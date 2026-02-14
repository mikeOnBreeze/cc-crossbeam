# Agent SDK Backend Plan — City Plan Review Flow

## Goal

**Run the ADU plan review pipeline programmatically via the Claude Agent SDK**, so a city plan checker can upload a plan binder PDF and receive a draft corrections letter. This is the city-side counterpart to the contractor corrections flow already running in `agents-crossbeam/`.

### What We're Building

A single `query()` call that:

1. Accepts a plan binder PDF + city name
2. Extracts pages and builds a sheet manifest (Phase 1)
3. Reviews each sheet against code-grounded checklists via subagents (Phase 2)
4. Verifies findings against state law + city rules (Phase 3)
5. Generates a draft corrections letter with confidence flags (Phase 4)
6. Generates a professional formatted PDF with confidence badges (Phase 5)
7. Returns `draft_corrections.json` + `draft_corrections.md` + `review_summary.json` + `corrections_letter.pdf`

### Context

- **Hackathon deadline:** Mon Feb 16, 12:00 PM PST
- **Today is:** Wed Feb 12 (Day 3 of 6)
- **Proven foundation:** Contractor flow (`agents-crossbeam/`) is fully built — L0-L4 tests all passing
- **Skill is designed:** `adu-plan-review/SKILL.md` — 280 lines, 5 phases, sub-skill routing
- **70% accuracy validated:** CLI test produced 23 findings, 7/10 real corrections matched, 0 false positives
- **Test data exists:** Same Placentia plan binder (1232 N Jefferson, 15 pages) used for contractor flow

### Key Difference from Contractor Flow

| | Contractor Flow | City Flow |
|---|---|---|
| **Direction** | Interprets corrections | Generates corrections |
| **Input** | Corrections letter + plan binder | Plan binder only (+ city name) |
| **Human pause** | Yes — contractor answers questions between Skill 1 and Skill 2 | **No** — runs straight through |
| **query() calls** | 2 (analysis → pause → response) | **1** (continuous) |
| **Subagent count** | ~5 (3 research + extraction + viewer) | ~7 (5 review + 2 compliance) |
| **Main output** | Contractor response package (4 files) | Draft corrections letter (2 files + summary) |
| **Skill** | `adu-corrections-flow` + `adu-corrections-complete` | `adu-plan-review` (single skill) |

The big simplification: no human-in-the-loop pause means a single `query()` call handles everything.

---

## Architecture: Extend `agents-crossbeam/`

**Decision: Add to the existing `agents-crossbeam/` directory.** Not a new backend.

Rationale:
- Shared utilities already work (`config.ts`, `session.ts`, `progress.ts`, `verify.ts`)
- Same test ladder pattern (L0-L4)
- Same package.json, tsconfig, .env.local
- Same project structure (flows/, tests/, utils/)
- Skills are symlinked — just add the new ones

What changes:
1. Add 3 new skill symlinks (adu-plan-review, placentia-adu, adu-corrections-pdf)
2. Add 1 new flow wrapper (`src/flows/plan-review.ts`)
3. Add new test files (`test-l0c-smoke-city.ts`, `test-l1c-skill-invoke.ts`, etc.)
4. ~~Update `config.ts` system prompt to be flow-neutral~~ **DONE** (2026-02-12)
5. ~~Add `getReviewSessionFiles()` to session.ts~~ **DONE** (2026-02-12)
6. ~~Add `detectReviewPhases()` + `findFileByPattern()` to verify.ts~~ **DONE** (2026-02-12)
7. ~~Pre-extract PNGs + sheet manifest as fixtures~~ **DONE** — `test-assets/city-flow/mock-session/` (15 PNGs + manifest)

### Updated Skill Symlinks

