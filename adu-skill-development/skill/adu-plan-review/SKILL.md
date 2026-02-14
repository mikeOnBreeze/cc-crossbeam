---
name: adu-plan-review
description: "City-side ADU plan review — the flip side of adu-corrections-flow. Takes a plan binder PDF + city name, reviews each sheet against code-grounded checklists, checks state and city compliance, and generates a draft corrections letter with confidence flags and reviewer blanks. Coordinates three sub-skills (california-adu for state law, adu-city-research OR a dedicated city skill for city rules, adu-targeted-page-viewer for plan extraction). Triggers when a city plan checker uploads a plan binder for AI-assisted review."
---

# ADU Plan Review — City Corrections Generator

## Overview

Review ADU construction plan submittals and generate a draft corrections letter. This is the city-side counterpart to the contractor-side `adu-corrections-flow`.

| Skill | Direction | Input | Output |
|-------|-----------|-------|--------|
| `adu-corrections-flow` | Contractor → interprets corrections | Corrections letter + plans | Contractor questions + response package |
| **`adu-plan-review`** (this skill) | **City → generates corrections** | **Plan binder + city name** | **Draft corrections letter** |

Same domain knowledge, opposite direction.

## Sub-Skills

| Skill | Role | When |
|-------|------|------|
| `adu-targeted-page-viewer` | Extract PDF → PNGs + sheet manifest | Phase 1 |
| `california-adu` | State-level code compliance (28 reference files, offline) | Phase 3A |
| City-specific skill **OR** `adu-city-research` | City rules — see City Routing below | Phase 3B |

## City Routing

The city knowledge source depends on whether the city has been onboarded:

```
Input: city_name

IF dedicated city skill exists (e.g., placentia-adu/):
  → Tier 3: Load city skill reference files (offline, fast, ~30 sec)
ELSE:
  → Tier 2: Run adu-city-research
    → Mode 1 (Discovery): WebSearch for city URLs (~30 sec)
    → Mode 2 (Extraction): WebFetch discovered URLs (~60-90 sec)
    → Mode 3 (Browser Fallback): Only if extraction has gaps (~2-3 min)
```

**How to detect onboarded cities:** Check for a city skill directory at `skill/{city-slug}-adu/SKILL.md`. If it exists, the city is onboarded. If not, fall back to web research.

**Tier 1 (state law only)** is always available — it's the `california-adu` skill. Even without any city knowledge, state law catches ~70% of common corrections.

## Inputs

| Input | Format | Required |
|-------|--------|----------|
| Plan binder | PDF (full construction plan set) | Yes |
| City name | String | Yes |
| Project address | String | Recommended (improves city research) |
| Review scope | `full` or `administrative` | Optional — defaults to `full` |

**Review scope options:**
- `administrative` — Cover sheet, sheet index, stamps/signatures, governing codes, project data. Fast (~2 min), HIGH confidence. Good for completeness screening.
- `full` — All sheet types, all check categories. Slower (~5-8 min), mixed confidence. Produces the draft corrections letter.

## Outputs

All written to the session directory.

| Output | Format | Phase |
|--------|--------|-------|
| `sheet-manifest.json` | Sheet ID ↔ page mapping | Phase 1 |
| `sheet_findings.json` | Per-sheet review findings with confidence flags | Phase 2 |
| `state_compliance.json` | State law findings relevant to plan issues | Phase 3A |
| `city_compliance.json` | City-specific findings (from city skill or web research) | Phase 3B |
| **`draft_corrections.json`** | **Draft corrections letter — the main output** | Phase 4 |
| `review_summary.json` | Stats: items found by confidence tier, review coverage, reviewer action items | Phase 4 |

## Workflow

### Phase 1: Extract & Map

Run `adu-targeted-page-viewer`:

1. **Check first:** PNGs and title block crops may already be pre-extracted in `project-files/pages-png/` and `project-files/title-blocks/`. If they exist, skip extraction and go straight to reading the cover sheet.
2. If PNGs don't exist: Extract PDF pages to PNGs: `scripts/extract-pages.sh <binder.pdf> <output-dir>`
3. Read cover sheet for sheet index
4. Match sheet IDs to pages (title block reading if needed)
5. Save `sheet-manifest.json`

~90 seconds (or ~30 seconds if PNGs are pre-extracted). Identical to Phase 2 of `adu-corrections-flow`.

### Phase 2: Sheet-by-Sheet Review

Review each sheet against the relevant checklist reference file. Group sheets by discipline to limit subagent count.

**Subagent grouping:**

| Subagent | Sheets | Checklist Reference | Priority |
|----------|--------|---------------------|----------|
| **Architectural A** | Cover sheet, floor plan(s) | `checklist-cover.md`, `checklist-floor-plan.md` | HIGH — run first |
| **Architectural B** | Elevations, roof plan, building sections | `checklist-elevations.md` | HIGH |
| **Site / Civil** | Site plan, grading plan, utility plan | `checklist-site-plan.md` | HIGH |
| **Structural** | Foundation, framing, structural details | `checklist-structural.md` | LOW — flag for reviewer |
| **MEP / Energy** | Plumbing, mechanical, electrical, Title 24 | `checklist-mep-energy.md` | MEDIUM |

