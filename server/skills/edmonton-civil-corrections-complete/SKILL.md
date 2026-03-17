---
name: edmonton-civil-corrections-complete
description: Generates the final response package for Edmonton civil engineering permit corrections — the second half of the corrections pipeline. This skill should be used after edmonton-civil-corrections-flow has produced its analysis files and the consultant has answered questions. It reads the research artifacts (categorized corrections, standards findings, sheet observations) plus consultant answers, and produces four deliverables — a response letter to the City of Edmonton / EPCOR, a professional scope of work, a corrections status report, and per-sheet annotations. Triggers when a session directory contains corrections analysis files and a consultant_answers.json has been provided. This skill runs as a cold start — it has no conversation history from the analysis phase and relies entirely on the file artifacts.
---

# Edmonton Civil Corrections Complete

## Overview

Generate the final response package for Edmonton civil engineering permit corrections. This is the second skill in a two-skill pipeline:

1. **`edmonton-civil-corrections-flow`** (Phase 1) — reads the corrections letter, builds the sheet manifest, researches Edmonton standards, views plan sheets, categorizes corrections, generates consultant questions. Produces research artifacts in a session directory.
2. **`edmonton-civil-corrections-complete`** (this skill, Phase 2) — reads those research artifacts + consultant answers, generates all deliverables.

**This skill runs as a cold start.** It has no conversation history from Phase 1. Everything it needs is in the session directory files. The quality of its output depends entirely on the quality of those files — especially `corrections_categorized.json`, which contains the merged research findings.

## Input: Session Directory

The session directory (e.g., `correction-01/`) must contain these files from Phase 1:

| File | What It Contains | How This Skill Uses It |
|------|-----------------|----------------------|
| `corrections_parsed.json` | Raw correction items with original wording | Original wording preserved in response letter |
| `sheet-manifest.json` | Sheet ID ↔ page number mapping | Sheet references in all outputs |
| `standards_findings.json` | Per-standard lookups from Edmonton references | Standard citations in response letter |
| `sheet_observations.json` | What's currently on each plan sheet | Informs what needs to change |
| `corrections_categorized.json` | **The main input.** Each item with category, research context, standards findings, sheet observations, affected sheets | Drives all output generation |
| `consultant_questions.json` | What questions were asked | Maps answer keys to correction items |
| `consultant_answers.json` | **Consultant's responses** | The new input that completes the picture |

### Reading Order

Read files in this order to build context efficiently:

1. **`corrections_categorized.json`** — read first, it's the backbone. Each item has its category, research context, and cross-referenced findings already merged.
2. **`consultant_answers.json`** — read second, map answers to items.
3. **`sheet-manifest.json`** — read third, for accurate sheet references.
4. **`corrections_parsed.json`** — read fourth, for original wording to preserve in the response letter.
5. Other files only if `corrections_categorized.json` doesn't have enough detail on a specific item — it usually does.

## Output: Four Deliverables

### 1. `response_letter.md`

Professional letter from the consultant to the City of Edmonton / EPCOR reviewer, addressing every correction item.

**Structure:**
```
# Response to Review Comments
## [Review Round] — [Project Address]
### [Permit Number] | [Project Type]

Date / To / From / Re header

---

### [Section from original letter]

**Item [#] — [Summary]**
[Response addressing the correction with specific references]

...

---

**Summary of Sheet Revisions:**
| Sheet | Changes |
```

**Rules:**
- Address EVERY item — do not skip any, even procedural ones
- Preserve the original correction wording — quote it or reference it clearly
- For items with consultant answers: incorporate the answer with standard justification
  - Example: "Confirmed invert elevation at sampling MH is 652.35m. Over 8.5m pipe length, this provides 0.20m fall (2.35% slope), exceeding the minimum 2% requirement per Edmonton DCS."
- For items without answers (skipped): mark as `[TODO: description of what's needed]`
- For auto-fixable items: state what was changed and on which sheet
- For redesign items: state the scope and that P.Eng review is in progress
- For EPCOR items: state the coordination status and expected timeline
- Reference specific sheets from the manifest — never guess
- End with a summary table of sheet revisions
- Tone: professional, specific, respectful. This goes to a City of Edmonton plan reviewer.
- **If corrections came from both City and EPCOR:** Organize response by issuing authority, with separate sections or clearly labeled subsections.

### 2. `professional_scope.md`

Work breakdown grouped by engineering discipline, with enough detail that the P.Eng can execute without re-reading the corrections letter.

**Structure:**
```
# Professional Scope of Work
## [Address] — [Permit Number]

---

## [Discipline: Grading / Servicing / Lane Design / Survey]
**Sheets:** [list]

### Required Actions
| Item | Sheet | Action | Consultant Input | Status |

### Key Specifications
[Detailed specs from consultant answers — elevations, slopes, pipe sizes]

### Deliverables
- [ ] checklist items

---

## Per-Sheet Action Summary
| Sheet | Actions | Discipline | Status |
```

