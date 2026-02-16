# Testing Strategy — Vercel Sandbox Pipeline (Cloud)

## Why This Doc Exists

Local Agent SDK tests pass for both flows (contractor: $6.54/20min, city: $6.75/20min). Cloud (Vercel Sandbox) has **0 successful runs**. We need a structured testing ladder for cloud debugging — just like the local test ladders in `testing-agents-sdk.md` and `testing-agents-sdk-city.md`.

**Critical difference from local testing:** Cloud tests go through the deployed API (curl + Supabase queries), not `query()` directly. Claude Code can run these autonomously using the crossbeam-ops skill + API key.

**Reference docs:**
- `testing-agents-sdk.md` — Local contractor flow testing ladder
- `testing-agents-sdk-city.md` — Local city flow testing ladder
- `learnings-agents-sdk.md` — What worked and what broke locally

---

## Root Cause Analysis (Feb 14, 2026)

### Diagnosed from Supabase message forensics:

**City Review (b1) — Last run 07:59 UTC:**
- `pages-png.tar.gz` and `title-blocks.tar.gz` file records created 12 hours AFTER the run
- At runtime, only the PDF existed → sandbox downloaded 1 file instead of 3
- Agent tried `sips` (macOS-only) → failed in Linux sandbox
- **Status: Fixed** — tar.gz records now exist in the files table

**Corrections Analysis (b2) — Last run 08:35 UTC:**
- Agent had 3 files (PDF + 2 corrections PNGs), successfully parsed corrections
- Launched 3 parallel subagents, city discovery completed
- Terminated at 08:40:58 — **hit 80-turn limit**
- **Status: Fixed** — maxTurns raised to 500

---

## Pre-requisite Code Changes

### Change 1: Raise turn limits and budgets ✅ DONE
**File:** `server/src/utils/config.ts`
```
city-review:          maxTurns: 500, maxBudgetUsd: 50.00
corrections-analysis: maxTurns: 500, maxBudgetUsd: 50.00
corrections-response: maxTurns: 150, maxBudgetUsd: 20.00
```

### Change 2: Add [SANDBOX N/7] phase logging ✅ DONE
**File:** `server/src/services/sandbox.ts`
Numbered messages after each lifecycle phase for easy forensics.

### Change 3: Use detached runCommand mode ✅ DONE
**File:** `server/src/services/sandbox.ts`
The `runCommand` for `agent.mjs` was using default (non-detached) mode, which keeps an HTTP streaming connection open. GCP's load balancer kills idle HTTP connections at ~5 minutes, terminating the command. Fix: `detached: true` + resilient wait loop with automatic reconnection.

### Change 4: Cloud Run resource upgrades ✅ DONE
```bash
gcloud run deploy crossbeam-server --timeout=3600 --no-cpu-throttling \
  --min-instances=1 --memory=4Gi --cpu=4
```

### Change 5: Rebuild + Redeploy ✅ DONE
Revision: `crossbeam-server-00009-66v`

---

## Test Projects

### Existing Demo Projects

| Name | ID | Flow | Files |
|------|----|------|-------|
| City Review Demo | `b0000000-0000-0000-0000-000000000001` (b1) | city-review | PDF + pages-png.tar.gz + title-blocks.tar.gz |
| Contractor Demo | `b0000000-0000-0000-0000-000000000002` (b2) | corrections-analysis | PDF + 2 correction PNGs + pages-png.tar.gz + title-blocks.tar.gz |

### Small Test Projects (for CV2/CV3)

These need to be created. They use smaller tar.gz archives for faster, cheaper unit tests.

| Name | ID | Flow | Files | Source |
|------|----|------|-------|--------|
| City 1-Page Test | `c0000000-0000-0000-0000-000000000001` (c1) | city-review | pages-png-1page.tar.gz | `test-assets/cloud-tests/` |
| City 3-Page Test | `c0000000-0000-0000-0000-000000000002` (c2) | city-review | pages-png-3page.tar.gz | `test-assets/cloud-tests/` |

