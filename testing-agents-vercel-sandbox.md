# Testing Strategy — Vercel Sandbox Pipeline (Cloud)

## Why This Doc Exists

Local Agent SDK tests pass for both flows (contractor: $6.54/20min, city: $6.75/20min). Cloud (Vercel Sandbox) has **0 successful runs**. We need a structured testing ladder for cloud debugging — just like the local test ladders in `testing-agents-sdk.md` and `testing-agents-sdk-city.md`.

**Critical difference from local testing:** Cloud tests go through the deployed API (curl + Supabase queries), not `query()` directly. Claude Code can run these autonomously using the crossbeam-ops skill + API key.

**Reference docs:**
- `testing-agents-sdk.md` — Local contractor flow testing
- `testing-agents-sdk-city.md` — Local city flow testing
- `learnings-agents-sdk.md` — What worked and what broke locally

---

## Root Cause Analysis (Feb 14, 2026)

### Diagnosed from Supabase message forensics:

**City Review (b0000000-0000-0000-0000-000000000001) — Last run 07:59 UTC:**
- `pages-png.tar.gz` and `title-blocks.tar.gz` file records were created at 20:35 UTC — **12 hours AFTER the run**
- At runtime, only the PDF existed in the `files` table → sandbox downloaded 1 file instead of 3
- Agent tried to extract pages from PDF using `sips` (macOS-only tool) → failed in Linux sandbox
- **Root cause: Missing file records in DB at time of run**
- **Status: Fixed** — tar.gz records now exist in the files table

**Corrections Analysis (b0000000-0000-0000-0000-000000000002) — Last run 08:35 UTC:**
- Same archive issue, but agent had 3 files (PDF + 2 corrections PNGs)
- Agent successfully parsed corrections, launched 3 parallel subagents
- City discovery completed, but agent terminated at 08:40:58 — **hit 80-turn limit**
- **Root cause: Turn limit too low for multi-subagent flows**
- **Status: Needs code change** — raise maxTurns from 80 to 500

### Key Cloud vs Local Differences

| Factor | Local | Cloud Sandbox |
|--------|-------|---------------|
| PDF→PNG | Pre-populated fixtures | Must download + unpack tar.gz archives |
| Skills | Symlinked from host | Copied to sandbox filesystem |
| Turn limit | 80-100 | Same — but sandbox burns more turns on setup |
| `allowedTools` | Restricted for offline tests | Not set — agent wastes turns on WebSearch |
| macOS tools | Available (sips) | NOT available — Linux only |

---

## Pre-requisite Code Changes

Apply these before running any cloud tests.

### Change 1: Raise turn limits and budgets
**File:** `server/src/utils/config.ts` (lines 27-31)

```typescript
// BEFORE:
'city-review':          { maxTurns: 100, maxBudgetUsd: 20.00 },
'corrections-analysis': { maxTurns: 80,  maxBudgetUsd: 15.00 },
'corrections-response': { maxTurns: 40,  maxBudgetUsd: 8.00  },

// AFTER:
'city-review':          { maxTurns: 500, maxBudgetUsd: 50.00 },
'corrections-analysis': { maxTurns: 500, maxBudgetUsd: 50.00 },
'corrections-response': { maxTurns: 150, maxBudgetUsd: 20.00 },
```

**Why:** Local L4c used ~100 turns at $6.75. Sandbox burns more turns on setup. Set high (500) now — we'll tune down once we know the actual average. Better to waste a few bucks than waste a test run.

### Change 2: Add sandbox phase logging
**File:** `server/src/services/sandbox.ts` (inside `runCrossBeamFlow`, lines 770-833)

Replace the existing system messages with numbered `[SANDBOX N/7]` messages for each lifecycle phase:

```typescript
await insertMessage(projectId, 'system', '[SANDBOX 1/7] Sandbox created');
await insertMessage(projectId, 'system', '[SANDBOX 2/7] Dependencies installed');
await insertMessage(projectId, 'system', `[SANDBOX 3/7] Downloaded ${files.length} files`);
await insertMessage(projectId, 'system', '[SANDBOX 4/7] Archives unpacked');
await insertMessage(projectId, 'system', `[SANDBOX 5/7] Skills copied (${FLOW_SKILLS[flowType].length} skills)`);
await insertMessage(projectId, 'system', '[SANDBOX 6/7] Pre-extraction complete');
await insertMessage(projectId, 'system', '[SANDBOX 7/7] Launching agent...');
```

