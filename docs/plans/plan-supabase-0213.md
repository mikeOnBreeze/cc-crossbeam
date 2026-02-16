# CrossBeam — Supabase Schema Plan (Feb 13, 2026)

> **Purpose:** Single source of truth for the CrossBeam database schema.
> **Project:** Labyrinth (`bhjrpklzqyrelnhexhlj`) on us-east-1
> **Schema:** `crossbeam` (DROP and rebuild fresh — old schema is from a different iteration)

---

## The Two Flows (Why This Matters for Schema)

CrossBeam has two distinct flows that share infrastructure but have different lifecycles:

### City Review Flow (Single Phase)
```
Judge clicks "Run AI Review"
  └→ status: 'processing'
  └→ Agent runs plan-review.ts (one shot, ~10-15 min)
  └→ status: 'completed'
  └→ Results: draft corrections letter + review checklist
```

### Contractor Corrections Flow (Two Phases + Human Loop)
```
Judge clicks "Analyze Corrections"
  └→ status: 'processing-phase1'
  └→ Agent runs corrections-analysis.ts (~15 min)
  └→ Produces contractor_questions.json
  └→ Server parses questions → inserts into contractor_answers table
  └→ status: 'awaiting-answers'
  └→ Frontend shows questions form

Judge answers questions, clicks "Submit & Generate Response"
  └→ status: 'processing-phase2'
  └→ Agent runs corrections-response.ts (~8-10 min)
  └→ Reads Phase 1 outputs + contractor answers
  └→ Produces response package (letter, scope, report)
  └→ status: 'completed'
  └→ Results: response letter + professional scope + corrections report
```

The `flow_type` on projects stays `'corrections-analysis'` throughout — the server knows
to run `corrections-response.ts` when transitioning from `awaiting-answers` to Phase 2.

---

## Agent Output Files → Schema Mapping

### Corrections Flow — Phase 1 (corrections-analysis.ts)

| Agent Output File | Schema Location | Notes |
|---|---|---|
| `corrections_parsed.json` | `outputs.raw_artifacts` | Parsed correction items |
| `sheet-manifest.json` | `outputs.raw_artifacts` | Plan page catalog |
| `state_law_findings.json` | `outputs.raw_artifacts` | State code research |
| `city_discovery.json` | `outputs.raw_artifacts` | City URL discovery |
| `city_research_findings.json` | `outputs.raw_artifacts` | City code research |
| `sheet_observations.json` | `outputs.raw_artifacts` | Per-sheet notes |
| `corrections_categorized.json` | `outputs.corrections_analysis_json` | **Primary output** — categorized corrections |
| `contractor_questions.json` | `outputs.contractor_questions_json` + `contractor_answers` table | Questions for human loop |

### Corrections Flow — Phase 2 (corrections-response.ts)

| Agent Output File | Schema Location | Notes |
|---|---|---|
| `response_letter.md` | `outputs.response_letter_md` | **Primary deliverable** |
| `response_letter.pdf` | `outputs.response_letter_pdf_path` | PDF version (storage) |
| `professional_scope.md` | `outputs.professional_scope_md` | Scope of work document |
| `corrections_report.md` | `outputs.corrections_report_md` | Detailed corrections report |
| `sheet_annotations.json` | `outputs.raw_artifacts` | Per-sheet annotation data |

### City Review Flow (plan-review.ts)

| Agent Output File | Schema Location | Notes |
|---|---|---|
| `sheet-manifest.json` | `outputs.raw_artifacts` | Plan page catalog |
| `sheet_findings.json` | `outputs.raw_artifacts` | Per-sheet findings |
| `state_compliance.json` | `outputs.raw_artifacts` | State code compliance |
| `city_compliance.json` | `outputs.raw_artifacts` | City code compliance |
| `draft_corrections.md` | `outputs.corrections_letter_md` | **Primary deliverable** |
| `draft_corrections.json` | `outputs.review_checklist_json` | Structured checklist |
| `corrections_letter.pdf` | `outputs.corrections_letter_pdf_path` | PDF version (storage) |
| `review_summary.json` | `outputs.raw_artifacts` | Summary stats |
| `qa_result.json` | `outputs.raw_artifacts` | Quality assurance check |

