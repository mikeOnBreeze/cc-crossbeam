# Plan: Supabase Realtime for CrossBeam

## Status: READY TO IMPLEMENT (not yet started)

## Why

CrossBeam currently uses **polling** (2-3 second intervals) to detect status changes and new messages. This works but:
- Burns database queries every 2-3 seconds per active user
- Adds 5-7 seconds of latency to detect completion
- Feels sluggish compared to Mako (which uses Realtime and feels instant)

Mako's Realtime implementation works perfectly. We follow it exactly.

## Key Lesson from Mako

**Watch for column CHANGES on table UPDATEs, not specific values.** Early Realtime attempts failed because we were trying to filter by specific status values. The working pattern is:

1. Subscribe to ALL UPDATEs on the projects table (filtered by project ID only)
2. Read `payload.new.status` in the callback
3. React to the new value in JavaScript

This is what Mako does and it works every time.

## Current State (Polling)

### `project-detail-client.tsx` (lines 81-100)
```typescript
// Status polling every 3 seconds
useEffect(() => {
  if (TERMINAL_STATUSES.includes(project.status)) return
  if (project.status === 'ready' && !starting) return

  const interval = setInterval(async () => {
    const { data } = await supabase
      .schema('crossbeam')
      .from('projects')
      .select('status, error_message')
      .eq('id', project.id)
      .single()

    if (data && data.status !== project.status) {
      setProject(prev => ({ ...prev, ...data }))
    }
  }, 3000)

  return () => clearInterval(interval)
}, [project.id, project.status, starting, supabase])
```

### `agent-stream.tsx` (lines 79-110)
```typescript
// Polling every 2 seconds
useEffect(() => {
  const interval = setInterval(async () => {
    const { data } = await supabase
      .schema('crossbeam')
      .from('messages')
      .select('*')
      .eq('project_id', projectId)
      .gt('id', lastSeenIdRef.current)
      .order('id', { ascending: true })
    // ... processes messages, detects completion
  }, 2000)
  return () => clearInterval(interval)
}, [projectId, supabase, router])
```

## Target State (Realtime)

Two Realtime subscriptions, mirroring Mako exactly:

### 1. Project Status Subscription (PRIMARY completion trigger)

In `project-detail-client.tsx`, replace the polling `useEffect` (lines 81-100) with:

```typescript
// Realtime: project status changes
useEffect(() => {
  if (TERMINAL_STATUSES.includes(project.status)) return
  if (project.status === 'ready' && !starting) return

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
        console.log('Project status changed:', payload.new.status)
        const newStatus = payload.new.status as ProjectStatus
        const newError = payload.new.error_message as string | null
        setProject(prev => ({ ...prev, status: newStatus, error_message: newError }))
      }
    )
    .subscribe((status) => {
      console.log('Project subscription:', status)
    })

  return () => {
    supabase.removeChannel(channel)
  }
}, [project.id, project.status, starting, supabase])
```

**Key differences from Mako:**
- Schema is `crossbeam` not `mako`
- We update local state directly (Mako calls `router.refresh()`)
- We handle more statuses: `processing`, `processing-phase1`, `processing-phase2`, `awaiting-answers`, `completed`, `failed`
- We read `error_message` from the payload too

**Why update state instead of `router.refresh()`?** CrossBeam's project page is a single client component that conditionally renders based on `project.status`. Updating state triggers a re-render instantly. Mako's page is a server component that needs a full refresh. Both approaches work — we match our architecture.

### 2. Messages Subscription (live activity stream + BACKUP completion trigger)

In `agent-stream.tsx`, replace the polling `useEffect` (lines 79-110) with:

