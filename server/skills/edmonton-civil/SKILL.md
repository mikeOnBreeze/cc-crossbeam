---
name: edmonton-civil
description: "City of Edmonton civil engineering permit standards for subdivision and development. Covers lane design, lot grading, surface water drainage, vertical alignment, utilities (water, sanitary, storm), and permit submission/review process. Use this skill for any Edmonton civil engineering permit question."
version: "0.1"
source: "City of Edmonton Design and Construction Standards, Complete Streets Guidelines, Lot Grading Guidelines, EPCOR Standards"
authority: "City of Edmonton"
standards_as_of: "2025"
---

# Edmonton Civil Engineering Permit Decision Engine

This skill contains City of Edmonton civil engineering standards for subdivision and development permits. It covers lane design, lot grading, surface water management, vertical/horizontal alignment, and utility infrastructure.

**What this covers**: City of Edmonton standards for civil engineering design and construction — the rules that must be met for permit approval.

**What this does NOT cover**: Structural engineering, building permits, architectural design, or federal/provincial requirements beyond what Edmonton references.

## Edmonton Civil Permit Structure

Edmonton civil engineering permits are split into two categories:

### On-Site (항상 있음)
- **Sewer & Water Service** — service connections from main to property
- **On-site Grading** — lot grading, surface water drainage, slopes

On-site에는 **체크리스트 2개** 가 있음 (sewer/water 1개, grading 1개).

### MIA / Off-Site (항상 있는 것은 아님)
- **Lane Design** — lane reconstruction, vertical/horizontal alignment, cross-sections

Off-site에는 **체크리스트 1개** 가 있음.

### Review Workflow

사용자가 도면을 완성하면:
1. 해당 **체크리스트** 항목을 하나씩 확인
2. 이 스킬의 **reference 파일** 기준값과 대조
3. 둘 다 만족하는지 판단
4. 부족하거나 애매한 항목에 대해 **코멘트** 제공

## How to Use This Skill

When answering an Edmonton civil engineering question, follow the 3-step decision tree below. Each step tells you which reference files to load. Load only what you need — most questions require 2-4 reference files, not all of them.

---

## Decision Tree Router

### STEP 1: Classify the Infrastructure Type

What kind of civil work is being designed or reviewed?

| Infrastructure Type | Load These References |
|---------------------|----------------------|
| **Lane / roadway design** (alignment, cross-section, pavement) | `lane-design.md`, `vertical-alignment.md` |
| **Lot grading / surface water drainage** | `grading-drainage.md` |
| **Sanitary sewer** | `utilities-sanitary.md` |
| **Storm sewer / stormwater management** | `utilities-storm.md` |
| **Water distribution** | `utilities-water.md` |
| **Combined / full subdivision** | `lane-design.md`, `grading-drainage.md`, `utilities-sanitary.md`, `utilities-storm.md`, `utilities-water.md` |

### STEP 2: Check Design Parameters

Does the question involve any of these specific design elements?

| Design Element | Load These References |
|----------------|----------------------|
| **Vertical curves / K values** | `vertical-alignment.md` |
| **Horizontal curves / superelevation** | `lane-design.md` |
| **Surface water flow direction** | `grading-drainage.md` |
| **Edge of lane / match existing elevation** | `lane-design.md`, `grading-drainage.md` |
| **Pipe sizing / minimum cover / frost depth** | `utilities-sanitary.md` or `utilities-storm.md` or `utilities-water.md` |
| **Easements / right-of-way** | `lane-design.md`, `permit-process.md` |

### STEP 3: Check Process and Submission

What stage is the project at?

| Topic | Load These References |
|-------|----------------------|
| **Permit application / required drawings** | `permit-process.md` |
| **Corrections letter / review comments** | `permit-process.md`, plus relevant technical reference |
| **Inspection requirements** | `permit-process.md` |
| **EPCOR coordination** | `utilities-water.md`, `utilities-sanitary.md` |
| **Terminology / abbreviations** | `glossary.md` |

---

## Quick-Reference Thresholds

These are the key numbers that come up frequently in Edmonton civil reviews:

| Parameter | Value | Reference |
|-----------|-------|-----------|
| Minimum vertical curve K value | 5 | `vertical-alignment.md` |
| Edge of lane elevation | Must match existing | `lane-design.md` |
| Surface water to private property | Not permitted | `grading-drainage.md` |
| Minimum lane width (residential) | TBD | `lane-design.md` |
| Minimum pipe cover (frost) | TBD | `utilities-sanitary.md` |
| Minimum slope — pavement | 0.6% | `grading-drainage.md` |
| Minimum slope — sod/landscape | 1.5% | `grading-drainage.md` |
| Maximum lane grade | TBD | `vertical-alignment.md` |

> **TBD** = To be filled in with specific City of Edmonton standards. Items marked TBD need your input or web research to complete.
