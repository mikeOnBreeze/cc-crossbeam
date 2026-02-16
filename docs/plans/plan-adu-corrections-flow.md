# ADU Corrections Pipeline — Architecture & Data Flow

## What This Is

A two-skill pipeline that processes city correction letters for ADU permit applications. The contractor uploads their corrections letter + plan binder, gets back informed questions, answers them, then gets a complete response package ready to send back to the building department.

This doc describes how the two skills work together. It's the reference for implementing this pipeline in the Agent SDK.

### The Two Skills

| Skill | Role | Duration | Context |
|-------|------|----------|---------|
| **`adu-corrections-flow`** | Analysis & research. Reads corrections, researches codes, categorizes items, generates contractor questions. | ~4-8 min | Has conversation history, orchestrates 3 sub-skills |
| **`adu-corrections-complete`** | Response generation. Takes research artifacts + contractor answers, generates 4 deliverables. | ~1-2 min | **Cold start** — no conversation history, reads files only |

### Sub-Skills Used (by `adu-corrections-flow` only)

| Sub-Skill | What It Does | Mode |
|-----------|-------------|------|
| `california-adu` | State-level ADU law, building codes (CRC, CBC, CPC, etc.) | Offline — 28 reference files |
| `adu-city-research` | City municipal code, standard details, Information Bulletins | Online — WebSearch, WebFetch, optional Chrome browser |
| `adu-targeted-page-viewer` | Plan sheet manifest + on-demand sheet viewing | Local — PDF extraction + vision |

---

## End-to-End Flow

```
USER UPLOADS                       SKILL 1                          UI                    SKILL 2
corrections letter ──┐
                     ├──▶ adu-corrections-flow ──▶ contractor_questions.json ──▶ UI form
plan binder PDF ─────┘     (Phases 1-4, ~4-8 min)                                  │
                                   │                                                │
                                   │ writes 8 files to                   contractor │
                                   │ session directory                   fills form │
                                   ▼                                                │
                            correction-01/                                          ▼
                            ├── corrections_parsed.json          contractor_answers.json
                            ├── sheet-manifest.json                       │
                            ├── state_law_findings.json                   │
                            ├── city_discovery.json              ┌───────┘
                            ├── city_research_findings.json      │
                            ├── sheet_observations.json          │
                            ├── corrections_categorized.json     │
                            └── contractor_questions.json        │
                                                                 ▼
                                                    adu-corrections-complete
                                                    (Phase 5, ~1-2 min, cold start)
                                                            │
                                                            ▼
                                                    response_letter.md
                                                    professional_scope.md
                                                    corrections_report.md
                                                    sheet_annotations.json
```

### The Natural Pause

There is exactly one pause in the pipeline — between Skill 1 and Skill 2. The UI displays the contractor questions form. The contractor answers (could take minutes, could take days). Then Skill 2 runs.

These are **two separate agent invocations**, not one long-running session. Skill 2 starts cold with zero conversation history and reads everything from files.

---

## Skill 1: `adu-corrections-flow` (Phases 1–4)

### Phase 1 + Phase 2 (concurrent, no dependencies)

These two phases have zero dependencies on each other and should run simultaneously.

#### Phase 1: Read Corrections Letter

Direct vision reading of the corrections letter (1-3 pages, typically PNG or PDF). No sub-skill needed.

**What it does:** Reads every correction item from the letter. Extracts code references (CRC R302.1, ASCE 7-16, B&P 5536.1, etc.), sheet references (elevations, roof plan, site plan), and preserves the exact original wording verbatim.

**Output:** `corrections_parsed.json`

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

Key fields: `code_references_summary` drives Phase 3A research scope. `referenced_sheets` drives Phase 3C sheet viewing scope.

#### Phase 2: Build Sheet Manifest

Uses `adu-targeted-page-viewer` skill to extract the plan binder PDF into individual page PNGs and build the sheet-to-page mapping.

**Steps:**
1. `scripts/extract-pages.sh <binder.pdf> <output-dir>` — PDF to PNGs at 200 DPI
2. Read cover sheet (page 1) for the sheet index
3. If page count doesn't match index count, crop title blocks and read to resolve
4. Build manifest

**Output:** `sheet-manifest.json`

