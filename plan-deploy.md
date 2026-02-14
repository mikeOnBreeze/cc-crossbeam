# CrossBeam — Deployment Plan

> **Goal:** Live deployed app for hackathon judging. Judges click one button, see the agent work.
> **Architecture:** Mako-pattern — Vercel Frontend + Google Cloud Run Orchestrator + Vercel Sandbox
> **Deadline:** Monday Feb 16, 12:00 PM PST (submission)
> **Repo:** CC-Crossbeam (add `frontend/` + `server/` to existing repo)

---

## Part 1: Hackathon Flow & UX

### 1.1 Login Experience

**"Sign in as a Judge" button** — zero friction, one click.

Pre-create a Supabase demo account:
```
Email: judge@crossbeam.app
Password: crossbeam-hackathon-2026
```

Login page layout:
```
┌──────────────────────────────────┐
│                                  │
│        🏗️ CrossBeam              │
│   AI-Powered Permit Review       │
│   for California ADUs            │
│                                  │
│  ┌────────────────────────────┐  │
│  │  🔑 Sign in as a Judge     │  │  ← Primary CTA, big, obvious
│  └────────────────────────────┘  │
│                                  │
│            — or —                │
│                                  │
│  ┌────────────────────────────┐  │
│  │  G  Sign in with Google    │  │  ← Secondary, for real users
│  └────────────────────────────┘  │
│                                  │
└──────────────────────────────────┘
```

**Implementation:**
```typescript
// Judge button handler — hardcoded credentials, no user input needed
const handleJudgeLogin = async () => {
  await supabase.auth.signInWithPassword({
    email: 'judge@crossbeam.app',
    password: 'crossbeam-hackathon-2026'
  })
  router.push('/dashboard')
}
```

**Supabase config:**
- Enable email/password auth
- Enable Google OAuth
- Create the judge@crossbeam.app account via Supabase dashboard
- RLS policies: authenticated users can CRUD their own projects + read demo projects

### 1.2 First-Time Onboarding (Bread-Style Popups)

When judge lands on dashboard for first time, show a guided walkthrough:

**Step 1:** "Welcome to CrossBeam 👋 — We use AI to review ADU building permits for California cities."

**Step 2:** "Choose a perspective: Are you a **City Reviewer** checking submitted plans, or a **Contractor** who got corrections back?"

**Step 3:** "We've pre-loaded a real ADU permit from Buena Park, CA so you can see it in action. Click **Run Review** to start."

Implementation: use a lightweight tooltip/popover library (e.g., `react-joyride` or custom with shadcn Dialog). Store `has_seen_onboarding` in localStorage.

### 1.3 Dashboard — Two Persona Cards

After login, the judge sees:

```
┌─────────────────────────────────────────────────────────────────┐
│  CrossBeam Dashboard                                             │
│                                                                   │
│  Choose your perspective:                                         │
│                                                                   │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐  │
│  │  🏛️ CITY REVIEWER         │  │  🔨 CONTRACTOR                │  │
│  │                           │  │                               │  │
│  │  "I'm reviewing a permit  │  │  "I got a corrections letter  │  │
│  │   submission. Help me     │  │   back. Help me understand    │  │
│  │   pre-screen it against   │  │   what to fix and build a     │  │
│  │   state + city code."     │  │   response."                  │  │
│  │                           │  │                               │  │
│  │  📋 Demo: 742 Flint Ave   │  │  📋 Demo: 742 Flint Ave       │  │
│  │     Buena Park, CA        │  │     Buena Park Corrections    │  │
│  │                           │  │                               │  │
│  │  [Run AI Review →]        │  │  [Analyze Corrections →]      │  │
│  └──────────────────────────┘  └──────────────────────────────┘  │
│                                                                   │
│  ─── or upload your own ───                                       │
│  [+ New Project]                                                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.4 Flow: City Reviewer Experience

1. Judge clicks **"Run AI Review"** on City card
2. → Project detail page for the pre-loaded plan binder
3. → Shows: project address, city, file thumbnail, "Status: Ready"
4. → Big button: **"Start AI Review"**
5. → Click → POST to Cloud Run `/generate` with `flow_type: 'city-review'`
6. → Real-time streaming panel shows:
   - Agent status messages ("Extracting plan pages...", "Researching Buena Park ADU codes...", "Reviewing Sheet A1 against setback requirements...")
   - Tool calls as they happen (WebSearch, Skill invocations, subagent launches)
   - Progress indicator (phases: Extract → Research → Review → Generate)
7. → ~10–15 min later: Results appear
   - Draft corrections letter (viewable inline + downloadable PDF)
   - Review checklist with code citations
   - Confidence scores per finding

### 1.5 Flow: Contractor Experience

1. Judge clicks **"Analyze Corrections"** on Contractor card
2. → Project detail page showing pre-loaded plan binder + corrections letter
3. → Big button: **"Start Analysis"**
4. → POST to Cloud Run `/generate` with `flow_type: 'corrections-analysis'`
5. → Real-time streaming panel (same pattern):
   - "Reading corrections letter...", "Found 14 correction items...", "Researching CA Vehicle Code §..."
   - Code research happening live
   - Cross-referencing against plan pages
6. → ~15 min later: Results appear
   - Categorized corrections (what contractor can fix vs needs engineer)
   - Annotated response with code citations
   - Action item checklist per sheet
   - Contractor questions (if any items need clarification)

### 1.6 Navigation Between Personas

After finishing one flow, judge can:
- Click **"← Back to Dashboard"** to try the other persona
- Both demo projects persist with their results
- If they already ran one, it shows "Completed ✅" with results viewable

### 1.7 "Upload Your Own" (Stretch Goal)

Secondary flow for judges who want to test with different data:
1. Click **"+ New Project"**
2. Choose flow type (City Review or Corrections Analysis)
3. Enter address + city
4. Drag & drop PDF(s)
5. Run

This reuses the exact same backend — just different input files. Low incremental effort if time allows.

---

## Part 2: Deployment Infrastructure

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         JUDGE (Browser)                          │
│                                                                   │
│  Next.js Frontend — deployed on Vercel                            │
│  - Login (Judge button / Google OAuth)                            │
│  - Dashboard (persona cards)                                      │
│  - Project detail (file preview, run button)                      │
│  - Agent working (real-time message stream)                       │
│  - Results view (corrections letter, checklist)                   │
└────────────────────────┬────────────────────────────────────────┘
                         │ POST /generate
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│             Google Cloud Run — Orchestrator                       │
│             (Express server, Docker container)                    │
│                                                                   │
│  1. Receives generate request (project_id, flow_type)             │
│  2. Responds immediately { status: "processing" }                 │
│  3. Async: Creates Vercel Sandbox (30 min timeout)                │
│  4. Installs Claude Code CLI + Agent SDK in sandbox               │
│  5. Downloads files from Supabase Storage → sandbox               │
│  6. Copies CrossBeam skills to sandbox (.claude/skills/)          │
│  7. Runs agent via query() — streams messages to Supabase         │
│  8. Agent finishes → uploads results to Supabase from sandbox     │
│  9. Updates project status to 'completed'                         │
│  10. Cleans up sandbox                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
              ┌──────────┼───────────┐
              ▼          ▼           ▼
     ┌──────────┐  ┌──────────┐  ┌──────────────┐
     │  Vercel  │  │ Supabase │  │   Supabase   │
     │ Sandbox  │  │ Postgres │  │   Storage    │
     │          │  │          │  │              │
     │ Agent SDK│  │ crossbeam│  │ Buckets:     │
     │ + Skills │  │ schema:  │  │ - uploads    │
     │ + Tools  │  │ - users  │  │ - outputs    │
     │          │  │ - projects│ │ - demo-assets│
     └──────────┘  │ - messages│ └──────────────┘
                   │ - outputs │
                   │ - files   │
                   └──────────┘
```

### 2.2 Repo Structure (New Files)