**Why:** When monitoring messages, numbered phases make it trivial to see exactly where things stall.

### Change 3: Rebuild + Redeploy
```bash
cd server
npm run build
# Then rebuild Docker + push to Cloud Run
```

---

## Cloud Testing Ladder

### CV0: Pre-flight Checks ($0, ~30 sec)

**What it tests:** Is all infrastructure up? Are file records correct?

**Commands:**
```bash
# 1. Cloud Run health
curl -s https://crossbeam-server-v7eqq3533a-uc.a.run.app/health

# 2. Vercel API auth + city project
curl -s https://cc-crossbeam.vercel.app/api/projects/b0000000-0000-0000-0000-000000000001 \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" | jq '{status: .project.status, files: (.files | length)}'

# 3. Vercel API auth + contractor project
curl -s https://cc-crossbeam.vercel.app/api/projects/b0000000-0000-0000-0000-000000000002 \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" | jq '{status: .project.status, files: (.files | length)}'
```

**Supabase checks (via MCP `execute_sql`):**
```sql
-- City demo file records (expect 3: PDF + pages-png.tar.gz + title-blocks.tar.gz)
SELECT filename, file_type FROM crossbeam.files
WHERE project_id = 'b0000000-0000-0000-0000-000000000001';

-- Contractor demo file records (expect 5: PDF + 2 correction PNGs + 2 tar.gz)
SELECT filename, file_type FROM crossbeam.files
WHERE project_id = 'b0000000-0000-0000-0000-000000000002';
```

**Pass criteria:**
- [ ] Cloud Run returns `{"status":"ok"}`
- [ ] City project API returns files count = 3
- [ ] Contractor project API returns files count = 5
- [ ] All storage_path values valid

---

### CV1: Reset + Trigger + Boot Verification ($0-1, ~3 min)

**What it tests:** Full sandbox lifecycle: creation → deps → download → unpack → skills → agent start.

**Commands:**
```bash
# 1. Reset city demo project
curl -X POST https://cc-crossbeam.vercel.app/api/reset-project \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"b0000000-0000-0000-0000-000000000001"}'

# 2. Trigger city-review
curl -X POST https://cc-crossbeam.vercel.app/api/generate \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"b0000000-0000-0000-0000-000000000001","flow_type":"city-review"}'

# 3. Poll every 15 sec for boot confirmation
```

**Monitoring (poll Supabase every 15 sec for ~3 min):**
```sql
SELECT id, role, content, created_at
FROM crossbeam.messages
WHERE project_id = 'b0000000-0000-0000-0000-000000000001'
ORDER BY created_at DESC LIMIT 5;
```

**Expected message sequence:**

| # | Message | Expected Timing |
|---|---------|----------------|
| 1 | `[SANDBOX 1/7] Sandbox created` | ~30 sec |
| 2 | `[SANDBOX 2/7] Dependencies installed` | ~90 sec |
| 3 | `[SANDBOX 3/7] Downloaded 3 files` | ~120 sec |
| 4 | `[SANDBOX 4/7] Archives unpacked` | ~130 sec |
| 5 | `[SANDBOX 5/7] Skills copied (7 skills)` | ~140 sec |
| 6 | `[SANDBOX 6/7] Pre-extraction complete` | ~145 sec |
| 7 | `[SANDBOX 7/7] Launching agent...` | ~150 sec |
| 8 | `Agent starting...` | ~155 sec |

**Pass criteria:**
- [ ] All 7 SANDBOX messages appear
- [ ] File download count = 3 (not 1!)
- [ ] Agent starting message appears
- [ ] No error messages between phases

**If it stalls after a specific phase, see Failure Mode Catalog below.**

---

### CV2: Full City Review Run ($6-15, ~15-25 min)