**Setup SQL (run once via Supabase MCP):**
```sql
-- Create 1-page test project
INSERT INTO crossbeam.projects (id, user_id, flow_type, project_name, city, project_address, status, is_demo)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'city-review',
  'Cloud Test: 1-Page City Review',
  'Placentia',
  '1232 N Jefferson St',
  'ready',
  true
);

-- Create 3-page test project
INSERT INTO crossbeam.projects (id, user_id, flow_type, project_name, city, project_address, status, is_demo)
VALUES (
  'c0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'city-review',
  'Cloud Test: 3-Page City Review',
  'Placentia',
  '1232 N Jefferson St',
  'ready',
  true
);
```

**Upload archives to Supabase storage bucket `crossbeam-demo-assets`:**
```
cloud-tests/pages-png-1page.tar.gz  (3.1 MB — just page-01.png cover sheet)
cloud-tests/pages-png-3page.tar.gz  (11 MB — page-01, page-02, page-03)
```

**File records (after upload):**
```sql
-- 1-page test file record
INSERT INTO crossbeam.files (project_id, filename, file_type, storage_path)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'pages-png-1page.tar.gz',
  'archive',
  'crossbeam-demo-assets/cloud-tests/pages-png-1page.tar.gz'
);

-- 3-page test file records
INSERT INTO crossbeam.files (project_id, filename, file_type, storage_path)
VALUES (
  'c0000000-0000-0000-0000-000000000002',
  'pages-png-3page.tar.gz',
  'archive',
  'crossbeam-demo-assets/cloud-tests/pages-png-3page.tar.gz'
);
```

---

## Cloud Testing Ladder

### CV0: Pre-flight Checks ($0, ~30 sec)

**What it tests:** Is all infrastructure up? Are file records correct?

**Commands:**
```bash
# 1. Cloud Run health
curl -s https://crossbeam-server-v7eqq3533a-uc.a.run.app/health

# 2. City demo project
curl -s https://cc-crossbeam.vercel.app/api/projects/b0000000-0000-0000-0000-000000000001 \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" | jq '{status: .project.status, files: (.files | length)}'

# 3. Contractor demo project
curl -s https://cc-crossbeam.vercel.app/api/projects/b0000000-0000-0000-0000-000000000002 \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" | jq '{status: .project.status, files: (.files | length)}'
```

**Supabase checks:**
```sql
-- City demo files (expect 3)
SELECT filename, file_type FROM crossbeam.files
WHERE project_id = 'b0000000-0000-0000-0000-000000000001';

-- Contractor demo files (expect 5)
SELECT filename, file_type FROM crossbeam.files
WHERE project_id = 'b0000000-0000-0000-0000-000000000002';
```

**Pass criteria:**
- [ ] Cloud Run returns `{"status":"ok"}`
- [ ] City project files = 3
- [ ] Contractor project files = 5

---

### CV1: Boot Verification ($0-1, ~3 min)

**What it tests:** Full sandbox lifecycle up to agent start. Does NOT let the agent run to completion — just confirms boot.

**Commands:**
```bash
# 1. Reset
curl -X POST https://cc-crossbeam.vercel.app/api/reset-project \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"b0000000-0000-0000-0000-000000000001"}'

# 2. Trigger
curl -X POST https://cc-crossbeam.vercel.app/api/generate \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"b0000000-0000-0000-0000-000000000001","flow_type":"city-review"}'

# 3. Poll Supabase messages every 15 sec
```

**Expected message sequence:**
| # | Message | ~Time |
|---|---------|-------|
| 1 | `[SANDBOX 1/7] Sandbox created` | 30s |
| 2 | `[SANDBOX 2/7] Dependencies installed` | 90s |
| 3 | `[SANDBOX 3/7] Downloaded 3 files` | 120s |
| 4 | `[SANDBOX 4/7] Archives unpacked` | 130s |
| 5 | `[SANDBOX 5/7] Skills copied (7 skills)` | 140s |
| 6 | `[SANDBOX 6/7] Setup complete` | 145s |
| 7 | `[SANDBOX 7/7] Launching plan review agent...` | 150s |
| 8 | `Agent starting...` | 155s |

**Pass criteria:**
- [ ] All 7 SANDBOX messages appear
- [ ] Downloaded file count = 3 (not 1!)
- [ ] `Agent starting...` message appears
- [ ] No errors between phases

**Key failure modes:**
- Stalls after 1/7 → npm install failed (check Cloud Run logs)
- `Downloaded 1 files` → missing file records in DB
- No messages at all → Cloud Run didn't receive request (check env vars)

