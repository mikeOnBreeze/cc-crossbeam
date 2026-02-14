# Output Schemas

JSON schemas for all outputs produced by the adu-corrections-flow pipeline.

## corrections_parsed.json (Phase 1)

Structured extraction of the corrections letter.

```json
{
  "project": {
    "address": "1232 N Jefferson St",
    "city": "Placentia",
    "state": "CA",
    "permit_number": "J25-434",
    "project_type": "New detached ADU, 600 sq ft",
    "review_round": "2nd Review",
    "reviewer": "John Smith, Plans Examiner",
    "date": "2026-01-15"
  },
  "items": [
    {
      "item_number": "5",
      "section": "Building Plan Check Comments",
      "description": "Projections within 5' of property line require fire-rated construction per CRC R302.1",
      "referenced_codes": ["CRC R302.1"],
      "referenced_sheets": ["elevations", "roof plan"],
      "original_wording": "Exact text from the correction letter — preserved verbatim",
      "severity_hint": "important"
    }
  ],
  "deadline": "2026-03-15",
  "total_items": 14,
  "code_references_summary": ["CRC R302.1", "ASCE 7-16 §30.11", "B&P 5536.1", "CPC Table 702.1"]
}
```

### Field Notes

| Field | Notes |
|-------|-------|
| `item_number` | String — corrections use various numbering (1, 2a, A.1, etc.) |
| `section` | The heading/section from the letter (e.g., "CalGreen Comments", "Structural") |
| `referenced_codes` | Extract ALL code citations — these drive Phase 3 research |
| `referenced_sheets` | Descriptive terms (not sheet IDs yet — those come from the manifest) |
| `original_wording` | Never paraphrase — keep exact text for the response letter |
| `severity_hint` | `critical` / `important` / `minor` — best guess from letter tone |
| `code_references_summary` | Deduplicated list of all codes cited across all items — used to scope Phase 3 research |

---

## contractor_questions.json (Phase 4)

UI-ready question data. Each correction item that needs contractor input gets a question group.

```json
{
  "project": {
    "address": "1232 N Jefferson St",
    "city": "Placentia",
    "permit_number": "J25-434"
  },
  "summary": {
    "total_items": 14,
    "auto_fixable": 5,
    "needs_contractor_input": 6,
    "needs_professional": 3
  },
  "question_groups": [
    {
      "correction_item_id": "4",
      "item_summary": "Utility connections — sewer, water, electrical adequacy",
      "category": "NEEDS_CONTRACTOR_INPUT",
      "research_context": "City of Placentia requires documentation of utility adequacy for increased plumbing load. CPC Table 702.1 governs fixture unit calculations. City standard detail available for sewer connection.",
      "affected_sheets": ["A1"],
      "questions": [
        {
          "question_index": 0,
          "question_id": "q_4_0",
          "question_text": "What is the size of the existing waste/sewer line?",
          "question_type": "choice",
          "options": ["3\" ABS", "4\" ABS", "4\" PVC", "6\" PVC"],
          "allow_other": true,
          "context": "CPC Table 702.1 allows 18 DFU on 3\" and 48 DFU on 4\" lines. ADU typically adds 10-15 DFU.",
          "required": true
        },
        {
          "question_index": 1,
          "question_id": "q_4_1",
          "question_text": "What is the current number of fixture units (DFU) on the existing waste line?",
          "question_type": "number",
          "unit": "DFU",
          "min": 0,
          "max": 100,
          "context": "Needed to calculate remaining capacity. If existing + ADU exceeds line capacity, an upgrade is required.",
          "required": true
        },
        {
          "question_index": 2,
          "question_id": "q_4_2",
          "question_text": "Describe the proposed sewer connection method",
          "question_type": "text",
          "placeholder": "e.g., Wye fitting, 15' from main house cleanout",
          "context": "City of Placentia has a standard sewer connection detail. Include fitting type, distance from main house, and cleanout location.",
          "required": true
        }
      ]
    },
    {
      "correction_item_id": "11",
      "item_summary": "Drainage — finished grades and slope direction",
      "category": "NEEDS_CONTRACTOR_INPUT",
      "research_context": "City grading ordinance requires minimum 2% slope away from foundation for first 10'. Finished grades at all corners needed for grading plan.",
      "affected_sheets": ["A1"],
      "questions": [
        {
          "question_index": 0,
          "question_id": "q_11_0",
          "question_text": "What are the finished grades at each corner of the ADU?",
          "question_type": "measurement",
          "unit": "feet",
          "placeholder": "e.g., 102.35",
          "context": "Enter elevation values for NE, NW, SE, SW corners. These establish drainage direction on the grading plan.",
          "required": true,
          "sub_fields": ["NE corner", "NW corner", "SE corner", "SW corner"]
        }
      ]
    }
  ],
  "auto_fixable_items": [
    {
      "correction_item_id": "2",
      "item_summary": "Add Placentia Municipal Code to governing codes on cover sheet",
      "auto_fix_description": "Add 'City of Placentia Municipal Code, Title 20 — Building Regulations' to the governing codes list on Sheet CS",
      "affected_sheets": ["CS"],
      "confidence": "high"
    }
  ],
  "professional_items": [
    {
      "correction_item_id": "5",
      "item_summary": "Fire-rated soffit detail — patio within 5' of property line",
      "professional_needed": "Designer / Architect",
      "scope_summary": "Draw fire-rated assembly detail for patio soffit per CRC R302.1. Replace unrated wood framing with 1-hour rated assembly (5/8\" Type X gypsum on underside).",
      "affected_sheets": ["A3"],
      "contractor_question": {
        "question_id": "q_5_0",
        "question_text": "Is the existing patio soffit exposed wood framing or does it have any existing sheathing?",
        "question_type": "choice",
        "options": ["Exposed wood framing", "Has existing sheathing/plywood", "Already has gypsum board"],
        "allow_other": true,
        "context": "Helps the designer determine whether to detail a new assembly or modify the existing one.",
        "required": false
      }
    }
  ]
}
```

