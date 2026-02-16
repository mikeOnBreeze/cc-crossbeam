# CrossBeam — Deployment Strategy (Feb 13, 2026)

> **Author:** Foreman Claude (orchestrating instance)
> **Date:** Thursday, Feb 13, 2026
> **Deadline:** Monday Feb 16, 12:00 PM PST (hackathon submission)
> **Goal:** Live deployed app — judges click one button, watch AI review an ADU permit in real-time.

---

## TL;DR

Four work streams. Stream 0 (Supabase schema) first, then Stream 1 (server) + Stream 2 (frontend) in parallel, then Stream 3 (deploy). Total estimated: 8-10 hours of Claude time.

```
Stream 0 (Schema) ──→ Stream 1 (Server)  ──→ Stream 3 (Deploy)
                  ──→ Stream 2 (Frontend) ─↗
```

---

## What Exists Today

### agents-crossbeam/ (DONE — the heart)
The Agent SDK flows and skills that run inside Vercel sandboxes. This is complete and tested.

- **9 skills** (symlinked from `adu-skill-development/skill/`):
  - `california-adu` (28 ref files — state law foundation)
  - `adu-corrections-flow` (Skill 1: corrections analysis → 8 JSON outputs)
  - `adu-corrections-complete` (Skill 2: response generation → 4 deliverables)
  - `adu-plan-review` (city plan review workflow → 6 outputs)
  - `adu-targeted-page-viewer` (smart PDF page extraction)
  - `adu-city-research` (city regulation lookup via web)
  - `adu-corrections-pdf` (PDF extraction for corrections letters)
  - `buena-park-adu` (Buena Park city-specific handbook)
  - `placentia-adu` (Placentia city-specific handbook)

- **3 flows** (`src/flows/`):
  - `corrections-analysis.ts` — Skill 1 wrapper. Budget: $15 / 80 turns.
  - `corrections-response.ts` — Skill 2 wrapper. Budget: $8 / 40 turns.
  - `plan-review.ts` — City review flow. Budget: $20 / 100 turns.

- **4 utils** (`src/utils/`): config, progress, session, verify
- **11 tests** (L0 smoke → L4 acceptance): all passing
- **Only dependency**: `@anthropic-ai/claude-agent-sdk`

### Supabase (Labyrinth project)
- **Project ID:** `bhjrpklzqyrelnhexhlj`
- **URL:** `https://bhjrpklzqyrelnhexhlj.supabase.co`
- **Region:** us-east-1
- **Status:** ACTIVE_HEALTHY, Postgres 17
- **Existing `crossbeam` schema:** FROM AN EARLIER ITERATION — will be nuked and rebuilt (see Stream 0)

### Mako Reference Project
- **Location:** `~/openai-demo/CC-Agents-SDK-test-1225/mako/`
- **What it is:** Demand letter generator for lawyers. Nearly identical architecture to what we're building.
- **Architecture:** Next.js on Vercel → Express on Cloud Run → Vercel Sandboxes (Agent SDK)
- **Key patterns we're forking:**
  1. Respond immediately, process async (Cloud Run returns `{status: "processing"}`)
  2. Sandbox uploads directly to Supabase (resilient to server crashes)
  3. Message streaming (fire-and-forget DB inserts, frontend polls every 2s)
  4. Skills bundled in Docker image, copied into sandbox at runtime
  5. Zod request validation on generate endpoint

### Design Bible
- **Location:** `DESIGN-BIBLE.md` (root of repo)
- **Direction:** "Magic Dirt v2" — premium, photorealistic, architectural
- **Stack:** Next.js 15 + shadcn/ui (new-york) + Tailwind v4
- **Fonts:** Playfair Display (headings 24px+) + Nunito (everything else)
- **Colors:** Moss green primary, warm soil brown secondary, sunset coral accent
- **Background:** Sky-to-earth gradient (not flat)
- **Assets:** Keyed ADU miniature PNGs in `/cc-crossbeam-video/assets/keyed/`

---

## Stream 0: Supabase Schema + Setup

**Who:** Foreman Claude (this instance, via Supabase MCP)
**Duration:** ~15-30 min
**Status:** NOT STARTED
**Full schema doc:** `plan-supabase-0213.md` — the definitive reference for all schema DDL

