# Output Schemas

JSON schemas for all outputs produced by the edmonton-civil-corrections-flow pipeline.

## corrections_parsed.json (Phase 1)

Structured extraction of the corrections letter.

```json
{
  "project": {
    "address": "12345 - 100 Avenue NW",
    "subdivision_name": "Maple Ridge Phase 3",
    "city": "Edmonton",
    "province": "AB",
    "permit_number": "DP-2025-1234",
    "project_type": "Infill lot grading + on-site servicing",
    "review_round": "2nd Review",
    "reviewer": "Jane Park, P.Eng — Drainage Planning",
    "date": "2026-01-15"
  },
  "items": [
    {
      "item_number": "3",
      "section": "Grading Plan Comments",
      "description": "Surface water from lane directed onto lot 5. Revise grading to prevent.",
      "referenced_standards": ["DCS Vol 1 Sec 3.3.2", "Drainage Bylaw 18100"],
      "referenced_sheets": ["grading plan", "C004"],
      "original_wording": "Exact text from the correction letter — preserved verbatim",
      "severity_hint": "critical",
      "infrastructure_type": "grading",
      "issuing_authority": "City of Edmonton"
    }
  ],
  "issuing_authority": "City of Edmonton",
  "deadline": "2026-03-01",
  "total_items": 8,
  "standards_references_summary": ["DCS Vol 1 Sec 3.3.2", "Drainage Bylaw 18100", "EPCOR WA-005-010", "Lot Grading Guidelines"]
}
```

### Field Notes

| Field | Notes |
|-------|-------|
| `item_number` | String — corrections use various numbering (1, 2a, A.1, etc.) |
| `section` | The heading/section from the letter (e.g., "Grading Plan Comments", "Servicing Comments") |
| `referenced_standards` | Extract ALL standard citations — these drive Phase 3A research |
| `referenced_sheets` | Descriptive terms (not sheet IDs yet — those come from the manifest) |
| `original_wording` | Never paraphrase — keep exact text for the response letter |
| `severity_hint` | `critical` / `important` / `minor` — best guess from letter tone |
| `infrastructure_type` | `grading` / `sanitary` / `storm` / `water` / `lane` / `general` — drives reference file routing |
| `issuing_authority` | `City of Edmonton` or `EPCOR` — determines response letter addressee |
| `standards_references_summary` | Deduplicated list of all standards cited across all items — used to scope Phase 3A research |

---

## consultant_questions.json (Phase 4)

UI-ready question data. Each correction item that needs consultant input gets a question group.