**Rolling window:** 3 subagents in flight. Architectural A + Architectural B + Site/Civil start first. As each completes, launch the next.

**Each subagent receives:**
- The sheet PNG(s) for its assigned sheets
- The relevant checklist reference file(s)
- The sheet manifest (for cross-reference context)

**Each subagent produces:** A findings array for its sheets — one entry per check, with:
- `check_id` — Which checklist item (e.g., "1A" = architect stamp)
- `sheet_id` — Which sheet (e.g., "A1")
- `status` — `PASS` | `FAIL` | `UNCLEAR` | `NOT_APPLICABLE`
- `visual_confidence` — `HIGH` | `MEDIUM` | `LOW`
- `observation` — What the subagent actually saw (evidence)
- `code_ref` — Code section this check is grounded in

**For `administrative` review scope:** Only launch the Architectural A subagent (cover sheet + floor plan). Skip all others.

~2-3 minutes for full review (5 subagents, 3-at-a-time rolling window).

### Phase 3: Code Compliance (concurrent 3A + 3B)

After Phase 2 completes, launch two concurrent subagents to verify findings against code.

#### 3A: State Law Verification

- **Skill:** `california-adu`
- **Input:** All `FAIL` and `UNCLEAR` findings from Phase 2
- **Task:** For each finding, look up the cited code section in the california-adu reference files. Verify: Is this actually required by state law? What are the exact thresholds? Are there ADU-specific exceptions?
- **Output:** `state_compliance.json` — per-finding code verification with exact citations

Why this matters: The checklist reference files cite code sections, but the `california-adu` skill has the detailed rules with exceptions and thresholds. Phase 3A catches false positives — e.g., the checklist flags a 3-foot setback, but the ADU is a conversion and conversions have no setback requirement.

#### 3B: City Rules

Route based on City Routing decision (see above).

**If onboarded city (Tier 3):**
- Load city skill reference files
- Check findings against city-specific amendments, standard details, and IBs
- Fast — ~30 sec, all offline

**If web research (Tier 2):**
- Run `adu-city-research` Mode 1 → Mode 2 → optional Mode 3
- Check findings against discovered city requirements
- Slower — ~90 sec to 3 min

**Output:** `city_compliance.json` — city-specific requirements, local amendments, standard details that apply to the findings

### Phase 4: Generate Draft Corrections Letter

Single agent merges all inputs and produces the corrections letter.

**Inputs to this phase:**
1. `sheet_findings.json` (Phase 2) — what the AI found on the plans
2. `state_compliance.json` (Phase 3A) — state law verification
3. `city_compliance.json` (Phase 3B) — city-specific rules
4. `sheet-manifest.json` (Phase 1) — for sheet references

**For each finding, apply this filter:**

| Condition | Action |
|-----------|--------|
| Finding confirmed by state AND/OR city code | Include in corrections letter with code citation |
| Finding confirmed by code but visual confidence is LOW | Include with `[VERIFY]` flag |
| Finding not confirmed by any code (no legal basis) | **DROP IT** — do not include |
| Finding relates to engineering/structural adequacy | Include as `[REVIEWER: ...]` blank |
| Finding requires subjective judgment | **DROP IT** — prohibited for ADUs per Gov. Code § 66314(b)(1) |

**Output format — `draft_corrections.json`:**

Each correction item includes:
- `item_number` — Sequential
- `section` — Building, Fire/Life Safety, Site/Civil, Planning/Zoning
- `description` — The correction text (what needs to be fixed)
- `code_citation` — Specific code section(s)
- `sheet_reference` — Which sheet(s) are affected
- `confidence` — `HIGH` | `MEDIUM` | `LOW`
- `visual_confidence` — How certain the AI is about the visual observation
- `reviewer_action` — `CONFIRM` (quick check) | `VERIFY` (needs closer look) | `COMPLETE` (reviewer must fill in)

See `references/output-schemas.md` for full JSON schema.

Phase 4 also outputs **`draft_corrections.md`** — a formatted markdown version of the corrections letter. This markdown is the handoff to Phase 5 (PDF generation) and also serves as the frontend-renderable version.

### Phase 5: PDF Generation + QA Loop (sub-agent)

Launch the `adu-corrections-pdf` skill as a sub-agent. This skill uses the `document-skills/pdf` primitive (reportlab, pdf-lib, pypdfium2) for the actual PDF generation. It only handles formatting — no research, no content changes.

**Sub-agent skills loaded:**
- `adu-corrections-pdf` — domain formatting (letterhead, badges, sections)
- `document-skills/pdf` — PDF generation primitives (reportlab, pypdfium2, etc.)

**Sub-agent input:**
- `draft_corrections.md` from Phase 4
- City name, project address, project info (from Phase 1 cover sheet extraction)
- Output path for the PDF

