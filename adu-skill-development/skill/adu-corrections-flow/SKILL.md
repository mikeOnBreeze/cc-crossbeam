---
name: adu-corrections-flow
description: Analyzes ADU permit corrections letters — the first half of the corrections pipeline. Reads the corrections letter, builds a sheet manifest from the plan binder, researches state and city codes, views referenced plan sheets, categorizes each correction item, and generates informed contractor questions. This skill should be used when a contractor receives a city corrections letter for an ADU permit. It coordinates three sub-skills (california-adu for state law, adu-city-research for city rules, adu-targeted-page-viewer for plan sheet navigation) to produce research artifacts and a UI-ready questions JSON. Does NOT generate the final response package — that is handled by adu-corrections-complete after the contractor answers questions. Triggers when a corrections letter PDF/PNG is provided along with the plan binder PDF.
---

# ADU Corrections Flow

## Overview

Analyze ADU permit corrections and generate informed contractor questions. This is the first skill in a two-skill pipeline:

1. **`adu-corrections-flow`** (this skill) — reads corrections, researches codes, categorizes items, generates questions
2. **`adu-corrections-complete`** (second skill) — takes contractor answers + these research artifacts, generates the final response package

This skill coordinates three sub-skills through a 4-phase workflow and stops after producing `contractor_questions.json`.

**Sub-skills used:**

| Skill | Role | When Used |
|-------|------|-----------|
| `california-adu` | State-level building codes (CRC, CBC, CPC, etc.) | Phase 3A — offline, 28 reference files |
| `adu-city-research` | City municipal code, standard details, IBs | Phase 3B (Mode 1: Discovery) + Phase 3.5 (Mode 2: Extraction) + optional Mode 3 (Browser Fallback) |
| `adu-targeted-page-viewer` | Sheet manifest + on-demand plan viewing | Phase 2 + Phase 3C — PDF extraction + vision |

**Key principle:** Research happens *before* contractor questions. Questions informed by actual code requirements are specific and answerable in seconds. Vague questions waste the contractor's time.

## Inputs

| Input | Format | Required |
|-------|--------|----------|
| Corrections letter | PDF or PNG (1-3 pages) | Yes |
| Plan binder | PDF (the full construction plan set) | Yes |
| City name | String (extracted from letter if not provided) | Auto-detected |
| Project address | String (extracted from letter if not provided) | Auto-detected |

## Outputs

All outputs are written to the session directory (e.g., `correction-01/`).

| Output | Format | Phase |
|--------|--------|-------|
| `corrections_parsed.json` | Structured correction items | Phase 1 |
| `sheet-manifest.json` | Sheet ID ↔ page number mapping | Phase 2 |
| `state_law_findings.json` | Per-code-section lookups | Phase 3A |
| `city_discovery.json` | Key URLs for the city's ADU pages | Phase 3B |
| `sheet_observations.json` | What's on each referenced plan sheet | Phase 3C |
| `city_research_findings.json` | Municipal code, standard details, IBs (extracted content) | Phase 3.5 |
| `corrections_categorized.json` | Items with categories + research context (the main handoff artifact) | Phase 4 |
| `contractor_questions.json` | UI-ready question form data | Phase 4 |

**This skill stops here.** The `contractor_questions.json` goes to the UI. After the contractor answers, the `adu-corrections-complete` skill takes the session directory + `contractor_answers.json` and generates the final response package (response letter, professional scope, corrections report, sheet annotations).

**Do NOT generate Phase 5 outputs** (response letter, professional scope, etc.). That is the job of `adu-corrections-complete`. Generating them here creates TODO-filled drafts that the second skill doesn't use.

## Workflow

### Phase 1 + Phase 2 (concurrent)

These two phases run simultaneously — they have no dependencies on each other.

#### Phase 1: Read Corrections Letter

Read the corrections letter visually (1-3 page PNG or PDF). No sub-skill needed — direct vision reading.

Extract each correction item as a structured object. Preserve the exact original wording. Identify all code references (CRC, CBC, ASCE, B&P Code, municipal code, etc.) and any sheet references.

