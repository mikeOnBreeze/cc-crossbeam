---
skill: california-adu
description: "Reference file catalog for the California ADU Regulatory Decision Engine"
total_files: 28
source: "HCD ADU Handbook, January 2025 + January 2026 Addendum"
---

# California ADU — Reference File Catalog

All reference files are in the `references/` directory. Each has YAML frontmatter with `title`, `category`, `relevance`, and `key_code_sections`.

Use the decision tree in `SKILL.md` to determine which files to load for a given query. Most questions require 3-5 files, not all 28.

---

## Unit Types

Classification files — load these first to determine which rules apply.

| File | Description | Key Code Sections |
|------|-------------|-------------------|
| `unit-types-66323.md` | The four Gov. Code § 66323 ADU categories and combinations table — what's allowed on each lot type | Gov. Code § 66323 |
| `unit-types-adu-general.md` | ADU definition, three physical types (attached, detached, converted), when each applies | Gov. Code §§ 66313(a), 66314 |
| `unit-types-jadu.md` | JADU-specific rules: 500 sq ft max, must be within existing/proposed dwelling, owner-occupancy, efficiency kitchen | Gov. Code §§ 66333-66339 |
| `unit-types-multifamily.md` | Multifamily ADU rules: converted from non-livable space, detached (up to 8 or 25% of units), size limits | Gov. Code §§ 66314, 66323 |

## Development Standards

Physical requirements for ADU construction.

| File | Description | Key Code Sections |
|------|-------------|-------------------|
| `standards-height.md` | Height limits by ADU type and context: 16 ft base, 18 ft transit/multistory, 25 ft attached | Gov. Code § 66321(b)(4) |
| `standards-size.md` | Size requirements: 150 sq ft efficiency, 850 sq ft 1-BR, 1,000 sq ft 2+BR, 1,200 sq ft max detached, FAR/lot coverage | Gov. Code §§ 66314(d)(4)-(5), 66321(b)(2)-(3), 66325(b) |
| `standards-setbacks.md` | Setback rules: 4 ft max side/rear, front setback limits, no setback for conversions | Gov. Code §§ 66314(d)(7), 66321(b)(3) |
| `standards-parking.md` | Parking requirements: max 1 space per ADU, 6 exemption categories (transit, historic, car share, etc.) | Gov. Code § 66314(d)(10)-(11) |
| `standards-fire.md` | Fire protection and sprinkler rules: when sprinklers are required, fire access, fire hazard zones | Gov. Code § 66314(d)(12); HSC § 13275 |
| `standards-solar.md` | Solar and energy code requirements: CalGreen/Title 24 applicability to ADUs | California Energy Code |
| `standards-design.md` | Objective vs. subjective design standards: prohibition on subjective review, bedroom requirements | Gov. Code §§ 66313(i), 66314(b)(1) |

## Permitting and Fees

Process rules, fee calculations, and funding sources.

| File | Description | Key Code Sections |
|------|-------------|-------------------|
| `permit-process.md` | Ministerial review: 15 business day completeness, 60-day approval, deemed-approved, appeal process, pre-approved plans (AB 1332) | Gov. Code §§ 66317(a)(2), 66317(d)(1), 66320(a), 66328, 66329(a), 65852.27 |
| `permit-fees.md` | Impact fees: ≤ 750 sq ft interior livable space exemption, proportionality to primary dwelling, school fees, assessable space, utility connection fees | Gov. Code §§ 66311.5, 66324, 66323; Ed. Code § 17620 |
| `permit-funding.md` | ADU financing programs: CalHFA ADU Grant, FHA guidelines, Freddie Mac, Fannie Mae products | Various |

## Zoning

Jurisdiction-wide rules and environmental constraints.

| File | Description | Key Code Sections |
|------|-------------|-------------------|
| `zoning-general.md` | General zoning rules: ADUs don't count toward density, density bonus law interaction, SDBL, zoning overrides | Gov. Code §§ 66326, 65915 |
| `zoning-hazards.md` | Hazard zone rules: very high fire hazard severity zones, coastal zone, Coastal Commission role | Gov. Code § 66329; PRC §§ 4125-4290 |
| `zoning-nonconforming.md` | Nonconforming zoning and building code violations: ADUs can be built despite nonconforming conditions | Gov. Code § 66322 |

## Ownership and Use

Rules about who can live in, rent, or sell ADUs.

| File | Description | Key Code Sections |
|------|-------------|-------------------|
| `ownership-use.md` | Owner-occupancy (JADUs only), 30-day minimum rental term, short-term rental prohibition, deed restrictions | Gov. Code §§ 66315, 66318, 66336 |
| `ownership-sales.md` | Separate conveyance rules, condominium conversion (AB 1033), qualified nonprofit requirements | Gov. Code §§ 66340-66342 |
| `ownership-hoa.md` | HOA restrictions: CC&Rs cannot prohibit ADUs, HOA review timeline limits, reasonable restrictions | Civ. Code §§ 4751, 714.3 |

## Special Topics

Specific housing types and related laws.

| File | Description | Key Code Sections |
|------|-------------|-------------------|
| `special-manufactured.md` | Manufactured homes as ADUs, mobilehome park rules, tiny homes classification | Gov. Code § 66313(a)(2); HSC §§ 18007, 18210 |
| `special-sb9.md` | SB 9 interaction: urban lot split, four-unit cap on single-family lots, how ADU law interacts with SB 9 | Gov. Code §§ 65852.21, 66411.7 |

## Compliance and Enforcement

Local ordinance rules, unpermitted ADUs, and housing planning.

| File | Description | Key Code Sections |
|------|-------------|-------------------|
| `compliance-unpermitted.md` | Unpermitted ADU legalization: pre-January 1, 2020 amnesty, inspection process, fee waivers, 5-year protection | Gov. Code §§ 66331, 66332 |
| `compliance-ordinances.md` | Local ADU ordinances: what cities must include, HCD review and enforcement powers, bonus unit programs | Gov. Code §§ 66314, 66325 |
| `compliance-housing.md` | Housing elements: RHNA credit for ADUs, Prohousing Designation Program, reporting requirements | Gov. Code §§ 65583, 66330 |
| `compliance-utilities.md` | Utility connections: separate connection rules, utility company requirements, CPUC complaint process | Gov. Code § 66324(d)-(e) |

## Reference

Glossary and legislative history.

| File | Description | Key Code Sections |
|------|-------------|-------------------|
| `glossary.md` | All defined terms from the handbook with legal citations | Gov. Code § 66313; Various |
| `legislative-changes.md` | Bill summaries (2019-2025), SB 477 renumbering table, statutory changes table | Gov. Code §§ 66310-66342, 66311.5, 66333.5 |