---

### CV2: 1-Page City Review (~5-8 min, ~$1-3)

**What it tests:** Agent receives 1 page (cover sheet only), discovers skills, attempts to review it, writes output. Tests the full agent loop with minimal data — catches skill discovery, file access, tool usage, and output writing issues.

**Prerequisite:** CV1 passes. Test project `c1` exists with 1-page archive.

```bash
# 1. Reset
curl -X POST https://cc-crossbeam.vercel.app/api/reset-project \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"c0000000-0000-0000-0000-000000000001"}'

# 2. Trigger
curl -X POST https://cc-crossbeam.vercel.app/api/generate \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"c0000000-0000-0000-0000-000000000001","flow_type":"city-review"}'
```

**Monitoring (every 30 sec):**
```sql
SELECT role, left(content, 150) as content, created_at
FROM crossbeam.messages
WHERE project_id = 'c0000000-0000-0000-0000-000000000001'
ORDER BY created_at DESC LIMIT 10;
```

**What we're looking for:**
- Agent finds skills (look for `Skill` tool usage in messages)
- Agent reads the cover sheet PNG
- Agent writes output files to output dir
- Agent completes without hitting turn/budget limit

**Pass criteria:**
- [ ] Status = `completed`
- [ ] Agent used < 100 turns
- [ ] Agent cost < $5
- [ ] Output record has `raw_artifacts` with at least `sheet-manifest.json`
- [ ] No `sips` or macOS-specific errors in messages

