-- CrossBeam ADU Permit Assistant — PostgreSQL schema
-- Schema: crossbeam
-- RLS: Enabled with permissive policies for MVP local testing (allow all access).

-- ---------------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS crossbeam;

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------
CREATE TABLE crossbeam.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  flow_type text NOT NULL CHECK (flow_type IN ('city-review', 'corrections-analysis')),
  project_name text NOT NULL,
  project_address text,
  city text,
  status text NOT NULL CHECK (status IN (
    'ready', 'uploading', 'processing', 'processing-phase1',
    'awaiting-answers', 'processing-phase2', 'completed', 'failed'
  )),
  error_message text,
  applicant_name text,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Project files (plan binder, corrections letter, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE crossbeam.files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES crossbeam.projects(id) ON DELETE CASCADE,
  file_type text NOT NULL CHECK (file_type IN ('plan-binder', 'corrections-letter', 'other')),
  filename text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_files_project_id ON crossbeam.files(project_id);

-- ---------------------------------------------------------------------------
-- Messages (agent/conversation log)
-- ---------------------------------------------------------------------------
CREATE TABLE crossbeam.messages (
  id bigserial PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES crossbeam.projects(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('system', 'assistant', 'tool')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_project_id ON crossbeam.messages(project_id);

-- ---------------------------------------------------------------------------
-- Outputs (per-flow-phase artifacts: analysis, response, review)
-- ---------------------------------------------------------------------------
CREATE TABLE crossbeam.outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES crossbeam.projects(id) ON DELETE CASCADE,
  flow_phase text NOT NULL CHECK (flow_phase IN ('analysis', 'response', 'review')),
  version integer NOT NULL DEFAULT 1,

  -- City review
  corrections_letter_md text,
  corrections_letter_pdf_path text,
  review_checklist_json jsonb,

  -- Contractor phase 1 (analysis)
  corrections_analysis_json jsonb,
  contractor_questions_json jsonb,

  -- Contractor phase 2 (response)
  response_letter_md text,
  response_letter_pdf_path text,
  professional_scope_md text,
  corrections_report_md text,

  -- Catch-all and metadata
  raw_artifacts jsonb,
  agent_cost_usd numeric,
  agent_turns integer,
  agent_duration_ms bigint,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_outputs_project_id ON crossbeam.outputs(project_id);
CREATE INDEX idx_outputs_project_phase ON crossbeam.outputs(project_id, flow_phase);

-- ---------------------------------------------------------------------------
-- Contractor answers (Q&A for corrections flow)
-- ---------------------------------------------------------------------------
CREATE TABLE crossbeam.contractor_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES crossbeam.projects(id) ON DELETE CASCADE,
  question_key text NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('text', 'number', 'choice', 'measurement', 'select')),
  options jsonb,
  context text,
  correction_item_id text,
  answer_text text,
  is_answered boolean NOT NULL DEFAULT false,
  output_id uuid REFERENCES crossbeam.outputs(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contractor_answers_project_id ON crossbeam.contractor_answers(project_id);

-- ---------------------------------------------------------------------------
-- Row Level Security (RLS) — permissive for MVP local testing
-- Allow full public access (SELECT, INSERT, UPDATE, DELETE) on all tables.
-- Restrict before production.
-- ---------------------------------------------------------------------------

ALTER TABLE crossbeam.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE crossbeam.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE crossbeam.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crossbeam.outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crossbeam.contractor_answers ENABLE ROW LEVEL SECURITY;

-- projects: allow all
CREATE POLICY "projects_allow_all" ON crossbeam.projects
  FOR ALL USING (true) WITH CHECK (true);

-- files: allow all
CREATE POLICY "files_allow_all" ON crossbeam.files
  FOR ALL USING (true) WITH CHECK (true);

-- messages: allow all
CREATE POLICY "messages_allow_all" ON crossbeam.messages
  FOR ALL USING (true) WITH CHECK (true);

-- outputs: allow all
CREATE POLICY "outputs_allow_all" ON crossbeam.outputs
  FOR ALL USING (true) WITH CHECK (true);

-- contractor_answers: allow all
CREATE POLICY "contractor_answers_allow_all" ON crossbeam.contractor_answers
  FOR ALL USING (true) WITH CHECK (true);