### Frontend Rendering Notes

The `contractor_questions.json` is designed for direct consumption by a Next.js frontend:

- **`question_groups`** — Render as collapsible card sections, one per correction item
- **`question_id`** — Stable ID for form state management (`q_{item}_{index}`)
- **`allow_other`** — When true, add an "Other" option with a free-text input
- **`sub_fields`** — When present, render multiple labeled inputs (e.g., 4 grade elevation fields)
- **`placeholder`** — Display as input placeholder text
- **`min` / `max`** — Use for input validation on number fields
- **`auto_fixable_items`** — Display as read-only info cards ("These will be fixed automatically")
- **`professional_items`** — Display with professional badge and optional question
- **`summary`** — Use for progress indicators (5 auto / 6 need input / 3 need pro)

### Component Mapping

| `question_type` | Component | Props |
|-----------------|-----------|-------|
| `text` | `<Textarea>` | `placeholder` |
| `number` | `<Input type="number">` | `min`, `max`, `unit` as suffix label |
| `choice` | `<RadioGroup>` | `options` + conditional "Other" `<Input>` |
| `multi_choice` | `<CheckboxGroup>` | `options` array |
| `measurement` | `<Input type="number">` | `unit` as suffix, `sub_fields` for multiple |
| `yes_no` | `<Switch>` or 2-option `<RadioGroup>` | — |

---

## contractor_answers.json (UI → Phase 5)

Returned from the frontend after the contractor fills in the form.

```json
{
  "project": {
    "address": "1232 N Jefferson St",
    "permit_number": "J25-434"
  },
  "answers": {
    "4": {
      "0": "4\" ABS",
      "1": 18,
      "2": "Wye fitting, 15' from main house cleanout"
    },
    "11": {
      "0": {
        "NE corner": 102.35,
        "NW corner": 102.45,
        "SE corner": 102.15,
        "SW corner": 102.25
      }
    },
    "5": {
      "0": "Exposed wood framing"
    }
  },
  "skipped": ["7", "9"]
}
```

### Field Notes

- **`answers`** — Keyed by `correction_item_id`, then by `question_index` (as string)
- **Values** — String for text/choice, number for number/measurement, object for sub_fields
- **`skipped`** — Item IDs where contractor selected "Don't know" or left blank
- Skipped items become `[TODO]` markers in Phase 5 outputs

---

## sheet_annotations.json (Phase 5)

