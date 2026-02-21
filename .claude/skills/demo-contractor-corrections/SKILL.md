---
name: demo-contractor-corrections
description: "Local demo: Contractor corrections analysis and response — two-phase flow with a human-in-the-loop pause. Phase 1 reads the corrections letter, researches codes, views plan sheets, and generates questions for the contractor. The agent STOPS and presents questions to the user. After the user provides answers, Phase 2 generates the full response package (response letter, professional scope, corrections report, sheet annotations). Triggers on: 'Analyze these corrections' or 'Run the contractor flow on [path]'."
---

# Demo: Contractor Corrections Flow

Run the contractor-side corrections analysis and response locally. You are helping a contractor understand and respond to a city corrections letter on their ADU permit.

**This is a two-phase flow with a pause in the middle.** Phase 1 produces questions. You STOP and present them. The user answers. Then Phase 2 generates deliverables.

## How to Invoke

The user provides:
1. **Corrections letter** — PNG images or a PDF of the corrections letter (typically 1-3 pages)
2. **Plan binder** — either a PDF path or a directory of pre-extracted PNGs
3. (Optional) **City name** and **project address** — auto-detected from the corrections letter if not provided

Example invocations:
- "Analyze these corrections for my Placentia ADU project. Corrections: `test-assets/corrections/`. Plans: `test-assets/01-extract-test/pages-png/`"
- "Run the contractor flow. Corrections letter: `path/to/corrections-p1.png` and `path/to/corrections-p2.png`. Plan binder: `path/to/plans.pdf`"
- "I got corrections back from the city. Here they are: [paths]"

## Input Resolution

**Corrections letter:**
- If PNG files: use directly with vision
- If a directory: find all PNGs in it, sort by name, read each as a page
- If PDF: extract to PNGs first (same as plan binder extraction below)

**Plan binder:**
- If a directory of PNGs: use directly. Check for pre-existing `sheet-manifest.json` and `title-blocks/`.
- If a PDF: extract with `pdftoppm -png -r 200 "<input.pdf>" "<output-dir>/pages-png/page"`

## Output Directory

Create `demo-output/contractor-<city>-<timestamp>/` in the workspace root. All output files go here.

---

## PHASE 1: Analysis

### Step 1.1: Parse Corrections Letter (~30 sec)

Read the corrections letter pages visually. Extract:
- **Project info**: address, city, jurisdiction number, job description, date, reviewer name
- **Each correction item** as a structured object:
  - Item number (preserve original numbering, including sub-items like 3a, 3b, 3c)
  - Original text (exact wording)
  - Code references (CRC, CBC, ASCE, CPC, B&P Code, municipal code)
  - Plan sheet references (Sheet A1, Detail 2/A3, etc.)
  - Review round (1st review outstanding vs. 2nd review new)
  - Bold/emphasis flags

Write `corrections_parsed.json` to output directory.

### Step 1.2: Build Sheet Manifest (~30-90 sec)

Run concurrently with Step 1.1.

Follow the `adu-targeted-page-viewer` skill workflow:
1. Read page 1 (cover sheet) visually for the sheet index
2. Match sheet IDs to page numbers (title block reading if count mismatch)
3. Write `sheet-manifest.json`

### Step 1.3: Parallel Research (~60-90 sec)

After Steps 1.1 and 1.2 complete, launch three concurrent subagents:

**Subagent A — State Law Researcher:**
- Load `adu-skill-development/skill/california-adu/references/`
- Look up every code section cited in the corrections (CRC, CBC, ASCE, CPC, B&P Code)
- For each: what does the code require? What are the thresholds? ADU exceptions?
- Write findings (will be merged in Step 1.4)

**Subagent B — City Research:**
- Check if `adu-skill-development/skill/<city-slug>-adu/` exists
  - **If yes**: Load city skill references (offline, fast)
  - **If no**: Run `adu-city-research` — WebSearch for URLs, then WebFetch to extract content
- Focus on: municipal code amendments, standard details referenced in corrections, Information Bulletins
- Write findings (will be merged in Step 1.4)

**Subagent C — Sheet Viewer:**
- Using the sheet manifest, read only the plan sheets referenced by correction items
- For each referenced sheet, describe what is currently drawn in the area relevant to the correction
- Write `sheet_observations.json`

### Step 1.4: Categorize + Generate Questions (~2 min)

Merge all research and categorize each correction item:

| Category | Meaning |
|----------|---------|
| `AUTO_FIXABLE` | Drafter fixes: labels, notes, formatting, checklists |
| `NEEDS_CONTRACTOR_INPUT` | Requires specific facts from the contractor (pipe sizes, elevations, materials) |
| `NEEDS_PROFESSIONAL` | Requires licensed professional work (structural calcs, fire-rated details, stamps) |

For each item, document:
- Category assignment with justification
- Research context (what the code requires, what the city adds)
- What's currently on the plan (from sheet observations)
- What needs to change

Write `corrections_categorized.json`.