```json
{
  "project": {
    "address": "12345 - 100 Avenue NW",
    "subdivision_name": "Maple Ridge Phase 3",
    "permit_number": "DP-2025-1234"
  },
  "summary": {
    "total_items": 12,
    "auto_fixable": 4,
    "needs_consultant_input": 5,
    "needs_redesign": 2,
    "epcor_coordination": 1
  },
  "question_groups": [
    {
      "correction_item_id": "7",
      "item_summary": "Sampling manhole slope does not meet minimum 2% for sanitary",
      "category": "NEEDS_CONSULTANT_INPUT",
      "research_context": "Edmonton DCS requires sampling manholes on sanitary service connections at minimum 2% slope. Current plan shows 1.5% between building connection and sampling MH. Need confirmed invert elevations to verify if 2% slope can be achieved with current alignment.",
      "research_context_ko": "에드먼턴 DCS 기준: 오수 서비스 연결 샘플링 맨홀 최소 경사 2%. 현재 도면에 건물 연결부~샘플링 MH 구간 1.5% 표시. 현 정렬로 2% 경사 달성 가능 여부 확인 위해 관저고 확인 필요.",
      "affected_sheets": ["C003"],
      "questions": [
        {
          "question_index": 0,
          "question_id": "q_7_0",
          "question_text": "What is the confirmed invert elevation at the sampling manhole?",
          "question_text_ko": "샘플링 맨홀의 확인된 관저고(INV)는?",
          "question_type": "measurement",
          "unit": "m",
          "context": "Need to verify if 2% minimum slope can be achieved between building connection and sampling MH.",
          "required": true
        },
        {
          "question_index": 1,
          "question_id": "q_7_1",
          "question_text": "What is the pipe length from the building to the sampling MH?",
          "question_text_ko": "건물에서 샘플링 MH까지의 관 길이는?",
          "question_type": "measurement",
          "unit": "m",
          "context": "Combined with invert, this determines if 2% slope is achievable. If not, the alignment may need revision.",
          "required": true
        }
      ]
    },
    {
      "correction_item_id": "4",
      "item_summary": "Surface water directed onto adjacent property — revise grading",
      "category": "NEEDS_REDESIGN",
      "research_context": "Edmonton core grading principle: surface water from public infrastructure must NOT flow onto private property. Current grading plan shows flow arrows directing lane water toward lot 5 rear property line. Requires regrading to redirect flow to catch basin or swale within R/W.",
      "research_context_ko": "에드먼턴 핵심 배수 원칙: 공공 인프라의 표면수는 사유지로 흐를 수 없음. 현재 정지 계획에서 레인 우수가 로트 5 후면 경계선으로 향하는 유수 화살표 확인. 집수정 또는 R/W 내 스웨일로 유수 방향 수정 필요.",
      "affected_sheets": ["C004", "C007"],
      "questions": [
        {
          "question_index": 0,
          "question_id": "q_4_0",
          "question_text": "Is there an existing catch basin or swale in the lane R/W near lot 5 that could receive redirected flow?",
          "question_text_ko": "로트 5 인근 레인 R/W 내에 유수를 받을 수 있는 기존 집수정 또는 스웨일이 있는가?",
          "question_type": "choice",
          "options": ["Yes — existing CB within 15m", "Yes — existing swale", "No — need new drainage infrastructure", "Unknown — need field verification"],
          "allow_other": true,
          "context": "This determines whether a simple grading revision is sufficient or if new drainage infrastructure is required.",
          "required": true
        }
      ]
    }
  ],
  "auto_fixable_items": [
    {
      "correction_item_id": "1",
      "item_summary": "ESC general notes missing from C015 sheet",
      "auto_fix_description": "Add standard ESC general notes and spill control/silt fence notes to Sheet C015 per checklist-onsite.md C015 requirements",
      "affected_sheets": ["C015"],
      "confidence": "high"
    },
    {
      "correction_item_id": "2",
      "item_summary": "Missing flow direction arrows on grading plan",
      "auto_fix_description": "Add surface water flow direction arrows to all areas of grading plan (C004). Flow directions are derivable from existing spot elevations.",
      "affected_sheets": ["C004"],
      "confidence": "high"
    }
  ],
  "redesign_items": [
    {
      "correction_item_id": "4",
      "item_summary": "Surface water directed onto adjacent property — revise grading",
      "professional_needed": "P.Eng (Grading)",
      "scope_summary": "Redesign grading between lane and lot 5 to redirect surface water to R/W drainage. Requires revised spot elevations, swale design or CB connection, and updated flow arrows on C004 and C007.",
      "affected_sheets": ["C004", "C007"],
      "consultant_question": {
        "question_id": "q_4_0",
        "question_text": "Is there an existing CB or swale near lot 5?",
        "required": true
      }
    }
  ],
  "epcor_items": [
    {
      "correction_item_id": "10",
      "item_summary": "EPCOR requires confirmation of water service size for proposed density",
      "epcor_requirement": "Water service sizing must accommodate proposed number of units. EPCOR pre-approval required before City permit issuance.",
      "scope_summary": "Submit water service sizing calculation to EPCOR. Await EPCOR confirmation letter before resubmitting to City.",
      "affected_sheets": ["C003"],
      "consultant_question": {
        "question_id": "q_10_0",
        "question_text": "Has EPCOR been contacted regarding water service sizing? If yes, what was their response?",
        "question_text_ko": "EPCOR에 급수관 크기 관련 연락했는지? 했다면 회신 내용은?",
        "required": true
      }
    }
  ]
}
```

### Frontend Rendering Notes

The `consultant_questions.json` is designed for direct consumption by a Next.js frontend:

- **`question_groups`** — Render as collapsible card sections, one per correction item
- **`question_id`** — Stable ID for form state management (`q_{item}_{index}`)
- **`allow_other`** — When true, add an "Other" option with a free-text input
- **`sub_fields`** — When present, render multiple labeled inputs (e.g., elevation fields per corner)
- **`placeholder`** — Display as input placeholder text
- **`min` / `max`** — Use for input validation on number fields
- **`auto_fixable_items`** — Display as read-only info cards ("These will be fixed automatically")
- **`redesign_items`** — Display with P.Eng badge and scope description
- **`epcor_items`** — Display with EPCOR badge and coordination requirement
- **`summary`** — Use for progress indicators (4 auto / 5 need input / 2 redesign / 1 EPCOR)
- **`_ko` fields** — Display Korean translation alongside English when user's language is Korean