**Key insight:** The `raw_artifacts JSONB` column is the safety net. The server dumps ALL
intermediate files into it as `{"filename": {content}}`. The named columns hold the primary
deliverables that the frontend displays. Nothing is lost.

---

## Full Schema DDL

```sql
-- ============================================================
-- CrossBeam Schema — Fresh rebuild
-- ============================================================

-- Nuke old schema (old iteration, incompatible structure)
DROP SCHEMA IF EXISTS crossbeam CASCADE;
CREATE SCHEMA crossbeam;

-- ============================================================
-- 1. PROJECTS
-- ============================================================
CREATE TABLE crossbeam.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  flow_type TEXT NOT NULL
    CHECK (flow_type IN ('city-review', 'corrections-analysis')),
  project_name TEXT NOT NULL,
  project_address TEXT,
  city TEXT,
  status TEXT NOT NULL DEFAULT 'ready'
    CHECK (status IN (
      'ready',              -- Initial state, files uploaded
      'uploading',          -- Files being uploaded
      'processing',         -- City review running (single phase)
      'processing-phase1',  -- Contractor: Skill 1 running (corrections analysis)
      'awaiting-answers',   -- Contractor: Skill 1 done, waiting for human input
      'processing-phase2',  -- Contractor: Skill 2 running (response generation)
      'completed',          -- Done — results available
      'failed'              -- Error state
    )),
  error_message TEXT,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. FILES (uploaded plan binders + corrections letters)
-- ============================================================
CREATE TABLE crossbeam.files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES crossbeam.projects(id) ON DELETE CASCADE NOT NULL,
  file_type TEXT NOT NULL
    CHECK (file_type IN ('plan-binder', 'corrections-letter', 'other')),
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. MESSAGES (real-time agent streaming)
-- ============================================================
-- BIGSERIAL id enables efficient polling: WHERE id > last_seen_id
-- Server inserts via service role (bypasses RLS), frontend only SELECTs
CREATE TABLE crossbeam.messages (
  id BIGSERIAL PRIMARY KEY,
  project_id UUID REFERENCES crossbeam.projects(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL
    CHECK (role IN ('system', 'assistant', 'tool')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. OUTPUTS (agent-generated deliverables)
-- ============================================================
CREATE TABLE crossbeam.outputs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES crossbeam.projects(id) ON DELETE CASCADE NOT NULL,
  flow_phase TEXT NOT NULL
    CHECK (flow_phase IN ('analysis', 'response', 'review')),
    -- 'analysis'  = corrections Phase 1 (Skill 1)
    -- 'response'  = corrections Phase 2 (Skill 2)
    -- 'review'    = city review (single phase)
  version INTEGER DEFAULT 1,

  -- === City Review outputs ===
  corrections_letter_md TEXT,             -- draft_corrections.md
  corrections_letter_pdf_path TEXT,       -- corrections_letter.pdf (storage path)
  review_checklist_json JSONB,            -- draft_corrections.json

  -- === Contractor Phase 1 outputs ===
  corrections_analysis_json JSONB,        -- corrections_categorized.json
  contractor_questions_json JSONB,        -- contractor_questions.json (also populates contractor_answers table)

  -- === Contractor Phase 2 outputs ===
  response_letter_md TEXT,                -- response_letter.md
  response_letter_pdf_path TEXT,          -- response_letter.pdf (storage path)
  professional_scope_md TEXT,             -- professional_scope.md
  corrections_report_md TEXT,             -- corrections_report.md

  -- === Catch-all for ALL intermediate files ===
  -- Server dumps every file from the agent's output directory as:
  -- {"sheet_manifest": {...}, "state_law_findings": {...}, ...}
  -- Frontend can cherry-pick what to display. Nothing is lost.
  raw_artifacts JSONB DEFAULT '{}'::jsonb,

  -- === Agent run metadata ===
  agent_cost_usd NUMERIC(10,4),
  agent_turns INTEGER,
  agent_duration_ms INTEGER,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. CONTRACTOR ANSWERS (human-in-the-loop for corrections flow)
-- ============================================================
-- Populated by server after Phase 1 completes (parses contractor_questions.json)
-- Updated by frontend when judge/contractor answers questions
-- Read by server when launching Phase 2 (passed to Skill 2 as contractor_answers.json)
CREATE TABLE crossbeam.contractor_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES crossbeam.projects(id) ON DELETE CASCADE NOT NULL,
  question_key TEXT NOT NULL,             -- Matches key from contractor_questions.json
  question_text TEXT NOT NULL,            -- The question as generated by Skill 1
  question_type TEXT DEFAULT 'text'       -- text, number, choice, measurement
    CHECK (question_type IN ('text', 'number', 'choice', 'measurement')),
  options JSONB,                          -- For choice-type questions: ["Option A", "Option B"]
  context TEXT,                           -- Why this question matters (shown to user)
  correction_item_id TEXT,                -- Links back to which correction item triggered this
  answer_text TEXT,                       -- User's response (NULL until answered)
  is_answered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE crossbeam.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE crossbeam.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE crossbeam.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crossbeam.outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crossbeam.contractor_answers ENABLE ROW LEVEL SECURITY;

-- Projects: users see their own + all demo projects
CREATE POLICY "Users can CRUD own projects"
  ON crossbeam.projects FOR ALL
  USING (auth.uid() = user_id OR is_demo = true);

-- Files: users access files for their projects + demo projects
CREATE POLICY "Users can CRUD own files"
  ON crossbeam.files FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM crossbeam.projects p
      WHERE p.id = project_id AND (p.user_id = auth.uid() OR p.is_demo = true)
    )
  );

-- Messages: frontend only polls (SELECT), server inserts via service role
CREATE POLICY "Users can read messages for their projects"
  ON crossbeam.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crossbeam.projects p
      WHERE p.id = project_id AND (p.user_id = auth.uid() OR p.is_demo = true)
    )
  );

-- Outputs: frontend only reads, server inserts via service role
CREATE POLICY "Users can read outputs for their projects"
  ON crossbeam.outputs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crossbeam.projects p
      WHERE p.id = project_id AND (p.user_id = auth.uid() OR p.is_demo = true)
    )
  );

-- Contractor answers: frontend reads AND updates (answer_text, is_answered)
CREATE POLICY "Users can CRUD own contractor answers"
  ON crossbeam.contractor_answers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM crossbeam.projects p
      WHERE p.id = project_id AND (p.user_id = auth.uid() OR p.is_demo = true)
    )
  );
```

