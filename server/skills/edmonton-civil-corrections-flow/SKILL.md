---
name: edmonton-civil-corrections-flow
description: Analyzes Edmonton civil engineering permit corrections letters — the first half of the corrections pipeline. Reads the corrections letter, builds a sheet manifest from the plan binder, researches Edmonton design standards against local reference files, views referenced plan sheets, categorizes each correction item, and generates informed consultant questions. This skill should be used when a civil engineering consultant receives a corrections letter from the City of Edmonton or EPCOR on their subdivision/development plans. It coordinates two sub-skills (edmonton-civil for standards lookup, adu-targeted-page-viewer for plan sheet navigation) to produce research artifacts and a UI-ready questions JSON. Does NOT generate the final response package — that is handled by edmonton-civil-corrections-complete after the consultant answers questions. Triggers when a corrections letter PDF/PNG is provided along with the plan binder PDF.
---

# Edmonton Civil Corrections Flow

## Overview

Analyze Edmonton civil engineering permit corrections and generate informed consultant questions. This is the first skill in a two-skill pipeline:

1. **`edmonton-civil-corrections-flow`** (this skill) — reads corrections, researches standards, categorizes items, generates questions
2. **`edmonton-civil-corrections-complete`** (second skill) — takes consultant answers + these research artifacts, generates the final response package

This skill coordinates two sub-skills through a 4-phase workflow and stops after producing `consultant_questions.json`.

**Sub-skills used:**

| Skill | Role | When Used |
|-------|------|-----------|
| `edmonton-civil` | Edmonton design standards (11 reference files, all offline) | Phase 3A — standards lookup via decision tree |
| `adu-targeted-page-viewer` | Sheet manifest + on-demand plan viewing | Phase 2 + Phase 3B — PDF extraction + vision |

**Key simplification vs ADU flow:** ALL research is offline. No web search, no URL extraction, no browser fallback. Edmonton standards are fully captured in the `edmonton-civil` skill's 11 reference files.

**Key principle:** Research happens *before* consultant questions. Questions informed by actual standards are specific and answerable in seconds. Vague questions waste the consultant's time.

## Inputs

| Input | Format | Required |
|-------|--------|----------|
| Corrections letter | PDF or PNG (1-3 pages) | Yes |
| Plan binder | PDF (the full construction plan set) | Yes |
| Project type | On-site / Off-site (MIA) / Both | Auto-detected from letter |
| Issuing authority | City of Edmonton / EPCOR | Auto-detected from letter |

## Outputs

All outputs are written to the session directory (e.g., `correction-01/`).

| Output | Format | Phase |
|--------|--------|-------|
| `corrections_parsed.json` | Structured correction items | Phase 1 |
| `sheet-manifest.json` | Sheet ID ↔ page number mapping | Phase 2 |
| `standards_findings.json` | Per-standard lookups from edmonton-civil references | Phase 3A |
| `sheet_observations.json` | What's on each referenced plan sheet | Phase 3B |
| `corrections_categorized.json` | Items with categories + research context (the main handoff artifact) | Phase 4 |
| `consultant_questions.json` | UI-ready question form data | Phase 4 |

**This skill stops here.** The `consultant_questions.json` goes to the UI. After the consultant answers, the `edmonton-civil-corrections-complete` skill takes the session directory + `consultant_answers.json` and generates the final response package (response letter, professional scope, corrections report, sheet annotations).

**Do NOT generate Phase 5 outputs** (response letter, professional scope, etc.). That is the job of `edmonton-civil-corrections-complete`.

## Workflow

### Phase 1 + Phase 2 (concurrent)

These two phases run simultaneously — they have no dependencies on each other.

#### Phase 1: Read Corrections Letter

Read the corrections letter visually (1-3 page PNG or PDF). No sub-skill needed — direct vision reading.