**What it tests:** Agent completes the full city-review flow end-to-end.

**Prerequisite:** CV1 passes (agent boots and starts).

After CV1, let the flow continue. Monitor messages every 30 seconds:

```sql
SELECT id, role,
  CASE WHEN length(content) > 150 THEN left(content, 150) || '...' ELSE content END as content,
  created_at
FROM crossbeam.messages
WHERE project_id = 'b0000000-0000-0000-0000-000000000001'
ORDER BY created_at DESC LIMIT 10;
```

**Key milestone messages:**

| Message Pattern | Meaning | Expected Time |
|----------------|---------|---------------|
| tool: `Skill` | Agent loaded adu-plan-review skill | ~3 min |
| tool: `Glob` / `Read` | Agent exploring files, reading skill refs | ~3-5 min |
| tool: `Task` | Agent spawning review subagents | ~5-8 min |
| tool: `TaskOutput` | Agent checking on subagents | ~8-15 min |
| tool: `Write` | Agent writing output files | ~15-20 min |
| `Completed in N turns, cost: $X` | Agent finished | ~15-25 min |

**Final checks:**
```sql
-- Project status
SELECT status, error_message, updated_at
FROM crossbeam.projects
WHERE id = 'b0000000-0000-0000-0000-000000000001';

-- Output details
SELECT flow_phase, agent_cost_usd, agent_turns, agent_duration_ms
FROM crossbeam.outputs
WHERE project_id = 'b0000000-0000-0000-0000-000000000001'
ORDER BY created_at DESC LIMIT 1;
```

```bash
# Output artifacts via API
curl -s https://cc-crossbeam.vercel.app/api/projects/b0000000-0000-0000-0000-000000000001 \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" | jq '.latest_output | {cost: .agent_cost_usd, turns: .agent_turns, duration_ms: .agent_duration_ms, artifacts: (.raw_artifacts | keys)}'
```

**Expected output artifacts (in raw_artifacts):**
- `sheet-manifest.json`
- `sheet_findings.json`
- `state_compliance.json`
- `draft_corrections.json`
- `draft_corrections.md`
- `review_summary.json`

**Pass criteria:**
- [ ] Status = `completed`
- [ ] Output record exists
- [ ] raw_artifacts contains all 6 expected files
- [ ] draft_corrections.md has numbered corrections with code citations
- [ ] Cost < $40, turns < 400

---

### CV3: Contractor Flow End-to-End ($10-25, ~25-35 min)

**What it tests:** Full 2-phase contractor flow: analysis → answers → response.

**Prerequisite:** CV2 passes (city-review works).

```bash
# 1. Reset contractor project
curl -X POST https://cc-crossbeam.vercel.app/api/reset-project \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"b0000000-0000-0000-0000-000000000002"}'

# 2. Trigger Phase 1 (corrections-analysis)
curl -X POST https://cc-crossbeam.vercel.app/api/generate \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"b0000000-0000-0000-0000-000000000002","flow_type":"corrections-analysis"}'

# 3. Monitor + poll until status = awaiting-answers
```

**After Phase 1 completes (status = awaiting-answers):**
```sql
-- Check contractor questions
SELECT question_key, left(question_text, 100), is_answered
FROM crossbeam.contractor_answers
WHERE project_id = 'b0000000-0000-0000-0000-000000000002';

-- Auto-fill answers for testing
UPDATE crossbeam.contractor_answers
SET answer_text = 'Acknowledged — will comply with this correction.',
    is_answered = true,
    updated_at = now()
WHERE project_id = 'b0000000-0000-0000-0000-000000000002'
  AND is_answered = false;
```

**Trigger Phase 2:**
```bash
curl -X POST https://cc-crossbeam.vercel.app/api/generate \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"b0000000-0000-0000-0000-000000000002","flow_type":"corrections-response"}'
```

**Pass criteria:**
- [ ] Phase 1: status = `awaiting-answers`, contractor questions populated
- [ ] Phase 2: status = `completed`
- [ ] Output: response_letter_md, professional_scope_md, corrections_report_md populated

---

## Failure Mode Catalog

