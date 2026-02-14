---
name: adu-corrections-complete
description: Generates the final response package for ADU permit corrections — the second half of the corrections pipeline. This skill should be used after adu-corrections-flow has produced its analysis files and the contractor has answered questions. It reads the research artifacts (categorized corrections, state law findings, city research, sheet observations) plus contractor answers, and produces four deliverables — a response letter to the building department, a professional scope of work, a corrections status report, and per-sheet annotations. Triggers when a session directory contains corrections analysis files and a contractor_answers.json has been provided. This skill runs as a cold start — it has no conversation history from the analysis phase and relies entirely on the file artifacts.
---

# ADU Corrections Complete

## Overview

Generate the final response package for ADU permit corrections. This is the second skill in a two-skill pipeline:

1. **`adu-corrections-flow`** (Phase 1) — reads the corrections letter, builds the sheet manifest, researches state and city codes, views plan sheets, categorizes corrections, generates contractor questions. Produces research artifacts in a session directory.
2. **`adu-corrections-complete`** (this skill, Phase 2) — reads those research artifacts + contractor answers, generates all deliverables.

**This skill runs as a cold start.** It has no conversation history from Phase 1. Everything it needs is in the session directory files. The quality of its output depends entirely on the quality of those files — especially `corrections_categorized.json`, which contains the merged research findings.

## Input: Session Directory

The session directory (e.g., `correction-01/`) must contain these files from Phase 1:

| File | What It Contains | How This Skill Uses It |
|------|-----------------|----------------------|
| `corrections_parsed.json` | Raw correction items with original wording | Original wording preserved in response letter |
| `sheet-manifest.json` | Sheet ID ↔ page number mapping | Sheet references in all outputs |
| `state_law_findings.json` | Per-code-section lookups (CRC, CBC, ASCE, etc.) | Code citations in response letter |
| `city_research_findings.json` | Municipal code, standard details, IBs | City-specific references in outputs |
| `sheet_observations.json` | What's currently on each plan sheet | Informs what needs to change |
| `corrections_categorized.json` | **The main input.** Each item with category, research context, state findings, city findings, sheet observations, affected sheets | Drives all output generation |
| `contractor_questions.json` | What questions were asked | Maps answer keys to correction items |
| `contractor_answers.json` | **Contractor's responses** | The new input that completes the picture |

### Reading Order

Read files in this order to build context efficiently:

1. **`corrections_categorized.json`** — read first, it's the backbone. Each item has its category, research context, and cross-referenced findings already merged.
2. **`contractor_answers.json`** — read second, map answers to items.
3. **`sheet-manifest.json`** — read third, for accurate sheet references.
4. **`corrections_parsed.json`** — read fourth, for original wording to preserve in the response letter.
5. Other files only if `corrections_categorized.json` doesn't have enough detail on a specific item — it usually does.

## Output: Four Deliverables

### 1. `response_letter.md`

Professional letter from the contractor to the building department, addressing every correction item.