```json
{
  "source_pdf": "plan-binder.pdf",
  "total_pages": 26,
  "indexed_sheets": 24,
  "sheets": [
    { "sheet_id": "A1", "page_number": 5, "file": "page-05.png", "description": "Site Plan" },
    { "sheet_id": "A3", "page_number": 7, "file": "page-07.png", "description": "Elevations & Proposed Roof Plan" }
  ],
  "unindexed_pages": [{"page_number": 25, "file": "page-25.png", "likely_content": "Appendix"}]
}
```

**Critical:** This manifest is the single source of truth for sheet references in ALL downstream outputs. Every sheet reference in every file must come from this manifest. Never guess sheet numbers.

---

### Phase 3 (concurrent — 3 subagents)

After Phase 1 and Phase 2 both complete, launch three parallel research subagents. Each is specialized by domain. All receive the parsed corrections from Phase 1.

#### Subagent 3A: State Law Researcher

| Aspect | Value |
|--------|-------|
| Sub-skill | `california-adu` (28 reference files, all offline) |
| Input | `corrections_parsed.json` — all code references |
| Task | Look up every unique code section. Deduplicate — if items 5 and 12 both cite CRC R302.1, look it up once and link to both items. |
| Speed | ~60 sec (no network, just reading reference files) |

**Output:** `state_law_findings.json`

```json
{
  "code_lookups": {
    "CRC_R302.1": {
      "title": "Exterior Walls — Fire Separation",
      "requirement": "Projections within 5' of property line require 1-hour fire-rated construction per Table R302.1(1)",
      "key_thresholds": "5' setback trigger, 1-hour rating, Table R302.1(1)",
      "adu_exceptions": "Gov Code 66314(b)(2) limits cities from imposing setbacks beyond 4' for rear/side yard ADUs — but fire separation still applies",
      "prescriptive_or_performance": "prescriptive",
      "applies_to_items": ["5", "12"]
    }
  },
  "notes": "..."
}
```

#### Subagent 3B: City Discovery

| Aspect | Value |
|--------|-------|
| Sub-skill | `adu-city-research` — **Mode 1 (Discovery) only** |
| Input | City name + correction topics |
| Task | Run 3-5 WebSearch queries to find the city's key ADU-related URLs. **Discovery ONLY — do NOT fetch page content.** |
| Speed | ~30 sec (WebSearch only) |

**Output:** `city_discovery.json`

```json
{
  "city": "Placentia",
  "discovery_timestamp": "2026-02-11T10:30:00Z",
  "urls": {
    "adu_page": "https://placentia.org/adu",
    "municipal_code": {
      "platform": "ecode360",
      "base_url": "https://ecode360.com/PL3477",
      "building_code_title_url": "https://ecode360.com/PL3477#title20"
    },
    "standard_details": [
      {"name": "Sewer Connection Standard Detail", "url": "https://placentia.org/..."}
    ],
    "information_bulletins": [],
    "submittal_requirements": "https://placentia.org/building-permits"
  },
  "not_found": ["information_bulletins", "pre_approved_plans"],
  "notes": "City uses ecode360 for municipal code..."
}
```

**Why Discovery is separate from Extraction:** Discovery runs fast (~30 sec) via WebSearch in parallel with 3A and 3C. Content extraction (which requires WebFetch and is slower) runs after all Phase 3 subagents return. This cuts the critical path.

#### Subagent 3C: Sheet Viewer

| Aspect | Value |
|--------|-------|
| Sub-skill | `adu-targeted-page-viewer` |
| Input | `sheet-manifest.json` + sheet references from `corrections_parsed.json` |
| Task | Read only the plan sheets referenced by correction items (typically 5-8 out of 15-30 pages). Describe what is currently drawn in the area relevant to each correction. |
| Speed | ~60 sec (reading PNGs) |

**Output:** `sheet_observations.json`

```json
{
  "sheets_reviewed": [
    {
      "sheet_id": "A3",
      "page_number": 7,
      "file": "page-07.png",
      "description": "Elevations & Proposed Roof Plan",
      "observations": [
        {
          "area": "South elevation, patio soffit detail — lower right of elevation view",
          "current_state": "Shows standard unrated wood soffit framing with no fire rating callout",
          "correction_relevance": "Item 5 — needs fire-rated construction within 5' of property line",
          "what_appears_missing": "No fire rating specification, no 5/8\" Type X gypsum callout"
        }
      ],
      "applies_to_items": ["5", "12"]
    }
  ],
  "sheets_not_found": []
}
```

---

### Phase 3.5: City Content Extraction

After Phase 3 completes (all three subagents return), run city content extraction using the URLs discovered by Subagent 3B.

#### Default: Single Agent