Per-sheet breakdown of what needs to change and where on the construction plans.

```json
{
  "project": {
    "address": "1232 N Jefferson St",
    "permit_number": "J25-434"
  },
  "revision_number": 1,
  "revision_date": "2026-02-11",
  "annotations": [
    {
      "sheet_id": "A3",
      "page_number": 7,
      "file": "page-07.png",
      "sheet_title": "Elevations & Proposed Roof Plan",
      "actions": [
        {
          "item_number": "5",
          "area": "South elevation, patio soffit — Detail 2, lower-right quadrant",
          "action": "Replace unrated soffit with 1-hour fire-rated assembly detail",
          "specification": "5/8\" Type X gypsum board on underside of soffit framing per CRC R302.1 Table R302.1(1)",
          "professional": "Designer",
          "status": "SCOPED",
          "revision_note": "REV 1: Added fire-rated soffit detail per correction Item 5"
        }
      ]
    },
    {
      "sheet_id": "CS",
      "page_number": 1,
      "file": "page-01.png",
      "sheet_title": "Cover Sheet",
      "actions": [
        {
          "item_number": "2",
          "area": "Governing codes section, top-left area",
          "action": "Add City of Placentia Municipal Code to governing codes list",
          "specification": "Title 20 — Building Regulations (2022 Edition)",
          "professional": null,
          "status": "AUTO_FIXABLE",
          "revision_note": "REV 1: Added Placentia Municipal Code per correction Item 2"
        }
      ]
    },
    {
      "sheet_id": "A1",
      "page_number": 5,
      "file": "page-05.png",
      "sheet_title": "Site Plan",
      "actions": [
        {
          "item_number": "4",
          "area": "Utility connection area, between main house and ADU",
          "action": "Add sewer connection detail per city standard detail",
          "specification": "4\" ABS wye fitting, 15' from main house cleanout. Show cleanout location, pipe sizes, and connection method.",
          "professional": "Designer",
          "status": "COMPLETE",
          "revision_note": "REV 1: Added utility connections per correction Item 4"
        },
        {
          "item_number": "4",
          "area": "Utility connection area",
          "action": "Add water service connection",
          "specification": null,
          "professional": "Designer",
          "status": "TODO",
          "revision_note": null
        }
      ]
    }
  ],
  "revision_table": [
    {"rev": 1, "date": "2026-02-11", "description": "Added fire-rated soffit detail", "sheet": "A3", "item": "5"},
    {"rev": 1, "date": "2026-02-11", "description": "Added Placentia Municipal Code to governing codes", "sheet": "CS", "item": "2"},
    {"rev": 1, "date": "2026-02-11", "description": "Added utility connections", "sheet": "A1", "item": "4"}
  ]
}
```

### Status Values

| Status | Meaning |
|--------|---------|
| `AUTO_FIXABLE` | Can be fixed without additional input |
| `COMPLETE` | Contractor provided all needed info, action fully specified |
| `SCOPED` | Professional work needed, scope defined but work not done |
| `TODO` | Missing contractor input — action cannot be fully specified yet |
| `PARTIAL` | Some info provided, some still missing |

---

## corrections_categorized.json (Phase 4)

Internal working file that merges research findings with categorizations. Used as input to Phase 5.

```json
{
  "items": [
    {
      "item_number": "5",
      "original_wording": "Projections within 5' of property line...",
      "category": "NEEDS_PROFESSIONAL",
      "professional": "Designer",
      "state_law_finding": {
        "code": "CRC R302.1",
        "requirement": "1-hour fire-rated construction within 5' of property line",
        "adu_exceptions": "None for fire separation"
      },
      "city_finding": {
        "local_amendment": false,
        "notes": "No Placentia-specific amendment — state code applies"
      },
      "sheet_observation": {
        "sheet_id": "A3",
        "current_state": "Unrated wood soffit shown on south elevation",
        "what_to_fix": "Replace with fire-rated assembly detail"
      },
      "affected_sheets": ["A3"],
      "research_context": "CRC R302.1 Table R302.1(1) requires 1-hour fire-rated construction for projections within 5' of property line. Currently shows unrated wood soffit on Sheet A3 south elevation."
    }
  ]
}
```
