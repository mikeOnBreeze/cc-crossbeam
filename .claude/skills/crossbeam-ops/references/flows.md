---
title: "Flow Types and Phases"
category: operations
relevance: "When you need to understand what each flow does, its phases, budgets, and expected outputs"
---

# CrossBeam Flow Types

Three flow types, two user-facing flows.

**Architecture:** Cloud Run handles all mechanical file processing (PDF extraction, image cropping, archive creation). The Vercel Sandbox is purely for the AI agent — no system packages, no file conversion. Archives are downloaded and unpacked in the sandbox automatically.

**Pipeline:** `/api/generate` → Cloud Run pre-extract (if needed) → create sandbox → download files → unpack archives → copy skills → run agent

## city-review

**Persona:** City plan checker reviewing an ADU submittal
**Input:** Plan binder PDF
**Status progression:** `ready` → `processing` → `completed` / `failed`

**Phases:**
0. **Pre-Extract (Cloud Run)** — PDF → page PNGs + title block crops (automatic, before sandbox)
1. **Sheet Manifest** — Read cover sheet, build sheet-to-page mapping
2. **Research** — Look up state + city ADU requirements
3. **Review** — Check each relevant sheet against code requirements
4. **Generate** — Draft corrections letter with code citations

**Budget:** 100 turns, $20 max
**Sandbox timeout:** 30 minutes

**Expected output files** (in `outputs.raw_artifacts`):
- `sheet-manifest.json` — sheet ID to page number mapping
- `sheet_findings.json` — per-sheet findings
- `state_compliance.json` — state law compliance check
- `draft_corrections.json` — structured corrections
- `draft_corrections.md` — formatted corrections letter
- `review_summary.json` — overall summary

**Skills loaded:** california-adu, adu-plan-review, adu-targeted-page-viewer, adu-city-research, adu-corrections-pdf, buena-park-adu, placentia-adu

---

## corrections-analysis (Phase 1 of Contractor Flow)

**Persona:** Contractor analyzing corrections received from city
**Input:** Plan binder PDF + corrections letter (PNG images)
**Status progression:** `ready` → `processing-phase1` → `awaiting-answers` / `failed`

**Phases:**
0. **Pre-Extract (Cloud Run)** — PDF → page PNGs + title block crops (automatic, before sandbox)
1. **Parse** — Read corrections letter PNGs, parse individual items
2. **Analyze** — Read cover sheet, build sheet manifest, cross-reference plan pages
3. **Research** — Look up state + city codes for each correction item
4. **Categorize** — Sort items: contractor fix / needs engineer / already compliant
5. **Prepare** — Generate contractor questions for ambiguous items

**Budget:** 80 turns, $15 max
**Sandbox timeout:** 30 minutes

**Expected output files:**
- `corrections_parsed.json` — raw correction items
- `sheet-manifest.json` — sheet mapping
- `state_law_findings.json` — code research results
- `corrections_categorized.json` — items with categories
- `contractor_questions.json` — questions for the contractor

**After completion:** Project status goes to `awaiting-answers`. Contractor answers are collected, then Phase 2 is triggered.

**Skills loaded:** california-adu, adu-corrections-flow, adu-targeted-page-viewer, adu-city-research, adu-corrections-pdf, buena-park-adu, placentia-adu

---

## corrections-response (Phase 2 of Contractor Flow)

**Persona:** Same contractor, generating response package
**Input:** Phase 1 artifacts + contractor answers
**Status progression:** `awaiting-answers` → `processing-phase2` → `completed` / `failed`
**Prerequisite:** Phase 1 must be complete AND contractor answers must be provided

**Budget:** 40 turns, $8 max
**Sandbox timeout:** 30 minutes

**Expected output files (4 deliverables):**
- `response_letter.md` — professional letter to building department
- `professional_scope.md` — work breakdown by professional (architect, engineer, etc.)
- `corrections_report.md` — status dashboard with checklist
- `sheet_annotations.json` — per-sheet breakdown of needed changes

**Skills loaded:** california-adu, adu-corrections-complete, buena-park-adu, placentia-adu

---

## Full Contractor Flow (End-to-End)

```
1. Reset project       → POST /api/reset-project
2. Trigger Phase 1     → POST /api/generate { flow_type: "corrections-analysis" }
3. Poll until done     → GET /api/projects/:id (wait for "awaiting-answers")
4. Answer questions    → Update contractor_answers table via Supabase
5. Trigger Phase 2     → POST /api/generate { flow_type: "corrections-response" }
6. Poll until done     → GET /api/projects/:id (wait for "completed")
7. Read results        → GET /api/projects/:id → latest_output.raw_artifacts
```