```
CC-Crossbeam/
├── agents-crossbeam/          (existing — agent SDK flows + skills)
│   ├── .claude/skills/        (9 skills — symlinks)
│   ├── src/flows/             (corrections-analysis, plan-review, corrections-response)
│   └── src/utils/             (config, session, progress)
│
├── frontend/                  ← NEW — fork from Mako frontend
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── layout.tsx                  # Root layout
│   │   ├── globals.css                 # Tailwind styles
│   │   ├── auth/
│   │   │   ├── callback/route.ts       # OAuth callback (fork Mako)
│   │   │   └── signout/route.ts        # Sign out (fork Mako)
│   │   ├── (auth)/
│   │   │   └── login/page.tsx          # Login page — REWRITE for judge button
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx              # Dashboard shell
│   │   │   ├── dashboard/page.tsx      # Two persona cards — NEW
│   │   │   └── projects/
│   │   │       ├── [id]/page.tsx       # Project detail + agent working + results — ADAPT
│   │   │       └── new/page.tsx        # Upload new project — ADAPT
│   │   └── api/
│   │       ├── generate/route.ts       # → Cloud Run proxy (fork Mako, remove credits)
│   │       └── health-check/route.ts   # Health check
│   ├── components/
│   │   ├── ui/                         # shadcn components (fork Mako)
│   │   ├── agent-stream.tsx            # Real-time message viewer — NEW/ADAPT
│   │   ├── persona-card.tsx            # Dashboard persona cards — NEW
│   │   ├── results-viewer.tsx          # Corrections letter / checklist display — NEW
│   │   └── onboarding.tsx              # First-time walkthrough — NEW
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              # Browser client (fork Mako)
│   │   │   ├── server.ts              # Server client (fork Mako)
│   │   │   └── middleware.ts          # Auth middleware (fork Mako)
│   │   └── utils.ts
│   ├── middleware.ts                   # Route protection (fork Mako)
│   ├── types/
│   │   └── database.ts                # CrossBeam types — REWRITE
│   ├── supabase/
│   │   └── migrations/
│   │       └── 001_crossbeam_schema.sql  # Schema — NEW
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── .env.local
│
├── server/                    ← NEW — fork from Mako server
│   ├── src/
│   │   ├── index.ts                    # Express app (identical to Mako)
│   │   ├── routes/
│   │   │   └── generate.ts            # Generate endpoint — ADAPT for two flow types
│   │   ├── services/
│   │   │   ├── sandbox.ts             # Sandbox orchestration — ADAPT for CrossBeam skills
│   │   │   └── supabase.ts            # DB helpers — ADAPT schema references
│   │   └── utils/
│   │       └── config.ts              # Config + prompts — REWRITE for CrossBeam
│   ├── skills/                         # Skills copied INTO the sandbox at runtime
│   │   ├── california-adu/             # State-level ADU skill (copy from agents-crossbeam)
│   │   ├── adu-plan-review/            # City review flow skill
│   │   ├── adu-corrections-flow/       # Contractor corrections skill
│   │   ├── adu-corrections-complete/   # Response generation skill
│   │   ├── adu-targeted-page-viewer/   # Smart page extraction
│   │   ├── adu-city-research/          # City regulation lookup
│   │   ├── adu-corrections-pdf/        # PDF generation
│   │   ├── buena-park-adu/             # Buena Park-specific (demo city)
│   │   └── placentia-adu/              # Placentia-specific
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── test-assets/                (existing — plan binders, corrections letters)
├── adu-skill-development/      (existing — skill source files)
├── design-directions/          (existing — UI mockups)
├── docs/                       (existing)
├── spec.md                     (existing)
├── plan-crossbeam.md           (existing)
├── plan-deploy.md              (this file)
└── ...
```

### 2.3 What to Fork vs Rewrite

> **📖 For working code examples of every file below, see `@reference-mako.md`.**
> It has the exact code patterns with inline comments showing what to change for CrossBeam.

#### Fork Directly from Mako (minimal changes):

| Mako File | CrossBeam File | Changes Needed |
|-----------|---------------|----------------|
| `server/src/index.ts` | `server/src/index.ts` | None — identical Express setup |
| `server/Dockerfile` | `server/Dockerfile` | None — identical Node container |
| `server/package.json` | `server/package.json` | Update name, same deps |
| `server/src/services/sandbox.ts` | `server/src/services/sandbox.ts` | Change skill paths, prompt, flow routing |
| `server/src/services/supabase.ts` | `server/src/services/supabase.ts` | Change schema `mako` → `crossbeam`, rename functions |
| `server/src/routes/generate.ts` | `server/src/routes/generate.ts` | Add `flow_type` field, remove credits logic |
| `frontend/lib/supabase/*` | `frontend/lib/supabase/*` | Same — Supabase client setup is identical |
| `frontend/middleware.ts` | `frontend/middleware.ts` | Same — auth route protection |
| `frontend/app/auth/*` | `frontend/app/auth/*` | Same — OAuth callback/signout |
| `frontend/components/ui/*` | `frontend/components/ui/*` | Same — shadcn components |