One subagent runs `adu-city-research` **Mode 2 (Targeted Extraction)** against all discovered URLs.

| Aspect | Value |
|--------|-------|
| Sub-skill | `adu-city-research` — Mode 2 (Targeted Extraction) |
| Input | `city_discovery.json` + correction topics |
| Task | WebFetch each discovered URL. Extract content relevant to corrections. Prioritize standard detail PDFs and municipal code amendments. |
| Speed | ~60-90 sec |

**Output:** `city_research_findings.json`

```json
{
  "city": "Placentia",
  "municipal_code": {
    "platform": "ecode360",
    "code_edition": "2022 California Building Standards Code",
    "relevant_chapters": [
      {"chapter": "20.04", "title": "California Building Code", "url": "...", "key_content": "..."}
    ],
    "local_amendments": []
  },
  "standard_details": [
    {"name": "Sewer Connection", "url": "...", "description": "...", "applies_to_items": ["4"]}
  ],
  "information_bulletins": [],
  "specific_findings": [],
  "extraction_gaps": [
    {"category": "standard detail PDF", "url_attempted": "...", "reason": "PDF not readable", "fallback_suggestion": "Navigate to engineering page"}
  ]
}
```

#### Optional: Fan-Out Mode

When Discovery returns 6+ URLs across multiple categories, split across 2-3 subagents by topic for speed:
- Agent 1: Municipal code URLs
- Agent 2: Standard detail PDFs + Information Bulletins
- Agent 3: ADU page + submittal requirements

Orchestrator merges results into a single `city_research_findings.json`.

#### Conditional: Browser Fallback

If Extraction has gaps (URLs returned empty, PDFs unreadable, sections not found), launch one subagent running `adu-city-research` **Mode 3 (Browser Fallback)** with Chrome MCP.

| Aspect | Value |
|--------|-------|
| Sub-skill | `adu-city-research` — Mode 3 (Browser Fallback) |
| Input | `extraction_gaps` from Mode 2 output |
| Task | Navigate the city's website with browser automation to fill specific gaps |
| Speed | ~2-3 min |
| When | Only if Mode 2 has actionable gaps. Most cities don't need this. |

Browser findings get merged into `city_research_findings.json`.

---

### Phase 4: Merge + Categorize + Generate Questions

The orchestrator itself (not a subagent) merges all research streams and does the intelligence work.

**Inputs:** All Phase 1-3.5 outputs.

**Process per correction item:**

1. **Cross-reference** — What does the correction letter say? What does state law require? Does the city add anything? What's currently on the plan sheet?

2. **Categorize** with full context:

| Category | Meaning | Example |
|----------|---------|---------|
| `AUTO_FIXABLE` | Fix is clear from research alone — add notes, mark checklists, update labels | Missing CalGreen item, governing codes list |
| `NEEDS_CONTRACTOR_INPUT` | Research identified what the code requires, but need physical facts from contractor | Sewer line size, finished grade elevations |
| `NEEDS_PROFESSIONAL` | Requires licensed professional work — design changes, structural calcs, energy modeling | Fire-rated assembly detail, engineering calculations |

3. **Generate questions** for `NEEDS_CONTRACTOR_INPUT` items (and optional questions for `NEEDS_PROFESSIONAL`). Every question includes `research_context` explaining why it's being asked and what the code requires. This is the whole point — research-informed questions are specific and answerable in seconds.

**Example — Item 5 (fire-rated soffit):**

| Source | Finding |
|--------|---------|
| State law (3A) | CRC R302.1 Table R302.1(1): 1-hour fire rating within 5' of property line |
| City (3.5) | No local amendment — state code applies |
| Sheet (3C) | Sheet A3: south elevation shows unrated wood soffit, no fire rating callout |
| **Category** | **NEEDS_PROFESSIONAL** — designer must draw the fire-rated assembly detail |
| **Question** | "Is the existing patio soffit (a) exposed wood framing, (b) has existing sheathing, (c) other?" — helps designer know what to detail |

**Outputs:**

`corrections_categorized.json` — the main handoff artifact to Skill 2:

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

`contractor_questions.json` — UI-ready question form:

```json
{
  "project": { "address": "1232 N Jefferson St", "city": "Placentia", "permit_number": "J25-434" },
  "summary": { "total_items": 14, "auto_fixable": 5, "needs_contractor_input": 6, "needs_professional": 3 },
  "question_groups": [
    {
      "correction_item_id": "4",
      "item_summary": "Utility connections — sewer, water, electrical adequacy",
      "category": "NEEDS_CONTRACTOR_INPUT",
      "research_context": "City of Placentia requires documentation of utility adequacy. CPC Table 702.1 governs fixture unit calculations.",
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
        }
      ]
    }
  ],
  "auto_fixable_items": [
    {
      "correction_item_id": "2",
      "item_summary": "Add Placentia Municipal Code to governing codes on cover sheet",
      "auto_fix_description": "Add 'City of Placentia Municipal Code, Title 20' to governing codes list on Sheet CS",
      "affected_sheets": ["CS"],
      "confidence": "high"
    }
  ],
  "professional_items": [
    {
      "correction_item_id": "5",
      "item_summary": "Fire-rated soffit detail — patio within 5' of property line",
      "professional_needed": "Designer / Architect",
      "scope_summary": "Draw fire-rated assembly detail for patio soffit per CRC R302.1.",
      "affected_sheets": ["A3"],
      "contractor_question": {
        "question_id": "q_5_0",
        "question_text": "Is the existing patio soffit exposed wood framing or does it have existing sheathing?",
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

**Skill 1 stops here.** The `contractor_questions.json` goes to the UI. The contractor answers. Then Skill 2 runs.

---

## The Handoff: Session Directory

When Skill 1 finishes, the session directory contains 8 files. These files ARE the handoff — Skill 2 has no other context.

```
correction-01/
├── corrections_parsed.json        ← Phase 1: raw correction items, original wording
├── sheet-manifest.json            ← Phase 2: sheet ID ↔ page number mapping
├── state_law_findings.json        ← Phase 3A: per-code-section lookups
├── city_discovery.json            ← Phase 3B: discovered URLs (used by 3.5)
├── city_research_findings.json    ← Phase 3.5: extracted city content
├── sheet_observations.json        ← Phase 3C: what's on each plan sheet
├── corrections_categorized.json   ← Phase 4: merged research + categories (THE BACKBONE)
├── contractor_questions.json      ← Phase 4: UI-ready questions
└── [pages/]                       ← Phase 2: extracted PNGs (page-01.png, page-02.png, ...)
```

Then the UI adds one more file:

```
correction-01/
└── contractor_answers.json        ← UI: contractor's responses to questions
```

### Why Cold Start Matters

Skill 2 runs as a completely new agent invocation. It has:
- Zero conversation history from Skill 1
- No memory of the research process
- No context beyond what's in the files

This means `corrections_categorized.json` must be extremely high quality. Every item must have its research context, code findings, city findings, and sheet observations fully documented. If it's not in the file, Skill 2 doesn't know about it.

### `contractor_answers.json` Format

```json
{
  "project": { "address": "1232 N Jefferson St", "permit_number": "J25-434" },
  "answers": {
    "4": {
      "0": "4\" ABS",
      "1": 18,
      "2": "Wye fitting, 15' from main house cleanout"
    },
    "11": {
      "0": { "NE corner": 102.35, "NW corner": 102.45, "SE corner": 102.15, "SW corner": 102.25 }
    },
    "5": { "0": "Exposed wood framing" }
  },
  "skipped": ["7", "9"]
}
```

Keyed by `correction_item_id`, then by `question_index` (as string). Values are string for text/choice, number for number/measurement, object for sub_fields. Skipped items become `[TODO]` markers in outputs.

---

## Skill 2: `adu-corrections-complete` (Phase 5)

### Reading Order

Skill 2 reads files in this order to build context efficiently:

1. **`corrections_categorized.json`** — the backbone. Has merged research per item.
2. **`contractor_answers.json`** — map answers to items.
3. **`sheet-manifest.json`** — for accurate sheet references.
4. **`corrections_parsed.json`** — for original wording to preserve in the response letter.
5. Other files only if `corrections_categorized.json` doesn't have enough detail.

### Four Deliverables

#### 1. `response_letter.md`

Professional letter from the contractor to the building department addressing every correction item.

**Rules:**
- Address EVERY item — never skip, even procedural ones
- Preserve original correction wording — quote or reference it
- For answered items: incorporate the answer with code justification
- For unanswered items: mark as `[TODO: specific description]`
- For auto-fixable items: state what was changed and on which sheet
- For professional items: state the scope and who will do the work
- Reference specific sheets from the manifest
- End with summary table of sheet revisions
- Tone: professional, specific, respectful (goes to a city plan checker)

#### 2. `professional_scope.md`

Work breakdown grouped by professional (Designer, Structural Engineer, HERS Rater, etc.).

**Rules:**
- Group by professional, not by correction item
- Include per-sheet action table with specific sheet references
- Extract professional names from plan sheet title blocks if available
- Include a **Key Specifications** section with contractor-provided details formatted for the designer (DFU justification notes, grade elevation tables, patio dimensions)
- Mark status: READY, PENDING, FINAL STEP
- Per-sheet action summary at the bottom as quick-reference

#### 3. `corrections_report.md`

Status dashboard — the project manager's view.

**Rules:**
- Status values: COMPLETE, SCOPED, PENDING, TODO
- "Key Findings" section translates raw answers into conclusions ("Sewer capacity is fine — 34 DFU on a 216 DFU line")
- Action items checklist with [x] for completed items
- Critical path showing what can proceed in parallel vs. sequentially

#### 4. `sheet_annotations.json`

Per-sheet breakdown of what needs to change, structured for potential future PDF markup.

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
          "item_number": "5",
          "area": "South elevation, patio soffit — Detail 2 area",
          "action": "New fire-rated assembly detail",
          "specification": "5/8\" Type X gypsum on underside of 2x rafter framing",
          "professional": "Designer",
          "status": "SCOPED",
          "revision_note": "REV 1: New fire-rated soffit detail per Item 5"
        }
      ]
    }
  ],
  "revision_table": [
    { "rev": 1, "date": "", "description": "", "sheet": "", "item": "" }
  ]
}
```