**Structure:**
```
# Response to Plan Check Comments
## [Review Round] — [Address]
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
- Address EVERY item — do not skip any, even procedural ones (Items 1, 2)
- Preserve the original correction wording — quote it or reference it clearly
- For items with contractor answers: incorporate the answer with code justification
  - Example: "Existing 4" ABS waste line serves 22 DFU. ADU adds 12 DFU. Combined 34 DFU is within the 216 DFU capacity of a 4" drain per CPC Table 702.1."
- For items without answers (skipped): mark as `[TODO: description of what's needed]`
- For auto-fixable items: state what was changed and on which sheet
- For professional items: state the scope and who will do the work
- Reference specific sheets from the manifest — never guess
- End with a summary table of sheet revisions
- Tone: professional, specific, respectful. This goes to a city plan checker.

### 2. `professional_scope.md`

Work breakdown grouped by professional, with enough detail that the designer/engineer can execute without re-reading the corrections letter.

**Structure:**
```
# Professional Scope of Work
## [Address] — [Permit Number]

---

## [Professional Name / Firm]
**Sheets:** [list]

### Required Actions
| Item | Sheet | Action | Contractor Input | Status |

### Key Specifications
[Detailed specs from contractor answers — dimensions, materials, elevations]

### Deliverables
- [ ] checklist items

---

## Per-Sheet Action Summary
| Sheet | Actions | Professional | Status |
```

**Rules:**
- Group by professional (Designer, Structural Engineer, HERS Rater, etc.)
- Extract professional names from the plan sheets if available (title block info in sheet observations)
- Include a **Key Specifications** section with contractor-provided details formatted for the designer
  - DFU justification note ready to paste onto Sheet A1
  - Grade elevation table with drops from finished floor
  - Patio dimensions for the structural engineer
- Mark status: READY (can proceed), PENDING (waiting on other items), FINAL STEP (stamps/signatures last)
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

### Key Findings from Contractor Answers
[Important conclusions — capacity is fine, drainage works, etc.]

### Action Items Checklist
#### [Role]
- [ ] / [x] checklist items

### Critical Path
[Dependency diagram showing what blocks what]
```

**Rules:**
- Status values: COMPLETE (fully resolved), SCOPED (professional work defined), PENDING (waiting on other items or final actions), TODO (missing contractor input)
- The "Key Findings" section is important — it translates raw answers into conclusions
  - "Sewer capacity is fine — 34 DFU on a 216 DFU line"
  - "Water meter adequate — 3/4" for SFR + 600 sq ft ADU"
  - "Drainage works naturally — property slopes SW"
- Mark completed contractor items with [x] in the checklist
- Show the critical path — what can proceed in parallel, what's sequential

### 4. `sheet_annotations.json`

Per-sheet breakdown of what needs to change, structured for potential future PDF markup.

**Schema:**
```json
{
  "project": { "address": "", "permit_number": "" },
  "revision_number": 1,
  "revision_date": "YYYY-MM-DD",
  "annotations": [
    {
      "sheet_id": "A3",
      "page_number": 7,
      "file": "page-07.png",
      "sheet_title": "Elevations & Proposed Roof Plan",
      "actions": [
        {
          "item_number": "14",
          "area": "South elevation, patio soffit — Detail 2 area",
          "action": "New fire-rated assembly detail replacing Detail 2/A3",
          "specification": "5/8\" Type X gypsum on underside of 2x rafter framing",
          "professional": "Designer",
          "status": "SCOPED",
          "revision_note": "REV 1: New fire-rated soffit detail per Item 14"
        }
      ]
    }
  ],
  "revision_table": [
    { "rev": 1, "date": "", "description": "", "sheet": "", "item": "" }
  ]
}
```

**Rules:**
- Every annotation must reference a valid sheet from `sheet-manifest.json`
- Include revision_note text for each action — ready for a revision table
- Status follows the same values as the corrections report
- The revision_table at the bottom collects all revision entries

## Handling Missing Answers

When `contractor_answers.json` has items in the `skipped` array or questions left unanswered:

- **Response letter:** Insert `[TODO: specific description]` at the exact gap
- **Professional scope:** Show "Awaiting contractor input" with the specific missing info listed
- **Corrections report:** Mark status as TODO or PARTIAL
- **Sheet annotations:** Set status to "TODO", set specification to null

Never block on missing answers. A partial response package is still valuable — the professional can start on everything that IS answered.

## Important Notes

- **This skill has no memory of Phase 1.** Do not assume any context beyond what's in the files. Read the files carefully.
- **`corrections_categorized.json` is the source of truth.** It has the merged research — state law findings, city findings, sheet observations — all cross-referenced per item. Trust it.
- **Preserve original wording.** The `corrections_parsed.json` has the exact text from the corrections letter. Use it in the response letter — the plan checker needs to see their language referenced.
- **Sheet references are sacred.** Every sheet reference must come from `sheet-manifest.json`. The manifest is the ground truth for which sheet ID maps to which page.
- **Professional scope should be actionable.** A designer reading the scope should be able to sit down and start drawing without re-reading the corrections letter. Include specific dimensions, materials, code references.
- **Contractor answers become specifications.** "4 inch ABS" in the answer becomes "4\" ABS" in the professional scope with a ready-to-paste note for the plan. "102.85" becomes a row in a grade table with the calculated drop from finished floor.
- **This tool helps contractors comply, not litigate.** If the city says fix it, help fix it.