### Component Mapping

| `question_type` | Component | Props |
|-----------------|-----------|-------|
| `text` | `<Textarea>` | `placeholder` |
| `number` | `<Input type="number">` | `min`, `max`, `unit` as suffix label |
| `choice` | `<RadioGroup>` | `options` + conditional "Other" `<Input>` |
| `multi_choice` | `<CheckboxGroup>` | `options` array |
| `measurement` | `<Input type="number">` | `unit` as suffix (always `m` for Edmonton), `sub_fields` for multiple |
| `yes_no` | `<Switch>` or 2-option `<RadioGroup>` | — |

---

## consultant_answers.json (UI → Phase 5)

Returned from the frontend after the consultant fills in the form.

```json
{
  "project": {
    "address": "12345 - 100 Avenue NW",
    "permit_number": "DP-2025-1234"
  },
  "answers": {
    "7": {
      "0": 652.35,
      "1": 8.5
    },
    "4": {
      "0": "Yes — existing CB within 15m"
    },
    "10": {
      "0": "Yes — EPCOR confirmed 25mm service is adequate. Confirmation letter attached."
    }
  },
  "skipped": ["9"]
}
```

### Field Notes

- **`answers`** — Keyed by `correction_item_id`, then by `question_index` (as string)
- **Values** — String for text/choice, number for number/measurement, object for sub_fields
- **`skipped`** — Item IDs where consultant selected "Don't know" or left blank
- Skipped items become `[TODO]` markers in Phase 5 outputs

---

## standards_findings.json (Phase 3A)

Per-standard lookups from edmonton-civil reference files.

```json
{
  "standard_lookups": {
    "grading-drainage/no-surface-water-to-private": {
      "title": "Core Grading Principle",
      "source_file": "grading-drainage.md",
      "requirement": "Surface water from public infrastructure must NOT flow onto private property",
      "threshold": null,
      "applies_to_items": ["4"]
    },
    "grading-drainage/building-zone-2m-sod": {
      "title": "Building zone minimum slope (sod)",
      "source_file": "grading-drainage.md",
      "requirement": "First 2.0m from building — sod/landscape minimum 10% slope",
      "threshold": "10%",
      "applies_to_items": ["5", "6"]
    },
    "utilities-sanitary/sampling-mh-slope": {
      "title": "Sampling MH minimum slope (sanitary)",
      "source_file": "utilities-sanitary.md",
      "requirement": "Minimum 2% slope for sanitary sampling manholes",
      "threshold": "2%",
      "applies_to_items": ["7"]
    },
    "utilities-storm/orifice-min": {
      "title": "Orifice minimum size",
      "source_file": "utilities-storm.md",
      "requirement": "Minimum 50mm round sharp-edged orifice for SWM facility",
      "threshold": "50mm",
      "applies_to_items": ["8"]
    }
  },
  "checklist_gaps": [
    {
      "checklist": "checklist-onsite.md",
      "section": "C004 — Grading Plan",
      "item": "Direction of Flow arrows for all areas",
      "status": "not_shown_on_drawings",
      "applies_to_items": ["2"]
    },
    {
      "checklist": "checklist-onsite.md",
      "section": "C003 — Site Servicing Plan",
      "item": "Sampling MH with minimum slope notation",
      "status": "slope_below_minimum",
      "applies_to_items": ["7"]
    }
  ],
  "notes": "All lookups resolved against edmonton-civil offline references. No web search required."
}
```

---

## sheet_annotations.json (Phase 5)

Per-sheet breakdown of what needs to change and where on the construction plans.