### Gap Handling

When contractor answers are incomplete, Skill 2 marks gaps clearly:

- **Response letter:** `[TODO: Water meter size not provided — contractor to confirm]`
- **Professional scope:** "Awaiting contractor input" with specific missing info listed
- **Corrections report:** Status = TODO or PARTIAL
- **Sheet annotations:** Status = "TODO", specification = null

Never block on missing answers. A partial response package is still valuable.

---

## Timing

| Phase | Time | What's Happening |
|-------|------|-----------------|
| Phase 1 | ~30 sec | Vision reading corrections letter (1-3 pages) |
| Phase 2 | ~90 sec | PDF extraction + sheet manifest building |
| Phase 3A | ~60 sec | State code lookups (offline reference files) |
| Phase 3B | ~30 sec | City URL discovery (WebSearch only) |
| Phase 3C | ~60 sec | Reading 5-8 plan sheet PNGs |
| Phase 3.5 | ~60-90 sec | City content extraction (WebFetch) |
| Phase 3.5-fallback | ~2-3 min | Browser fallback (only if needed) |
| Phase 4 | ~2 min | Merge + categorize + generate questions |
| **Skill 1 total** | **~4-5 min** | **Typical (no browser fallback)** |
| **Skill 1 total** | **~6-8 min** | **With browser fallback** |
| --- | --- | --- |
| _Contractor answers questions_ | _minutes to days_ | _UI pause_ |
| --- | --- | --- |
| Phase 5 | ~1-2 min | Read files + generate 4 deliverables |
| **Skill 2 total** | **~1-2 min** | **All writing, no research** |

### Critical Path

```
Phase 1 ─────┐
              ├──▶ Phase 3A ──┐
Phase 2 ─────┤                │
              ├──▶ Phase 3B ──┼──▶ Phase 3.5 ──▶ Phase 4 ──▶ [UI PAUSE] ──▶ Phase 5
              │                │   (extraction)
              └──▶ Phase 3C ──┘
```

Phase 3.5 (city extraction) is the only phase that must wait for a specific Phase 3 subagent (3B Discovery). Phases 3A and 3C results can flow into Phase 4 as soon as they're ready, but Phase 4 waits for all three plus 3.5.

---

## Concurrency Map

For Agent SDK implementation, here's what can run in parallel:

| Step | Concurrent With | Depends On |
|------|----------------|------------|
| Phase 1 | Phase 2 | Nothing |
| Phase 2 | Phase 1 | Nothing |
| Phase 3A | Phase 3B, Phase 3C | Phase 1 complete |
| Phase 3B | Phase 3A, Phase 3C | Phase 1 complete |
| Phase 3C | Phase 3A, Phase 3B | Phase 1 AND Phase 2 complete |
| Phase 3.5 | Nothing | Phase 3B complete (needs `city_discovery.json`) |
| Phase 3.5-fallback | Nothing | Phase 3.5 complete (needs `extraction_gaps`) |
| Phase 4 | Nothing | Phase 3A + 3.5 + 3C all complete |
| Phase 5 | Nothing | Phase 4 complete + `contractor_answers.json` exists |