### Boot Failures (CV1)

| # | Symptom | Message Pattern | Root Cause | Fix |
|---|---------|----------------|------------|-----|
| 1 | No messages at all | (none) | Cloud Run didn't receive request | Check CLOUD_RUN_URL env, Cloud Run logs |
| 2 | Only `[SANDBOX 1/7]` | Stall after creation | npm install failed | Check Cloud Run logs for npm errors |
| 3 | `Downloaded 1 files` | Wrong file count | Missing file records in DB | Add tar.gz records to files table |
| 4 | No `[SANDBOX 4/7]` | Archive unpack failed | tar.gz format or missing file | Check storage bucket, re-upload |
| 5 | Skills copied but agent fails | `[SANDBOX 5/7]` then error | settingSources or cwd mismatch | Verify `.claude/skills/` in sandbox |

### Agent Failures (CV2/CV3)

| # | Symptom | Message Pattern | Root Cause | Fix |
|---|---------|----------------|------------|-----|
| 6 | Agent tries `sips` | `sips which is macOS-only` | Pre-extracted PNGs missing | Verify archive unpack, check pages-png/ |
| 7 | Agent stops mid-flow | Last msg `TaskOutput` | Turn or budget limit hit | Raise maxTurns / maxBudgetUsd |
| 8 | Agent does excessive WebSearch | Multiple `WebSearch` calls | Agent using web instead of offline skills | Strengthen prompt to prefer offline skills |
| 9 | Agent says "no skills" | `I don't have any skills` | Skills not copied / cwd wrong | Check [SANDBOX 5/7], verify paths |
| 10 | Status stuck `processing` | No status change | Agent crashed silently | Check Cloud Run logs |
| 11 | Completed but no output | `Completed in N turns` | Output dir mismatch | Check SANDBOX_OUTPUT_PATH |
| 12 | `error_max_turns` | Result subtype | Turn limit exhausted | Raise maxTurns |
| 13 | `error_max_budget_usd` | Result subtype | Budget exhausted | Raise maxBudgetUsd |

---

## Diagnostic Queries (Quick Reference)

```sql
-- Latest messages (reverse chronological)
SELECT id, role, left(content, 200), created_at
FROM crossbeam.messages
WHERE project_id = '<PROJECT_ID>'
ORDER BY created_at DESC LIMIT 20;

-- Project status + error
SELECT status, error_message, updated_at
FROM crossbeam.projects WHERE id = '<PROJECT_ID>';

-- Output details
SELECT flow_phase, agent_cost_usd, agent_turns, agent_duration_ms
FROM crossbeam.outputs
WHERE project_id = '<PROJECT_ID>'
ORDER BY created_at DESC LIMIT 1;

-- Message count by role
SELECT role, count(*)
FROM crossbeam.messages
WHERE project_id = '<PROJECT_ID>'
GROUP BY role;

-- Contractor questions
SELECT question_key, left(question_text, 100), is_answered
FROM crossbeam.contractor_answers
WHERE project_id = '<PROJECT_ID>';

-- Clear stale data for fresh run
DELETE FROM crossbeam.messages WHERE project_id = '<PROJECT_ID>';
DELETE FROM crossbeam.outputs WHERE project_id = '<PROJECT_ID>';
```

---

## Test Results Log

### Code Changes Applied

| Change | Status | Notes |
|--------|--------|-------|
| Raise turn limits (500) + budgets ($50) | TODO | `server/src/utils/config.ts` |
| Add [SANDBOX N/7] phase logging | TODO | `server/src/services/sandbox.ts` |
| Rebuild + redeploy to Cloud Run | TODO | After code changes |

### CV0: Pre-flight Results

| Check | Status | Result |
|-------|--------|--------|
| Cloud Run health | TODO | |
| City project API (files=3) | TODO | |
| Contractor project API (files=5) | TODO | |
| City file records (3 rows) | TODO | |
| Contractor file records (5 rows) | TODO | |

### CV1: Boot Verification Results