#### Rewrite for CrossBeam:

| File | Why |
|------|-----|
| `server/src/utils/config.ts` | Different prompts, flow types, model config |
| `frontend/app/(auth)/login/page.tsx` | Judge button + Google OAuth (new design) |
| `frontend/app/(dashboard)/dashboard/page.tsx` | Two persona cards (completely different from Mako dashboard) |
| `frontend/app/(dashboard)/projects/[id]/page.tsx` | Different results display (corrections letter vs demand letter) |
| `frontend/types/database.ts` | CrossBeam schema types |
| `frontend/supabase/migrations/001_crossbeam_schema.sql` | CrossBeam-specific tables |

### 2.4 Supabase Schema (`crossbeam`)

```sql
-- Create schema
CREATE SCHEMA IF NOT EXISTS crossbeam;

-- Projects table
CREATE TABLE crossbeam.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  flow_type TEXT NOT NULL CHECK (flow_type IN ('city-review', 'corrections-analysis')),
  project_name TEXT NOT NULL,            -- e.g., "742 Flint Ave ADU"
  project_address TEXT,                  -- Street address
  city TEXT,                             -- City name (important for code lookup)
  status TEXT NOT NULL DEFAULT 'ready'
    CHECK (status IN ('ready', 'uploading', 'processing', 'completed', 'failed')),
  error_message TEXT,
  is_demo BOOLEAN DEFAULT false,         -- Pre-seeded demo projects
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Uploaded files (plan binders, corrections letters)
CREATE TABLE crossbeam.files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES crossbeam.projects(id) ON DELETE CASCADE NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('plan-binder', 'corrections-letter', 'other')),
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Agent messages (real-time streaming)
CREATE TABLE crossbeam.messages (
  id BIGSERIAL PRIMARY KEY,
  project_id UUID REFERENCES crossbeam.projects(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('system', 'assistant', 'tool')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Agent outputs
CREATE TABLE crossbeam.outputs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES crossbeam.projects(id) ON DELETE CASCADE NOT NULL,
  version INTEGER DEFAULT 1,

  -- City Review outputs
  corrections_letter_md TEXT,
  corrections_letter_pdf_path TEXT,
  review_checklist_json JSONB,

  -- Contractor outputs
  corrections_analysis_json JSONB,       -- Categorized corrections
  response_letter_md TEXT,
  response_letter_pdf_path TEXT,
  action_items_json JSONB,
  contractor_questions_json JSONB,

  -- Common
  agent_cost_usd NUMERIC(10,4),
  agent_turns INTEGER,
  agent_duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE crossbeam.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE crossbeam.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE crossbeam.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crossbeam.outputs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read/write their own projects + all demo projects
CREATE POLICY "Users can CRUD own projects"
  ON crossbeam.projects FOR ALL
  USING (auth.uid() = user_id OR is_demo = true);

CREATE POLICY "Users can CRUD own files"
  ON crossbeam.files FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM crossbeam.projects p
      WHERE p.id = project_id AND (p.user_id = auth.uid() OR p.is_demo = true)
    )
  );

CREATE POLICY "Users can read messages for their projects"
  ON crossbeam.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crossbeam.projects p
      WHERE p.id = project_id AND (p.user_id = auth.uid() OR p.is_demo = true)
    )
  );

CREATE POLICY "Users can read outputs for their projects"
  ON crossbeam.outputs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crossbeam.projects p
      WHERE p.id = project_id AND (p.user_id = auth.uid() OR p.is_demo = true)
    )
  );

-- Service role bypass for Cloud Run server (inserts messages, updates status)
-- (Service role key ignores RLS by default)
```

### 2.5 Cloud Run Server — Key Adaptations from Mako

> **📖 See `@reference-mako.md` Patterns 1-3 and 10 for full working code with inline adaptation notes.**

#### `server/src/utils/config.ts` (Rewrite)