**Rules:**
- Group by discipline:
  - **Grading**: lot grading, surface water, retaining walls
  - **Servicing**: sanitary, storm, water connections, SWM
  - **Lane Design**: alignment, vertical curves, cross-sections
  - **Survey**: benchmarks, as-built verification
- Include a **Key Specifications** section with consultant-provided details formatted for the engineer
  - Invert elevations formatted as a table
  - Slope calculations with confirmation of compliance
  - Pipe sizing verification
- Mark status: READY (can proceed), PENDING (waiting on other items), EPCOR_PENDING (awaiting EPCOR), FINAL STEP (stamps/signatures last)
- The per-sheet action summary at the bottom is the quick-reference — one row per sheet showing all work

### 3. `corrections_report.md`

Status dashboard with checklist — the project manager's view.

**Structure:**
```
# Corrections Report
## [Address] — [Permit Number]

### Summary
| Category | Count | Items |

### Item Status Table
| Item | Section | Category | Status | Notes |

### Key Findings from Consultant Answers
[Important conclusions — slope is achievable, drainage works, EPCOR approved, etc.]

### Action Items Checklist
#### [Role / Discipline]
- [ ] / [x] checklist items

### Critical Path
[Dependency diagram showing what blocks what]
```

**Rules:**
- Status values: COMPLETE (fully resolved), SCOPED (P.Eng work defined), PENDING (waiting), TODO (missing input), EPCOR_PENDING (awaiting EPCOR)
- The "Key Findings" section is important — it translates raw answers into conclusions
  - "Sampling MH slope achievable — 2.35% over 8.5m at confirmed INV 652.35m"
  - "EPCOR confirmed 25mm water service adequate for proposed density"
  - "Grading revision needed — existing CB in lane can receive redirected flow"
- Mark completed items with [x] in the checklist
- Show the critical path — what can proceed in parallel, what's sequential (e.g., EPCOR approval blocks permit resubmission)

### 4. `sheet_annotations.json`

Per-sheet breakdown of what needs to change, structured for potential future PDF markup.

**Schema:** See `edmonton-civil-corrections-flow/references/output-schemas.md` for the full `sheet_annotations.json` schema.

**Rules:**
- Every annotation must reference a valid sheet from `sheet-manifest.json`
- Include revision_note text for each action — ready for a revision table
- Status follows the same values as the corrections report
- The revision_table at the bottom collects all revision entries
- Use Edmonton civil sheet IDs (C001, C003, C004, etc.)

## Handling Missing Answers

When `consultant_answers.json` has items in the `skipped` array or questions left unanswered:

- **Response letter:** Insert `[TODO: specific description]` at the exact gap
- **Professional scope:** Show "Awaiting consultant input" with the specific missing info listed
- **Corrections report:** Mark status as TODO or PARTIAL
- **Sheet annotations:** Set status to "TODO", set specification to null

Never block on missing answers. A partial response package is still valuable — the engineer can start on everything that IS answered.

## Korean Bilingual Support

When the consultant's language context suggests Korean:

- Use Korean technical terms from `glossary.md` in parentheses after English terms
  - Example: "sampling manhole (샘플링 맨홀)" on first use
- The `corrections_categorized.json` already contains `research_context_ko` fields — use these when generating Korean-language summaries
- The response letter should remain in English (it goes to the City), but the professional scope and corrections report can include Korean annotations if helpful

## Important Notes

- **This skill has no memory of Phase 1.** Do not assume any context beyond what's in the files. Read the files carefully.
- **`corrections_categorized.json` is the source of truth.** It has the merged research — standards findings, sheet observations — all cross-referenced per item. Trust it.
- **Preserve original wording.** The `corrections_parsed.json` has the exact text from the corrections letter. Use it in the response letter — the plan reviewer needs to see their language referenced.
- **Sheet references are sacred.** Every sheet reference must come from `sheet-manifest.json`. The manifest is the ground truth for which sheet ID maps to which page.
- **Professional scope should be actionable.** A P.Eng reading the scope should be able to sit down and start working without re-reading the corrections letter. Include specific elevations, slopes, calculations, code references.
- **Consultant answers become specifications.** "652.35" in the answer becomes a row in an invert table with calculated slope. "Existing CB within 15m" becomes a specific design instruction for grading revision.
- **Distinguish City vs EPCOR.** If corrections came from both authorities, the response letter may need separate sections. EPCOR items may have different timelines (EPCOR approval often takes 2-4 weeks).
- **This tool helps consultants comply.** Focus on *how to fix it*, not whether the correction is valid. If the City says fix it, help fix it.