**What this catches that CV1 doesn't:**
- Skills not actually working (CV1 only checks they're copied)
- Agent can't read PNGs (file access in sandbox)
- Agent writing to wrong output directory
- Agent stuck in loops (cheaper to debug with 1 page)

---

### CV3: 3-Page City Review (~8-12 min, ~$3-5)

**What it tests:** Agent with 3 pages (cover + 2 plan sheets). Tests multi-page review, sheet manifest building, and subagent coordination — still small enough for fast iteration.

**Prerequisite:** CV2 passes.

```bash
# 1. Reset
curl -X POST https://cc-crossbeam.vercel.app/api/reset-project \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"c0000000-0000-0000-0000-000000000002"}'

# 2. Trigger
curl -X POST https://cc-crossbeam.vercel.app/api/generate \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"c0000000-0000-0000-0000-000000000002","flow_type":"city-review"}'
```

**Pass criteria:**
- [ ] Status = `completed`
- [ ] Agent used < 150 turns
- [ ] Agent cost < $8
- [ ] sheet-manifest.json has 3 entries
- [ ] draft_corrections.md exists with at least some findings

**What this catches that CV2 doesn't:**
- Multi-page sheet manifest building
- Subagent spawning for review (may spawn review subagents for sheets)
- Agent handling multiple PNGs

---

### CV4: Full City Review (~15-25 min, ~$6-15)

**What it tests:** Full 15-page city review — the actual demo flow.

**Prerequisite:** CV3 passes.

```bash
# Use the demo project (b1)
curl -X POST https://cc-crossbeam.vercel.app/api/reset-project \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"b0000000-0000-0000-0000-000000000001"}'

curl -X POST https://cc-crossbeam.vercel.app/api/generate \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"b0000000-0000-0000-0000-000000000001","flow_type":"city-review"}'
```

**Monitoring (every 60 sec):**
```sql
SELECT role, left(content, 150) as content, created_at
FROM crossbeam.messages
WHERE project_id = 'b0000000-0000-0000-0000-000000000001'
ORDER BY created_at DESC LIMIT 10;
```

**Expected output artifacts:**
- `sheet-manifest.json`
- `sheet_findings.json`
- `state_compliance.json`
- `draft_corrections.json`
- `draft_corrections.md`
- `review_summary.json`

**Pass criteria:**
- [ ] Status = `completed`
- [ ] Cost < $40, turns < 400
- [ ] All 6 output artifacts present
- [ ] draft_corrections.md has numbered corrections with code citations

---

### CV5: Contractor Flow End-to-End (~25-35 min, ~$10-25)

**What it tests:** Full 2-phase contractor flow. Phase 1 (corrections-analysis) → auto-fill answers → Phase 2 (corrections-response).

**Prerequisite:** CV4 passes.

```bash
# 1. Reset
curl -X POST https://cc-crossbeam.vercel.app/api/reset-project \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"b0000000-0000-0000-0000-000000000002"}'

# 2. Trigger Phase 1
curl -X POST https://cc-crossbeam.vercel.app/api/generate \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"b0000000-0000-0000-0000-000000000002","flow_type":"corrections-analysis"}'

# 3. Poll until status = awaiting-answers
# 4. Auto-fill answers (SQL below)
# 5. Trigger Phase 2
# 6. Poll until status = completed
```

**Auto-fill answers (after Phase 1 completes):**
```sql
UPDATE crossbeam.contractor_answers
SET answer_text = 'Acknowledged — will comply with this correction.',
    is_answered = true,
    updated_at = now()
WHERE project_id = 'b0000000-0000-0000-0000-000000000002'
  AND is_answered = false;
```

**Phase 2 trigger:**
```bash
curl -X POST https://cc-crossbeam.vercel.app/api/generate \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"b0000000-0000-0000-0000-000000000002","flow_type":"corrections-response"}'
```

**Pass criteria:**
- [ ] Phase 1: status = `awaiting-answers`
- [ ] Contractor questions populated in DB
- [ ] Phase 2: status = `completed`
- [ ] Output has response_letter.md, professional_scope.md, corrections_report.md

---

## Failure Mode Catalog

| # | Symptom | Where | Root Cause | Fix |
|---|---------|-------|------------|-----|
| 1 | No messages at all | CV1 | Cloud Run didn't receive request | Check CLOUD_RUN_URL env, Cloud Run logs |
| 2 | Only `[SANDBOX 1/7]` | CV1 | npm install failed | Check Cloud Run logs for npm errors |
| 3 | `Downloaded 1 files` | CV1 | Missing file records in DB | Add tar.gz records to files table |
| 4 | No `[SANDBOX 4/7]` | CV1 | Archive unpack failed | Check tar.gz format, storage bucket |
| 5 | Agent says "no skills" | CV2 | Skills not copied / settingSources wrong | Check [SANDBOX 5/7], verify paths |
| 6 | Agent tries `sips` | CV2 | PNGs not in expected dir | Verify archive unpack → pages-png/ |
| 7 | Agent stops mid-flow | CV3+ | Turn or budget limit hit | Check result subtype |
| 8 | Excessive WebSearch | CV2+ | Agent using web instead of offline skills | Strengthen prompt wording |
| 9 | Status stuck `processing` | Any | Agent crashed silently | Check Cloud Run logs |
| 10 | Completed but no output | CV2+ | Output dir mismatch | Check SANDBOX_OUTPUT_PATH |
| 11 | `TypeError: terminated` at ~5 min | CV2+ | HTTP streaming conn killed by GCP LB | Use `detached: true` mode (FIXED) |
| 12 | `SocketError: other side closed` | CV2+ | Same as #11 | Same fix — detached mode |

---

## Diagnostic Queries

```sql
-- Latest messages (reverse chron)
SELECT id, role, left(content, 200), created_at
FROM crossbeam.messages
WHERE project_id = '<PID>'
ORDER BY created_at DESC LIMIT 20;

-- Project status + error
SELECT status, error_message, updated_at
FROM crossbeam.projects WHERE id = '<PID>';

-- Output details
SELECT flow_phase, agent_cost_usd, agent_turns, agent_duration_ms
FROM crossbeam.outputs
WHERE project_id = '<PID>'
ORDER BY created_at DESC LIMIT 1;

-- Message count by role
SELECT role, count(*)
FROM crossbeam.messages WHERE project_id = '<PID>'
GROUP BY role;
```

---

## Test Results Log

### Code Changes

| Change | Status | Notes |
|--------|--------|-------|
| Raise turns to 500 + budgets to $50 | ✅ DONE | `server/src/utils/config.ts` |
| Add [SANDBOX N/7] phase logging | ✅ DONE | `server/src/services/sandbox.ts` |
| Detached runCommand mode | ✅ DONE | `server/src/services/sandbox.ts` — THE key fix |
| Cloud Run resource upgrades | ✅ DONE | timeout=3600, no-cpu-throttling, 4 CPU, 4Gi RAM |
| Rebuild + redeploy to Cloud Run | ✅ DONE | Revision `crossbeam-server-00009-66v` |

### CV0: Pre-flight ✅ PASSED

| Check | Status | Result |
|-------|--------|--------|
| Cloud Run health | ✅ | `{"status":"ok"}` |
| City project API (files=3) | ✅ | 3 files (PDF + 2 tar.gz) |
| Contractor project API (files=5) | ✅ | 5 files |

### CV1: Boot Verification ✅ PASSED

| Check | Status | Result |
|-------|--------|--------|
| [SANDBOX 1/7] created | ✅ | ~30s |
| [SANDBOX 2/7] deps installed | ✅ | ~8s |
| [SANDBOX 3/7] downloaded N files | ✅ | N=3 for b1, N=1 for c1 |
| [SANDBOX 4/7] archives unpacked | ✅ | |
| [SANDBOX 5/7] skills copied | ✅ | 7 skills |
| [SANDBOX 6/7] setup complete | ✅ | |
| [SANDBOX 7/7] launching agent | ✅ | |
| Agent starting | ✅ | |

### CV2: 1-Page Review ✅ PASSED (Feb 14, 22:00 UTC)

| Check | Status | Result |
|-------|--------|--------|
| Test project c1 created | ✅ | `c0000000-...-000000000001` |
| Archive uploaded to storage | ✅ | 3.1MB pages-png-1page.tar.gz |
| File record created | ✅ | |
| Agent completed | ✅ | **FIRST SUCCESSFUL CLOUD RUN!** |
| Turns used | ✅ | 37 turns (well under 500 limit) |
| Cost | ✅ | $3.14 |
| Duration | ✅ | 10.2 min (612s) |
| Output artifacts | ✅ | All 7: sheet-manifest, sheet_findings, state_compliance, city_compliance, draft_corrections.json, draft_corrections.md, review_summary |

### CV3: 3-Page Review

| Check | Status | Result |
|-------|--------|--------|
| Test project c2 created | ✅ | `c0000000-...-000000000002` |
| Archive uploaded to storage | ✅ | 11MB pages-png-3page.tar.gz |
| File record created | ✅ | |
| Agent completed | | PENDING |
| Turns / cost | | |
| sheet-manifest entries | | |

### CV4: Full City Review — PARTIAL (Feb 14, 22:27 UTC)

| Check | Status | Result |
|-------|--------|--------|
| Status = completed | ✅ | Sandbox infra worked perfectly |
| Boot + all 7 phases | ✅ | Downloaded 3 files, unpacked 2 archives, 15 pages |
| Cost / turns | ⚠️ | $0.72 / 45 turns — WAY too fast, agent stopped early |
| All 6+ artifacts present | ❌ | Only `sheet-manifest.json` — no review artifacts |
| draft_corrections.md quality | ❌ | Not generated |
| **Root cause** | | Agent read all 15 PNGs + 15 title blocks (30 images) in main context → hit context window → completed before review work. Need subagent architecture for multi-page review. **Not a sandbox issue — skill/prompt architecture issue.** |

### CV5: Contractor E2E

| Check | Status | Result |
|-------|--------|--------|
| Phase 1 → awaiting-answers | | PENDING |
| Phase 1 cost/turns | | |
| Questions generated | | |
| Phase 2 → completed | | |
| Phase 2 cost/turns | | |
| Response letter quality | | |

### Issues Found & Fixed

| # | Issue | Found In | Fix | Verified |
|---|-------|----------|-----|----------|
| 1 | tar.gz file records missing at runtime | Root cause analysis | Records added to DB | ✅ CV1 — Downloaded 3 files |
| 2 | 80-turn limit too low | Root cause analysis | Raised to 500 | ✅ CV2 — used 37 turns |
| 3 | Cloud Run CPU throttling | CV2 fail #1 | `--no-cpu-throttling` | ✅ |
| 4 | Cloud Run request timeout 900s | CV2 fail #1 | `--timeout=3600` | ✅ |
| 5 | **runCommand HTTP connection killed at ~5min** | CV2 fails #1-3 | **`detached: true` mode** | ✅ CV2 — ran 10.2 min |
| 6 | `sips` (macOS-only) in sandbox | Root cause analysis | Pre-extracted PNGs + archive | ✅ CV2 — no sips errors |
