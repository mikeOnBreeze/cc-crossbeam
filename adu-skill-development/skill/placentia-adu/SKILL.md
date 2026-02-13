---
name: placentia-adu
version: "1.0"
description: "City-level ADU regulations for Placentia, California. This skill should be used when answering ADU questions specific to Placentia — local ordinance provisions, development standards, permit process, fees, fire requirements, zoning, and anything that differs from or adds to California state ADU law. This skill layers on top of the california-adu state law skill. Load state law first, then use this skill for Placentia-specific requirements."
source: "Placentia Municipal Code Chapter 23.73 (Ord. O-2025-05, July 2025), HCD TA Letter (Nov 2023), ecode360, city website"
authority: "City of Placentia Department of Development Services"
law_as_of: "July 15, 2025 (Ordinance No. O-2025-05)"
---

# Placentia ADU — City Regulatory Skill

This skill contains Placentia's city-level ADU rules — the local ordinance, development standards, permit process, fees, and fire/zoning requirements that supplement or override California state ADU law.

**How this skill relates to state law**: The `california-adu` skill covers the state floor (Gov. Code §§ 66310-66342). This skill covers what Placentia adds, matches, or potentially conflicts with. **Always load state law context first**, then layer this skill on top for city-specific questions.

**What this covers**: Placentia Municipal Code Chapter 23.73, Title 20 building codes, Title 23 zoning, Title 18 fire code, permit process, fees, and local development standards.

**What this does NOT cover**: State-level ADU law (use `california-adu` skill), federal requirements, or project-specific engineering.

---

## Decision Tree Router

### STEP 1: What's the Question About?

| Topic | Load These References |
|-------|----------------------|
| **ADU height, setbacks, size, building separation, or units allowed** | `ordinance-adu-standards.md` |
| **Parking requirements or exemptions** | `ordinance-adu-standards.md`, `transit-parking.md` |
| **Design standards, entrance visibility, stairway rules** | `ordinance-adu-standards.md` |
| **JADU rules, owner occupancy, deed restrictions, sale/rental** | `ordinance-adu-rules.md` |
| **Impact fees, school fees, fee exemptions** | `fees-impacts.md` |
| **Fire sprinklers, fire plan review, fire hazard zones** | `fire-placentia.md` |
| **Which building codes apply, local amendments, 2025 code cycle** | `building-codes.md` |
| **Zoning zones, lot coverage, base setbacks** | `zoning-residential.md` |
| **Permit process, submittal, who to contact, inspections** | `permit-process.md` |
| **Utilities, drainage, grading, stormwater, WQMP** | `utilities-grading.md` |
| **Energy code, insulation, solar PV** | `energy-climate.md` |
| **Transit stops, Metrolink, TOD district, parking exemption zones** | `transit-parking.md` |
| **Housing policy, RHNA, SB 9, pre-approved plans** | `context-housing-sb9.md` |

### STEP 2: Does a State Law Conflict Apply?

If the question involves any of these topics, also load `hcd-compliance.md`:

- Owner occupancy enforcement
- Building separation requirements
- Entrance or stairway visibility restrictions
- HCD findings or state preemption
- Potential conflicts between local ordinance and state law

**Key principle**: Where Placentia's ordinance is more restrictive than state law, **state law preempts**. The `hcd-compliance.md` file identifies the known issue areas. Placentia's code includes an explicit preemption clause: "If there is any inconsistency between this chapter and mandatory requirements of state law, state law shall control."

### STEP 3: Need More Information?

Every reference file includes URLs to city websites, ecode360, and external resources. If a question requires information beyond what's in the reference files, use these URLs with web search or browser tools to find the answer.

---

## Quick-Reference: Placentia vs. State Law

These are the key numbers where Placentia differs from or matches state law. Check here first before loading a reference file.

| Standard | State Law (Floor) | Placentia | Delta |
|----------|------------------|-----------|-------|
| **ADU max size (detached)** | 850/1,000 sq ft | **1,200 sq ft** | **More permissive** |
| **Detached height (base)** | 16 ft | **20 ft** | **More permissive** |
| **Attached height** | 25 ft / primary height | 25 ft or zone limit | Matches |
| **Side/rear setbacks** | 4 ft max | 4 ft | Matches |
| **Building separation** | Not specified | **10 ft minimum** | **Additional requirement** |
| **Entrance visibility** | Not restricted | **Not visible from street** | **Additional restriction** |
| **Exterior stairways** | Not restricted | **Not visible from any street** | **Additional restriction** |
| **Parking** | 1 space max, 6 exemptions | 1 space, similar exemptions | Matches |
| **Impact fee exemption** | ≤ 750 sq ft | ≤ 750 sq ft | Matches |
| **Fire sprinklers** | Only if required for primary | Same | Matches |
| **Approval timeline** | 60 days | 60 days | Matches |
| **Lot coverage** | Not specified by state | **50% (R-1)** | City standard |
| **Design match** | Objective standards only | **Match primary dwelling** | City-specific detail |
| **Owner occupancy (ADU)** | Not allowed | Not required | Matches |
| **Owner occupancy (JADU)** | Required | Required | Matches |
| **Short-term rental** | 30-day min | 30-day min | Matches |
| **Solar (new detached)** | Required per Energy Code | Required | Matches |
| **Separate sale** | Not unless AB 1033 opted in | Not permitted | Matches |

---

## Key Placentia Facts

- **Fire service**: Placentia Fire and Life Safety Department (city-run since 2020, NOT OCFA)
- **Zoning zones**: R-A, R-1, R-2, R-G, R-3, RPC, PUD + 10 specific plans/overlays (17 total)
- **Building codes**: 2022 California Building Standards Code editions; plans after Jan 1, 2026 must use 2025 Edition
- **Climate zone**: 8 (standard SoCal Title 24 requirements)
- **Transit**: Metrolink station planned but NOT YET BUILT; 7 OCTA bus routes serve city
- **TOD District**: Packing House District near future Metrolink — special fee exemptions
- **Water provider**: Golden State Water Company (private utility) — ADU triggers rate reclassification
- **Grading code**: City's own grading code (NOT OC County grading code)
- **Stormwater**: WQMP required for priority development; LID principles required
- **Pre-approved ADU plans**: Not available
- **RHNA**: 4,374 units allocated — pro-ADU environment
- **Online portal**: SmartGov (beta) — https://ci-placentia-ca.smartgovcommunity.com/Public/Home
- **Submittal**: 3 sets plans + PDF; PW approval required BEFORE building plan check
- **Development Services Director**: Joseph Lambert, (714) 993-8124
- **School fees**: $3.48/sq ft for ADUs over 500 sq ft (PYLUSD)

---

## Reference File Catalog

See `CLAUDE.md` for the complete catalog of all 12 reference files with descriptions and key topics.