```
agents-crossbeam/.claude/skills/
├── adu-city-research       → (existing)
├── adu-corrections-complete → (existing — not needed for city flow, but doesn't hurt)
├── adu-corrections-flow     → (existing — not needed for city flow, but doesn't hurt)
├── adu-targeted-page-viewer → (existing — shared with city flow)
├── buena-park-adu           → (existing)
├── california-adu           → (existing — shared with city flow)
├── adu-plan-review          → NEW — the main city-side orchestrator skill
├── placentia-adu            → NEW — onboarded city (Tier 3, 12 reference files)
└── adu-corrections-pdf      → NEW — PDF formatting sub-agent (Phase 5)
```

Only 3 new symlinks needed. `document-skills/pdf` is loaded by the `adu-corrections-pdf` skill internally — it doesn't need its own top-level symlink.

### Updated Flow Structure

```
agents-crossbeam/src/flows/
├── corrections-analysis.ts    ← Existing (contractor Skill 1)
├── corrections-response.ts    ← Existing (contractor Skill 2)
└── plan-review.ts             ← NEW (city flow — single query())
```

---

## Flow Design: Single `query()` Call

Unlike the contractor flow (2 calls with a human pause), the city flow is a single continuous agent run.

```
SINGLE INVOCATION
─────────────────
query({
  prompt: "Review this plan binder..."
  // adu-plan-review skill runs Phases 1-4
})
  │
  ├── Phase 1: Extract PDF → PNGs + sheet manifest
  ├── Phase 2: Sheet-by-sheet review (5 subagents)
  ├── Phase 3: Code compliance (2 concurrent subagents)
  ├── Phase 4: Generate draft corrections letter
  └── Phase 5: PDF generation + QA screenshot
        │
        ▼
  UI renders draft_corrections.md
  Plan checker reviews + edits
```

### Why Not Split Into Multiple Calls?

- No natural pause point — the city plan checker doesn't need to answer questions mid-flow
- All phases depend on the previous phase's output
- Single context window means the agent can reference earlier findings throughout
- Simpler error handling — one session to resume, one cost to track

### Phase 5: PDF Generation

Phase 5 runs `adu-corrections-pdf` + `document-skills/pdf` to produce a professional `corrections_letter.pdf` from the `draft_corrections.md`. The skill handles formatting, city letterhead, confidence badges, and DRAFT watermarks. A QA loop lets the main agent review a page-1 screenshot and re-invoke with fix instructions (max 2 retries).

The PDF is a key deliverable — city plan checkers expect a printed document, not markdown. Both outputs serve different purposes:
- `draft_corrections.md` → frontend interactive viewer (renders in Next.js)
- `corrections_letter.pdf` → downloadable, printable, sharable with applicants

---

## System Prompt & Configuration

### System Prompt Architecture — DONE

Base prompt is minimal — project context only, no identity (Claude Code preset handles that):

```typescript
// config.ts — DONE (updated 2026-02-12)
const CROSSBEAM_PROMPT = `You are working on CrossBeam, an ADU permit assistant for California.
Use available skills to research codes, analyze plans, and generate professional output.
Always write output files to the session directory provided in the prompt.`;
```

Each flow adds role-specific instructions via `systemPromptAppend` (concatenated after the base by `createQueryOptions()`). The Claude Code preset system prompt is NOT overridden — our text is appended to it.

The flow-specific context goes in `systemPromptAppend`:

```typescript
// flows/plan-review.ts
const CITY_SYSTEM_PROMPT = `You are reviewing an ADU plan submittal from the city's perspective.
Your job is to identify issues that violate state or city code and produce a draft corrections letter.

CRITICAL RULES:
- NO false positives. Every correction MUST have a specific code citation.
- Drop findings that lack code basis — err on the side of missing items (reviewer catches them).
- Use [REVIEWER: ...] blanks for structural, engineering, and judgment items.
- ADUs can ONLY be subject to objective standards (Gov. Code § 66314(b)(1)).
- State law preempts city rules — if city is more restrictive, flag the conflict.
- Report BOTH code confidence and visual confidence for every finding.`;
```

### query() Configuration for City Flow