Save as `corrections_parsed.json`. See `references/output-schemas.md` for the full schema.

#### Phase 2: Build Sheet Manifest

Run the `adu-targeted-page-viewer` skill workflow:

1. **Check first:** PNGs and title block crops may already be pre-extracted in `project-files/pages-png/` and `project-files/title-blocks/`. If they exist, skip extraction and go straight to reading the cover sheet.
2. If PNGs don't exist: Extract PDF pages to PNGs: `scripts/extract-pages.sh <binder.pdf> <output-dir>`
3. Read the cover sheet (page 1) for the sheet index
4. If page count differs from index count, crop and read title blocks to resolve
5. Save `sheet-manifest.json`

This takes ~90 seconds (or ~30 seconds if PNGs are pre-extracted) and produces the sheet-to-page mapping needed for Phase 3C.

### Phase 3 (concurrent — 3 subagents)

After Phases 1+2 complete, launch three parallel research subagents. Each is specialized by domain. All receive the parsed corrections from Phase 1.

See `references/subagent-prompts.md` for the full subagent prompts.

#### Subagent 3A: State Law Researcher

- **Skill context:** `california-adu` (28 reference files, all offline)
- **Input:** All correction items with their code references
- **Task:** Look up every referenced code section. Deduplicate — if multiple items cite the same section, look it up once and link to all relevant items.
- **Speed:** Fast — no network, just reading reference files (~60 sec)
- **Output:** Per-code-section findings with requirements, thresholds, ADU exceptions

#### Subagent 3B: City Discovery

- **Skill context:** `adu-city-research` — **Mode 1 (Discovery) only**
- **Input:** City name + list of topics extracted from corrections
- **Task:** Run WebSearch to find the city's key ADU-related URLs: ADU page, municipal code platform, standard detail PDFs, Information Bulletins, submittal requirements. Do NOT fetch page content — just find URLs.
- **Speed:** Fast — WebSearch only (~30 sec)
- **Output:** `city_discovery.json` — categorized URL list for extraction

#### Subagent 3C: Sheet Viewer

- **Skill context:** `adu-targeted-page-viewer`
- **Input:** Sheet manifest from Phase 2 + sheet references from corrections
- **Task:** Read only the plan sheets referenced by correction items (typically 5-8 out of 15-30 pages). For each, describe what is currently drawn in the area relevant to the correction.
- **Speed:** Fast — just reading PNGs (~60 sec)
- **Output:** Per-sheet observations: current state, what appears missing, location on sheet

### Phase 3.5: City Extraction

After Phase 3 completes (all three subagents return), launch city content extraction using the URLs discovered by Subagent 3B.

#### Single-Agent Mode (default)

One subagent runs `adu-city-research` **Mode 2 (Targeted Extraction)** against all discovered URLs.

- **Input:** `city_discovery.json` + correction topics
- **Task:** WebFetch each discovered URL, extract content relevant to corrections. Prioritize standard detail PDFs and municipal code sections.
- **Speed:** ~60-90 sec (depends on URL count)
- **Output:** `city_research_findings.json`

#### Fan-Out Mode (optional, for speed)

Split the discovered URLs across 2-3 subagents by topic:

- **Agent 1:** Municipal code URLs — local amendments, ADU ordinance, grading chapter
- **Agent 2:** Standard detail PDFs + Information Bulletin URLs
- **Agent 3:** ADU page + submittal requirements

Each agent runs `adu-city-research` Mode 2 with its URL subset. Orchestrator merges results into a single `city_research_findings.json`.

**When to use fan-out:** When Discovery returns 6+ URLs across multiple categories. For smaller cities with 2-3 URLs, single-agent is sufficient.

#### Browser Fallback (conditional)