**Sub-agent output:**
- `corrections_letter.pdf` — Professional formatted PDF with city header, confidence badges, proper pagination
- `qa_screenshot.png` — Screenshot of page 1

#### QA Loop

After the sub-agent returns the screenshot, the **main agent** (not the sub-agent) reviews it:

```
LOOP (max 2 retries):
  1. View qa_screenshot.png
  2. Check:
     - Header correct? (city name, project info, "DRAFT" visible)
     - Sections formatted? (numbered items, horizontal rules)
     - Tables readable? (no overflow, columns aligned)
     - No layout breaks? (text not cut off, pages not blank)
     - Footer present? (page numbers, draft disclaimer)
  3. IF everything looks good → Phase 5 COMPLETE
  4. IF issues found → re-invoke sub-agent with fix_instructions:
     - Describe what's wrong: "Table on page 2 overflows right margin"
     - Sub-agent applies fix and regenerates PDF + new screenshot
     - Return to step 1
```

**Max 2 retries.** If the PDF still has issues after 2 fix attempts, deliver it as-is with a note to the user. A slightly imperfect PDF is better than an infinite loop.

**The `draft_corrections.md` serves double duty:**
1. Input to the PDF sub-agent (Phase 5) → downloadable PDF
2. Input to the frontend UI (rendered in Next.js) → interactive viewer

Both consumers get the same content. The markdown is the source of truth.

## Timing

| Phase | Time | Notes |
|-------|------|-------|
| Phase 1 | ~90 sec | PDF extraction + manifest |
| Phase 2 | ~2-3 min | 5 subagents, 3-at-a-time rolling window |
| Phase 3A | ~60 sec | State law lookup (offline) |
| Phase 3B (Tier 3) | ~30 sec | Onboarded city — offline |
| Phase 3B (Tier 2) | ~90 sec–3 min | Web research — depends on city |
| Phase 4 | ~2 min | Merge + filter + format markdown |
| Phase 5 | ~30-60 sec | PDF generation sub-agent + QA screenshot |
| **Total (Tier 3 city)** | **~6-8 min** | |
| **Total (Tier 2 city)** | **~7-10 min** | |
| **Administrative scope only** | **~3-4 min** | Cover sheet checks only |

## Reference Files

### Checklist References (what to check per sheet type)

| File | Sheet Type | Status |
|------|-----------|--------|
| `references/checklist-cover.md` | Cover / title sheet | Draft |
| `references/checklist-site-plan.md` | Site plan, grading, utilities | TODO |
| `references/checklist-floor-plan.md` | Floor plan(s) | TODO |
| `references/checklist-elevations.md` | Elevations, roof plan, sections | TODO |
| `references/checklist-structural.md` | Foundation, framing, details | TODO |
| `references/checklist-mep-energy.md` | Plumbing, mechanical, electrical, Title 24 | TODO |

### Output References

| File | Contents | Status |
|------|----------|--------|
| `references/output-schemas.md` | JSON schemas for all output files | TODO |
| `references/corrections-letter-template.md` | How to format the draft corrections letter | TODO |

### Sub-Skill References

| Skill | Role | Reference |
|-------|------|-----------|
| `california-adu` | State law (Phase 3A) | `california-adu/AGENTS.md` — 28 reference files |
| `adu-city-research` | City rules via web (Phase 3B Tier 2) | Modes 1/2/3 in its SKILL.md |
| `adu-targeted-page-viewer` | Plan extraction (Phase 1) | Sheet manifest workflow in its SKILL.md |
| `adu-corrections-pdf` | PDF generation (Phase 5) | Letter format + CSS in its SKILL.md |
| `document-skills/pdf` | PDF primitives (loaded by Phase 5 sub-agent) | reportlab, pypdfium2, pdf-lib, pypdf |

## Important Notes

- **No false positives.** A city tool that generates incorrect corrections destroys trust. Phase 4's filter is designed to DROP findings that lack code basis rather than include them with low confidence. Err on the side of missing something (the human reviewer catches it) rather than flagging something incorrectly.
- **Reviewer blanks > AI guesses.** For structural, engineering, and judgment-call items, insert `[REVIEWER: describe what needs human assessment]` rather than attempting an assessment. The AI's job is the repeatable 60%, not the expert 40%.
- **Objective standards only.** Per Gov. Code § 66314(b)(1), ADUs can only be subject to objective (measurable, verifiable) standards. If a potential finding requires subjective judgment ("design doesn't match neighborhood character"), do NOT include it. This is the law.
- **State preemption.** State law sets minimum ADU rights. If city rules are MORE restrictive than state law, flag the conflict — the state law prevails. The `california-adu` skill is the authority on state requirements.
- **Two confidence dimensions.** Every finding has both code confidence (is this legally required?) and visual confidence (am I right about what I see?). Both must be reported. A reviewer needs to know "the law is clear but I'm not sure what I see" vs. "I can clearly see this but I'm not sure it's required."