```typescript
export async function runPlanReview(opts: PlanReviewOptions): Promise<PlanReviewResult> {
  const prompt = buildPlanReviewPrompt(opts);

  const q = query({
    prompt,
    options: createQueryOptions({
      maxTurns: 100,             // Higher than contractor flow — more subagents
      maxBudgetUsd: 20.00,       // 7 subagents all Opus — needs headroom
      allowedTools: opts.allowedTools ?? DEFAULT_TOOLS,
      systemPromptAppend: CITY_SYSTEM_PROMPT,
      abortController: opts.abortController,
    }),
  });

  // ... iterate messages
}
```

**Budget rationale:** The city flow spawns ~7 subagents (5 review + 2 compliance). Based on contractor flow benchmarks ($5.48 for 4 subagents), estimate $8-14 for 7 subagents. Budget $20 for headroom.

**Turn count rationale:** 5 review subagents + 2 compliance subagents + Phase 1 extraction + Phase 4 merge. Each subagent spawn + poll takes ~5-8 turns. 100 turns gives comfortable headroom.

---

## Session Directory & Output Files

Each plan review job gets a session directory:

```
agents-crossbeam/sessions/review-{timestamp}/
├── pages-png/                    ← Extracted plan pages (Phase 1)
│   ├── page-01.png
│   ├── page-02.png
│   └── ...
├── title-blocks/                 ← Cropped title blocks (Phase 1)
├── sheet-manifest.json           ← Sheet ID ↔ page mapping (Phase 1)
├── sheet_findings.json           ← Per-sheet review findings (Phase 2)
├── state_compliance.json         ← State law verification (Phase 3A)
├── city_compliance.json          ← City-specific findings (Phase 3B)
├── draft_corrections.json        ← Structured corrections data (Phase 4)
├── draft_corrections.md          ← Formatted corrections letter (Phase 4)
├── review_summary.json           ← Stats + reviewer action items (Phase 4)
├── corrections_letter.pdf        ← Professional formatted PDF (Phase 5)
└── qa_screenshot.png             ← Page 1 screenshot for QA (Phase 5)
```

**Verification targets** (files that must exist for the run to be considered successful):

```typescript
const REQUIRED_FILES = [
  'sheet-manifest.json',       // Phase 1
  'sheet_findings.json',       // Phase 2
  'state_compliance.json',     // Phase 3A
  'draft_corrections.json',    // Phase 4
  'draft_corrections.md',      // Phase 4
  'review_summary.json',       // Phase 4
  'corrections_letter.pdf',    // Phase 5
];

// city_compliance.json is OPTIONAL — only present if city research runs
// qa_screenshot.png is OPTIONAL — produced during Phase 5 QA loop
```

---

## Phase-by-Phase Agent Behavior

### Phase 1: Extract & Map (~90 sec)

**Identical to contractor flow Phase 2.** Uses `adu-targeted-page-viewer` skill.

- Bash: `pdftoppm -png <binder.pdf> <output-dir>/page`
- Read cover sheet PNG for sheet index
- Match sheet IDs to pages
- Write `sheet-manifest.json`

No changes needed — the skill handles this the same way.

### Phase 2: Sheet-by-Sheet Review (~2-3 min)

**The core new capability.** Spawns up to 5 subagents, 3-at-a-time rolling window.

| Subagent | Sheets | Checklist Reference | Priority |
|----------|--------|---------------------|----------|
| Architectural A | Cover sheet, floor plan(s) | `checklist-cover.md`, `checklist-floor-plan.md` | HIGH — first |
| Architectural B | Elevations, roof plan, sections | `checklist-elevations.md` | HIGH |
| Site / Civil | Site plan, grading, utility | `checklist-site-plan.md` | HIGH |
| Structural | Foundation, framing, details | `checklist-structural.md` | LOW — flag for reviewer |
| MEP / Energy | Plumbing, mechanical, electrical, Title 24 | `checklist-mep-energy.md` | MEDIUM |

**How subagents get checklist content:**

