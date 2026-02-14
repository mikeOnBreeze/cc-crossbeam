---
name: california-adu
description: "California state-level ADU and JADU rules from the HCD ADU Handbook (Jan 2025) and 2026 Addendum. Covers Government Code §§ 66310-66342 including setbacks, height, size, parking, permitting, fees, and ownership. Use this skill for any California ADU question about state requirements."
version: "1.0"
source: "HCD ADU Handbook, January 2025 (54 pages) + January 2026 Addendum (pages 55-58)"
authority: "California Department of Housing and Community Development"
law_as_of: "January 1, 2026"
---

# California ADU Regulatory Decision Engine

This skill contains the California state-level ADU (Accessory Dwelling Unit) and JADU (Junior Accessory Dwelling Unit) rules extracted from the HCD ADU Handbook (January 2025) and the January 2026 Addendum. It covers Government Code §§ 66310-66342 (including new §§ 66311.5, 66333.5) as amended through January 1, 2026.

**What this covers**: State law — the floor that cities cannot go below. Cities may be more permissive but cannot impose standards more restrictive than what is stated here.

**What this does NOT cover**: City/county-specific ordinances, federal requirements (FHA, ADA), or project-specific engineering.

## How to Use This Skill

When answering an ADU question, follow the 4-step decision tree below. Each step tells you which reference files to load. Load only what you need — most questions require 3-5 reference files, not all 28.

After loading references, check the **Quick-Reference Thresholds** table below for the key numbers that come up in almost every query.

---

## Decision Tree Router

### STEP 1: Classify the Lot Type

What kind of lot is the ADU proposed on?

| Lot Type | Load These References |
|----------|----------------------|
| **Single-family lot** | `unit-types-66323.md`, `unit-types-adu-general.md` |
| **Multifamily lot** (2+ existing units) | `unit-types-multifamily.md`, `unit-types-66323.md` |
| **JADU only** (within existing/proposed single-family dwelling) | `unit-types-jadu.md` |
| **Unsure / mixed question** | `unit-types-66323.md` (start here — it has the combinations table) |

### STEP 2: Classify the ADU Construction Type

How is the ADU being built?

| Construction Type | Load These References |
|-------------------|----------------------|
| **New detached construction** | `standards-height.md`, `standards-size.md`, `standards-setbacks.md` |
| **Conversion from existing space** (garage, basement, etc.) | `standards-size.md`, `zoning-nonconforming.md` |
| **Attached addition** to existing dwelling | `standards-height.md`, `standards-size.md`, `standards-setbacks.md` |
| **Manufactured/factory-built home** | `special-manufactured.md` |

### STEP 3: Check Situational Modifiers

Does any of the following apply? Load the additional references.

| Situation | Load These References |
|-----------|----------------------|
| **Near public transit** (½ mile of rail/ferry, ¼ mile of bus) | `standards-height.md` (18 ft bonus), `standards-parking.md` (exemptions) |
| **In coastal zone** | `zoning-hazards.md` |
| **In fire hazard severity zone** | `zoning-hazards.md`, `standards-fire.md` |
| **In historic district** | `zoning-general.md`, `standards-design.md` |
| **Property has an HOA** | `ownership-hoa.md` |
| **Rental / short-term rental question** | `ownership-use.md` |
| **Selling or converting ADU to condo** | `ownership-sales.md` |
| **SB 9 lot split involved** | `special-sb9.md` |
| **Nonconforming zoning or building code violations** | `zoning-nonconforming.md` |
| **Solar / energy code question** | `standards-solar.md` |
| **Fire sprinkler question** | `standards-fire.md` |
| **Parking question** | `standards-parking.md` |
| **Design review / subjective standards question** | `standards-design.md` |

### STEP 4: Check Process, Fees, and Compliance

What stage is the project at?

| Topic | Load These References |
|-------|----------------------|
| **Permit application / timeline / pre-approved plans** | `permit-process.md` |
| **Impact fees / connection fees** | `permit-fees.md` |
| **Financing / grants / loans** | `permit-funding.md` |
| **Unpermitted existing ADU** (legalization) | `compliance-unpermitted.md` |
| **Local ordinance question / HCD enforcement** | `compliance-ordinances.md` |
| **Housing element / RHNA credit** | `compliance-housing.md` |
| **Utility connections** | `compliance-utilities.md` |
| **Legislative history / bill tracking** | `legislative-changes.md` |
| **Definition of a term** | `glossary.md` |

---

## Quick-Reference Thresholds

These numbers come up in almost every ADU query. Check here first before loading a reference file — you may already have the answer.

| Threshold | Value | Reference File |
|-----------|-------|----------------|
| JADU maximum size | 500 sq ft of **interior livable space** | `unit-types-jadu.md` |
| 66323(a) converted/detached max | 800 sq ft | `unit-types-66323.md` |
| Minimum ADU size (efficiency unit) | 150 sq ft | `standards-size.md` |
| Minimum ADU size (0-1 bedroom) | 850 sq ft of **interior living space** | `standards-size.md` |
| Minimum ADU size (2+ bedrooms) | 1,000 sq ft of **interior living space** | `standards-size.md` |
| Maximum detached ADU (no local ordinance) | 1,200 sq ft of **interior living space** | `standards-size.md` |
| Fee exemption threshold | ≤ 750 sq ft of **interior livable space** (§ 66311.5) | `permit-fees.md` |
| Maximum side/rear setback | 4 ft | `standards-setbacks.md` |
| Detached height — base | 16 ft | `standards-height.md` |
| Detached height — near transit or multistory primary | 18 ft | `standards-height.md` |
| Detached height — transit + additional 2 ft for roof pitch | 18 ft (+2 ft) | `standards-height.md` |
| Attached ADU height | 25 ft (or primary dwelling height) | `standards-height.md` |
| Completeness check deadline | **15 business days** | `permit-process.md` |
| Approval/denial deadline | 60 days | `permit-process.md` |
| Minimum rental term | 30 days | `ownership-use.md` |
| Unpermitted ADU amnesty cutoff | Before January 1, 2020 | `compliance-unpermitted.md` |
| Multifamily detached ADU cap | 8 units or 25% of existing | `unit-types-multifamily.md` |

---

## Key Principles

1. **State preemption**: State law sets minimum ADU rights. Cities cannot impose standards more restrictive than those in these reference files. Cities *can* be more permissive.

2. **Ministerial approval**: ADU permits must be approved ministerially (no discretionary review, no public hearings, no CEQA). See `permit-process.md`.

3. **No density count**: ADUs and JADUs do not count toward allowable density for the lot. See `zoning-general.md`.

4. **Objective standards only**: Cities may only apply objective (measurable, verifiable) development standards to ADUs — not subjective design review. See `standards-design.md`.

5. **Owner-occupancy**: Required for JADUs **only if the JADU shares sanitation facilities** with the primary structure. Not required for ADUs (except for separate conveyance under AB 1033). See `ownership-use.md`.

---

## Reference File Catalog

See `AGENTS.md` for the complete catalog of all 28 reference files with descriptions and key code sections.