If Mode 2 extraction has gaps (URLs that returned empty, PDFs that couldn't be read, sections not found), launch one subagent running `adu-city-research` **Mode 3 (Browser Fallback)** with Chrome MCP.

- **Input:** `extraction_gaps` from Mode 2 output
- **Task:** Navigate the city's website with browser automation to fill specific gaps
- **Speed:** ~2-3 min
- **Output:** Gap-filling additions merged into `city_research_findings.json`

**Only run Browser Fallback if there are actionable gaps.** Most cities' information is accessible via WebSearch + WebFetch. Browser Fallback is for the edge cases.

### Phase 4: Merge + Categorize + Generate Questions

Single agent merges all three research streams and does the intelligence work.

**For each correction item, cross-reference:**
1. What does the correction letter say? (Phase 1)
2. What does state law require? (Phase 3A)
3. Does the city add anything? (Phase 3.5)
4. What's currently on the plan sheet? (Phase 3C)

**Then categorize:**

| Category | Meaning | Example |
|----------|---------|---------|
| `AUTO_FIXABLE` | Resolve by adding notes, marking checklists, updating labels | Missing CalGreen item, governing codes list |
| `NEEDS_CONTRACTOR_INPUT` | Requires specific facts from the contractor | Sewer line size, finished grade elevations |
| `NEEDS_PROFESSIONAL` | Requires licensed professional work (designer, engineer, HERS rater) | Structural calcs, fire-rated assembly detail |

**Then generate questions** for `NEEDS_CONTRACTOR_INPUT` items. Each question includes `research_context` explaining why it's being asked and what the code requires. See `references/output-schemas.md` for the `contractor_questions.json` schema.

**Output files:** `corrections_categorized.json` + `contractor_questions.json`

**Return `contractor_questions.json` to the UI.** This skill is now complete. Stop here.

**What happens next:** The UI renders the questions. The contractor answers. Then the `adu-corrections-complete` skill takes the session directory + `contractor_answers.json` and generates the response package. That is a separate agent invocation — not a continuation of this one.

## Timing

| Phase | Time | Notes |
|-------|------|-------|
| Phase 1 | ~30 sec | Vision reading, 1-3 pages |
| Phase 2 | ~90 sec | PDF extraction + manifest building |
| Phase 3A | ~60 sec | Offline reference lookup |
| Phase 3B | ~30 sec | City URL discovery (WebSearch only) |
| Phase 3C | ~60 sec | Reading 5-8 PNGs |
| Phase 3.5 | ~60-90 sec | City content extraction (WebFetch) |
| Phase 3.5-fallback | ~2-3 min | Browser fallback (only if needed) |
| Phase 4 | ~2 min | Merge + categorize + questions |
| **Total (no fallback)** | **~4-5 min** | **Typical case** |
| **Total (with fallback)** | **~6-8 min** | **Difficult city website** |

## Important Notes

- **This skill stops after Phase 4.** Do NOT generate response letters, professional scopes, or any Phase 5 outputs. That is the job of `adu-corrections-complete`.
- **Research before questions.** Never generate contractor questions without first doing code research. The research makes the questions specific and actionable.
- **Write high-quality research artifacts.** The `corrections_categorized.json` is the main handoff to the second skill. Every item must have its research context, code findings, and sheet observations fully documented — because the second skill runs cold with no conversation history.
- **Sheet references are sacred.** Every sheet reference must come from `sheet-manifest.json`. Never guess.
- **This tool helps contractors comply, not litigate.** Focus on *how to fix it*, not whether the correction is valid. If the city says fix it, help the contractor fix it.
- **City research uses two passes.** Phase 3B (Discovery) runs fast via WebSearch in parallel with 3A/3C. Phase 3.5 (Extraction) uses WebFetch against discovered URLs. Browser Fallback only runs if WebFetch has gaps. This two-pass approach cuts city research from ~5 min to ~90 sec for most cities.

## References

| File | Contents |
|------|----------|
| `references/output-schemas.md` | JSON schemas for all output files — corrections_parsed, contractor_questions, contractor_answers |
| `references/subagent-prompts.md` | Full prompts for Phase 3 subagents (state law, city research, sheet viewer) + Phase 4 merge prompt |