---

## Storage Buckets

Create three buckets in Supabase Storage:

| Bucket | Purpose | Access |
|---|---|---|
| `crossbeam-uploads` | User-uploaded plan binders + corrections letters | Authenticated users |
| `crossbeam-outputs` | Agent-generated files (PDFs, response packages) | Authenticated users |
| `crossbeam-demo-assets` | Pre-seeded demo files (plan binder, corrections letter) | Public read |

---

## Auth Setup

### Email/Password
- Enable in Authentication → Providers
- Create judge account: `judge@crossbeam.app` / `crossbeam-hackathon-2026`

### Google OAuth (stretch goal)
- Enable in Authentication → Providers
- Requires Google Cloud Console client ID/secret
- **Can skip for hackathon** — judge button is sufficient

---

## Demo Data Seeding

After schema is created and judge account exists:

```sql
-- Get the judge's user_id from auth.users after account creation
-- Replace {JUDGE_USER_ID} with actual UUID

-- City Review demo project
INSERT INTO crossbeam.projects (id, user_id, flow_type, project_name, project_address, city, status, is_demo)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '{JUDGE_USER_ID}',
  'city-review',
  '742 Flint Ave ADU — City Review',
  '742 Flint Ave',
  'Buena Park',
  'ready',
  true
);

-- Contractor Corrections demo project
INSERT INTO crossbeam.projects (id, user_id, flow_type, project_name, project_address, city, status, is_demo)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  '{JUDGE_USER_ID}',
  'corrections-analysis',
  '742 Flint Ave ADU — Corrections Response',
  '742 Flint Ave',
  'Buena Park',
  'ready',
  true
);

-- Link demo files (after uploading PDFs to crossbeam-demo-assets bucket)
INSERT INTO crossbeam.files (project_id, file_type, filename, storage_path, mime_type)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'plan-binder', 'plan-binder.pdf', 'crossbeam-demo-assets/buena-park/plan-binder.pdf', 'application/pdf'),
  ('a0000000-0000-0000-0000-000000000002', 'plan-binder', 'plan-binder.pdf', 'crossbeam-demo-assets/buena-park/plan-binder.pdf', 'application/pdf'),
  ('a0000000-0000-0000-0000-000000000002', 'corrections-letter', 'corrections-letter.pdf', 'crossbeam-demo-assets/buena-park/corrections-letter.pdf', 'application/pdf');
```

