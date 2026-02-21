# Plan: Fix Supabase Realtime State Transitions

## Status: READY FOR REVIEW

## Problem

The project detail page doesn't react to state changes in realtime. Users have to manually refresh to see:
- `ready` → `processing` (after clicking Start)
- `processing` → `completed` (after the agent finishes)

## Root Cause

**`project.status` is in the useEffect dependency array** in `project-detail-client.tsx:109`:

```typescript
}, [project.id, project.status, starting, supabase])
//                ^^^^^^^^^^^^^^ THIS IS THE BUG
```

Every time the realtime callback fires and updates `project.status`, the dependency changes, React tears down the subscription, and rebuilds it. During that teardown/rebuild gap (~200-500ms for WebSocket handshake), events are missed. This also creates a race condition at startup where the subscription might not be connected before the server writes the first status update.

## What Mako Does (Working Pattern)

Mako has the same architecture (Supabase realtime for project status + messages) and it works perfectly. Key differences:

### Mako's StatusBadge subscription
```typescript
// Dependency array: [projectId, supabase, onStatusChange]
// NO status in dependencies — subscribe once, stays alive
useEffect(() => {
  const channel = supabase
    .channel(`project-${projectId}`)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'mako', table: 'projects',
      filter: `id=eq.${projectId}`,
    }, (payload) => {
      setStatus(payload.new.status)
      onStatusChange?.(payload.new.status)
    })
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}, [projectId, supabase, onStatusChange])
```

### Mako's ProcessingCard subscription
```typescript
// Dependency array: [projectId, supabase, router]
// Handles terminal states by calling router.refresh()
useEffect(() => {
  const channel = supabase
    .channel(`project-status-${projectId}`)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'mako', table: 'projects',
      filter: `id=eq.${projectId}`,
    }, (payload) => {
      const newStatus = payload.new.status
      if (newStatus === 'completed' || newStatus === 'failed') {
        router.refresh()
      }
    })
    .subscribe((status) => {
      console.log('Project subscription status:', status)
    })
  return () => { supabase.removeChannel(channel) }
}, [projectId, supabase, router])
```

### Mako's AgentActivityLog subscription
```typescript
// Dependency array: [projectId, supabase]
// Same pattern as CrossBeam's agent-stream (which is already correct)
```

### The Pattern

| | Mako | CrossBeam |
|---|---|---|
| Status in deps? | Never | Yes (bug) |
| Subscribe callback? | Yes (logging) | No |
| Terminal handling | `router.refresh()` | Guard clause (re-runs effect) |
| Architecture | Decentralized (child components own subscriptions) | Centralized (parent page owns everything) |

## The Fix

### Change 1: `project-detail-client.tsx` — Fix the dependency array

Remove `project.status` and `starting` from the dependency array. Use a ref to track whether we should be subscribed, so the subscription is created once and stays alive.

**Before:**
```typescript
useEffect(() => {
  if (TERMINAL_STATUSES.includes(project.status)) return
  if (project.status === 'ready' && !starting) return

  const channel = supabase
    .channel(`project-status-${project.id}`)
    .on('postgres_changes', { ... },
      (payload) => {
        const newStatus = payload.new.status as ProjectStatus
        const newError = payload.new.error_message as string | null
        setProject(prev => ({ ...prev, status: newStatus, error_message: newError }))
      }
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [project.id, project.status, starting, supabase])
```

**After:**
```typescript
// Ref to track whether we should listen (avoids putting status/starting in deps)
const shouldSubscribeRef = useRef(false)
useEffect(() => {
  shouldSubscribeRef.current =
    starting || (!TERMINAL_STATUSES.includes(project.status) && project.status !== 'ready')
}, [project.status, starting])

// Realtime: project status changes — subscribe ONCE per project, stay alive
useEffect(() => {
  const channel = supabase
    .channel(`project-status-${project.id}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'crossbeam',
        table: 'projects',
        filter: `id=eq.${project.id}`,
      },
      (payload) => {
        if (!shouldSubscribeRef.current) return  // ignore if not in active state
        const newStatus = payload.new.status as ProjectStatus
        const newError = payload.new.error_message as string | null
        console.log('[Realtime] Project status:', newStatus)
        setProject(prev => ({ ...prev, status: newStatus, error_message: newError }))
      }
    )
    .subscribe((status) => {
      console.log('[Realtime] Subscription:', status)
    })

  return () => {
    supabase.removeChannel(channel)
  }
}, [project.id, supabase])  // Only re-subscribe if project ID changes
```

**Why this works:**
- Channel is created once per project and stays alive through ALL status transitions
- No teardown/rebuild cycle on status changes = no missed events
- The ref check (`shouldSubscribeRef`) prevents acting on events when in ready/terminal state without causing re-subscriptions
- `.subscribe((status) => {...})` provides observability (matches Mako)

### Change 2: `project-detail-client.tsx` — Add catch-up fetch after subscribe

To handle the race condition where the server updates status before the subscription is ready:

```typescript
// After the subscription is created, do a one-time catch-up fetch
// This catches any status change that happened during WebSocket handshake
.subscribe((status) => {
  console.log('[Realtime] Subscription:', status)
  if (status === 'SUBSCRIBED' && shouldSubscribeRef.current) {
    // Catch-up: fetch current status in case we missed the event
    supabase
      .schema('crossbeam')
      .from('projects')
      .select('status, error_message')
      .eq('id', project.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProject(prev => ({ ...prev, status: data.status, error_message: data.error_message }))
        }
      })
  }
})
```

### Change 3: `agent-stream.tsx` — Add subscribe callback (minor)

The agent stream subscription is already correct (no status in deps). Just add the subscribe callback for observability:

```typescript
.subscribe((status) => {
  console.log('[Realtime] Messages subscription:', status)
})
```

## Database / Server Changes

None needed. The publication, RLS, and server-side status updates are all working correctly:
- `crossbeam.projects` and `crossbeam.messages` are in the `supabase_realtime` publication
- RLS policies allow SELECT for authenticated users on their own projects + demo projects
- Server uses `service_role` key for writes (bypasses RLS)

## Files Changed

| File | Change | Risk |
|------|--------|------|
| `frontend/app/(dashboard)/projects/[id]/project-detail-client.tsx` | Fix dependency array, add ref, add catch-up fetch, add subscribe callback | Low — isolated to subscription logic |
| `frontend/components/agent-stream.tsx` | Add subscribe callback (1 line) | Trivial |

## Test Plan

1. Start a demo project → verify UI transitions from ready → processing without refresh
2. Wait for completion → verify UI transitions to completed without refresh
3. Watch browser console for `[Realtime]` logs confirming subscription is alive
4. Force-fail a project → verify UI transitions to failed state
5. Verify DevTools state controls still work
6. Verify the agent message stream still shows live activity

## Rollback

`git checkout` the two files. No database changes to revert.