```typescript
import ms from 'ms';

export const CONFIG = {
  SANDBOX_TIMEOUT: ms('30m'),
  SANDBOX_VCPUS: 4,
  RUNTIME: 'node22' as const,
  AGENT_MAX_TURNS: 80,
  AGENT_MAX_BUDGET_USD: 15.00,
  MODEL: 'claude-opus-4-6',
};

export type FlowType = 'city-review' | 'corrections-analysis';

// Skills to copy into sandbox, keyed by flow type
export const FLOW_SKILLS: Record<FlowType, string[]> = {
  'city-review': [
    'california-adu',
    'adu-plan-review',
    'adu-targeted-page-viewer',
    'adu-city-research',
    'adu-corrections-pdf',
    'buena-park-adu',
    'placentia-adu',
  ],
  'corrections-analysis': [
    'california-adu',
    'adu-corrections-flow',
    'adu-corrections-complete',
    'adu-targeted-page-viewer',
    'adu-city-research',
    'buena-park-adu',
    'placentia-adu',
  ],
};

export const SANDBOX_FILES_PATH = '/vercel/sandbox/project-files';
export const SANDBOX_SKILLS_BASE = '/vercel/sandbox/.claude/skills';

export function buildPrompt(flowType: FlowType, city: string, address?: string): string {
  if (flowType === 'city-review') {
    return `You are reviewing an ADU permit submission from the city's perspective.

PROJECT FILES: ${SANDBOX_FILES_PATH}/
CITY: ${city}
${address ? `ADDRESS: ${address}` : ''}

Use the adu-plan-review skill to:
1. Extract and catalog the plan pages
2. Research ${city} ADU requirements (state + city code)
3. Review each relevant sheet against code requirements
4. Generate a draft corrections letter

Write all output files to ${SANDBOX_FILES_PATH}/output/

CRITICAL: Every correction must have a specific code citation. No false positives.
ADUs are subject to OBJECTIVE standards only (Gov. Code § 66314(b)(1)).
State law preempts city rules.`;
  }

  return `You are analyzing corrections for an ADU permit on behalf of the contractor.

PROJECT FILES: ${SANDBOX_FILES_PATH}/
CITY: ${city}
${address ? `ADDRESS: ${address}` : ''}

Use the adu-corrections-flow skill to:
1. Read the corrections letter
2. Build a sheet manifest from the plan binder
3. Research state + city codes for each correction item
4. Categorize each correction (contractor fix vs needs engineer)
5. Generate contractor questions where needed
6. Produce a response package

Write all output files to ${SANDBOX_FILES_PATH}/output/`;
}
```

#### `server/src/routes/generate.ts` (Adapt)

Key changes from Mako:
- Add `flow_type` to request schema (`'city-review' | 'corrections-analysis'`)
- Remove credits logic (no billing for hackathon)
- Pass `flow_type` through to sandbox service

```typescript
const generateRequestSchema = z.object({
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
  flow_type: z.enum(['city-review', 'corrections-analysis']),
});
```

#### `server/src/services/sandbox.ts` (Adapt)

Key changes from Mako:
- `readSkillFilesFromDisk()` → reads skills based on `flow_type` (use `FLOW_SKILLS` config)
- `copySkillToSandbox()` → copies only relevant skills for the flow
- `buildDownloadManifest()` → simpler: just plan binder + optional corrections letter (no user assets concept)
- `runAgent()` → uses CrossBeam prompt from `buildPrompt()`
- `extractOutputs()` → looks for corrections letter PDF, review checklist, response package (not demand letter)

### 2.6 Frontend — Key Adaptations from Mako

> **📖 See `@reference-mako.md` Patterns 4-9 for full working code with inline adaptation notes.**

#### Login Page (`frontend/app/(auth)/login/page.tsx`) — Rewrite

- **Judge button:** calls `supabase.auth.signInWithPassword()` with hardcoded creds
- **Google button:** calls `supabase.auth.signInWithOAuth({ provider: 'google' })`
- CrossBeam branding (not Mako branding)

#### Dashboard (`frontend/app/(dashboard)/dashboard/page.tsx`) — New

- Two `PersonaCard` components side by side
- Each card links to its demo project: `/projects/{demo-city-review-id}` or `/projects/{demo-corrections-id}`
- "+ New Project" link at bottom

#### Project Detail (`frontend/app/(dashboard)/projects/[id]/page.tsx`) — Adapt