Extract each correction item as a structured object. Preserve the exact original wording. Identify:
- **Issuing authority**: City of Edmonton (Drainage, Transportation, Development Services) or EPCOR
- **Infrastructure type per item**: grading / sanitary / storm / water / lane / general
- **Referenced standards**: DCS (Design and Construction Standards) sections, Drainage Bylaw 18100, EPCOR standards, Lot Grading Guidelines
- **Referenced sheets**: C001, C003, C004, C005, C007, C100, C200, etc.

Save as `corrections_parsed.json`. See `references/output-schemas.md` for the full schema.

#### Phase 2: Build Sheet Manifest

Run the `adu-targeted-page-viewer` skill workflow:

1. **Check first:** PNGs and title block crops may already be pre-extracted in `project-files/pages-png/` and `project-files/title-blocks/`. If they exist, skip extraction and go straight to reading the cover sheet.
2. If PNGs don't exist: Extract PDF pages to PNGs: `scripts/extract-pages.sh <binder.pdf> <output-dir>`
3. Read the cover sheet (page 1) for the sheet index
4. If page count differs from index count, crop and read title blocks to resolve
5. Save `sheet-manifest.json`

**Edmonton civil sheet naming convention:** C001 (Cover), C002 (Topo/Survey), C003 (Servicing), C004 (Grading), C005 (SWM), C006 (Road/Lane), C007 (Off-site Grading), C015 (ESC), C100 (Profile), C200 (Details), L001 (Landscape).

### Phase 3 (concurrent — 2 subagents)

After Phases 1+2 complete, launch two parallel research subagents. Each is specialized by domain. Both receive the parsed corrections from Phase 1.

See `references/subagent-prompts.md` for the full subagent prompts.

#### Subagent 3A: Edmonton Standards Researcher

- **Skill context:** `edmonton-civil` (11 reference files, all offline)
- **Input:** All correction items with their standard references and infrastructure types
- **Task:** For each correction item, use the edmonton-civil decision tree to load the relevant reference files. Cross-reference against checklists (on-site, off-site, infill grading). Extract specific thresholds and requirements.
- **Speed:** Fast — no network, just reading reference files (~60 sec)
- **Output:** Per-standard findings with requirements, thresholds, checklist cross-references

**Decision tree routing per infrastructure_type:**

| infrastructure_type | Primary Reference | Checklist |
|---------------------|-------------------|-----------|
| grading | `grading-drainage.md` | `checklist-onsite.md` (C004 section) or `checklist-infill-grading.md` |
| sanitary | `utilities-sanitary.md` | `checklist-onsite.md` (C003 section) |
| storm | `utilities-storm.md` | `checklist-onsite.md` (C005 section) |
| water | `utilities-water.md` | `checklist-onsite.md` (C003 section) |
| lane | `lane-design.md`, `vertical-alignment.md` | `checklist-offsite.md` (C006/C100 section) |
| general | `permit-process.md` | Appropriate checklist based on context |

#### Subagent 3B: Sheet Viewer

- **Skill context:** `adu-targeted-page-viewer`
- **Input:** Sheet manifest from Phase 2 + sheet references from corrections
- **Task:** Read only the plan sheets referenced by correction items (typically 3-6 out of 10-20 pages). For each, describe what is currently drawn in the area relevant to the correction.
- **Speed:** Fast — just reading PNGs (~60 sec)
- **Output:** Per-sheet observations: current state, what appears missing, location on sheet

**What to look for on Edmonton civil sheets:**

For Servicing Plan (C003):
- Pipe routing, sizes, and materials
- Manhole labels (SAN, STM), catch basins
- Service connection details (TVS, water, sewer)
- Sampling manhole locations and slopes
- Hydrant locations and spacing

For Grading Plan (C004):
- Spot elevations, flow arrows
- Building pad elevation vs property line
- Swale locations and slopes
- Retaining wall heights
- 2.0m building zone slopes

For SWM Plan (C005):
- Storage facility layout
- Orifice size and location
- Inlet/outlet elevations
- Overflow route
- Calculation summary table