The skill's SKILL.md instructs the main agent to spawn Task subagents with prompts that include:
1. File paths to the relevant checklist reference files (subagents use Read tool)
2. File paths to the assigned sheet PNGs
3. The sheet manifest for cross-reference context

Subagents use `Read` to load checklist files and plan PNGs. They don't need the `Skill` tool — the checklist is a reference file, not a skill invocation.

**Checklist gap (critical):** Only `checklist-cover.md` exists today. See "Checklist Reference Gap" section below.

### Phase 3: Code Compliance (~60-90 sec, concurrent)

Two subagents run concurrently after Phase 2 completes.

**3A — State Law Verification:**
- Input: All FAIL and UNCLEAR findings from Phase 2
- Reads `california-adu` reference files via Read tool
- Verifies each finding against state law
- Catches false positives (e.g., conversion exemptions)
- Output: `state_compliance.json`

**3B — City Rules (onboarded cities only for hackathon):**
- City flow requires an onboarded city skill (Tier 3) — no web search needed
- Reads `placentia-adu` or `buena-park-adu` reference files (~30 sec, offline)
- Web search fallback (Tier 2) is a post-hackathon feature
- This is the key simplification vs. contractor flow: no 14-min web search bottleneck
- Output: `city_compliance.json`

### Phase 4: Generate Draft Corrections Letter (~2 min)

Single agent (main agent, no subagent) merges all inputs:
1. `sheet_findings.json` (Phase 2)
2. `state_compliance.json` (Phase 3A)
3. `city_compliance.json` (Phase 3B)
4. `sheet-manifest.json` (Phase 1)

Applies the filtering rules from SKILL.md:
- Code-confirmed findings → include with citation
- Code-confirmed but LOW visual confidence → include with `[VERIFY]` flag
- No code basis → **DROP**
- Structural/engineering → `[REVIEWER: ...]` blank
- Subjective judgment → **DROP** (Gov. Code 66314(b)(1))

Outputs: `draft_corrections.json`, `draft_corrections.md`, `review_summary.json`

### Prompt Completion Requirements

From the learnings doc — be explicit about what "done" means:

```
YOU MUST COMPLETE ALL 4 PHASES — do NOT stop after spawning subagents.
The job is NOT done until ALL of these files exist in the session directory:
- sheet-manifest.json (Phase 1)
- sheet_findings.json (Phase 2)
- state_compliance.json (Phase 3A)
- draft_corrections.json (Phase 4)
- draft_corrections.md (Phase 4)
- review_summary.json (Phase 4)

Do NOT return success without writing ALL of these files.
```

---

## Checklist Reference Gap & Mitigation

### Current State

| Checklist | Status | Lines |
|-----------|--------|-------|
| `checklist-cover.md` | **Done** | ~450 |
| `checklist-floor-plan.md` | TODO | — |
| `checklist-site-plan.md` | TODO | — |
| `checklist-elevations.md` | TODO | — |
| `checklist-structural.md` | TODO | — |
| `checklist-mep-energy.md` | TODO | — |

Only 1 of 6 checklists exists. Building the remaining 5 would take 3-6 hours of research + writing.

### Why the CLI Test Still Got 70% Without Checklists

The CLI test (`test-01-analysis.md`) achieved 7/10 real corrections matched because:
1. The agent used `california-adu` (28 state law reference files) directly
2. The agent used `placentia-adu` (12 city reference files) directly
3. The agent applied its own construction knowledge for sheet review
4. Only the cover sheet had a formal checklist — everything else was ad hoc

The checklists make review **systematic and reproducible**, but the agent can still catch many issues without them by reading state/city law and applying general knowledge.

### Mitigation Strategy

**For the hackathon (Tier 1 — do this):**
1. Build the Agent SDK flow using only the cover sheet checklist (`administrative` scope)
2. Validate that the systematic checklist-driven approach works through the SDK
3. For `full` scope, let the agent use its own knowledge + state/city skills (same as CLI test)
4. Accept that `full` scope accuracy may vary without checklists but will still be impressive