Fork Mako's project page but change:
- Remove case file upload grid → single plan binder display (+ corrections letter for contractor flow)
- Remove credits check
- Results section shows corrections letter + checklist (not demand letter + memo)
- Add "phase" progress indicator specific to each flow

#### Agent Stream Component — Adapt

Fork Mako's message polling component:
```typescript
// Poll crossbeam.messages table for real-time updates
const { data: messages } = await supabase
  .schema('crossbeam')
  .from('messages')
  .select('*')
  .eq('project_id', projectId)
  .order('created_at', { ascending: true })
```

Same pattern — poll every 2 seconds, render messages as they appear.

### 2.7 Demo Data Seeding

Create a seed script (`frontend/supabase/seed.sql` or a Node script) that:

1. **Creates judge account** in Supabase Auth
2. **Uploads test assets** to Supabase Storage:
   - Plan binder PDF (`test-assets/buena-park/` or `test-assets/approved/`)
   - Corrections letter (from `test-assets/corrections/`)
3. **Creates two demo projects** in `crossbeam.projects`:
   ```sql
   -- City Review Demo
   INSERT INTO crossbeam.projects (id, user_id, flow_type, project_name, project_address, city, status, is_demo)
   VALUES ('demo-city-001', '{judge_user_id}', 'city-review', '742 Flint Ave ADU', '742 Flint Ave', 'Buena Park', 'ready', true);

   -- Contractor Demo
   INSERT INTO crossbeam.projects (id, user_id, flow_type, project_name, project_address, city, status, is_demo)
   VALUES ('demo-corrections-001', '{judge_user_id}', 'corrections-analysis', '742 Flint Ave — Corrections Response', '742 Flint Ave', 'Buena Park', 'ready', true);
   ```
4. **Links files** to demo projects in `crossbeam.files`

**Optional pre-run:** Run both flows once against the demo data, save the outputs. Then the judge can either view pre-computed results instantly OR re-run live to watch the agent work. Best of both worlds.

### 2.8 Storage Buckets

Create in Supabase Storage:
- `crossbeam-uploads` — user-uploaded plan binders + corrections letters
- `crossbeam-outputs` — agent-generated files (corrections PDFs, response packages)
- `crossbeam-demo-assets` — pre-seeded demo files (plan binder, corrections letter for demo projects)

### 2.9 Environment Variables