### Subagent Inventory

| Subagent | Phase | Skills/Tools Needed |
|----------|-------|-------------------|
| Corrections reader | 1 | Vision (image reading) |
| PDF extractor | 2 | `adu-targeted-page-viewer`, Bash (scripts/extract-pages.sh) |
| State law researcher | 3A | `california-adu` (28 reference files) |
| City discovery | 3B | `adu-city-research` Mode 1, WebSearch |
| Sheet viewer | 3C | `adu-targeted-page-viewer`, vision (PNG reading) |
| City extractor | 3.5 | `adu-city-research` Mode 2, WebFetch |
| City browser (conditional) | 3.5-fallback | `adu-city-research` Mode 3, Chrome MCP |
| Merge + categorize | 4 | No sub-skill — orchestrator logic |
| Output generator | 5 | No sub-skill — writing from files |

---

## UI Integration Points

The pipeline has two integration points with the frontend:

### 1. After Skill 1 → UI renders question form

**Input to UI:** `contractor_questions.json`

The JSON maps directly to React components:

| `question_type` | Component | Props |
|-----------------|-----------|-------|
| `text` | `<Textarea>` | `placeholder` |
| `number` | `<Input type="number">` | `min`, `max`, `unit` as suffix |
| `choice` | `<RadioGroup>` | `options` + conditional "Other" input |
| `multi_choice` | `<CheckboxGroup>` | `options` array |
| `measurement` | `<Input type="number">` | `unit` as suffix, `sub_fields` for multiple inputs |
| `yes_no` | `<Switch>` or 2-option `<RadioGroup>` | — |

The `summary` field drives progress indicators (5 auto / 6 need input / 3 need pro). The `auto_fixable_items` render as read-only info cards. The `professional_items` render with a professional badge and optional question.

### 2. After Skill 2 → UI renders results

**Input to UI:** 3 markdown files + 1 JSON

- `response_letter.md` — render as formatted markdown with `[TODO]` highlights
- `professional_scope.md` — render as formatted markdown with per-sheet tables
- `corrections_report.md` — render as dashboard with status badges
- `sheet_annotations.json` — render as per-sheet change callouts with page thumbnails

---

## Design Principles

1. **Research before questions.** Never generate contractor questions without code research. Research makes questions specific and answerable in seconds instead of requiring back-and-forth.

2. **Cold start architecture.** Skill 2 runs entirely from files. All context is embedded in `corrections_categorized.json`. This enables the pipeline pause (contractor may answer days later) and keeps agent invocations independent.

3. **Sheet references are sacred.** Every sheet reference in every output must come from `sheet-manifest.json`. Never guess. Watch for similar names: A1 vs A1.1 vs A1A.1 are different sheets.

4. **Two-pass city research.** Discovery runs fast via WebSearch in parallel with other research. Extraction uses WebFetch against discovered URLs. Browser Fallback only if gaps remain. Most cities: ~90 sec instead of 5 min.

5. **Deduplication in state research.** If 5 items cite CRC R302.1, look it up once and link to all 5. Saves tokens and avoids inconsistency.

6. **Help contractors comply, not litigate.** If the city says fix it, help the contractor fix it. Focus on *how to fix it*, not whether the correction is valid.

7. **Never block on missing answers.** A partial response package with clear `[TODO]` markers is more valuable than no response package. The professional can start on everything that IS answered.

---

## File Locations

| What | Path |
|------|------|
| This plan doc | `plan-adu-corrections-flow.md` |
| Skill 1 definition | `adu-skill-development/skill/adu-corrections-flow/SKILL.md` |
| Skill 1 output schemas | `adu-skill-development/skill/adu-corrections-flow/references/output-schemas.md` |
| Skill 1 subagent prompts | `adu-skill-development/skill/adu-corrections-flow/references/subagent-prompts.md` |
| Skill 2 definition | `adu-skill-development/skill/adu-corrections-complete/SKILL.md` |
| State law sub-skill | `adu-skill-development/skill/california-adu/` (28 reference files) |
| City research sub-skill | `adu-skill-development/skill/adu-city-research/SKILL.md` |
| Sheet viewer sub-skill | `adu-skill-development/skill/adu-targeted-page-viewer/SKILL.md` |
| Test data (Placentia) | `test-assets/corrections/` and `test-assets/correction-01/` |
