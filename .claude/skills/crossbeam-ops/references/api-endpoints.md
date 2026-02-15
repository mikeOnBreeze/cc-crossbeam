---
title: "API Endpoints Reference"
category: operations
relevance: "When triggering flows, checking status, getting results, or resetting projects via HTTP"
---

# CrossBeam API Endpoints

All endpoints accept `Authorization: Bearer $CROSSBEAM_API_KEY` header. Browser users authenticate via Supabase session cookies instead.

**Base URL (production):** `https://cc-crossbeam.vercel.app`
**Base URL (local dev):** `http://localhost:3000`

---

## POST /api/generate

Triggers an agent flow. Returns immediately — processing happens async on Cloud Run.

**Auth:** Bearer token or Supabase session
**Content-Type:** application/json

**Body:**
```json
{
  "project_id": "UUID (required)",
  "user_id": "UUID (optional for API key, defaults to zero UUID)",
  "flow_type": "city-review | corrections-analysis | corrections-response"
}
```

**Success (200):**
```json
{ "success": true, "message": "Generation started" }
```

**Errors:**
- 400: Missing project_id
- 401: No auth / bad API key
- 403: User doesn't own project (browser auth only)
- 404: Project not found
- 500: CLOUD_RUN_URL not configured
- 502: Can't reach Cloud Run
- 504: Cloud Run timeout (30s — server may be cold-starting)

**Example:**
```bash
curl -X POST https://cc-crossbeam.vercel.app/api/generate \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"b0000000-0000-0000-0000-000000000002","flow_type":"corrections-analysis"}'
```

---

## GET /api/projects/:id

Returns project + messages + latest output + files + contractor answers in one call. The "check on everything" endpoint.

**Auth:** Bearer token or Supabase session

**Response (200):**
```json
{
  "project": {
    "id": "UUID",
    "user_id": "UUID",
    "flow_type": "corrections-analysis",
    "project_name": "...",
    "status": "processing-phase1",
    "city": "Placentia",
    "is_demo": true,
    "error_message": null,
    "created_at": "...",
    "updated_at": "..."
  },
  "files": [
    { "id": "UUID", "filename": "plan-binder.pdf", "file_type": "plan-binder", "storage_path": "..." }
  ],
  "messages": [
    { "id": 1, "role": "system", "content": "Agent starting...", "created_at": "..." },
    { "id": 2, "role": "assistant", "content": "Reading corrections letter...", "created_at": "..." }
  ],
  "latest_output": {
    "id": "UUID",
    "flow_phase": "analysis",
    "raw_artifacts": { ... },
    "agent_cost_usd": 2.34,
    "agent_turns": 15,
    "agent_duration_ms": 180000
  },
  "contractor_answers": [
    { "question_key": "q1", "question_text": "...", "answer_text": "...", "is_answered": true }
  ]
}
```

**Polling pattern:**
```bash
# Loop until status is "completed", "awaiting-answers", or "failed"
while true; do
  STATUS=$(curl -s https://cc-crossbeam.vercel.app/api/projects/$PROJECT_ID \
    -H "Authorization: Bearer $CROSSBEAM_API_KEY" | jq -r '.project.status')
  echo "Status: $STATUS"
  if [[ "$STATUS" == "completed" || "$STATUS" == "awaiting-answers" || "$STATUS" == "failed" ]]; then
    break
  fi
  sleep 10
done
```

---

## GET /api/projects/:id/runs

Returns all output records (run history) for a project, newest first. Each run has a unique version number per flow_phase. Use this to compare quality across test runs.

**Auth:** Bearer token or Supabase session

**Query params:**
- `flow_phase` (optional): Filter by phase — `analysis`, `response`, or `review`

