---
name: demo-city-review
description: "Local demo: City-side ADU plan review. Point this at a plan binder (PDF or pre-extracted PNGs) and a city name. It reviews the plans sheet-by-sheet against state and city code, then generates a draft corrections letter. Fire-and-forget — no human-in-the-loop pause. Triggers on: 'Review this ADU plan set for [City]' or 'Run the city review on [path]'."
---

# Demo: City Plan Review

Run a city-side ADU plan review locally. You are a city plan checker reviewing an ADU permit submittal for code compliance.

## How to Invoke

The user provides:
1. **Plan binder** — either a PDF path or a directory of pre-extracted PNGs
2. **City name** — e.g., "Placentia", "Buena Park", "Long Beach"
3. (Optional) **Project address**

Example invocations:
- "Review this ADU plan set for Placentia: `test-assets/city-flow/mock-session/pages-png/`"
- "Run city review on `test-assets/01-extract-test/pages-png/` for Buena Park"
- "Review `path/to/plans.pdf` for the City of Long Beach"

## Input Resolution

Determine what the user gave you:

**If a directory of PNGs** (e.g., `pages-png/page-01.png`, `page-02.png`, ...):
- Use directly. Skip PDF extraction.
- Check for pre-existing `sheet-manifest.json` in the same directory or parent. If found, load it and skip manifest building.
- Check for pre-existing `title-blocks/` directory. If found, use those for manifest building.

**If a PDF file**:
- Check if `pdftoppm` is installed: `which pdftoppm`
- If not: `brew install poppler` (macOS) or tell the user to install it
- Extract pages: create a `pages-png/` directory next to the PDF and run:
  ```
  pdftoppm -png -r 200 "<input.pdf>" "<output-dir>/pages-png/page"
  ```
- Rename outputs to `page-01.png`, `page-02.png`, etc. (pdftoppm outputs `page-01.png` format already with the prefix)

## Output Directory

Create `demo-output/city-review-<city>-<timestamp>/` in the workspace root. All output files go here.

## Workflow

### Phase 1: Sheet Manifest (~30-90 sec)

Follow the `adu-targeted-page-viewer` skill workflow:

1. Read page 1 (cover sheet) visually. Extract the sheet index.
2. If page count matches index count, map 1:1 in order.
3. If mismatch, read title blocks to resolve (crop bottom-right 20% of each page, or use pre-cropped title blocks if available).
4. Write `sheet-manifest.json` to the output directory.

### Phase 2: Sheet-by-Sheet Review (~3-5 min)

Review sheets in parallel using subagents. Group by discipline:

**Subagent A — Administrative + Architectural:**
- Cover sheet (CS): stamps, signatures, governing codes list, sheet index accuracy, project data
- Floor plan (A-series): room dimensions, fixture counts, egress, accessibility

**Subagent B — Site + Civil:**
- Site plan: setbacks, lot coverage, FAR, parking, utility connections shown, easements
- Grading/drainage: slopes shown, drainage direction, "For Reference Only" stamp

**Subagent C — Elevations + Fire/Life Safety:**
- Elevations: height compliance, fire separation distance (< 5' from property line = 1-hour rated), roof plan consistency
- Building sections: insulation, foundation-to-wall connection

Launch all three concurrently. Each subagent reads the relevant PNGs and produces findings.

For each finding, record:
- `check`: What was checked
- `status`: PASS | FAIL | UNCLEAR | NOT_APPLICABLE
- `confidence`: HIGH | MEDIUM | LOW
- `observation`: What was actually seen on the plan
- `code_ref`: Code section (CRC, CBC, Gov. Code, municipal code)
- `sheet_id` and `page_number`

Write all findings to `sheet_findings.json`.

### Phase 3: Code Verification (concurrent, ~60-90 sec)

Launch two parallel subagents:

**3A — State Law Verification:**
- Load reference files from `adu-skill-development/skill/california-adu/references/`
- For each FAIL and UNCLEAR finding, verify the code citation
- Check for ADU-specific exceptions (Gov. Code § 66310-66342)
- Write `state_compliance.json`

**3B — City Rules:**
- Check if `adu-skill-development/skill/<city-slug>-adu/` exists
  - **If yes** (onboarded city): Load the city skill reference files. Fast, offline.
  - **If no**: Run the `adu-city-research` skill — Discovery (WebSearch) then Extraction (WebFetch)
- Check findings against city-specific amendments, standard details, IBs
- Write `city_compliance.json`

### Phase 4: Draft Corrections Letter (~2 min)

Merge all inputs and generate the corrections letter:

1. For each finding, apply the filter:
   - Confirmed by code → **include** with citation
   - Confirmed but LOW visual confidence → include with `[VERIFY]` flag
   - No code basis found → **drop it** (no false positives)
   - Structural/engineering adequacy → `[REVIEWER: ...]` blank for human
   - Subjective judgment → **drop it** (prohibited for ADUs per Gov. Code § 66314(b)(1))

2. Write two outputs:
   - `draft_corrections.json` — structured, each item with code citation, confidence, reviewer_action
   - `draft_corrections.md` — formatted markdown corrections letter ready to read

3. Write `review_summary.json` — stats on items found, confidence breakdown, coverage

### Phase 5: Present Results

After all phases complete, present to the user:
- Summary: how many items found, confidence breakdown
- The full `draft_corrections.md` content
- Note which items need `[VERIFY]` or `[REVIEWER]` attention
- List output files written

## Key Rules

- **No false positives.** Drop findings without code basis. It's better to miss something than to flag something incorrectly.
- **Reviewer blanks > AI guesses.** For structural and engineering items, use `[REVIEWER: ...]` instead of guessing.
- **Objective standards only.** ADUs can only be subject to objective, measurable standards (Gov. Code § 66314(b)(1)). Never flag subjective design issues.
- **State preemption.** If a city rule is more restrictive than state law, flag the conflict — state law prevails.
- **Two confidence dimensions.** Report both code confidence (is this legally required?) and visual confidence (am I correct about what I see?).

## Test Data

Ready-to-use test data for demos:

| Test Set | City | Path |
|----------|------|------|
| 1232 N Jefferson | Placentia | `test-assets/city-flow/mock-session/pages-png/` (15 pages, title blocks in `../title-blocks/`) |
| Same project | Placentia | `test-assets/01-extract-test/pages-png/` (15 pages, same project) |

Pre-built mock session data (for comparison): `test-assets/city-flow/mock-session/sheet-manifest.json`

## Sub-Skills Referenced

| Skill | Location | Role |
|-------|----------|------|
| `adu-targeted-page-viewer` | `adu-skill-development/skill/adu-targeted-page-viewer/` | PDF extraction + sheet manifest |
| `california-adu` | `adu-skill-development/skill/california-adu/` | State law (28 reference files) |
| `adu-city-research` | `.claude/skills/adu-city-research/` | Web research for non-onboarded cities |
| `placentia-adu` | `adu-skill-development/skill/placentia-adu/` | Placentia-specific rules (onboarded) |
| `buena-park-adu` | `adu-skill-development/skill/buena-park-adu/` | Buena Park-specific rules (onboarded) |
