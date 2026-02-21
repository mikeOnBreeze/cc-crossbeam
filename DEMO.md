# CrossBeam Local Demo — Claude Code

Run the full ADU permit analysis locally using Claude Code skills. No server, no Supabase, no sandbox — just Claude Code reading plans and researching codes.

## Setup

```bash
bash scripts/setup-demo.sh
```

This creates `demo-workspace/` with symlinked test data. Run it once.

**Optional prereqs** (only needed for extracting new PDFs):
```bash
brew install poppler imagemagick
```

The test assets already have pre-extracted PNGs, so you can demo without these.

## Two Flows

### Flow 1: City Plan Review

**What it does:** You're a city plan checker. Review an ADU plan set for code violations and generate a draft corrections letter.

**How it works:** Fire-and-forget. Point it at plan pages and a city name. It runs all phases autonomously and hands you a corrections letter at the end.

**Invoke:**
```
Review this ADU plan set for Placentia: demo-workspace/city-review-placentia/plans/
```

**What happens:**
1. Reads cover sheet, builds sheet manifest
2. Reviews each sheet against code checklists (3 parallel subagents)
3. Verifies findings against state law + city rules
4. Generates `draft_corrections.md` with code citations and confidence flags
5. Presents the corrections letter

**Output:** `demo-output/city-review-placentia-<timestamp>/`

---

### Flow 2: Contractor Corrections

**What it does:** You're a contractor who got a corrections letter back from the city. Analyze the corrections, research the codes, get answers to key questions, and generate a response package.

**How it works:** Two phases with a pause in the middle.

**Invoke (full flow — Phase 1 + Phase 2):**
```
Analyze these corrections for my Placentia ADU.
Corrections: demo-workspace/contractor-placentia/corrections/
Plans: demo-workspace/contractor-placentia/plans/
```

**What happens:**

**Phase 1 (~4-5 min):**
1. Reads the corrections letter (vision)
2. Builds sheet manifest from plan binder
3. Researches state codes + city rules + views referenced plan sheets (3 parallel subagents)
4. Categorizes each item: auto-fixable / needs your input / needs professional
5. **STOPS and presents questions to you**

**The Pause:**
- You see the questions with research context (why it's being asked, what the code says)
- Answer them inline, or say **"use the mock answers"** to load pre-built test answers
- Or say **"skip"** to generate with TODO placeholders

**Phase 2 (~2 min):**
1. Reads your answers + Phase 1 research
2. Generates 4 deliverables:
   - `response_letter.md` — professional letter to the building department
   - `professional_scope.md` — work breakdown for your design team
   - `corrections_report.md` — status dashboard with checklists
   - `sheet_annotations.json` — per-sheet markup instructions

**Output:** `demo-output/contractor-placentia-<timestamp>/`

---

### Shortcut: Phase 2 Only

Skip the analysis and jump straight to generating deliverables using pre-built mock data:

```
Generate the response package using the mock session data at demo-workspace/contractor-placentia/mock-session/
```

This loads pre-built Phase 1 artifacts + mock contractor answers and runs Phase 2 only. Useful for demoing the output generation without waiting for the full analysis.

## Test Data

| Asset | Description | Path |
|-------|-------------|------|
| Corrections letter | 2-page Placentia corrections for 1232 N Jefferson | `demo-workspace/contractor-placentia/corrections/` |
| Plan pages | 15-page plan set (PNGs at 200 DPI) | `demo-workspace/contractor-placentia/plans/` |
| Mock Phase 1 outputs | Pre-built analysis artifacts | `demo-workspace/contractor-placentia/mock-session/` |
| Mock answers | Contractor answers for all questions | `demo-workspace/contractor-placentia/mock-session/contractor_answers.json` |
| City review plans | Same project, separate PNG copies | `demo-workspace/city-review-placentia/plans/` |
| Real agent outputs | Previous production run results (for comparison) | `test-assets/correction-01/` |

## Architecture

```
Production (deployed):
  API → Cloud Run (PDF extract) → Vercel Sandbox (Agent SDK) → Supabase (storage + DB)

Local demo (this):
  You → Claude Code → skills (vision + web search + subagents) → local filesystem
```

Same skills, same domain knowledge, same code research. Just no infrastructure.