For `NEEDS_CONTRACTOR_INPUT` items, generate specific questions:
- Each question includes research_context explaining why it's being asked
- Question types: choice, text, number, measurement, multi_choice
- Questions are informed by the code research — they ask for specific data, not vague descriptions

Write `contractor_questions.json`.

Also write `state_law_findings.json` (from Subagent A) and any city research files.

---

## ⛔ STOP HERE — Present Questions to the User

**After Phase 1 completes, you MUST stop and wait for the user.**

Present the results in this format:

---

### Phase 1 Complete — Corrections Analysis

**Project:** [address], [city] — [permit number]
**Corrections:** [N] items parsed from [review round]
**Breakdown:** [X] auto-fixable, [Y] need your input, [Z] need professional work

#### Questions for You

For each question group (organized by correction item):

> **Item [#] — [summary]**
> [research context — why this matters, what the code says]
>
> 1. [question text]
>    - Options: [if choice type]
> 2. [question text]
>    ...

#### Auto-Fixable Items (no input needed)
- Item [#]: [summary] — [what will be done]
- ...

#### Professional Items (scoped for your design team)
- Item [#]: [summary] — needs [professional role]
- ...

**Answer the questions above and I'll generate your response package.**

You can also say:
- "Use the mock answers" (loads `test-assets/mock-session/contractor_answers.json`)
- "Skip the questions, just generate with what you have" (Phase 2 runs with TODO placeholders)

---

**Wait for the user's response before proceeding to Phase 2.**

---

## PHASE 2: Generate Response Package

Triggered when the user provides answers. Three ways this happens:

1. **User answers inline** — Parse their answers from the conversation. Map to question IDs.
2. **User says "use mock answers"** — Load `test-assets/mock-session/contractor_answers.json`
3. **User says "skip" or "generate with what you have"** — Proceed with empty answers; TODO placeholders in outputs.

Write `contractor_answers.json` to the output directory (even if loaded from mock).

### Step 2.1: Load Phase 1 Context

Read all Phase 1 outputs from the output directory:
1. `corrections_categorized.json` — the backbone, read first
2. `contractor_answers.json` — map answers to items
3. `sheet-manifest.json` — for sheet references
4. `corrections_parsed.json` — for original wording

### Step 2.2: Generate Four Deliverables

Follow the `adu-corrections-complete` skill specification. Generate all four:

**1. `response_letter.md`** — Professional letter to the building department
- Address EVERY item, even procedural ones
- Preserve original correction wording
- Incorporate contractor answers with code justification
- Reference specific sheets from manifest
- End with a sheet revisions summary table

**2. `professional_scope.md`** — Work breakdown by professional
- Group by role: Designer, Structural Engineer, HERS Rater
- Include Key Specifications section with contractor-provided details
- Ready-to-use notes for the design team (DFU justification, grade table, dimensions)
- Status per item: READY, PENDING, FINAL STEP

**3. `corrections_report.md`** — Status dashboard / checklist
- Summary table by category
- Key findings from contractor answers (capacity conclusions, drainage assessment)
- Action items checklist with checkboxes
- Critical path (what blocks what, what can run in parallel)

**4. `sheet_annotations.json`** — Per-sheet markup instructions
- Every annotation references a valid sheet from the manifest
- Revision notes ready for a revision table
- Specifications from contractor answers mapped to sheet locations

### Step 2.3: Present Results

After generating all deliverables, present to the user:
- Summary: what was generated, where files are saved
- The full `response_letter.md` content (this is the main deliverable they care about)
- Highlights from the professional scope (who needs to do what)
- Link to the corrections report for the full status view

---

## Test Data

Ready-to-use test data for the Placentia demo project:

| Asset | Path |
|-------|------|
| Corrections letter (2 pages) | `test-assets/corrections/1232-n-jefferson-corrections-p1.png` and `p2.png` |
| Plan pages (15 PNGs) | `test-assets/01-extract-test/pages-png/` |
| Mock session data | `test-assets/mock-session/` (all Phase 1 outputs pre-built) |
| Mock contractor answers | `test-assets/mock-session/contractor_answers.json` |
| Real agent output (comparison) | `test-assets/correction-01/` |

**Quick demo path** (skips Phase 1, tests Phase 2 only):
- "Generate the response package using the mock session data at `test-assets/mock-session/`"
- This loads pre-built Phase 1 artifacts + mock answers and jumps straight to Phase 2 deliverables.

## Sub-Skills Referenced

| Skill | Location | Role |
|-------|----------|------|
| `adu-targeted-page-viewer` | `adu-skill-development/skill/adu-targeted-page-viewer/` | PDF extraction + sheet manifest |
| `california-adu` | `adu-skill-development/skill/california-adu/` | State law (28 reference files) |
| `adu-city-research` | `.claude/skills/adu-city-research/` | Web research for non-onboarded cities |
| `adu-corrections-complete` | `adu-skill-development/skill/adu-corrections-complete/` | Phase 2 output spec |
| `placentia-adu` | `adu-skill-development/skill/placentia-adu/` | Placentia-specific rules |
| `buena-park-adu` | `adu-skill-development/skill/buena-park-adu/` | Buena Park-specific rules |
