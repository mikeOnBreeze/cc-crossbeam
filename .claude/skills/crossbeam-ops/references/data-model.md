---
title: "Data Model Reference"
category: operations
relevance: "When querying the database directly via Supabase MCP or SQL"
---

# CrossBeam Data Model

**Supabase Project:** bhjrpklzqyrelnhexhlj
**Schema:** `crossbeam` (NOT `public` — always use `.schema('crossbeam')` or `SET search_path TO crossbeam;`)

---

## Tables

### projects

The core table. One row per ADU project.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| user_id | UUID | FK to auth.users |
| flow_type | text | `city-review` or `corrections-analysis` |
| project_name | text | |
| project_address | text | nullable |
| city | text | nullable |
| status | text | see Status Values below |
| error_message | text | nullable, set on failure |
| is_demo | boolean | true for pre-seeded demo projects |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Status values:** `ready` → `processing` / `processing-phase1` / `processing-phase2` → `awaiting-answers` → `completed` / `failed`

### files

Uploaded documents linked to a project.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| project_id | UUID | FK to projects |
| filename | text | e.g. `plan-binder.pdf` |
| storage_path | text | Supabase Storage path |
| file_type | text | `plan-binder`, `corrections-letter`, `other` |
| mime_type | text | |
| size_bytes | integer | |
| created_at | timestamptz | |

### messages

Agent conversation stream. Messages appear in real-time as the agent works.

| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL (PK) | auto-increment, NOT UUID |
| project_id | UUID | FK to projects |
| role | text | `system`, `assistant`, `tool` |
| content | text | message content |
| created_at | timestamptz | |

### outputs

Structured results from completed flows.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| project_id | UUID | FK to projects |
| flow_phase | text | `analysis`, `response`, `review` |
| version | integer | |
| raw_artifacts | jsonb | catch-all for all output data |
| corrections_letter_md | text | city review output |
| corrections_letter_pdf_path | text | storage path |
| corrections_analysis_json | jsonb | phase 1 analysis |
| contractor_questions_json | jsonb | questions for contractor |
| response_letter_md | text | phase 2 response |
| professional_scope_md | text | phase 2 scope |
| corrections_report_md | text | phase 2 report |
| agent_cost_usd | numeric | |
| agent_turns | integer | |
| agent_duration_ms | integer | |
| created_at | timestamptz | |

### contractor_answers

Contractor responses to agent-generated questions.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| project_id | UUID | FK to projects |
| question_key | text | e.g. `q1`, `q2` |
| question_text | text | |
| question_type | text | |
| options | jsonb | nullable, for multiple-choice |
| context | text | |
| correction_item_id | text | |
| answer_text | text | |
| is_answered | boolean | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## Storage Buckets

| Bucket | Contents |
|--------|----------|
| `crossbeam-demo-assets` | Pre-loaded demo files (plan binder, corrections PNGs, pre-built archives) |
| `crossbeam-uploads` | User-uploaded files + Cloud Run extraction archives |
| `crossbeam-outputs` | Agent-generated PDFs and artifacts |

### Archive Files

Pre-extracted page PNGs and title block crops are stored as `.tar.gz` archives. These are created either:
- **Demo projects:** Pre-built and uploaded to `crossbeam-demo-assets/placentia/`
- **Real projects:** Created by Cloud Run extraction service, uploaded to `crossbeam-uploads/`

File records use `file_type: 'other'`. The sandbox downloads and unpacks them automatically.

| Archive | Contents | Typical Size |
|---------|----------|------|
| `pages-png.tar.gz` | Full-DPI page PNGs (7200×4800 at 200 DPI) | ~30MB |
| `title-blocks.tar.gz` | Cropped title blocks (bottom-right 25%×35%) | ~1MB |

---

## Common Queries (Supabase MCP)

```sql
-- Check project status
SELECT id, status, flow_type, error_message FROM crossbeam.projects WHERE id = 'PROJECT_ID';

-- Get latest messages
SELECT role, content, created_at FROM crossbeam.messages
WHERE project_id = 'PROJECT_ID' ORDER BY created_at DESC LIMIT 10;

-- Get outputs
SELECT flow_phase, raw_artifacts, agent_cost_usd, agent_turns, agent_duration_ms
FROM crossbeam.outputs WHERE project_id = 'PROJECT_ID' ORDER BY created_at DESC LIMIT 1;

-- Get contractor answers
SELECT question_key, question_text, answer_text, is_answered
FROM crossbeam.contractor_answers WHERE project_id = 'PROJECT_ID';

-- List all demo projects
SELECT id, project_name, flow_type, status, city FROM crossbeam.projects WHERE is_demo = true;
```

---

## RLS Policies

All tables have RLS enabled. Policies check: `auth.uid() = user_id OR is_demo = true` (via project join for child tables). The service role key bypasses RLS.
