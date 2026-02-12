---
name: buena-park-adu
version: "1.0"
description: "City-level ADU regulations for Buena Park, California. This skill should be used when answering ADU questions specific to Buena Park — local ordinance provisions, development standards, permit process, fees, fire (OCFA) requirements, zoning, and anything that differs from or adds to California state ADU law. This skill layers on top of the california-adu state law skill. Load state law first, then use this skill for Buena Park-specific requirements."
source: "Buena Park Municipal Code § 19.348.010 (June 2025), HCD Findings (May 2025), ecode360/QCode, city website, OCFA"
authority: "City of Buena Park Community Development Department"
law_as_of: "July 22, 2025 (Ordinance No. 1757)"
---

# Buena Park ADU — City Regulatory Skill

This skill contains Buena Park's city-level ADU rules — the local ordinance, development standards, permit process, fees, and fire/zoning requirements that supplement or override California state ADU law.

**How this skill relates to state law**: The `california-adu` skill covers the state floor (Gov. Code §§ 66310-66342). This skill covers what Buena Park adds, matches, or potentially conflicts with. **Always load state law context first**, then layer this skill on top for city-specific questions.

**What this covers**: Buena Park Municipal Code § 19.348.010, Title 15 building codes, Title 19 zoning, OCFA fire requirements, permit process, fees, and local development standards.

**What this does NOT cover**: State-level ADU law (use `california-adu` skill), federal requirements, or project-specific engineering.

---

## Decision Tree Router

### STEP 1: What's the Question About?

| Topic | Load These References |
|-------|----------------------|
| **ADU height, setbacks, size, or units allowed** | `ordinance-adu-standards.md` |
| **Parking requirements or exemptions** | `ordinance-adu-standards.md`, `transit-parking.md` |
| **Design standards, JADU rules, sale/rental** | `ordinance-adu-rules.md` |
| **Fire sprinklers, OCFA review, road access** | `fire-ocfa.md` |
| **Which building codes apply, local amendments** | `building-codes.md` |
| **Zoning zones, lot coverage, base setbacks** | `zoning-residential.md` |
| **Permit process, submittal, who to contact** | `permit-process.md` |
| **Fees, impact fees, exemptions** | `fees-impacts.md` |
| **Utilities, drainage, grading, stormwater** | `utilities-grading.md` |
| **Energy code, insulation, solar** | `energy-climate.md` |
| **Transit stops, height bonus, parking exemption zones** | `transit-parking.md` |
| **Housing policy, SB 9, pre-approved plans** | `context-housing-sb9.md` |

### STEP 2: Does a State Law Conflict Apply?

If the question involves any of these topics, also load `hcd-compliance.md`:

- Unit combinations (how many ADUs + JADUs on one lot)
- Front setback conditions
- Zoning nonconformities
- Unpermitted ADU legalization (AB 2533)
- Outdated code references in the ordinance

**Key principle**: Where Buena Park's ordinance is more restrictive than state law, **state law preempts**. The `hcd-compliance.md` file identifies the known conflict areas.

### STEP 3: Need More Information?

Every reference file includes URLs to city websites, ecode360, OCFA documents, and fee schedules. If a question requires information beyond what's in the reference files, use these URLs with web search or browser tools to find the answer.

---

## Quick-Reference: Buena Park vs. State Law

These are the key numbers where Buena Park differs from or matches state law. Check here first before loading a reference file.

| Standard | State Law (Floor) | Buena Park | Delta |
|----------|-------------------|------------|-------|
| **ADU max size (0-1 BR)** | 850 sq ft | 850 sq ft | Matches |
| **ADU max size (2+ BR)** | 1,000 sq ft | 1,000 sq ft | Matches |
| **Detached height (base)** | 16 ft | 16 ft | Matches |
| **Attached height** | 25 ft / primary height | **30 ft / 2 stories** | **More permissive** |
| **Near-transit detached height** | 18 ft | **20 ft** | **More permissive** |
| **Side/rear setbacks** | 4 ft max | 4 ft | Matches |
| **Second story balcony setback** | Not specified | **5 ft** | **Additional requirement** |
| **External staircase** | Not restricted | **No street-facing** | **Additional restriction** |
| **Parking** | 1 space max, 6 exemptions | 1 space, **7 exemptions** | **More permissive** |
| **Unit combos (SF lot)** | Converted + detached + JADU | JADU + 1 ADU | **Potentially more restrictive** |
| **Impact fee exemption** | <= 750 sq ft | <= 750 sq ft | Matches |
| **Fire sprinklers** | Only if required for primary | Same | Matches |
| **Approval timeline** | 60 days | 60 days | Matches |
| **Lot coverage** | Not specified by state | **40% all zones** | City standard |
| **Design match** | Objective standards only | **Match primary dwelling** | City-specific detail |

---

## Key Buena Park Facts

- **Fire service**: OCFA (not city fire department) — separate plan review may be required
- **Zoning zones**: RS-6, RS-8, RS-10, RS-16 (single-family); RM-20 (multifamily)
- **Building codes**: 2022 California Building Standards Code editions (city has NOT adopted 2025 editions yet, but plans must reference 2025 Edition code cycle)
- **Climate zone**: 8 (standard SoCal Title 24 requirements)
- **Transit**: Buena Park Metrolink Station (major transit stop) + OC Bus Rapid 529 on Beach Blvd
- **Grading code**: 1993 Orange County Grading and Excavation Code
- **Stormwater**: 1.85" first-flush retention requirement
- **Pre-approved ADU plans**: Not available
- **RHNA**: 8,919 units allocated, massive shortfall — pro-ADU environment
- **Plan submission**: In-person only, Mon–Thu 7:30 AM–5:00 PM
- **Building Official**: Jose Ibarra, 714-562-3681

---

## Reference File Catalog

See `CLAUDE.md` for the complete catalog of all 12 reference files with descriptions and key topics.