```json
{
  "project": {
    "address": "12345 - 100 Avenue NW",
    "permit_number": "DP-2025-1234"
  },
  "revision_number": 1,
  "revision_date": "2026-02-15",
  "annotations": [
    {
      "sheet_id": "C004",
      "page_number": 4,
      "file": "page-04.png",
      "sheet_title": "Grading Plan",
      "actions": [
        {
          "item_number": "2",
          "area": "All areas of grading plan — general",
          "action": "Add surface water flow direction arrows",
          "specification": "Arrows showing drainage direction from spot elevations. All areas must show positive drainage away from buildings.",
          "professional": null,
          "status": "AUTO_FIXABLE",
          "revision_note": "REV 1: Added flow direction arrows per correction Item 2"
        },
        {
          "item_number": "4",
          "area": "Area between lane and lot 5 rear property line",
          "action": "Revise grading to redirect surface water away from lot 5",
          "specification": "Redirect flow to existing CB in lane R/W. Revise spot elevations to create positive fall toward CB.",
          "professional": "P.Eng (Grading)",
          "status": "SCOPED",
          "revision_note": "REV 1: Revised grading to prevent surface water flow to lot 5 per correction Item 4"
        }
      ]
    },
    {
      "sheet_id": "C003",
      "page_number": 3,
      "file": "page-03.png",
      "sheet_title": "Site Servicing Plan",
      "actions": [
        {
          "item_number": "7",
          "area": "Sanitary service connection — sampling MH detail",
          "action": "Revise sampling MH slope to meet minimum 2%",
          "specification": "Update invert elevations. Confirmed INV at sampling MH: 652.35m. Pipe length: 8.5m. Required fall: 0.17m minimum.",
          "professional": "P.Eng (Servicing)",
          "status": "COMPLETE",
          "revision_note": "REV 1: Revised sampling MH slope to 2% minimum per correction Item 7"
        }
      ]
    }
  ],
  "revision_table": [
    {"rev": 1, "date": "2026-02-15", "description": "Added flow direction arrows", "sheet": "C004", "item": "2"},
    {"rev": 1, "date": "2026-02-15", "description": "Revised grading — lot 5 drainage", "sheet": "C004", "item": "4"},
    {"rev": 1, "date": "2026-02-15", "description": "Revised sampling MH slope to 2%", "sheet": "C003", "item": "7"}
  ]
}
```

### Status Values

| Status | Meaning |
|--------|---------|
| `AUTO_FIXABLE` | Can be fixed without additional input |
| `COMPLETE` | Consultant provided all needed info, action fully specified |
| `SCOPED` | P.Eng redesign needed, scope defined but work not done |
| `TODO` | Missing consultant input — action cannot be fully specified yet |
| `PARTIAL` | Some info provided, some still missing |
| `EPCOR_PENDING` | Awaiting EPCOR confirmation or coordination |

---

## corrections_categorized.json (Phase 4)

Internal working file that merges research findings with categorizations. Used as input to Phase 5.

```json
{
  "items": [
    {
      "item_number": "4",
      "original_wording": "Surface water from lane directed onto lot 5. Revise grading to prevent.",
      "category": "NEEDS_REDESIGN",
      "professional": "P.Eng (Grading)",
      "standards_finding": {
        "standard": "Core grading principle — grading-drainage.md",
        "requirement": "Surface water from public infrastructure must NOT flow onto private property",
        "threshold": null
      },
      "sheet_observation": {
        "sheet_id": "C004",
        "current_state": "Flow arrows show lane water draining toward lot 5 rear property line. Spot elevations confirm negative fall toward lot 5.",
        "what_to_fix": "Revise grading to direct lane water to catch basin or swale within R/W. Update spot elevations and flow arrows."
      },
      "affected_sheets": ["C004", "C007"],
      "research_context": "Edmonton core grading principle: surface water from public infrastructure must not flow onto private property. Current grading plan shows flow direction toward lot 5. Requires regrading with revised spot elevations.",
      "research_context_ko": "에드먼턴 핵심 배수 원칙: 공공 인프라의 표면수는 사유지로 흐를 수 없음. 현재 정지 계획에서 로트 5 방향으로 유수 확인. 표고 수정을 통한 재정지 필요."
    },
    {
      "item_number": "7",
      "original_wording": "Sampling manhole slope shown as 1.5%. Minimum required is 2% for sanitary.",
      "category": "NEEDS_CONSULTANT_INPUT",
      "professional": null,
      "standards_finding": {
        "standard": "Sampling MH slope — utilities-sanitary.md",
        "requirement": "Minimum 2% slope for sanitary sampling manholes",
        "threshold": "2%"
      },
      "sheet_observation": {
        "sheet_id": "C003",
        "current_state": "Sampling MH shown with 1.5% slope notation between building connection and MH",
        "what_to_fix": "Update slope to 2% minimum — need confirmed invert elevations to verify feasibility"
      },
      "affected_sheets": ["C003"],
      "research_context": "Edmonton DCS requires 2% minimum slope for sanitary sampling MH. Currently shown as 1.5%. Need confirmed invert elevation and pipe length to determine if adjustment is feasible within current alignment.",
      "research_context_ko": "에드먼턴 DCS 기준 오수 샘플링 MH 최소 경사 2%. 현재 1.5% 표시. 현 정렬 내 조정 가능 여부 판단을 위해 확인된 관저고와 관 길이 필요."
    }
  ]
}
```