For Profile Sheet (C100):
- Pipe inverts, slopes, cover depths
- Vertical curves with K values
- Grade breaks and design grades
- Utility crossings

For Lane Plan (C006):
- Lane width and cross-section
- Edge of lane elevations vs existing
- Curb and gutter details
- Centreline alignment

### Phase 4: Merge + Categorize + Generate Questions

Single agent merges both research streams and does the intelligence work.

**For each correction item, cross-reference:**
1. What does the correction letter say? (Phase 1)
2. What does the Edmonton standard require? (Phase 3A)
3. What's currently on the plan sheet? (Phase 3B)

**Then categorize:**

| Category | Meaning | Example |
|----------|---------|---------|
| `AUTO_FIXABLE` | Resolve by adding notes, labels, arrows, dimensions — all information is already available | Missing ESC note, missing scale bar, missing flow arrows, labeling format errors |
| `NEEDS_CONSULTANT_INPUT` | Requires physical site data, survey data, or design decisions from the civil consultant | Existing invert elevations, actual pipe sizes, survey benchmarks, as-built conditions |
| `NEEDS_REDESIGN` | Requires P.Eng-stamped redesign — changing alignment, regrading, resizing pipes, recalculating SWM | K value too low, surface water flowing to neighbor, insufficient pipe cover, SWM capacity shortfall |
| `EPCOR_COORDINATION` | Requires EPCOR involvement — water/sanitary utility provider has separate requirements | Water service sizing, sanitary sampling MH requirements, connection point confirmation, EPCOR pre-approval |

**Then generate questions** for `NEEDS_CONSULTANT_INPUT` and some `NEEDS_REDESIGN`/`EPCOR_COORDINATION` items. Each question includes `research_context` explaining why it's being asked and what the standard requires. See `references/output-schemas.md` for the `consultant_questions.json` schema.

**Korean bilingual support:** When generating research_context and question text, also provide `_ko` variants using terminology from `glossary.md`. This helps Korean-speaking consultants understand the questions in their working language.

**Output files:** `corrections_categorized.json` + `consultant_questions.json`

**Return `consultant_questions.json` to the UI.** This skill is now complete. Stop here.

## Timing

| Phase | Time | Notes |
|-------|------|-------|
| Phase 1 | ~30 sec | Vision reading, 1-3 pages |
| Phase 2 | ~90 sec | PDF extraction + manifest building |
| Phase 3A | ~60 sec | Offline reference lookup |
| Phase 3B | ~60 sec | Reading 3-6 PNGs |
| Phase 4 | ~2 min | Merge + categorize + questions |
| **Total** | **~2-3 min** | **All offline — no network delay** |

## Important Notes

- **This skill stops after Phase 4.** Do NOT generate response letters, professional scopes, or any Phase 5 outputs. That is the job of `edmonton-civil-corrections-complete`.
- **All research is offline.** Do NOT use WebSearch or WebFetch. All Edmonton standards are in the `edmonton-civil` skill's reference files.
- **Research before questions.** Never generate consultant questions without first doing standards research. The research makes the questions specific and actionable.
- **Write high-quality research artifacts.** The `corrections_categorized.json` is the main handoff to the second skill. Every item must have its research context, standards findings, and sheet observations fully documented — because the second skill runs cold with no conversation history.
- **Sheet references are sacred.** Every sheet reference must come from `sheet-manifest.json`. Never guess.
- **Distinguish City vs EPCOR corrections.** Some items come from City of Edmonton departments (Drainage, Transportation) and some from EPCOR (water, sanitary sewer). The response letter may need separate sections.
- **Korean bilingual output.** Use `glossary.md` for Korean technical terms. Provide `_ko` fields for research_context and question_text to help Korean-speaking consultants.

## References

| File | Contents |
|------|----------|
| `references/output-schemas.md` | JSON schemas for all output files — corrections_parsed, consultant_questions, consultant_answers |
| `references/subagent-prompts.md` | Full prompts for Phase 3 subagents (standards researcher, sheet viewer) + Phase 4 merge prompt |