### Key Schema Decisions (revised after agent review)

The original deploy plan schema had gaps. Two independent agent reviews identified issues
with the contractor two-phase flow. Here's what changed:

1. **Expanded status states** — Contractor flow pauses for human input between Phase 1
   (analysis) and Phase 2 (response). Added: `processing-phase1`, `awaiting-answers`,
   `processing-phase2` to the status CHECK constraint.

2. **`raw_artifacts JSONB` catch-all** — Agent produces ~13 files per flow, but only ~4
   are primary deliverables. Named columns hold the deliverables the frontend displays.
   `raw_artifacts` stores everything else as keyed JSON. Nothing is lost.

3. **`contractor_answers` table** — Human-in-the-loop for contractor flow. Server populates
   questions after Phase 1. Frontend shows form. Server reads answers for Phase 2.

4. **`flow_phase` on outputs** — Distinguishes which phase produced the output row:
   `'analysis'` (corrections Phase 1), `'response'` (corrections Phase 2), `'review'` (city).

5. **Renamed columns** — `action_items_json` → `professional_scope_md` (it's Markdown).
   Added `corrections_report_md` for the detailed report from Phase 2.

### 0.1 Nuke Existing Schema

The existing `crossbeam` schema has tables from an earlier iteration that don't match the deploy plan. Tables to drop:
- `crossbeam.contractor_questions` (58 rows — test data)
- `crossbeam.agent_messages` (0 rows)
- `crossbeam.correction_analyses` (8 rows — test data)
- `crossbeam.outputs` (6 rows — wrong structure)
- `crossbeam.messages` (53 rows — test data)
- `crossbeam.client_files` (6 rows)
- `crossbeam.projects` (2 rows — test data)
- `crossbeam.transactions` (0 rows)
- `crossbeam.promo_codes` (0 rows)
- `crossbeam.leads` (0 rows)
- `crossbeam.users` (64 rows — test data)

**Action:** `DROP SCHEMA IF EXISTS crossbeam CASCADE;`

### 0.2 Create New Schema

**Full DDL is in `plan-supabase-0213.md`.** Summary of 5 tables:

| Table | Key Columns | Purpose |
|---|---|---|
| `crossbeam.projects` | flow_type, status (8 states), is_demo | Project lifecycle |
| `crossbeam.files` | file_type (plan-binder/corrections-letter) | Uploaded documents |
| `crossbeam.messages` | BIGSERIAL id, role, content | Agent streaming |
| `crossbeam.outputs` | flow_phase, named deliverables, raw_artifacts JSONB | Agent outputs |
| `crossbeam.contractor_answers` | question_key, answer_text, is_answered | Human-in-the-loop |

### 0.3 Storage Buckets

- `crossbeam-uploads` — user-uploaded plan binders + corrections letters
- `crossbeam-outputs` — agent-generated files (PDFs, response packages)
- `crossbeam-demo-assets` — pre-seeded demo files (public read)

### 0.4 Manual Dashboard Tasks (Mike does these)

1. **Enable email/password auth** in Authentication → Providers
2. **Enable Google OAuth** (stretch — judge button is sufficient for demo)
3. **Create judge account:** `judge@crossbeam.app` / `crossbeam-hackathon-2026`
4. **Upload demo PDFs** to `crossbeam-demo-assets` bucket
5. **Seed demo projects** (SQL provided in `plan-supabase-0213.md`)

---

## Stream 1: Server (Cloud Run Backend)

**Who:** Dedicated Claude Code instance
**Duration:** ~3-4 hours
**Depends on:** Stream 0 (schema) — needs to know table structure
**Reference:** Mako server at `~/openai-demo/CC-Agents-SDK-test-1225/mako/server/`

### 1.1 What This Instance Builds

An Express server that handles two flow types:

**City Review (single phase):**
1. Receives POST `/generate` with `{project_id, user_id, flow_type: 'city-review'}`
2. Responds immediately `{status: "processing"}`
3. Creates Vercel Sandbox → runs `plan-review.ts` → streams messages → extracts outputs
4. Updates status: `processing` → `completed`

**Contractor Corrections (two phases):**
1. POST `/generate` with `flow_type: 'corrections-analysis'` → status: `processing-phase1`
2. Sandbox runs `corrections-analysis.ts` → produces `contractor_questions.json`
3. Server parses questions → inserts into `contractor_answers` table → status: `awaiting-answers`
4. (Human answers questions in frontend)
5. POST `/generate` with `flow_type: 'corrections-response'` → status: `processing-phase2`
6. Sandbox runs `corrections-response.ts` with Phase 1 outputs + answers → status: `completed`

**IMPORTANT:** The generate route needs to handle THREE flow types internally:
`'city-review'`, `'corrections-analysis'`, `'corrections-response'`
(even though `projects.flow_type` is only `'city-review'` or `'corrections-analysis'`)

### 1.2 Files to Create (forked from Mako)

```
CC-Crossbeam/server/
├── src/
│   ├── index.ts              ← Copy Mako as-is (Express setup, health check, route mounting)
│   ├── routes/
│   │   └── generate.ts       ← Fork Mako: add flow_type, remove credits logic
│   ├── services/
│   │   ├── sandbox.ts        ← Fork Mako: CrossBeam skills, prompts, output extraction
│   │   └── supabase.ts       ← Fork Mako: schema 'mako' → 'crossbeam', rename functions
│   └── utils/
│       └── config.ts         ← REWRITE: CrossBeam prompts, flow types, model config
├── skills/                    ← Copy from agents-crossbeam/.claude/skills/ (resolve symlinks)
│   ├── california-adu/
│   ├── adu-plan-review/
│   ├── adu-corrections-flow/
│   ├── adu-corrections-complete/
│   ├── adu-targeted-page-viewer/
│   ├── adu-city-research/
│   ├── adu-corrections-pdf/
│   ├── buena-park-adu/
│   └── placentia-adu/
├── Dockerfile                 ← Copy Mako as-is (Node 22 slim, PORT 8080)
├── package.json               ← Copy Mako, update name to "crossbeam-server"
└── tsconfig.json              ← Copy Mako as-is
```

### 1.3 Key Adaptations

**config.ts (REWRITE):**
- `MODEL: 'claude-opus-4-6'` (not claude-opus-4-5)
- `AGENT_MAX_TURNS: 80` / `AGENT_MAX_BUDGET_USD: 15.00`
- Three internal flow types: `'city-review' | 'corrections-analysis' | 'corrections-response'`
- `FLOW_SKILLS` map: which skills load for which flow
- `buildPrompt(flowType, city, address)` — see deploy plan §2.5 for exact prompt text

**generate.ts (ADAPT):**
- Request schema: `{project_id, user_id, flow_type}` — flow_type includes `'corrections-response'`
- Remove all credits/billing logic
- For `corrections-response`: read contractor_answers from DB, pass to sandbox
- Pass `flow_type` to sandbox service

**sandbox.ts (ADAPT):**
- `readSkillFilesFromDisk()` → reads skills based on flow_type from `FLOW_SKILLS` config
- `buildDownloadManifest()` → plan binder + optional corrections letter
- For `corrections-response`: also download Phase 1 output files + contractor_answers.json
- `runAgent()` → uses CrossBeam prompt from `buildPrompt()`
- `extractOutputs()` → flow-aware: different output files per flow_phase
- After Phase 1: parse `contractor_questions.json` → insert into `contractor_answers` table
- After Phase 1: set status `awaiting-answers` (not `completed`)
- Schema references: `'mako'` → `'crossbeam'` throughout

**supabase.ts (ADAPT):**
- All `.schema('mako')` → `.schema('crossbeam')`
- Table references: `client_files` → `files`, match new column names
- Output record: include `flow_phase`, `raw_artifacts`, named deliverable columns
- New functions: `insertContractorAnswers()`, `getContractorAnswers()`, `getPhase1Outputs()`
- Remove any Mako-specific functions (user_assets, credits, etc.)

### 1.4 Skills Handling

The skills in `agents-crossbeam/.claude/skills/` are **symlinks** pointing to `adu-skill-development/skill/`. When copying to `server/skills/`, resolve the symlinks — copy the actual skill directories. Each skill directory contains markdown instruction files + reference files.

### 1.5 Testing

Before deployment:
```bash
cd server
npm install
npm run build
node --env-file .env.local dist/index.js
# Hit http://localhost:8080/health
# POST http://localhost:8080/generate with test payload
```

---

## Stream 2: Frontend (Next.js on Vercel)

**Who:** Dedicated Claude Code instance
**Duration:** ~3-4 hours
**Depends on:** Stream 0 (schema) — needs types
**Reference:** Mako frontend at `~/openai-demo/CC-Agents-SDK-test-1225/mako/frontend/`
**Design reference:** `DESIGN-BIBLE.md` in repo root

### 2.1 What This Instance Builds

A Next.js 15 app with:
1. **Login page** — "Sign in as Judge" button (hardcoded creds) + Google OAuth
2. **Dashboard** — Two persona cards (City Reviewer / Contractor)
3. **Project detail** — File display, "Start Analysis" button, agent working stream, results view
4. **Agent stream** — Real-time message polling from `crossbeam.messages`
5. **Results viewer** — Corrections letter display, checklist, download

### 2.2 Files to Create (forked from Mako)

```
CC-Crossbeam/frontend/
├── app/
│   ├── page.tsx                         ← Landing page (CrossBeam branding, design bible hero)
│   ├── layout.tsx                       ← Fork Mako: change fonts (Playfair+Nunito), branding
│   ├── globals.css                      ← REWRITE: design bible colors, gradient, @theme inline
│   ├── auth/
│   │   ├── callback/route.ts           ← Copy Mako as-is (OAuth callback)
│   │   └── signout/route.ts            ← Copy Mako as-is
│   ├── (auth)/
│   │   └── login/page.tsx              ← REWRITE: judge button + Google OAuth
│   ├── (dashboard)/
│   │   ├── layout.tsx                  ← Fork Mako (protected layout, redirect if no auth)
│   │   ├── dashboard/page.tsx          ← NEW: two persona cards
│   │   └── projects/
│   │       └── [id]/page.tsx           ← ADAPT: file display, run button, agent stream, results
│   └── api/
│       ├── generate/route.ts           ← Fork Mako: add flow_type, remove credits
│       └── health-check/route.ts       ← Copy Mako as-is
├── components/
│   ├── ui/                              ← Copy Mako's shadcn components
│   ├── persona-card.tsx                 ← NEW: dashboard persona card component
│   ├── agent-stream.tsx                 ← ADAPT: polls crossbeam.messages, renders activity log
│   ├── contractor-questions-form.tsx    ← NEW: questions form for awaiting-answers state
│   └── results-viewer.tsx               ← NEW: corrections letter + checklist display
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   ← Copy Mako as-is (browser client)
│   │   ├── server.ts                   ← Copy Mako as-is (server client)
│   │   └── middleware.ts               ← Copy Mako as-is (session refresh)
│   └── utils.ts                         ← Copy Mako (cn() utility)
├── types/
│   └── database.ts                      ← REWRITE: CrossBeam schema types
├── middleware.ts                         ← Copy Mako as-is (auth routing)
├── package.json                         ← Copy Mako, update name
├── next.config.js                       ← Copy Mako
├── tailwind.config.ts                   ← ADAPT: add display/body font families
├── tsconfig.json                        ← Copy Mako
└── postcss.config.mjs                   ← Copy Mako
```

### 2.3 Design Bible Application

**CRITICAL: The frontend instance MUST read `DESIGN-BIBLE.md` before writing any code.**

Key rules:
- **globals.css:** Replace all CSS variables with design bible palette (§Color Palette). Include `@theme inline` block. Add `.bg-crossbeam-gradient` class.
- **Fonts:** Configure Playfair Display + Nunito via `next/font/google` in layout.tsx. Playfair ONLY for headings 24px+.
- **Cards:** Deep soft shadows (`0 8px 32px rgba(28,25,23,0.08)`), generous padding (`p-6`), `border-border/50`
- **Buttons:** Primary CTAs are pill-shaped (`rounded-full`), moss green
- **Background:** Sky-to-earth gradient on root layout, NOT flat white
- **NEVER:** Hardcode colors (`bg-blue-600`), use `!important`, add cartoon elements, use bounce animations

### 2.4 Screen-by-Screen Instructions

**Login Page:**
- CrossBeam logo + tagline at top
- Big primary button: "Sign in as a Judge" — calls `supabase.auth.signInWithPassword({email: 'judge@crossbeam.app', password: 'crossbeam-hackathon-2026'})`
- Divider: "— or —"
- Secondary button: "Sign in with Google" — calls `supabase.auth.signInWithOAuth({provider: 'google'})`
- Clean, centered, on gradient background

**Dashboard:**
- "Choose your perspective:" heading (Playfair Display)
- Two floating cards side by side:
  - **City Reviewer:** icon, description, demo project name, "Run AI Review →" button
  - **Contractor:** icon, description, demo project name, "Analyze Corrections →" button
- Each links to `/projects/{demo-project-id}`
- Optional: "+ New Project" link below

**Project Detail (the important one):**
This page renders differently based on `project.status`. See `plan-supabase-0213.md` for the
full status→UI mapping table. The key states:

| Status | UI |
|---|---|
| `ready` | File preview + "Start Analysis" / "Run AI Review" button |
| `processing` / `processing-phase1` | Agent working screen — progress dots, activity log, ADU miniature |
| `awaiting-answers` | **Contractor questions form** — questions from `contractor_answers` table with answer fields + "Submit & Generate Response" button |
| `processing-phase2` | Agent working screen (round 2) — "Building your response..." |
| `completed` | Results viewer — tabbed content (response letter / checklist / scope of work), summary stats, download |
| `failed` | Error message + retry option |

The `awaiting-answers` state is the **human-in-the-loop** for the contractor flow. The frontend:
1. Fetches questions from `crossbeam.contractor_answers WHERE project_id = ?`
2. Renders a form with each question + input field
3. On submit: updates `answer_text` + `is_answered` for each row
4. POSTs to `/api/generate` with `flow_type: 'corrections-response'`

**Agent Stream:**
- Polls `crossbeam.messages` every 2 seconds (use `WHERE id > last_seen_id` for efficiency)
- Displays messages in a scrolling log with timestamps
- Shows progress indicator: `● completed (green)` → `◉ active (amber pulse)` → `○ pending (gray)`
- Phases: Extract → Research → Review → Generate (for city-review) or Extract → Analyze → Research → Categorize → Prepare (for corrections)

### 2.5 Supabase Client Setup

The frontend uses **anon key** (not service role). All queries go through RLS policies.

```typescript
// All CrossBeam queries use .schema('crossbeam')
const { data } = await supabase
  .schema('crossbeam')
  .from('projects')
  .select('*')
  .eq('user_id', userId)
```

### 2.6 API Route: `/api/generate`

```typescript
// frontend/app/api/generate/route.ts
// 1. Authenticate user (server-side Supabase client)
// 2. Verify project ownership
// 3. POST to Cloud Run: { project_id, user_id, flow_type }
// 4. Return Cloud Run response
```

The `CLOUD_RUN_URL` comes from env var. In dev, use `http://localhost:8080`.

---

## Stream 3: Deploy

**Who:** Foreman Claude + Mike
**Duration:** ~1-2 hours
**Depends on:** Streams 0, 1, 2 all complete

### 3.1 Cloud Run Server

```bash
cd server
docker build -t crossbeam-server .
docker tag crossbeam-server gcr.io/{GCP_PROJECT}/crossbeam-server
docker push gcr.io/{GCP_PROJECT}/crossbeam-server
gcloud run deploy crossbeam-server \
  --image=gcr.io/{GCP_PROJECT}/crossbeam-server \
  --memory=512Mi \
  --timeout=3600 \
  --allow-unauthenticated \
  --region=us-east1
```

Env vars for Cloud Run:
```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://bhjrpklzqyrelnhexhlj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
VERCEL_TEAM_ID=team_xxx
VERCEL_PROJECT_ID=prj_xxx
VERCEL_TOKEN=xxx
PORT=8080
```

### 3.2 Vercel Frontend

```bash
cd frontend
vercel deploy --prod
```

Env vars for Vercel:
```
NEXT_PUBLIC_SUPABASE_URL=https://bhjrpklzqyrelnhexhlj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
CLOUD_RUN_URL=https://crossbeam-server-xxx.run.app
```

### 3.3 Vercel Sandbox Project

Need a Vercel project for sandbox billing. Get:
- `VERCEL_TEAM_ID`
- `VERCEL_PROJECT_ID`
- `VERCEL_TOKEN` (API token with sandbox scope)

Add these to Cloud Run env vars.

### 3.4 E2E Smoke Test

1. Hit deployed URL
2. Click "Sign in as Judge"
3. See dashboard with two persona cards
4. Click City Reviewer → "Run AI Review"
5. Watch agent stream messages in real-time
6. Verify results appear after ~10-15 min

---

## Environment Variables Reference

### Already Have (in .env.local)
- `SUPABASE_URL` = `https://bhjrpklzqyrelnhexhlj.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = (in .env.local)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (in .env.local)
- `ANTHROPIC_API_KEY` = (in agents-crossbeam/.env.local)

### Need to Get
- `VERCEL_TEAM_ID` — from Vercel dashboard
- `VERCEL_PROJECT_ID` — create new project or reuse
- `VERCEL_TOKEN` — generate in Vercel settings
- `CLOUD_RUN_URL` — will know after deployment
- Google OAuth client ID/secret — from Google Cloud Console (for Google login)

---

## Risk Mitigation

### If we run out of time:
1. **Cut Google OAuth** — judge button is enough for demo
2. **Cut upload-your-own flow** — demo projects only
3. **Cut onboarding popups** — dashboard is self-explanatory
4. **Pre-compute results** — run both flows offline, store results, show them instantly (skip live agent run during demo if nervous about timing)

### If sandbox takes too long during demo:
- Pre-run one flow, have results cached
- Show the other flow live
- Explain: "Here's one we ran earlier (2 min viewing), and here's one running live (watch for 3 min)"

### If Cloud Run fails:
- Fall back to local demo — run server on laptop, use ngrok for tunnel
- The Agent SDK flows work locally (proven in testing)

---

## Mako Reference File Map

For any Claude instance that needs to look at the Mako source:

```
~/openai-demo/CC-Agents-SDK-test-1225/mako/
├── server/
│   ├── src/index.ts              → Express setup, health, routes
│   ├── src/routes/generate.ts    → Generate endpoint (validate, async process)
│   ├── src/services/sandbox.ts   → Vercel Sandbox lifecycle (create, install, download, run, extract)
│   ├── src/services/supabase.ts  → DB queries, file uploads, message logging
│   ├── src/utils/config.ts       → Constants, timeouts, model, prompts
│   ├── skills/demand-letter/     → Bundled skill (agents, references, scripts)
│   ├── Dockerfile                → Node 22 slim, PORT 8080
│   └── package.json              → @vercel/sandbox, express, zod, supabase
├── frontend/
│   ├── app/(auth)/login/         → Login page
│   ├── app/(dashboard)/          → Dashboard, projects list, project detail
│   ├── app/api/generate/         → Cloud Run proxy route
│   ├── app/auth/                 → OAuth callback, signout
│   ├── components/ui/            → shadcn components
│   ├── components/project/       → File upload, agent activity log, output viewer
│   ├── lib/supabase/             → Browser + server + middleware clients
│   ├── types/database.ts         → Schema types
│   └── middleware.ts             → Auth routing
```

---

## Quick Reference: Supabase Project

- **Project name:** Labyrinth
- **Project ID:** `bhjrpklzqyrelnhexhlj`
- **URL:** `https://bhjrpklzqyrelnhexhlj.supabase.co`
- **DB host:** `db.bhjrpklzqyrelnhexhlj.supabase.co`
- **Region:** us-east-1
- **Schema:** `crossbeam` (will be rebuilt fresh in Stream 0)
- **Org ID:** `ihkvfmmwetbujbbtmzuh`

---

*Strategy written: Feb 13, 2026, ~evening PST*
*Next step: Execute Stream 0 (schema nuke + rebuild), then hand off Streams 1+2 as briefs.*
