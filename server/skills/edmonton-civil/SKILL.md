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
| Minimum lot grade (away from building) | TBD | `grading-drainage.md` |
| Maximum lane grade | TBD | `vertical-alignment.md` |

> **TBD** = To be filled in with specific City of Edmonton standards. Items marked TBD need your input or web research to complete.