**Post-hackathon (Tier 2 — do if time):**
5. Build `checklist-site-plan.md` — highest impact (site plan issues are common)
6. Build `checklist-floor-plan.md` — second highest impact
7. Build remaining checklists iteratively

**Why this works for the demo:**
- The 70% accuracy is already validated with the CLI approach
- The Agent SDK just needs to reproduce what the CLI achieved
- The cover sheet checklist demonstrates the *systematic* approach
- The `review_summary.json` shows confidence tiers — the demo can explain "HIGH confidence items are checklist-driven, MEDIUM items are agent-assessed"

---

## Testing Strategy

Same test ladder pattern as the contractor flow, with a `c` suffix for "city."

| Level | What It Tests | Model | Budget | Est. Time | Notes |
|-------|--------------|-------|--------|-----------|-------|
| L0c | SDK init + new skill discovery | Haiku | $0.10 | ~10s | Do adu-plan-review + placentia-adu resolve? |
| L1c | Single skill invocation | Sonnet | $1.00 | ~1m | Can the agent invoke adu-plan-review and write output? |
| L2c | Phase 1 extraction | Sonnet | $2.00 | ~2m | Can the agent run pdftoppm + build sheet manifest? |
| L3c | Administrative review (cover sheet only) | Opus | $8.00 | ~5m | Checklist-driven review of cover sheet only |
| L4c | Full review (all sheets, Placentia) | Opus | $20.00 | ~10-15m | Full pipeline with real Placentia data |

### L0c: Smoke Test

Verify the 3 new skills are discovered:

```typescript
// Agent should confirm it sees: adu-plan-review, placentia-adu, adu-corrections-pdf
// Plus the 6 existing skills
const prompt = 'List all available skills. Confirm you can see adu-plan-review.';
```

### L1c: Single Skill Invocation

Simple test — can the agent read the skill and respond?

```typescript
const prompt = `Read the adu-plan-review skill and tell me:
1. How many phases does it have?
2. What sub-skills does it use?
3. What files does it produce?
Write your answer to ${sessionDir}/skill-summary.txt`;
```

### L2c: Phase 1 Extraction

Use the Placentia plan binder. Verify sheet manifest is correct:

```typescript
const prompt = `Use the adu-targeted-page-viewer skill to extract pages from this PDF
and build a sheet manifest.
PDF: ${PROJECT_ROOT}/test-assets/corrections/Binder-1232-N-Jefferson.pdf
OUTPUT: ${sessionDir}/
Expected: pages-png/ directory with PNGs + sheet-manifest.json`;
```

### L3c: Administrative Review (The Key Test)

Cover sheet only. Uses the one existing checklist. This validates the systematic approach:

```typescript
const prompt = `Review this ADU plan binder from the city's perspective.
Use the adu-plan-review skill with ADMINISTRATIVE scope (cover sheet only).

PLAN BINDER: ${PROJECT_ROOT}/test-assets/corrections/Binder-1232-N-Jefferson.pdf
CITY: Placentia
SESSION DIRECTORY: ${sessionDir}

Only review the cover sheet against checklist-cover.md.
Write: sheet-manifest.json, sheet_findings.json, draft_corrections.json,
draft_corrections.md, review_summary.json`;
```

**L3c Shortcut:** Pre-populate the sheet manifest from a previous L2c run to skip PDF extraction. Saves ~90 sec per test.

### L4c: Full Pipeline

Full review of all sheets with Placentia data. This is the acceptance test:

```typescript
const prompt = `Review this ADU plan binder from the city's perspective.
Use the adu-plan-review skill with FULL scope.

PLAN BINDER: ${PROJECT_ROOT}/test-assets/corrections/Binder-1232-N-Jefferson.pdf
CITY: Placentia
PROJECT ADDRESS: 1232 N. Jefferson St., Unit 'A', Placentia, CA 92870
SESSION DIRECTORY: ${sessionDir}