| Check | Status | Result |
|-------|--------|--------|
| Reset project | TODO | |
| Trigger city-review | TODO | |
| [SANDBOX 1/7] Sandbox created | TODO | |
| [SANDBOX 2/7] Dependencies installed | TODO | |
| [SANDBOX 3/7] Downloaded N files | TODO | N = ? |
| [SANDBOX 4/7] Archives unpacked | TODO | |
| [SANDBOX 5/7] Skills copied | TODO | |
| [SANDBOX 6/7] Pre-extraction | TODO | |
| [SANDBOX 7/7] Agent launching | TODO | |
| Agent starting | TODO | |

### CV2: Full City Review Results

| Check | Status | Result |
|-------|--------|--------|
| Agent invoked skill | TODO | |
| Subagents spawned | TODO | How many? |
| Final status | TODO | completed / failed / error_max_turns |
| Agent cost | TODO | $? |
| Agent turns | TODO | ? |
| Agent duration | TODO | ? min |
| Output artifacts | TODO | Which files present? |
| draft_corrections.md quality | TODO | Corrections count? Code citations? |

### CV3: Contractor Flow Results

| Check | Status | Result |
|-------|--------|--------|
| Phase 1 final status | TODO | awaiting-answers / failed |
| Phase 1 cost/turns | TODO | |
| Contractor questions generated | TODO | How many? |
| Phase 2 triggered | TODO | |
| Phase 2 final status | TODO | completed / failed |
| Phase 2 cost/turns | TODO | |
| Response letter quality | TODO | |

### Issues Found & Fixed

| # | Issue | Found In | Fix Applied | Verified |
|---|-------|----------|-------------|----------|
| 1 | tar.gz file records missing at runtime | Root cause analysis | Records now exist in DB | TODO — verify in CV1 |
| 2 | 80-turn limit too low | Root cause analysis | TODO — raise to 500 | TODO — verify in CV3 |
| | | | | |

---

## Demo Project Quick Reference

| Project | ID | Flow | Files |
|---------|----|----|-------|
| City Review | `b0000000-0000-0000-0000-000000000001` | city-review | PDF + pages-png.tar.gz + title-blocks.tar.gz |
| Contractor | `b0000000-0000-0000-0000-000000000002` | corrections-analysis | PDF + 2 corrections PNGs + pages-png.tar.gz + title-blocks.tar.gz |
| Dev City | `a0000000-0000-0000-0000-000000000001` | city-review | Same files |
| Dev Contractor | `a0000000-0000-0000-0000-000000000002` | corrections-analysis | Same files |

**API URLs:**
- Vercel: `https://cc-crossbeam.vercel.app`
- Cloud Run: `https://crossbeam-server-v7eqq3533a-uc.a.run.app`
- Auth: `Authorization: Bearer $CROSSBEAM_API_KEY`

---

## Execution Order

| # | Step | Est. Time | Depends On |
|---|------|-----------|-----------|
| 1 | Apply code changes (config + sandbox) | 15 min | Nothing |
| 2 | Rebuild + redeploy server | 5-10 min | Step 1 |
| 3 | CV0 (pre-flight) | 1 min | Step 2 |
| 4 | CV1 (boot verification) | 3 min | CV0 passes |
| 5 | CV2 (full city review) | 15-25 min | CV1 passes |
| 6 | Fix issues from CV2 if needed | varies | CV2 failure |
| 7 | CV3 (contractor end-to-end) | 25-35 min | CV2 passes |

**Total estimated time:** ~60-90 min
**Total estimated API cost:** ~$15-40

---

## Notes

- **Always check messages before re-running** — stale messages from previous runs confuse diagnosis
- **Delete messages + outputs before re-testing** (or use reset-project endpoint)
- **Cloud Run cold starts** add ~10-30 sec on first request after idle
- **Vercel Sandbox timeout** is 30 min — sufficient for all flows
- **The agent script (`agent.mjs`)** handles all output writing + Supabase updates — Cloud Run just orchestrates sandbox lifecycle
- **If context compacts:** Read this doc + crossbeam-ops skill references to get back up to speed
- **Turn limit set to 500** — intentionally high. We'll tune down after learning the actual average turns needed. Rather waste money than waste test runs.
