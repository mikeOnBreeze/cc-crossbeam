# Agent Operations Plan — CrossBeam

## Why This Matters

Testing is the blocker right now. Every time we push to Vercel, we have to manually click through the UI to verify things work. Tomorrow the goal is: Claude Code (or any AI agent) can hit the deployed endpoints on Vercel, Cloud Run, and Vercel Sandboxes — and just keep running autonomously until everything is verified and working.

Two deliverables:
1. **API key auth on the Next.js routes** — so agents can trigger flows and read results without a browser session
2. **`crossbeam-ops` skill** — the agent manual that teaches Claude how to operate the entire system

---

## Part 1: API Key Auth Layer

### The Problem

The two API routes that matter (`/api/generate`, `/api/reset-project`) require a Supabase session cookie. No cookie = 401. An agent calling from `curl` or `fetch` has no cookie.

### The Fix

Add `Authorization: Bearer <key>` as an alternative auth method. If the key matches the `CROSSBEAM_API_KEY` env var, you're in. Existing browser auth continues to work unchanged.

### Files to Create/Modify

#### NEW: `frontend/lib/api-auth.ts`

Shared auth helper with two functions:
- `authenticateRequest()` — checks Bearer token against env var, falls back to Supabase cookies
- `getSupabaseForAuth()` — returns service-role client for API key path, cookie client for browser path

#### MODIFY: `frontend/app/api/generate/route.ts`

Replace inline Supabase auth with `authenticateRequest()`. API key path uses `user_id` from request body, skips ownership check.

#### MODIFY: `frontend/app/api/reset-project/route.ts`

Same auth swap. Use `getSupabaseForAuth()` for all DB operations.

#### NEW: `frontend/app/api/projects/[id]/route.ts`

Convenience GET endpoint. Returns project + messages + latest output + files + contractor answers in one call.

```
GET /api/projects/:id → { project, files, messages, latest_output, contractor_answers }
```

### Env Vars to Set

**`frontend/.env.local`** (local dev — add these):
```
CROSSBEAM_API_KEY=dev-test-key-change-in-production
SUPABASE_SERVICE_ROLE_KEY=<copy from root .env.local>
```

**Vercel Dashboard** (production):
- `CROSSBEAM_API_KEY` → generate with `openssl rand -hex 32`
- `SUPABASE_SERVICE_ROLE_KEY` → same value as Cloud Run already has

Both are server-side only. No `NEXT_PUBLIC_` prefix = never exposed to browser.

### How Agents Use It

```bash
# 1. Trigger a corrections analysis
curl -X POST https://cc-crossbeam.vercel.app/api/generate \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"b0000000-0000-0000-0000-000000000002","user_id":"00000000-0000-0000-0000-000000000000","flow_type":"corrections-analysis"}'

# 2. Poll for status and results
curl https://cc-crossbeam.vercel.app/api/projects/b0000000-0000-0000-0000-000000000002 \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY"

# 3. Reset a demo project to run again
curl -X POST https://cc-crossbeam.vercel.app/api/reset-project \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"b0000000-0000-0000-0000-000000000002"}'
```

### Cloud Run Direct Access

Cloud Run (`POST /generate`) has zero auth — agents CAN hit it directly:

```bash
curl -X POST https://crossbeam-server-v7eqq3533a-uc.a.run.app/generate \
  -H "Content-Type: application/json" \
  -d '{"project_id":"...","user_id":"...","flow_type":"corrections-analysis"}'
```

Fine for testing, not ideal for production.

---

## Part 2: `crossbeam-ops` Skill

The agent manual. When Claude loads this skill, it knows how to operate every part of the system.

### Location: `.claude/skills/crossbeam-ops/`

### Structure

- **SKILL.md** — Decision tree router mapping intents to reference files + quick reference (URLs, project IDs, auth)
- **CLAUDE.md** — File catalog
- **references/api-endpoints.md** — All endpoints with auth, params, examples, polling pattern
- **references/data-model.md** — Supabase schema, all tables, status values, SQL examples
- **references/flows.md** — Flow types, phases, budgets, expected outputs
- **references/ui-navigation.md** — Routes, login, interactive elements, DevTools
- **references/demo-projects.md** — Test project IDs, storage contents, reset procedure

---

## Implementation Order

1. `frontend/lib/api-auth.ts` — create shared auth helper
2. `frontend/app/api/generate/route.ts` — swap auth block
3. `frontend/app/api/reset-project/route.ts` — swap auth block
4. `frontend/app/api/projects/[id]/route.ts` — create GET endpoint
5. `frontend/.env.local` — add env vars
6. `.claude/skills/crossbeam-ops/` — create skill files
7. Set Vercel env vars
8. Deploy + test with curl

## Verification

1. `curl` with bearer token → auth passes
2. `curl` without token → 401
3. `curl` with wrong token → 401
4. `GET /api/projects/<demo-id>` → returns full project JSON
5. Deploy to Vercel, test against production URL
6. Load skill in Claude Code, verify agent can operate the site

## Future: Per-User API Keys (Tier 2)

When multi-user isolation is needed: `api_keys` table + self-signed JWT. Agent presents `cb_live_xxx` → hash lookup → get `user_id` → sign JWT → RLS works naturally. ~2.5 hrs. Not building now.