Complete ALL phases. Write ALL output files.`;
```

**Validation:** Compare output against `test-assets/corrections/DRAFT-CORRECTIONS-1232-N-Jefferson.md` (the CLI-generated draft). Should catch similar items with similar accuracy.

---

## Cost Estimates

Based on contractor flow benchmarks ($5.48 for Skill 1 with 4 subagents):

| Test | Subagents | Est. Cost | maxBudgetUsd |
|------|-----------|-----------|--------------|
| L0c | 0 | $0.05 | $0.10 |
| L1c | 0 | $0.30 | $1.00 |
| L2c | 1-2 | $1.50 | $3.00 |
| L3c (admin) | 1 review + 2 compliance | $4-6 | $10.00 |
| L4c (full) | 5 review + 2 compliance | $8-14 | $20.00 |

**Total test ladder (one pass through L0c-L4c):** ~$15-22

City research is the bottleneck in the contractor flow (14 min). For Placentia (Tier 3, onboarded), city compliance runs offline (~30 sec). This should make the city flow faster and cheaper than the contractor flow.

---

## Implementation Phases

### Phase A: Skills Setup + Smoke Test (~30 min)

1. Add 3 new symlinks to `agents-crossbeam/.claude/skills/`
2. Verify symlinks resolve with `ls -la`
3. ~~Update `CROSSBEAM_PROMPT` in config.ts to be flow-neutral~~ **DONE**
4. ~~Add `getReviewSessionFiles()` to session.ts~~ **DONE**
5. ~~Add `detectReviewPhases()` + `findFileByPattern()` to verify.ts~~ **DONE**
6. Write + run L0c smoke test
7. **Gate:** Agent discovers all 9 skills including adu-plan-review

### Phase B: Flow Wrapper + Phase 1 Test (~45 min)

1. Write `src/flows/plan-review.ts` (flow wrapper)
2. Write L1c skill invocation test
3. Write L2c extraction test
4. Run L2c — verify sheet manifest matches expected output
5. **Gate:** Sheet manifest for Placentia binder is correct (15 pages, correct sheet IDs)

### Phase C: Administrative Review Test (~1 hour)

1. ~~Pre-populate sheet manifest fixture~~ **DONE** — `test-assets/city-flow/mock-session/` has 15 PNGs + sheet-manifest.json
2. Write L3c administrative review test (with L3c shortcut — pre-populated manifest + PNGs)
3. Run L3c — verify cover sheet findings against checklist-cover.md expectations
4. **Gate:** `draft_corrections.md` contains cover sheet corrections with code citations

### Phase D: Full Pipeline Test (~1 hour)

1. Write L4c full pipeline test
2. Run L4c — full Placentia review
3. Compare output against CLI-generated draft (`DRAFT-CORRECTIONS-1232-N-Jefferson.md`)
4. **Gate:** 60%+ of CLI-found corrections are reproduced; 0 false positives

### Phase E: Frontend Integration (~2-3 hours, separate task)

1. Add API routes to Next.js:
   - `POST /api/review` → triggers `runPlanReview()`
   - `GET /api/review/:sessionId/status` → poll for completion
   - `GET /api/review/:sessionId/results` → read `draft_corrections.md`
2. Build upload page (plan binder PDF + city name)
3. Build results page (renders draft_corrections.md with confidence badges)
4. **Gate:** End-to-end works from browser upload to corrections letter display

### Time Estimate

| Phase | Time | Dependencies |
|-------|------|-------------|
| A: Setup | 30 min | None |
| B: Flow + Phase 1 | 45 min | A |
| C: Admin review | 1 hour | B |
| D: Full pipeline | 1 hour (+ 15 min wait) | C |
| E: Frontend | 2-3 hours | D |
| **Total** | **~5-6 hours** | |

This is doable in a single focused day. Phases A-D could run on Day 4 (Thu), Phase E on Day 5 (Fri).

---

## Open Questions — RESOLVED

