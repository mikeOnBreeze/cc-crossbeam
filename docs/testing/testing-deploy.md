# Testing Strategy — Deployment Harness (Server + Frontend + Schema)

## Why This Doc Exists

The agent SDK flows are tested separately (`testing-agents-sdk-city.md`, `testing-agents-sdk.md`).
This doc tests the **harness** that wraps them: Supabase schema, Express server, Next.js frontend,
and the glue between them. Without this, you're debugging a 4-layer stack at deploy time when
everything breaks at once.

Same philosophy as the agent SDK tests: **layered levels, build up complexity, fail fast**.
Each test is something a Claude Code instance can run inline while building. No separate test
framework needed — just bash commands, curl, node scripts, and Supabase MCP queries.

**Reference:**
- `plan-strategy-0213.md` — The 4-stream deployment strategy (what we're testing)
- `plan-supabase-0213.md` — Schema DDL (source of truth)
- `plan-deploy.md` — Overall deployment architecture
- `testing-agents-sdk-city.md` — The pattern we're adapting (layered testing for agent flows)

---

## Test Organization: Three Tracks

Tests are organized by stream, but designed to run **as you build**, not after.

```
Track S (Schema)     L0s → L1s → L2s
Track V (Server)     L0v → L1v → L2v → L3v → L4v
Track F (Frontend)   L0f → L1f → L2f → L3f
                                   └────────────────→ E2E: L0e → L1e
```

**Track S** runs first (Stream 0 dependency). Then V and F run in parallel (Streams 1+2).
E2E tests run after both V and F are passing L2+.

---

## Track S: Schema Tests (Stream 0)

### L0s: Schema Exists (~30 sec)

**When to run:** Immediately after running the schema migration.
**How:** Supabase MCP or `execute_sql`.

```sql
-- Test 1: Schema exists
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'crossbeam';
-- PASS: returns 1 row

-- Test 2: All 5 tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'crossbeam'
ORDER BY table_name;
-- PASS: contractor_answers, files, messages, outputs, projects (5 rows)

-- Test 3: Projects table has correct status CHECK constraint
SELECT conname, consrc FROM pg_catalog.pg_constraint
WHERE conrelid = 'crossbeam.projects'::regclass AND contype = 'c'
  AND conname LIKE '%status%';
-- PASS: Returns constraint with all 8 states:
-- ready, uploading, processing, processing-phase1, awaiting-answers,
-- processing-phase2, completed, failed

-- Test 4: Outputs table has flow_phase column
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'crossbeam' AND table_name = 'outputs' AND column_name = 'flow_phase';
-- PASS: returns 1 row, data_type = 'text'

-- Test 5: Messages uses BIGSERIAL (for efficient polling)
SELECT column_name, data_type, column_default FROM information_schema.columns
WHERE table_schema = 'crossbeam' AND table_name = 'messages' AND column_name = 'id';
-- PASS: column_default contains 'nextval' (bigserial)
```

**What this catches:**
- Migration didn't run or partially failed
- Wrong schema name
- Missing tables from earlier revisions
- Status states not matching plan-supabase-0213.md
- flow_phase column missing (from the schema review fixes)

---

### L1s: RLS + Service Role (~1 min)

**When to run:** After L0s passes. Tests that RLS is enabled and service role can bypass it.
**How:** Two separate queries — one with service role, one with anon key.

```sql
-- Test 6: RLS is enabled on all 5 tables
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'crossbeam';
-- PASS: all 5 rows have rowsecurity = true

-- Test 7: Service role can INSERT into projects
-- (Run via Supabase MCP which uses service role)
INSERT INTO crossbeam.projects (user_id, flow_type, project_name, city, status)
VALUES ('00000000-0000-0000-0000-000000000000'::uuid, 'city-review', 'TEST-L1s', 'Test City', 'ready')
RETURNING id;
-- PASS: returns UUID (service role bypasses RLS)

-- Test 8: Service role can INSERT into messages
INSERT INTO crossbeam.messages (project_id, role, content)
VALUES ((SELECT id FROM crossbeam.projects WHERE project_name = 'TEST-L1s'), 'system', 'Test message')
RETURNING id;
-- PASS: returns bigint ID

-- Test 9: Service role can INSERT into outputs
INSERT INTO crossbeam.outputs (project_id, flow_phase, raw_artifacts)
VALUES (
  (SELECT id FROM crossbeam.projects WHERE project_name = 'TEST-L1s'),
  'review',
  '{"test": true}'::jsonb
)
RETURNING id;
-- PASS: returns UUID

-- Test 10: Service role can INSERT into contractor_answers
INSERT INTO crossbeam.contractor_answers (project_id, question_key, question_text)
VALUES (
  (SELECT id FROM crossbeam.projects WHERE project_name = 'TEST-L1s'),
  'test-q1',
  'What is the existing roof material?'
)
RETURNING id;
-- PASS: returns UUID

-- Cleanup
DELETE FROM crossbeam.projects WHERE project_name = 'TEST-L1s';
-- Cascades to files, messages, outputs, contractor_answers
```

**What this catches:**
- RLS not enabled (security hole — server inserts would work but anon key would too)
- Service role key can't bypass RLS (server would fail to insert messages/outputs)
- CASCADE not working (cleanup wouldn't clear dependent rows)
- Column types wrong (e.g., flow_phase CHECK constraint blocking valid values)

---

### L2s: Demo Data + Storage Buckets (~2 min)

**When to run:** After L1s passes, judge account exists, and demo PDFs are uploaded.

```sql
-- Test 11: Judge account exists in auth.users
SELECT id, email FROM auth.users WHERE email = 'judge@crossbeam.app';
-- PASS: returns 1 row with UUID

-- Test 12: Demo projects exist and are linked to judge
SELECT p.id, p.flow_type, p.project_name, p.is_demo, p.status
FROM crossbeam.projects p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'judge@crossbeam.app' AND p.is_demo = true;
-- PASS: returns 2 rows (city-review + corrections-analysis)

-- Test 13: Demo projects have linked files
SELECT p.project_name, f.file_type, f.filename, f.storage_path
FROM crossbeam.files f
JOIN crossbeam.projects p ON f.project_id = p.id
WHERE p.is_demo = true
ORDER BY p.project_name, f.file_type;
-- PASS: returns 3 rows:
--   city-review project: 1 plan-binder
--   corrections project: 1 plan-binder + 1 corrections-letter

-- Test 14: Status transitions work
UPDATE crossbeam.projects
SET status = 'processing-phase1'
WHERE project_name LIKE '%-L2s-test%';
-- If you inserted a test row, PASS if no CHECK violation

-- Test 15: Verify all 8 status values are accepted
DO $$
DECLARE
  statuses TEXT[] := ARRAY['ready','uploading','processing','processing-phase1',
                           'awaiting-answers','processing-phase2','completed','failed'];
  s TEXT;
  test_id UUID;
BEGIN
  INSERT INTO crossbeam.projects (user_id, flow_type, project_name, status)
  VALUES ('00000000-0000-0000-0000-000000000000'::uuid, 'city-review', 'STATUS-TEST', 'ready')
  RETURNING id INTO test_id;

  FOREACH s IN ARRAY statuses LOOP
    UPDATE crossbeam.projects SET status = s WHERE id = test_id;
  END LOOP;

  DELETE FROM crossbeam.projects WHERE id = test_id;
  RAISE NOTICE 'All 8 status values accepted';
END $$;
-- PASS: "All 8 status values accepted" (no CHECK violation)
```

**Storage bucket tests (manual or via Supabase Dashboard):**
- [ ] `crossbeam-uploads` bucket exists
- [ ] `crossbeam-outputs` bucket exists
- [ ] `crossbeam-demo-assets` bucket exists (public read)
- [ ] Demo PDFs uploaded to `crossbeam-demo-assets`

**What this catches:**
- Judge account not created
- Demo projects not seeded or linked to wrong user
- Missing file records
- Status CHECK constraint too restrictive (missing one of the 8 states)
- Storage buckets not created

---

## Track V: Server Tests (Stream 1)

### L0v: Server Boots + Health Check (~30 sec)

**When to run:** After `server/src/index.ts` is written and dependencies installed.

```bash
# Test 16: TypeScript compiles
cd /Users/breez/openai-demo/CC-Crossbeam/server && npx tsc --noEmit
# PASS: exits 0, no errors

# Test 17: Server boots and responds to health check
cd /Users/breez/openai-demo/CC-Crossbeam/server && \
  timeout 10 node --env-file ../.env.local dist/index.js &
SERVER_PID=$!
sleep 2
curl -s http://localhost:8080/health
# PASS: returns JSON with { "status": "ok" } or similar
kill $SERVER_PID
```

**What this catches:**
- TypeScript errors in index.ts
- Missing imports or dependencies
- Express not starting
- PORT not configured
- Health check route not mounted

**Run this after writing EACH server file** — it's your compile-and-boot checkpoint.

---

### L1v: Config + Route Validation (~1 min)

**When to run:** After `config.ts` and `generate.ts` are written.

```bash
# Test 18: Config module loads without errors
cd /Users/breez/openai-demo/CC-Crossbeam/server && \
  node --env-file ../.env.local -e "
    import('./dist/utils/config.js').then(c => {
      console.log('Flow types:', Object.keys(c.FLOW_SKILLS || {}));
      console.log('Model:', c.CONFIG?.MODEL);
      console.log('Max turns:', c.CONFIG?.AGENT_MAX_TURNS);
      console.log('Max budget:', c.CONFIG?.AGENT_MAX_BUDGET_USD);
      const prompt = c.buildPrompt?.('city-review', 'Buena Park', '742 Flint Ave');
      console.log('Prompt length:', prompt?.length, 'chars');
      console.log(prompt ? '  PASS: prompt generated' : '  FAIL: buildPrompt returned empty');
    }).catch(e => { console.error('FAIL:', e.message); process.exit(1); });
  "
# PASS: Shows flow types, model, turns, budget, and non-empty prompt

# Test 19: Generate route rejects invalid requests
cd /Users/breez/openai-demo/CC-Crossbeam/server && \
  timeout 10 node --env-file ../.env.local dist/index.js &
SERVER_PID=$!
sleep 2

# 19a: Missing fields → 400
curl -s -w "\n%{http_code}" -X POST http://localhost:8080/generate \
  -H "Content-Type: application/json" \
  -d '{}'
# PASS: HTTP 400 with validation error

# 19b: Invalid flow_type → 400
curl -s -w "\n%{http_code}" -X POST http://localhost:8080/generate \
  -H "Content-Type: application/json" \
  -d '{"project_id":"test","user_id":"test","flow_type":"invalid"}'
# PASS: HTTP 400 with validation error

# 19c: Valid shape → should start processing (or 500 if sandbox not configured yet)
curl -s -w "\n%{http_code}" -X POST http://localhost:8080/generate \
  -H "Content-Type: application/json" \
  -d '{"project_id":"a0000000-0000-0000-0000-000000000001","user_id":"00000000-0000-0000-0000-000000000000","flow_type":"city-review"}'
# PASS: HTTP 200 with { "status": "processing" } OR HTTP 500 (sandbox not configured — that's OK at this level)

kill $SERVER_PID
```

**What this catches:**
- Config not exporting correctly (ESM vs CJS issues)
- `buildPrompt()` function missing or wrong signature
- `FLOW_SKILLS` map missing flow types
- Zod validation not rejecting bad input
- Route not mounted at `/generate`
- `flow_type` not included in request schema

---

### L2v: Supabase Service Functions (~2 min)

**When to run:** After `supabase.ts` is written. Tests the server's DB functions against live Supabase.
**Depends on:** L0s (schema exists).

```bash
# Test 20: Supabase service module loads and connects
cd /Users/breez/openai-demo/CC-Crossbeam/server && \
  node --env-file ../.env.local -e "
    import('./dist/services/supabase.js').then(async (svc) => {
      // Test: Can read demo projects
      const projects = await svc.getProjectFiles?.('a0000000-0000-0000-0000-000000000001');
      console.log('Project files:', projects?.length ?? 'function not found');

      // Test: Can update project status
      try {
        await svc.updateProjectStatus?.('a0000000-0000-0000-0000-000000000001', 'processing');
        console.log('PASS: status updated to processing');
        // Reset it
        await svc.updateProjectStatus?.('a0000000-0000-0000-0000-000000000001', 'ready');
        console.log('PASS: status reset to ready');
      } catch (e) {
        console.log('FAIL:', e.message);
      }

      // Test: Can insert a message
      try {
        const msgId = await svc.insertMessage?.('a0000000-0000-0000-0000-000000000001', 'system', 'L2v test message');
        console.log('PASS: message inserted, id:', msgId);
      } catch (e) {
        console.log('FAIL insertMessage:', e.message);
      }

      // Test: Can insert an output record
      try {
        const outId = await svc.createOutputRecord?.({
          project_id: 'a0000000-0000-0000-0000-000000000001',
          flow_phase: 'review',
          raw_artifacts: { test: true },
        });
        console.log('PASS: output record created, id:', outId);
      } catch (e) {
        console.log('FAIL createOutputRecord:', e.message);
      }

      // Test: Can insert contractor answers
      try {
        await svc.insertContractorAnswers?.('a0000000-0000-0000-0000-000000000002', [
          { question_key: 'test-q1', question_text: 'Test question?', question_type: 'text' }
        ]);
        console.log('PASS: contractor answers inserted');

        // Test: Can read them back
        const answers = await svc.getContractorAnswers?.('a0000000-0000-0000-0000-000000000002');
        console.log('PASS: contractor answers read, count:', answers?.length);
      } catch (e) {
        console.log('FAIL contractor answers:', e.message);
      }

      process.exit(0);
    }).catch(e => { console.error('FAIL module load:', e.message); process.exit(1); });
  "
```

**Cleanup after test:**
```sql
-- Remove test messages and outputs (keep demo projects intact)
DELETE FROM crossbeam.messages WHERE content = 'L2v test message';
DELETE FROM crossbeam.outputs WHERE raw_artifacts = '{"test": true}'::jsonb;
DELETE FROM crossbeam.contractor_answers WHERE question_key = 'test-q1';
UPDATE crossbeam.projects SET status = 'ready' WHERE is_demo = true;
```

**What this catches:**
- Schema reference wrong (`mako` instead of `crossbeam`)
- Table/column names don't match the DDL (e.g., `client_files` vs `files`)
- `flow_phase` not being set on output inserts
- `raw_artifacts` JSONB handling wrong
- Contractor answers CRUD not working
- Service role key not configured or wrong

---

### L3v: Skills Loading (~1 min)

**When to run:** After skills are copied to `server/skills/` (resolved from symlinks).

```bash
# Test 21: All 9 skill directories exist with content
cd /Users/breez/openai-demo/CC-Crossbeam/server && \
  for skill in california-adu adu-plan-review adu-corrections-flow adu-corrections-complete \
    adu-targeted-page-viewer adu-city-research adu-corrections-pdf buena-park-adu placentia-adu; do
    if [ -d "skills/$skill" ]; then
      count=$(find "skills/$skill" -type f | wc -l | tr -d ' ')
      echo "  OK $skill ($count files)"
    else
      echo "  MISSING $skill"
    fi
  done
# PASS: all 9 skills present with file counts

# Test 22: No broken symlinks (skills should be RESOLVED copies, not symlinks)
cd /Users/breez/openai-demo/CC-Crossbeam/server && \
  find skills/ -type l 2>/dev/null | head -5
# PASS: no output (no symlinks — all resolved copies)

# Test 23: Skill loading function works
cd /Users/breez/openai-demo/CC-Crossbeam/server && \
  node --env-file ../.env.local -e "
    import('./dist/services/sandbox.js').then(svc => {
      // Test reading skills for each flow type
      const citySkills = svc.readSkillFilesFromDisk?.('city-review');
      const corrSkills = svc.readSkillFilesFromDisk?.('corrections-analysis');

      console.log('City review skills:', citySkills?.length ?? 'function not found');
      console.log('Corrections skills:', corrSkills?.length ?? 'function not found');

      // Verify california-adu is in both (shared foundation)
      const cityHasCA = citySkills?.some(s => s.path?.includes('california-adu'));
      const corrHasCA = corrSkills?.some(s => s.path?.includes('california-adu'));
      console.log('california-adu in city-review:', cityHasCA);
      console.log('california-adu in corrections:', corrHasCA);

      // Verify flow-specific skills
      const cityHasPlanReview = citySkills?.some(s => s.path?.includes('adu-plan-review'));
      const corrHasCorrFlow = corrSkills?.some(s => s.path?.includes('adu-corrections-flow'));
      console.log('adu-plan-review in city-review:', cityHasPlanReview);
      console.log('adu-corrections-flow in corrections:', corrHasCorrFlow);
    }).catch(e => { console.error('FAIL:', e.message); process.exit(1); });
  "
# PASS: Both flow types load correct skill sets, california-adu in both
```

**What this catches:**
- Symlinks not resolved during copy (Docker can't follow host symlinks)
- Missing skill directories
- `readSkillFilesFromDisk()` not filtering by flow_type
- `FLOW_SKILLS` config not matching actual directory names
- california-adu not included in both flow types

---

### L4v: Sandbox Lifecycle — Minimal Agent (~$2-5, 3-5 min)

**When to run:** After L0v-L3v all pass. Tests the full sandbox create → install → run → extract cycle.
**WARNING:** This creates a real Vercel Sandbox and runs a minimal agent. Costs real money.

```bash
# Test 24: Full sandbox lifecycle with a trivial prompt
# This tests: sandbox creation, SDK install, skill copy, agent run, message streaming, output extraction
cd /Users/breez/openai-demo/CC-Crossbeam/server && \
  timeout 10 node --env-file ../.env.local dist/index.js &
SERVER_PID=$!
sleep 2

# Use a demo project that exists in the DB
# This will trigger the full async flow
curl -s -X POST http://localhost:8080/generate \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "a0000000-0000-0000-0000-000000000001",
    "user_id": "00000000-0000-0000-0000-000000000000",
    "flow_type": "city-review"
  }'
# PASS: returns { "status": "processing" } immediately

# Now poll the database for messages (the server streams them async)
# Wait 60 seconds, then check if any messages appeared
sleep 60
```

```sql
-- Check if the server is streaming messages
SELECT COUNT(*) as msg_count FROM crossbeam.messages
WHERE project_id = 'a0000000-0000-0000-0000-000000000001';
-- PASS: msg_count > 0 (server is streaming)

-- Check project status
SELECT status FROM crossbeam.projects
WHERE id = 'a0000000-0000-0000-0000-000000000001';
-- 'processing' is OK (still running)
-- 'completed' is great (finished fast)
-- 'failed' needs investigation (check error_message)
```

**After the agent finishes (~10-15 min):**
```sql
-- Verify output record was created
SELECT id, flow_phase, corrections_letter_md IS NOT NULL as has_letter,
       review_checklist_json IS NOT NULL as has_checklist,
       raw_artifacts != '{}'::jsonb as has_artifacts,
       agent_cost_usd, agent_turns, agent_duration_ms
FROM crossbeam.outputs
WHERE project_id = 'a0000000-0000-0000-0000-000000000001';
-- PASS: 1 row, flow_phase = 'review', has_letter = true, has_artifacts = true

-- Verify status is completed
SELECT status, error_message FROM crossbeam.projects
WHERE id = 'a0000000-0000-0000-0000-000000000001';
-- PASS: status = 'completed', error_message IS NULL
```

```bash
kill $SERVER_PID
```

**Reset after test:**
```sql
UPDATE crossbeam.projects SET status = 'ready' WHERE id = 'a0000000-0000-0000-0000-000000000001';
DELETE FROM crossbeam.messages WHERE project_id = 'a0000000-0000-0000-0000-000000000001';
DELETE FROM crossbeam.outputs WHERE project_id = 'a0000000-0000-0000-0000-000000000001';
```

**What this catches:**
- Vercel Sandbox creation failure (missing VERCEL_TEAM_ID, VERCEL_PROJECT_ID, VERCEL_TOKEN)
- SDK installation in sandbox fails
- Skill files not copying into sandbox correctly
- Agent prompt not triggering the right skill
- Message streaming to Supabase broken
- Output extraction logic wrong (files not found in sandbox)
- Status update flow broken (stuck in 'processing')

**Cost note:** This runs a real agent in a real sandbox. ~$2-5 depending on how far it gets.
Run sparingly. If L0v-L3v pass, L4v is very likely to work — the expensive part is the agent,
which is already tested separately in `testing-agents-sdk-city.md`.

---

### L4v-contractor: Contractor Two-Phase Flow (~$5-10, 15-20 min)

**When to run:** After L4v passes. Tests the two-phase lifecycle.
**Optional for hackathon** — if time is tight, validate this after deployment.

```bash
# Phase 1: Corrections Analysis
curl -s -X POST http://localhost:8080/generate \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "a0000000-0000-0000-0000-000000000002",
    "user_id": "00000000-0000-0000-0000-000000000000",
    "flow_type": "corrections-analysis"
  }'
# PASS: returns { "status": "processing" }
```

```sql
-- After ~15 min: Check Phase 1 completed
SELECT status FROM crossbeam.projects WHERE id = 'a0000000-0000-0000-0000-000000000002';
-- PASS: status = 'awaiting-answers'

-- Check contractor questions were populated
SELECT question_key, question_text, question_type, is_answered
FROM crossbeam.contractor_answers
WHERE project_id = 'a0000000-0000-0000-0000-000000000002';
-- PASS: 1+ rows, all is_answered = false

-- Check Phase 1 output record exists
SELECT flow_phase, corrections_analysis_json IS NOT NULL as has_analysis,
       contractor_questions_json IS NOT NULL as has_questions
FROM crossbeam.outputs
WHERE project_id = 'a0000000-0000-0000-0000-000000000002';
-- PASS: flow_phase = 'analysis', has_analysis = true, has_questions = true
```

```sql
-- Simulate answering questions (what the frontend form does)
UPDATE crossbeam.contractor_answers
SET answer_text = 'Standard comp shingle, installed 2019',
    is_answered = true,
    updated_at = now()
WHERE project_id = 'a0000000-0000-0000-0000-000000000002'
  AND question_key = (
    SELECT question_key FROM crossbeam.contractor_answers
    WHERE project_id = 'a0000000-0000-0000-0000-000000000002'
    LIMIT 1
  );
-- (Repeat for other questions or mark all answered)
UPDATE crossbeam.contractor_answers
SET answer_text = 'Yes', is_answered = true, updated_at = now()
WHERE project_id = 'a0000000-0000-0000-0000-000000000002' AND is_answered = false;
```

```bash
# Phase 2: Corrections Response
curl -s -X POST http://localhost:8080/generate \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "a0000000-0000-0000-0000-000000000002",
    "user_id": "00000000-0000-0000-0000-000000000000",
    "flow_type": "corrections-response"
  }'
# PASS: returns { "status": "processing" }
```

```sql
-- After ~8-10 min: Check Phase 2 completed
SELECT status FROM crossbeam.projects WHERE id = 'a0000000-0000-0000-0000-000000000002';
-- PASS: status = 'completed'

-- Check Phase 2 output record
SELECT flow_phase, response_letter_md IS NOT NULL as has_response,
       professional_scope_md IS NOT NULL as has_scope,
       corrections_report_md IS NOT NULL as has_report
FROM crossbeam.outputs
WHERE project_id = 'a0000000-0000-0000-0000-000000000002'
  AND flow_phase = 'response';
-- PASS: all three have content
```

---

## Track F: Frontend Tests (Stream 2)

### L0f: Build + TypeScript (~30 sec)

**When to run:** After each batch of frontend files is written. This is your compile checkpoint.

```bash
# Test 25: TypeScript compiles
cd /Users/breez/openai-demo/CC-Crossbeam/frontend && npx tsc --noEmit
# PASS: exits 0

# Test 26: Next.js build succeeds
cd /Users/breez/openai-demo/CC-Crossbeam/frontend && npm run build
# PASS: exits 0, no build errors

# Note: build requires env vars. Create frontend/.env.local with:
# NEXT_PUBLIC_SUPABASE_URL=https://bhjrpklzqyrelnhexhlj.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
# CLOUD_RUN_URL=http://localhost:8080
```

**Run `npx tsc --noEmit` after EVERY file change.** It's 5 seconds and catches 80% of issues.

**What this catches:**
- Import path errors
- Type mismatches between schema types and component props
- Missing dependencies
- Next.js config issues

---

### L1f: Dev Server + Routes (~1 min)

**When to run:** After layout.tsx, login page, and dashboard page exist.

```bash
# Test 27: Dev server starts without crashing
cd /Users/breez/openai-demo/CC-Crossbeam/frontend && \
  timeout 15 npx next dev --port 3333 &
DEV_PID=$!
sleep 8

# Test 28: Login page renders
curl -s -o /dev/null -w "%{http_code}" http://localhost:3333/login
# PASS: 200

# Test 29: Dashboard redirects to login (auth middleware)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3333/dashboard
# PASS: 307 (redirect to /login)

# Test 30: Root page renders
curl -s -o /dev/null -w "%{http_code}" http://localhost:3333/
# PASS: 200

kill $DEV_PID 2>/dev/null
```

**What this catches:**
- Runtime crashes in layout/page components
- Middleware not routing correctly
- Missing Supabase client initialization
- Font loading failures
- CSS/Tailwind config issues

---

### L2f: Auth Flow (~2 min)

**When to run:** After login page, Supabase client, and auth middleware are complete.
**Depends on:** L2s (judge account exists in Supabase).

```bash
# Test 31: Judge login via Supabase API (simulates what the button does)
cd /Users/breez/openai-demo/CC-Crossbeam && \
  node -e "
    import { createClient } from '@supabase/supabase-js';
    const sb = createClient(
      process.env.SUPABASE_URL || 'https://bhjrpklzqyrelnhexhlj.supabase.co',
      process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data, error } = await sb.auth.signInWithPassword({
      email: 'judge@crossbeam.app',
      password: 'crossbeam-hackathon-2026'
    });
    if (error) {
      console.log('FAIL:', error.message);
      process.exit(1);
    }
    console.log('PASS: logged in as', data.user.email);
    console.log('  user_id:', data.user.id);
    console.log('  access_token length:', data.session.access_token.length);

    // Test: can read demo projects with this token
    const { data: projects, error: projErr } = await sb
      .schema('crossbeam')
      .from('projects')
      .select('*')
      .eq('is_demo', true);
    if (projErr) {
      console.log('FAIL reading projects:', projErr.message);
    } else {
      console.log('PASS: read', projects.length, 'demo projects');
      projects.forEach(p => console.log('  -', p.project_name, '(' + p.flow_type + ')'));
    }

    // Test: can read messages for demo project
    const { data: msgs, error: msgErr } = await sb
      .schema('crossbeam')
      .from('messages')
      .select('id, role, content')
      .eq('project_id', projects[0]?.id)
      .limit(5);
    console.log(msgErr ? 'FAIL reading messages:' + msgErr.message : 'PASS: messages query works');

    // Test: can read contractor_answers
    const { data: answers, error: ansErr } = await sb
      .schema('crossbeam')
      .from('contractor_answers')
      .select('*')
      .eq('project_id', projects[1]?.id)
      .limit(5);
    console.log(ansErr ? 'FAIL reading answers:' + ansErr.message : 'PASS: contractor_answers query works');
  "
```

**What this catches:**
- Judge account not created or wrong password
- Anon key not working with RLS
- `.schema('crossbeam')` not set (queries go to `public` schema by default — silent failure)
- RLS blocking demo project reads (is_demo policy not working)
- Message polling would fail in production

---

### L3f: Component Rendering + Data Flow (~3 min)

**When to run:** After dashboard, project detail, agent stream, and results viewer are built.
**Method:** Start dev server and use curl/node to check page content includes expected elements.

```bash
# Start dev server
cd /Users/breez/openai-demo/CC-Crossbeam/frontend && \
  timeout 120 npx next dev --port 3333 &
DEV_PID=$!
sleep 8

# Test 32: Login page has judge button
curl -s http://localhost:3333/login | grep -i "judge" > /dev/null
echo "Judge button: $([ $? -eq 0 ] && echo 'PASS' || echo 'FAIL')"

# Test 33: Login page has Google OAuth button
curl -s http://localhost:3333/login | grep -i "google" > /dev/null
echo "Google OAuth: $([ $? -eq 0 ] && echo 'PASS' || echo 'FAIL')"

kill $DEV_PID 2>/dev/null
```

**Browser-based tests (use Chrome MCP if available, otherwise manual):**

- [ ] Login page renders with CrossBeam branding (Playfair Display headings, moss green CTA)
- [ ] "Sign in as a Judge" button works → redirects to /dashboard
- [ ] Dashboard shows two persona cards (City Reviewer + Contractor)
- [ ] City Reviewer card links to demo project detail page
- [ ] Contractor card links to demo project detail page
- [ ] Project detail page shows correct status UI based on `project.status`
- [ ] "Start Analysis" / "Run AI Review" button is visible in `ready` state
- [ ] Agent stream component shows "waiting for messages" or similar in `processing` state
- [ ] Results viewer renders markdown content in `completed` state

**Design bible conformance (visual check):**
- [ ] Gradient background (sky-to-earth, not flat white)
- [ ] Playfair Display for headings 24px+
- [ ] Nunito for body text
- [ ] Moss green primary buttons (pill-shaped, `rounded-full`)
- [ ] Deep soft shadows on cards
- [ ] No hardcoded colors (`bg-blue-600`, etc.)

---

## E2E Tests (Streams Combined)

### L0e: Server ↔ Schema Integration (~2 min)

**When to run:** After L2v and L2s both pass.
**What it tests:** Server writes to DB, reads back, status transitions work.

```bash
# Boot server
cd /Users/breez/openai-demo/CC-Crossbeam/server && \
  timeout 30 node --env-file ../.env.local dist/index.js &
SERVER_PID=$!
sleep 2

# Test 34: POST /generate updates project status in DB
curl -s -X POST http://localhost:8080/generate \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "a0000000-0000-0000-0000-000000000001",
    "user_id": "00000000-0000-0000-0000-000000000000",
    "flow_type": "city-review"
  }'
sleep 5
```

```sql
-- Verify server updated project status
SELECT status FROM crossbeam.projects WHERE id = 'a0000000-0000-0000-0000-000000000001';
-- PASS: 'processing' (not 'ready' anymore)

-- Verify server started inserting messages
SELECT COUNT(*) FROM crossbeam.messages WHERE project_id = 'a0000000-0000-0000-0000-000000000001';
-- PASS: count > 0
```

```bash
kill $SERVER_PID 2>/dev/null
```

**Reset:**
```sql
UPDATE crossbeam.projects SET status = 'ready' WHERE is_demo = true;
DELETE FROM crossbeam.messages WHERE project_id IN (
  SELECT id FROM crossbeam.projects WHERE is_demo = true
);
DELETE FROM crossbeam.outputs WHERE project_id IN (
  SELECT id FROM crossbeam.projects WHERE is_demo = true
);
```

---

### L1e: Full E2E — Browser to Results (~15-20 min)

**When to run:** After all L3+ tests pass. This is the acceptance test.
**Method:** Use Chrome MCP (browser automation) or manual testing.
**WARNING:** Runs a real agent — costs ~$10-20.

**Steps:**
1. Open deployed URL (or `localhost:3000`)
2. Click "Sign in as a Judge"
3. Verify dashboard appears with two persona cards
4. Click City Reviewer → "Run AI Review"
5. Verify agent stream shows real-time messages (poll every 2s)
6. Wait ~10-15 min for completion
7. Verify results viewer shows:
   - Draft corrections letter (viewable inline)
   - Review checklist with code citations
   - Download option
8. Click "Back to Dashboard"
9. Verify city-review card shows "Completed" state
10. Click Contractor → "Analyze Corrections"
11. Verify Phase 1 streams messages
12. Verify questions form appears after Phase 1
13. Answer questions (or accept pre-filled defaults)
14. Click "Submit & Generate Response"
15. Verify Phase 2 streams messages
16. Verify results viewer shows response letter + scope

**Pass criteria:** Both flows complete, results viewable, no crashes.

---

## Test Dependencies & Execution Order

```
STREAM 0 (Schema)
  L0s (tables exist)
  └→ L1s (RLS + service role)
      └→ L2s (demo data + buckets)

STREAM 1 (Server) ─────────────── after L0s
  L0v (boots + health)
  └→ L1v (config + routes)
      └→ L2v (supabase svc) ──── after L2s
      └→ L3v (skills loading)
          └→ L4v (sandbox lifecycle) ── expensive, run once

STREAM 2 (Frontend) ────────────── after L0s
  L0f (build + typecheck)
  └→ L1f (dev server + routes)
      └→ L2f (auth flow) ──────── after L2s
          └→ L3f (components)

E2E ─────────────────────────────── after L2v + L2f
  L0e (server ↔ schema)
  └→ L1e (browser to results) ─── acceptance test, run last
```

### Execution Cheat Sheet

| Order | Test | Time | Cost | When |
|-------|------|------|------|------|
| 1 | **L0s** | 30s | $0 | After schema migration |
| 2 | **L1s** | 1m | $0 | After L0s |
| 3 | **L2s** | 2m | $0 | After judge account + demo seed |
| 4a | **L0v** | 30s | $0 | After server/src/index.ts written |
| 4b | **L0f** | 30s | $0 | After frontend compiles (parallel with 4a) |
| 5a | **L1v** | 1m | $0 | After config.ts + generate.ts |
| 5b | **L1f** | 1m | $0 | After layout + login page (parallel with 5a) |
| 6a | **L2v** | 2m | $0 | After supabase.ts |
| 6b | **L2f** | 2m | $0 | After auth flow (parallel with 6a) |
| 7 | **L3v** | 1m | $0 | After skills copied |
| 8 | **L3f** | 3m | $0 | After all components |
| 9 | **L0e** | 2m | $0 | After L2v + L2f pass |
| 10 | **L4v** | 5m | ~$3 | After L3v passes (optional pre-deploy) |
| 11 | **L1e** | 20m | ~$15 | Acceptance test — run once before submission |

**Total cost for full test ladder:** ~$18 (L4v + L1e)
**Total cost for dry run (no sandbox):** ~$0 (L0s through L3f are all free)
**Total time (sequential, no sandbox):** ~15 min

---

## Incremental Build Checkpoints

**This is the key insight:** The building instance should run tests AFTER EACH FILE, not at the end.
Here's what to test when:

### Server Build Checkpoints

| After Writing... | Run | Expected |
|---|---|---|
| `src/index.ts` | `npx tsc --noEmit` + boot + `/health` | L0v passes |
| `src/utils/config.ts` | `npx tsc --noEmit` + config load test | L1v Test 18 |
| `src/routes/generate.ts` | `npx tsc --noEmit` + boot + curl tests | L1v Tests 19a-c |
| `src/services/supabase.ts` | `npx tsc --noEmit` + DB function tests | L2v Test 20 |
| `src/services/sandbox.ts` | `npx tsc --noEmit` + skill loading | L3v Tests 21-23 |
| All server files + skills copied | Full L4v sandbox test | L4v Test 24 |

### Frontend Build Checkpoints

| After Writing... | Run | Expected |
|---|---|---|
| `app/layout.tsx` + `globals.css` | `npx tsc --noEmit` | L0f |
| `lib/supabase/*` + `middleware.ts` | `npx tsc --noEmit` | L0f |
| `app/(auth)/login/page.tsx` | `npx tsc --noEmit` + dev server + curl login | L1f Tests 27-28 |
| `app/(dashboard)/dashboard/page.tsx` | `npx tsc --noEmit` + curl dashboard | L1f Test 29 |
| `types/database.ts` | `npx tsc --noEmit` (catches type mismatches) | L0f |
| `app/(dashboard)/projects/[id]/page.tsx` | `npx tsc --noEmit` + dev server | L1f |
| `components/agent-stream.tsx` | `npx tsc --noEmit` | L0f |
| `components/results-viewer.tsx` | `npx tsc --noEmit` | L0f |
| `components/contractor-questions-form.tsx` | `npx tsc --noEmit` | L0f |
| `app/api/generate/route.ts` | `npx tsc --noEmit` | L0f |
| All frontend files | `npm run build` + full L2f auth test | L0f + L2f |

---

## What Breaks First — Deployment Harness Failure Checklist

Ordered by likelihood (from agent SDK + Mako experience):

| # | Failure | Symptom | Fix | Test Level |
|---|---------|---------|-----|-----------|
| 1 | `.schema('crossbeam')` missing | Queries return empty, no error | Add `.schema('crossbeam')` to every Supabase query (server + frontend) | L2v, L2f |
| 2 | Schema name `mako` not renamed | "relation mako.xxx does not exist" | Global replace `mako` → `crossbeam` in supabase.ts | L2v |
| 3 | Table name wrong | "relation crossbeam.client_files does not exist" | Rename `client_files` → `files`, match DDL | L2v |
| 4 | Column name wrong | "column xxx does not exist" | Cross-check against plan-supabase-0213.md DDL | L2v |
| 5 | `flow_phase` not set on output insert | CHECK constraint violation | Always include `flow_phase` ('review', 'analysis', 'response') | L2v |
| 6 | Status CHECK violation | "new row violates check constraint" | Ensure all 8 states match DDL exactly | L1s |
| 7 | Skills are symlinks not copies | Docker build fails or sandbox can't read skills | `cp -rL` (resolve symlinks) when copying skills | L3v |
| 8 | VERCEL env vars missing | Sandbox creation fails with auth error | Set VERCEL_TEAM_ID, VERCEL_PROJECT_ID, VERCEL_TOKEN | L4v |
| 9 | RLS blocks service role | Server can't insert messages/outputs | Verify using service role key (bypasses RLS) | L1s |
| 10 | RLS blocks anon reads | Frontend gets empty results | Check `is_demo = true` policy, verify `.schema('crossbeam')` | L2f |
| 11 | Frontend env vars wrong | Supabase client can't connect | Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY | L2f |
| 12 | ESM/CJS module conflict | "Cannot use import statement" or "require is not defined" | Ensure `"type": "module"` in package.json, use `.js` extensions in imports | L0v |
| 13 | Next.js 16 breaking changes | Build errors from Mako patterns | Check Next.js migration guide, update deprecated APIs | L0f |
| 14 | Contractor answers not populated | Phase 2 has no questions to read | Verify server parses `contractor_questions.json` → inserts rows | L4v-contractor |
| 15 | Phase 2 missing Phase 1 outputs | Response generation fails | Verify server downloads Phase 1 outputs into sandbox | L4v-contractor |

---

## Quick-Reference SQL for Debugging

```sql
-- Current state of all projects
SELECT id, project_name, flow_type, status, is_demo, updated_at
FROM crossbeam.projects ORDER BY updated_at DESC;

-- Message count per project (is streaming working?)
SELECT p.project_name, COUNT(m.id) as msg_count
FROM crossbeam.projects p
LEFT JOIN crossbeam.messages m ON m.project_id = p.id
GROUP BY p.project_name;

-- Latest messages for a project (what's the agent doing?)
SELECT id, role, LEFT(content, 100) as content_preview, created_at
FROM crossbeam.messages
WHERE project_id = 'a0000000-0000-0000-0000-000000000001'
ORDER BY id DESC LIMIT 10;

-- Output status for a project
SELECT flow_phase,
       corrections_letter_md IS NOT NULL as has_letter,
       corrections_analysis_json IS NOT NULL as has_analysis,
       response_letter_md IS NOT NULL as has_response,
       professional_scope_md IS NOT NULL as has_scope,
       raw_artifacts != '{}'::jsonb as has_artifacts,
       agent_cost_usd, agent_turns
FROM crossbeam.outputs
WHERE project_id = 'a0000000-0000-0000-0000-000000000001';

-- Contractor questions status
SELECT question_key, LEFT(question_text, 60) as question,
       is_answered, LEFT(answer_text, 40) as answer
FROM crossbeam.contractor_answers
WHERE project_id = 'a0000000-0000-0000-0000-000000000002';

-- RESET a demo project to try again
UPDATE crossbeam.projects SET status = 'ready', error_message = NULL
WHERE id = 'a0000000-0000-0000-0000-000000000001';
DELETE FROM crossbeam.messages WHERE project_id = 'a0000000-0000-0000-0000-000000000001';
DELETE FROM crossbeam.outputs WHERE project_id = 'a0000000-0000-0000-0000-000000000001';

-- RESET EVERYTHING (nuclear option)
UPDATE crossbeam.projects SET status = 'ready', error_message = NULL WHERE is_demo = true;
DELETE FROM crossbeam.messages;
DELETE FROM crossbeam.outputs;
DELETE FROM crossbeam.contractor_answers;
```

---

## Environment Variables Checklist

Before running any tests, verify these are set:

### Root `.env.local` (used by server via `--env-file`)

| Var | Status | Used By |
|---|---|---|
| `ANTHROPIC_API_KEY` | Set | Server (sandbox agent) |
| `SUPABASE_URL` | Set | Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Set | Server (bypasses RLS) |
| `SUPABASE_ANON_KEY` | Set | Frontend auth tests |
| `VERCEL_TEAM_ID` | Set | Server (sandbox creation) |
| `VERCEL_PROJECT_ID` | Set | Server (sandbox creation) |
| `VERCEL_TOKEN` | **CHECK** | Server (sandbox creation) — may need to be in root .env.local |
| `PORT` | Set (8080) | Server |

### Frontend `.env.local`

| Var | Status | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **CREATE** | Same as SUPABASE_URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **CREATE** | Same as SUPABASE_ANON_KEY |
| `CLOUD_RUN_URL` | **CREATE** | `http://localhost:8080` for dev, Cloud Run URL for prod |

---

## Notes

- **`npx tsc --noEmit` is your best friend.** Run it after every file. 5 seconds, catches most issues.
- **`.schema('crossbeam')` is the #1 gotcha.** Every Supabase query needs it. Without it, queries
  silently go to `public` schema and return empty results. No error thrown.
- **Service role key vs anon key:** Server uses service role (bypasses RLS). Frontend uses anon
  key (respects RLS). Never mix them up.
- **Skills must be resolved copies, not symlinks.** Docker and Vercel Sandbox can't follow host
  symlinks. Use `cp -rL` when copying from `agents-crossbeam/.claude/skills/`.
- **Status state machine matters.** The server must transition states in the right order. The
  frontend renders different UIs per state. If they're out of sync, the UI shows the wrong thing.
- **Phase 1 → Phase 2 handoff is the tricky part.** Server must: (1) parse contractor_questions.json,
  (2) insert into contractor_answers, (3) set status to `awaiting-answers`, (4) wait for human,
  (5) read answers back, (6) pass to Phase 2. Any gap breaks the flow.
- **Pre-compute results as a safety net.** If the live agent fails during demo, having pre-computed
  results in the DB means the results viewer still works. Run both flows once against demo data,
  save the output records. Then the judge can view them instantly.

---

*Written: Feb 13, 2026*
*Adapted from testing-agents-sdk-city.md for the deployment harness*
*Referenced by: plan-strategy-0213.md (all 4 streams)*