---

## Frontend UI States (by project status)

| Status | Flow | What the UI Shows |
|---|---|---|
| `ready` | Both | File preview + "Start Analysis" / "Run AI Review" button |
| `uploading` | Both | Upload progress bar |
| `processing` | City Review | Agent working screen: progress dots, activity log, ADU miniature |
| `processing-phase1` | Contractor | Agent working screen (Phase 1): "Analyzing corrections..." |
| `awaiting-answers` | Contractor | **Questions form** — questions from Skill 1 with answer fields |
| `processing-phase2` | Contractor | Agent working screen (Phase 2): "Building your response..." |
| `completed` | Both | Results viewer: tabbed content, summary stats, download button |
| `failed` | Both | Error message + retry option |

---

## Server Responsibility per Status Transition

| Transition | Trigger | Server Actions |
|---|---|---|
| `ready` → `processing` | POST `/generate` (city-review) | Create sandbox, run plan-review.ts, stream messages |
| `processing` → `completed` | Agent finishes | Extract outputs, insert into `outputs` table, update status |
| `ready` → `processing-phase1` | POST `/generate` (corrections-analysis) | Create sandbox, run corrections-analysis.ts, stream messages |
| `processing-phase1` → `awaiting-answers` | Skill 1 finishes | Parse contractor_questions.json, insert into `contractor_answers`, create Phase 1 `outputs` row, update status |
| `awaiting-answers` → `processing-phase2` | POST `/generate` (corrections-response) | Read answers from `contractor_answers`, create sandbox with Phase 1 outputs + answers, run corrections-response.ts |
| `processing-phase2` → `completed` | Skill 2 finishes | Extract outputs, create Phase 2 `outputs` row, update status |
| Any → `failed` | Error | Set error_message, update status |

---

## Hackathon Simplification Options

If time is tight:

1. **Pre-fill contractor answers** — After Phase 1, auto-populate answers with sensible defaults. Judge sees questions form pre-filled, just clicks "Submit." Saves building the full interactive form.

2. **Skip Phase 2 live run** — Pre-compute Phase 2 results offline. When judge submits answers, show pre-cached results immediately instead of running Skill 2 live (~8 min saved per demo).

3. **Pre-compute everything** — Run both flows offline, store results. Demo shows instant results. Explain "here's what the agent produced" rather than watching it live. Less impressive but zero risk of demo failure.

**Recommended for demo:** Run Phase 1 live (it's the impressive part — watching AI analyze a permit in real-time). Pre-fill answers. Run Phase 2 live if time allows, otherwise show pre-cached results.

---

*Written: Feb 13, 2026*
*Referenced by: plan-strategy-0213.md (Stream 0)*