### 1. Config.ts: Shared or Forked? → **RESOLVED: Shared (Option A)**

**DONE.** Updated the shared `CROSSBEAM_PROMPT` to be flow-neutral. `systemPromptAppend` support was already built in. Zero risk to contractor flow — all changes are additive.

### 2. Subagent Skill Access → **RESOLVED: Read tool with file paths (Option A)**

Subagents use `Read` tool to load checklist files by absolute path. The main agent's prompt tells each subagent the full path. Path resolution works because `additionalDirectories: [PROJECT_ROOT]` includes the parent `CC-Crossbeam/` directory, which contains `adu-skill-development/skill/...`.

**CRITICAL: Validate in L1c** — L1c must include a subagent variant that spawns a Task subagent to read a checklist file. If this fails, fall back to inlining checklist content in subagent prompts (Option B).

### 3. Checklist Reference File Access Path → **RESOLVED: Absolute paths via PROJECT_ROOT**

Subagents access checklist files at:
```
${PROJECT_ROOT}/adu-skill-development/skill/adu-plan-review/references/checklist-cover.md
```

This is within `additionalDirectories: [PROJECT_ROOT]` and should resolve. L1c validates this.

### 4. Sheet-by-Sheet Review Without Checklists → **RESOLVED: Option A (general knowledge)**

For sheets without checklists, the agent uses general construction knowledge + state/city law reference files. Flag all such findings as MEDIUM confidence. The CLI test proved 70% accuracy with this approach. Demo framing: "HIGH confidence = checklist-driven, MEDIUM = agent-assessed."

### 5. Named Agents vs. Task Tool → **RESOLVED: Task tool (proven pattern)**

Stick with the Task tool approach. It's proven in the contractor flow. Named agents would introduce an untested pattern during a hackathon — not worth the risk.

### 6. City Flow Scope → **RESOLVED: Onboarded cities only (Tier 3)**

The city flow requires a pre-built city skill (e.g., `placentia-adu`, `buena-park-adu`). No web search needed — this eliminates the 14-minute city research bottleneck from the contractor flow. Web search fallback (Tier 2) is post-hackathon.

---

## File Reference

| File | Purpose |
|------|---------|
| `agents-crossbeam/src/flows/plan-review.ts` | **NEW** — City flow wrapper (single query()) |
| `agents-crossbeam/src/utils/config.ts` | Update system prompt to be flow-neutral |
| `agents-crossbeam/src/tests/test-l0c-smoke-city.ts` | **NEW** — Smoke test for city skills |
| `agents-crossbeam/src/tests/test-l1c-skill-invoke.ts` | **NEW** — Skill invocation test |
| `agents-crossbeam/src/tests/test-l2c-extraction.ts` | **NEW** — Phase 1 extraction test |
| `agents-crossbeam/src/tests/test-l3c-admin-review.ts` | **NEW** — Administrative review test |
| `agents-crossbeam/src/tests/test-l4c-full-review.ts` | **NEW** — Full pipeline test |
| `adu-skill-development/skill/adu-plan-review/SKILL.md` | The orchestrator skill (280 lines) |
| `adu-skill-development/skill/adu-plan-review/references/checklist-cover.md` | Cover sheet checklist (450 lines) |
| `adu-skill-development/skill/placentia-adu/` | Onboarded city (12 reference files) |
| `adu-skill-development/skill/adu-corrections-pdf/` | PDF generation skill (Phase 5 — future) |
| `test-assets/corrections/Binder-1232-N-Jefferson.pdf` | Test input (15-page plan binder) |
| `test-assets/corrections/DRAFT-CORRECTIONS-1232-N-Jefferson.md` | CLI-generated reference output |
| `test-assets/city-flow/test-01-analysis.md` | CLI test analysis (70% accuracy scorecard) |
| `learnings-contractors-agents-sdk.md` | Patterns from contractor flow build |
| `plan-contractors-agents-sdk.md` | Contractor flow architecture (reference) |