**Response (200):**
```json
{
  "project_id": "UUID",
  "total_runs": 3,
  "runs": [
    {
      "id": "UUID",
      "flow_phase": "analysis",
      "version": 3,
      "agent_cost_usd": 2.34,
      "agent_turns": 15,
      "agent_duration_ms": 180000,
      "raw_artifacts": { ... },
      "created_at": "2026-02-14T..."
    },
    {
      "id": "UUID",
      "flow_phase": "analysis",
      "version": 2,
      "agent_cost_usd": 3.10,
      "agent_turns": 18,
      "agent_duration_ms": 220000,
      "raw_artifacts": { ... },
      "created_at": "2026-02-14T..."
    }
  ]
}
```

**Examples:**
```bash
# All runs
curl -s https://cc-crossbeam.vercel.app/api/projects/b0000000-0000-0000-0000-000000000002/runs \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" | jq '.runs[] | {version, flow_phase, agent_cost_usd, created_at}'

# Only analysis runs
curl -s "https://cc-crossbeam.vercel.app/api/projects/b0000000-0000-0000-0000-000000000002/runs?flow_phase=analysis" \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY"
```

---

## POST /api/reset-project

Resets a demo project to "ready" state. Clears messages and contractor answers so the agent can run again. **Outputs are preserved** — they accumulate as run history with incrementing version numbers.

**Auth:** Bearer token or Supabase session
**Constraint:** Only works on projects where `is_demo = true`

**What gets cleared:** messages, contractor_answers, project status → `ready`
**What is preserved:** outputs (run history)

**Body:**
```json
{ "project_id": "UUID (required)" }
```

**Success (200):**
```json
{ "success": true }
```

**Example:**
```bash
curl -X POST https://cc-crossbeam.vercel.app/api/reset-project \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"b0000000-0000-0000-0000-000000000002"}'
```

---

## POST /api/extract

Pre-extracts a project's PDF binder into page PNGs + title block crops on Cloud Run. The sandbox never needs system packages — all mechanical extraction happens here. **Idempotent:** skips if archives already exist.

**Auth:** Bearer token or Supabase session
**Content-Type:** application/json

**Body:**
```json
{ "project_id": "UUID (required)" }
```

**Success (200):**
```json
{ "success": true, ... }
```

**What it does (async on Cloud Run):**
1. Downloads the PDF binder from Supabase Storage
2. Runs `pdftoppm` at 200 DPI → full-resolution page PNGs (7200×4800 for D-size sheets)
3. Crops title blocks (bottom-right 25%×35%) using ImageMagick
4. Creates `pages-png.tar.gz` and `title-blocks.tar.gz` archives
5. Uploads archives to Supabase Storage (`crossbeam-uploads` bucket)
6. Inserts file records with `file_type: 'other'`

**Note:** This is also called automatically by `/api/generate` before the sandbox starts (for non-corrections-response flows). You can call it standalone to pre-extract before triggering the agent.

**Example:**
```bash
curl -X POST https://cc-crossbeam.vercel.app/api/extract \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"b0000000-0000-0000-0000-000000000002"}'
```

---

## Cloud Run Direct Access (No Auth)

The Cloud Run server has no auth — it's meant to be called by the Next.js API. Agents can hit it directly for testing.

**Base URL:** `https://crossbeam-server-v7eqq3533a-uc.a.run.app`

### GET /health
```bash
curl https://crossbeam-server-v7eqq3533a-uc.a.run.app/health
# → {"status":"ok"}
```

### POST /generate
Same body as `/api/generate`. Returns immediately with `{"status":"processing","project_id":"..."}`.

```bash
curl -X POST https://crossbeam-server-v7eqq3533a-uc.a.run.app/generate \
  -H "Content-Type: application/json" \
  -d '{"project_id":"b0000000-0000-0000-0000-000000000002","user_id":"00000000-0000-0000-0000-000000000000","flow_type":"corrections-analysis"}'
```

Note: `user_id` is required here (Cloud Run validates with Zod). Use any valid UUID.

### POST /extract
Same body as `/api/extract`. Returns immediately with `{"status":"extracting","project_id":"..."}`.

```bash
curl -X POST https://crossbeam-server-v7eqq3533a-uc.a.run.app/extract \
  -H "Content-Type: application/json" \
  -d '{"project_id":"b0000000-0000-0000-0000-000000000002"}'
```