#### Frontend (Vercel):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
CLOUD_RUN_URL=https://crossbeam-server-xxx.run.app
```

#### Server (Cloud Run):
```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
VERCEL_TEAM_ID=team_xxx
VERCEL_PROJECT_ID=prj_xxx
VERCEL_TOKEN=xxx
PORT=8080
```

### 2.10 Deployment Steps

#### Step 1: Supabase Setup
1. Create new Supabase project (or use existing with new schema)
2. Run migration (`001_crossbeam_schema.sql`)
3. Create storage buckets
4. Enable Google OAuth in Auth settings
5. Create judge@crossbeam.app account
6. Run seed script (upload demo PDFs, create demo projects)

#### Step 2: Vercel Frontend
1. `cd frontend && vercel deploy`
2. Set env vars in Vercel dashboard
3. Link to CC-Crossbeam repo, set root directory to `frontend/`

#### Step 3: Cloud Run Server
1. Build Docker image: `cd server && docker build -t crossbeam-server .`
2. Push to GCR: `docker tag ... && docker push ...`
3. Deploy: `gcloud run deploy crossbeam-server --image=... --memory=512Mi --timeout=3600 --allow-unauthenticated`
4. Set env vars via `gcloud run services update --set-env-vars=...`
5. Note the Cloud Run URL → set in Vercel env vars

#### Step 4: Vercel Project for Sandboxes
1. Create a Vercel project for sandbox billing (or reuse Mako's)
2. Get `VERCEL_TEAM_ID`, `VERCEL_PROJECT_ID`
3. Create API token with sandbox scope
4. Add to Cloud Run env vars

#### Step 5: End-to-End Test
1. Hit the deployed URL
2. Click "Sign in as Judge"
3. Click City View → "Run AI Review"
4. Watch agent stream in real-time
5. Verify outputs appear

---

## Part 3: Implementation Order

### Phase 1: Backend (server/) — ~3 hours

**📖 Read `@reference-mako.md` first** — Patterns 1-3 and 5-6 cover every server file.

1. Fork Mako's `server/` directory into CC-Crossbeam (see `reference-mako.md` → File Map → Server)
2. Rewrite `config.ts` with CrossBeam prompts + flow types (see Pattern 2 for the generate route pattern)
3. Adapt `generate.ts` — add `flow_type`, remove credits (see Pattern 2: "Respond Immediately, Process Async")
4. Adapt `sandbox.ts` — CrossBeam skills, file paths, output extraction (see Pattern 3: Sandbox Lifecycle, all 6 steps)
5. Adapt `supabase.ts` — change schema `'mako'` → `'crossbeam'` (see Pattern 10)
6. Copy skills from `agents-crossbeam/.claude/skills/` into `server/skills/` (see Pattern 3, Step 4)
7. Test locally: `node --env-file .env.local dist/index.js`

### Phase 2: Supabase — ~1 hour
1. Run schema migration
2. Create storage buckets
3. Configure auth (email/password + Google)
4. Create judge account
5. Seed demo projects + upload test PDFs

### Phase 3: Frontend (frontend/) — ~3-4 hours

**📖 Read `@reference-mako.md` first** — Patterns 4-9 cover every frontend file.

1. Fork Mako's `frontend/` structure (see `reference-mako.md` → File Map → Frontend)
2. Build login page — judge button + Google (see §1.1 in this plan for design; Pattern 7 for Supabase client setup)
3. Build dashboard — two persona cards (see §1.3; Pattern 9 for data-fetching pattern)
4. Adapt project detail page — file display, run button, results view (see Pattern 4 for Cloud Run proxy, Pattern 6 for processing view)
5. Adapt agent stream component — real-time message polling (see Pattern 5: Real-Time Agent Activity Stream — this is the KEY component to get right)
6. Build results viewer — corrections letter display, checklist (adapt from Mako's output-viewer)
7. Wire up API routes `/api/generate` → Cloud Run proxy (see Pattern 4)

### Phase 4: Deploy — ~1-2 hours
1. Deploy Cloud Run server
2. Deploy Vercel frontend
3. Configure Vercel sandbox project
4. Set all env vars
5. End-to-end smoke test

### Phase 5: Polish — remaining time
1. First-time onboarding popups
2. Pre-computed results for instant demo viewing
3. Loading animations
4. Error states
5. Mobile responsiveness (judges might use phones)

**Total estimated time: 8-10 hours**

---

## Appendix: Files to Copy from Mako

> **📖 For the full code of every file below with inline `← CrossBeam:` adaptation comments, see `@reference-mako.md`.**

When telling Claude Code to fork, point it at these exact files:

```
SOURCE: ~/openai-demo/CC-Agents-SDK-test-1225/mako/

FORK server/:
  server/src/index.ts              → copy as-is
  server/src/routes/generate.ts    → adapt (add flow_type, remove credits)
  server/src/services/sandbox.ts   → adapt (CrossBeam skills, prompts)
  server/src/services/supabase.ts  → adapt (schema mako→crossbeam)
  server/src/utils/config.ts       → rewrite (CrossBeam config)
  server/Dockerfile                → copy as-is
  server/package.json              → copy, update name
  server/tsconfig.json             → copy as-is

FORK frontend/:
  frontend/middleware.ts           → copy as-is
  frontend/app/auth/*              → copy as-is
  frontend/app/layout.tsx          → adapt (branding)
  frontend/app/globals.css         → copy as-is
  frontend/lib/supabase/*          → copy as-is
  frontend/components/ui/*         → copy as-is (shadcn)
  frontend/package.json            → copy, update name
  frontend/tailwind.config.ts      → copy as-is
  frontend/tsconfig.json           → copy as-is
  frontend/next.config.js          → copy as-is
  frontend/postcss.config.mjs      → copy as-is

REWRITE (CrossBeam-specific):
  frontend/app/(auth)/login/page.tsx        → judge button + Google
  frontend/app/(dashboard)/dashboard/page.tsx → persona cards
  frontend/app/(dashboard)/projects/[id]/*  → adapted for CrossBeam flows
  frontend/app/api/generate/route.ts        → adapted (no credits, flow_type)
  frontend/types/database.ts                → CrossBeam types
```

---

*Written: Feb 13, 2026 — for the Claude Code Hackathon deployment sprint.*