```typescript
// Realtime: new messages
useEffect(() => {
  const channel = supabase
    .channel(`messages-${projectId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'crossbeam',
        table: 'messages',
        filter: `project_id=eq.${projectId}`,
      },
      (payload) => {
        const newMessage = payload.new as Message
        setMessages(prev => [...prev, newMessage])
        lastMessageTimeRef.current = Date.now()
        setStaleSeconds(0)

        // Backup completion detection
        if (
          newMessage.role === 'system' &&
          newMessage.content.startsWith('Completed in ') &&
          !completionTriggeredRef.current
        ) {
          completionTriggeredRef.current = true
          setTimeout(() => {
            router.refresh()
          }, 5000)
        }
      }
    )
    .subscribe((status) => {
      console.log('Messages subscription:', status)
    })

  return () => {
    supabase.removeChannel(channel)
  }
}, [projectId, supabase, router])
```

**What stays the same:**
- Initial fetch of existing messages (lines 63-77) — keep as-is
- Stale timer (lines 113-119) — keep as-is
- Auto-scroll (lines 122-126) — keep as-is
- Completion detection logic — same pattern, just triggered by Realtime instead of polling
- `lastSeenIdRef` — no longer needed for incremental polling, can be removed

**What gets removed:**
- The `setInterval` polling loop
- `lastSeenIdRef` (was only used for incremental polling)

## Database Migration

**CRITICAL FIRST STEP.** Without this, no Realtime events fire.

```sql
-- Enable Realtime on CrossBeam tables
ALTER PUBLICATION supabase_realtime ADD TABLE crossbeam.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE crossbeam.messages;
```

**Verification:** Currently the publication only includes `mako.projects` and `mako.messages` (confirmed via query). CrossBeam tables are not in the publication.

Run via Supabase MCP `apply_migration` or directly in SQL editor.

### RLS Consideration

Supabase Realtime respects Row Level Security. The `crossbeam.projects` and `crossbeam.messages` tables already have RLS policies that allow authenticated users to read their own data. Since the frontend Supabase client uses the anon key + user JWT, Realtime will only push events for rows the user can see. No changes needed.

**However:** Verify that the existing SELECT policies on both tables work with Realtime. The agent script in the sandbox uses the `service_role` key to INSERT messages and UPDATE project status — those writes bypass RLS. The Realtime subscription on the frontend uses the anon key — it needs SELECT permission. Check:

```sql
-- Verify SELECT policies exist
SELECT * FROM pg_policies
WHERE schemaname = 'crossbeam'
AND tablename IN ('projects', 'messages')
AND cmd = 'SELECT';
```

If no SELECT policy exists for the `authenticated` role, add one:

```sql
-- Only if missing:
CREATE POLICY "Users can read own projects" ON crossbeam.projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read own project messages" ON crossbeam.messages
  FOR SELECT USING (
    project_id IN (SELECT id FROM crossbeam.projects WHERE user_id = auth.uid())
  );
```

## Implementation Steps

### Step 1: Database migration (~1 min)
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE crossbeam.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE crossbeam.messages;
```

### Step 2: Verify RLS policies (~2 min)
Run the policy check query above. Add SELECT policies if missing.

### Step 3: Update `project-detail-client.tsx` (~5 min)
- Replace the status polling `useEffect` (lines 81-100) with Realtime subscription
- Keep DevTools event listeners (lines 52-79) as-is
- Keep the `starting` state guard — subscribe only when processing

### Step 4: Update `agent-stream.tsx` (~5 min)
- Replace the message polling `useEffect` (lines 79-110) with Realtime subscription
- Keep initial fetch (lines 63-77)
- Keep stale timer (lines 113-119)
- Remove `lastSeenIdRef` (no longer needed)

### Step 5: Test (~5 min)
- Start a demo project
- Verify messages stream in real-time (no 2-second batching)
- Verify status transitions happen instantly
- Verify completion triggers page transition
- Verify stale detection still works
- Verify DevTools still work

### Step 6: Cleanup
- Remove any leftover polling code
- Remove `lastSeenIdRef` from agent-stream

## Total: ~20 minutes

## Files Changed

| File | Change |
|------|--------|
| **Database** | `ALTER PUBLICATION` — add 2 tables to Realtime |
| `frontend/app/(dashboard)/projects/[id]/project-detail-client.tsx` | Replace status polling with Realtime subscription |
| `frontend/components/agent-stream.tsx` | Replace message polling with Realtime subscription |

Only 2 frontend files + 1 SQL migration. No server changes needed — the server already writes to the same tables.

## Rollback

If Realtime is flaky, revert to polling by:
1. Reverting the 2 frontend file changes (git checkout)
2. Optionally remove tables from publication (not strictly necessary — unused subscriptions are harmless)

The database migration is non-destructive — adding tables to the publication doesn't affect existing functionality.

## Gotchas from Past Experience

1. **Schema name matters.** Every `.on('postgres_changes', { schema: 'crossbeam', ... })` must exactly match. If you write `schema: 'public'` it silently receives zero events.

2. **Publication must include the table.** Without `ALTER PUBLICATION supabase_realtime ADD TABLE crossbeam.projects`, the subscription connects but never fires. This is the #1 cause of "Realtime doesn't work."

3. **Filter syntax is specific.** `filter: 'id=eq.${projectId}'` — no spaces, exact format. Wrong filter = silent failure.

4. **Watch column changes, don't filter by value.** Subscribe to all UPDATEs on the row, then check the new value in JavaScript. Don't try to filter by `status=eq.completed` in the subscription — it doesn't work reliably for rapidly changing values.

5. **Channel names must be unique per subscription.** Use `project-status-${projectId}` and `messages-${projectId}` — not generic names.

6. **Cleanup channels on unmount.** Always `supabase.removeChannel(channel)` in the useEffect return. Leaked channels accumulate and cause weird behavior.

7. **RLS applies to Realtime.** If the user's JWT doesn't have SELECT permission on the row, they won't receive the event. The `service_role` key used by the sandbox bypasses RLS for writes, but the frontend anon key needs RLS to allow reads.

8. **`router.refresh()` needs `force-dynamic`.** The project page server component must have `export const dynamic = 'force-dynamic'` or the refresh won't fetch new data. Check that this is set.
