---
title: "Cover Sheet — Plan Review Checklist"
category: plan-review
sheet_type: cover
relevance: "Load when reviewing a cover sheet (typically A0, A1, or T1 — the first architectural sheet). Defines required elements with code citations, visual identification guidance, and confidence calibration for AI-assisted review."
applies_to_sheets: ["cover sheet", "title sheet", "T1", "A0", "A1"]
---

## Cover Sheet — Plan Review Checklist

### Purpose of This File

This file defines WHAT must appear on a construction plan cover sheet for a California ADU project and WHY (per building code, statute, or professional standard). Each check includes a code basis, visual identification guidance, common deficiency patterns, and a confidence assessment.

This is a **knowledge file** — it does not prescribe a checking procedure. Any workflow that needs to evaluate a cover sheet (city plan review, contractor self-check, permit completeness screening) loads this file to know what to look for.

### Two Confidence Dimensions

Every check has two independent confidence ratings:

| Dimension | What It Measures | Scale |
|-----------|-----------------|-------|
| **Code confidence** | How certain is the legal requirement? | HIGH = explicit code section; MEDIUM = professional standard / common city requirement; LOW = best practice only |
| **Visual confidence** | How reliably can a vision model detect this from a plan PNG? | HIGH = distinct graphic/text element; MEDIUM = requires reading small text or interpreting layout; LOW = requires judgment or comparison |

A check can be HIGH code confidence but LOW visual confidence (e.g., "structural calcs must bear engineer's stamp" — the law is clear, but reading a stamp in a 200 DPI PNG is hard). Or MEDIUM code confidence but HIGH visual confidence (e.g., vicinity map — not explicitly required by CBC but easy to see if it's there).

---

## 1. Professional Stamps and Signatures

> Code confidence: **HIGH** | Visual confidence: **MEDIUM-HIGH**

### 1A. Design Professional Stamp

**Requirement:** Final drawings and calculations shall be stamped and signed by the respective Registered Design Professional. The date of signing must appear below the stamp. Digital stamps and signatures must be noted as such on the plan.

**Code basis:**
- B&P Code § 5536.1 — Plans for buildings/structures must bear stamp of licensed architect, with signature and date
- B&P Code § 5802 — Practice of professional engineering
- B&P Code § 6735 — Civil/structural engineering practice; calcs and plans must bear engineer's stamp
- CBC § 107.1 — Submittal documents for building permits

**Exemptions to know:**
- B&P Code § 5537 — Architect stamp exemption for single-story wood-frame dwellings and certain agricultural buildings. Many ADUs qualify for this exemption (single-story, wood-frame, on a lot with ≤ 3 dwelling units). When this exemption applies, a licensed designer (not architect) may stamp the plans.
- Structural sheets still require a licensed engineer's stamp regardless of the architectural exemption.

**Visual identification:**
- Circular or rectangular stamp impression — look in title block area (lower-right corner) or upper-right of the cover sheet
- Stamp contents: license number, professional name, "Licensed Architect" / "Registered Civil Engineer" / "Structural Engineer," state of California
- Signature: handwritten mark overlapping or adjacent to stamp
- Date: written below signature, typically MM/DD/YYYY format

**Common deficiencies:**
- Stamp present but unsigned
- Stamp present but no date of signing
- Digital stamp without digital notation (B&P Code § 5536.1 requires digital stamps to be noted)
- Plans prepared by unlicensed person without qualifying B&P § 5537 exemption
- Structural engineer stamp missing when structural sheets are included in the set

### 1B. Wet Signature on All Sheets

**Requirement:** Designer wet signature is required on all sheets — not just the cover.

**Code basis:**
- B&P Code § 5536.1 — Signature requirement applies to plans and instruments of service

**Visual identification:**
- Handwritten signature near the stamp on each sheet's title block
- Ink variation can indicate original vs. photocopy (originals show slight pressure variation; photocopies are flat)

**Common deficiencies:**
- Cover sheet signed, other sheets unsigned
- Photocopied signatures (some jurisdictions reject these)
- Signature present but no professional stamp adjacent

**Cross-sheet note:** This check applies to EVERY sheet. The cover sheet check establishes the baseline — are stamps/signatures present at all? Individual sheet reviews verify per-sheet compliance.

---

## 2. Governing Codes

> Code confidence: **HIGH** | Visual confidence: **HIGH**

### 2A. Applicable Code List with Edition Year

**Requirement:** Construction documents shall indicate the applicable building codes and edition years governing the project.

**Code basis:**
- CBC § 107.2.1 — Construction documents shall reference applicable building codes
- CBC § 101.4 — Referenced codes and standards; specific editions listed
- Professional standard — universally required by California jurisdictions

**Required codes for California residential ADU projects:**

| Code | Full Name | 2025 Cycle (eff. Jan 1, 2026) | 2022 Cycle (eff. Jan 1, 2023) |
|------|-----------|-------------------------------|-------------------------------|
| CBC | California Building Code | 2025 CBC | 2022 CBC |
| CRC | California Residential Code | 2025 CRC | 2022 CRC |
| CPC | California Plumbing Code | 2025 CPC | 2022 CPC |
| CMC | California Mechanical Code | 2025 CMC | 2022 CMC |
| CEC | California Electrical Code | 2025 CEC | 2022 CEC |
| CEnC | California Energy Code (Title 24 Part 6) | 2025 CEnC | 2022 CEnC |
| CALGreen | CA Green Building Standards Code (Title 24 Part 11) | 2025 CALGreen | 2022 CALGreen |
| CFC | California Fire Code | 2025 CFC | 2022 CFC |

**Also commonly listed:**
- ASCE 7 — Minimum Design Loads and Associated Criteria (referenced by CBC Chapter 16)
- ACI 318 — Structural concrete (if applicable)
- NDS — National Design Specification for Wood Construction (if wood-frame)
- NFPA 13D — Sprinkler systems for residential occupancies (if sprinklered)

**Visual identification:**
- Text block or table on cover sheet, typically titled "Governing Codes," "Applicable Codes," "Code References," or "Design Criteria"
- Look for abbreviations (CBC, CRC, CPC...) followed by edition years
- Usually appears in the upper or middle portion of the cover sheet, or within the building data section

**Common deficiencies:**
- Outdated edition year (e.g., listing 2022 CBC for a project submitted under the 2025 cycle)
- Missing codes — CEnC and CALGreen are the most commonly omitted
- No code list at all (frequent on plans from less experienced designers)
- Codes listed without edition years

### 2B. Local Municipal Code Reference

**Requirement:** Plans should reference the local jurisdiction's municipal code.

**Code basis:**
- City-specific — most California jurisdictions require their municipal code to be listed among governing codes on construction documents
- This is a near-universal plan check item across cities

**Visual identification:**
- "City of [Name] Municipal Code" or specific title/chapter reference in the governing codes section
- May reference specific sections (e.g., "Placentia Municipal Code Title 23 — Building and Housing")

**Common deficiencies:**
- State codes listed but no local code reference
- Generic "local codes apply" language instead of naming the specific municipal code
- Wrong city name (happens when plans are reused from another project)

**Note:** For state-law-only review (Tier 1), flag if NO local jurisdiction code appears. For city-specific review (Tier 2/3), flag if the specific city's code is not named.

---

## 3. Project Identification

> Code confidence: **HIGH** | Visual confidence: **HIGH**

### 3A. Project Address and Location

**Requirement:** Construction documents shall clearly identify the project site.

**Code basis:**
- CBC § 107.2.1 — Construction documents; project address
- Standard permitting requirement — every California jurisdiction requires address on plans

**Required elements:**

| Element | Notes |
|---------|-------|
| Street address | Number + street name |
| City, State, ZIP | Full jurisdiction identification |
| Assessor's Parcel Number (APN) | Format varies by county (XXX-XXX-XX or similar) |
| Legal description | Lot, Block, Tract reference — OR reference to recorded parcel/tract map |

**Visual identification:**
- Title block area (lower-right or upper-right of sheet)
- APN is a numeric string, often prefixed "APN:" or "Assessor's Parcel No."
- Legal description references a tract map number or lot/block

**Common deficiencies:**
- Address present but no APN
- APN present but no legal description
- City name missing or wrong (reused plan set from another project)

### 3B. Scope of Work Description

**Requirement:** Plans must describe the proposed work.

**Code basis:**
- CBC § 107.2.1 — Description of proposed work
- City submittal requirements (universal)

**Required content:**
- Construction type: new construction, addition, conversion, or remodel
- Building use: ADU, JADU, or combined
- Brief narrative (e.g., "New detached 600 sq ft ADU at rear of property")

**Why this matters beyond admin:**
- "New" vs. "conversion" determines which state law setback rules apply (no setback required for conversions per Gov. Code § 66314(d)(7))
- "ADU" vs. "JADU" determines owner-occupancy, size limits, and fee rules
- Square footage determines fee exemption threshold (≤ 750 sq ft per Gov. Code § 66324)

**Visual identification:**
- Text in title block or header area
- Key terms: "ADU," "Accessory Dwelling Unit," "JADU," "new construction," "conversion," "detached," "attached"

**Common deficiencies:**
- No scope description at all
- Vague description ("residential addition" without specifying ADU)
- Doesn't distinguish new vs. conversion

**Cross-reference:** `california-adu` → `unit-types-adu-general.md` for ADU type definitions; `permit-fees.md` for fee threshold implications.

---

## 4. Building Data

> Code confidence: **HIGH** | Visual confidence: **HIGH** (presence) / **MEDIUM** (accuracy)

### 4A. Building Data Table

**Requirement:** Plans should include a building data summary showing occupancy, construction type, and key design parameters.

**Code basis:**
- CBC § 107.2.1 — Construction documents; building description
- CBC Table 504.4 — Allowable building height by construction type
- CBC Table 506.2 — Allowable area by construction type
- CBC Chapter 3 — Use and occupancy classification

**Required data points:**

| Data Point | Typical ADU Value | Why It Matters |
|------------|-------------------|----------------|
| Occupancy classification | R-3 (one- and two-family dwellings) | Determines applicable code provisions |
| Construction type | V-B (most ADUs) or V-A | Determines fire resistance, allowable area/height |
| Number of stories | 1 or 2 | Affects structural, egress, fire requirements |
| Building height (ft) | 16 ft max detached (state law) | Gov. Code § 66321(b)(4); must match elevations |
| Building area (sq ft) | ≤ 1,200 sq ft detached (state law) | Gov. Code § 66314(d)(4)-(5); must match floor plan |
| Fire sprinkler required? | Follows primary residence | Gov. Code § 66314(d)(12) |
| Climate zone | 1-16 (CEC climate zone map) | Title 24 energy compliance path |
| Wind speed / exposure | Per ASCE 7 Figure 26.5-1 | Structural design parameter |
| Seismic design category | Per ASCE 7 / CBC Chapter 16 | Structural design parameter |
| Soil type | Per geotechnical report or CBC default | Foundation design parameter |

**Visual identification:**
- Table or data block titled "Building Data," "Project Data," "Code Analysis," or "Design Criteria"
- May be combined with governing codes section
- Look for the two-column format: label | value

**Common deficiencies:**
- Missing entirely (common on less detailed plan sets)
- Present but incomplete — occupancy and construction type listed, but no climate zone, wind speed, or seismic category
- Building area doesn't distinguish gross vs. net, or total vs. interior livable (matters for the 750 sq ft fee threshold and 1,200 sq ft max — both measured as "interior livable" per state law)
- Building height listed doesn't match elevation drawings

**Cross-sheet checks (originate here, verify elsewhere):**

| Cover Sheet Value | Verify Against | Check Sheet(s) |
|-------------------|----------------|-----------------|
| Building area (sq ft) | Floor plan area calculations | Floor plan |
| Building height (ft) | Elevation dimension callouts | Elevations |
| Number of stories | Section and elevation views | Elevations, building sections |
| Fire sprinkler (yes/no) | Sprinkler plan or plumbing notes | Plumbing / fire protection sheet |
| Construction type | Structural details and framing | Structural sheets |

**Cross-reference:** `california-adu` → `standards-size.md` for state law area thresholds; `standards-height.md` for height limits; `standards-fire.md` for sprinkler rules.

---

## 5. Sheet Index

> Code confidence: **MEDIUM** (professional standard, not explicit CBC section) | Visual confidence: **HIGH**

### 5A. Sheet Index Present

**Requirement:** Cover sheet should include an index listing all sheets in the plan set with their descriptions.

**Code basis:**
- Professional standard — universally expected by plan checkers
- City submittal requirements (most cities explicitly require a sheet index)
- CBC § 107.2.1 — Implied by requirement that construction documents be organized and complete

**Visual identification:**
- Table with two columns: sheet ID (e.g., A1, S1, M1) and description (e.g., "Floor Plan," "Foundation Plan")
- Typically lower half of cover sheet or second column
- Discipline prefixes: A = Architectural, S = Structural, M = Mechanical, P = Plumbing, E = Electrical, C = Civil, T24 = Energy, L = Landscape

**Common deficiencies:**
- No sheet index at all
- Index present but incomplete (sheets added during design but index not updated)
- Index descriptions don't match actual sheet content

### 5B. Sheet Index Matches Actual Plan Set

**Requirement:** Every sheet listed in the index must be in the binder. Every sheet in the binder must be in the index.

**Code basis:**
- Professional standard
- Plan checker verification item (explicitly flagged in Placentia corrections: "make sure that all the sheets in the set correspond with the SHEET INDEX and that all notes/detail references are correct & applicable")

**Verification approach:**
- Compare the sheet index table on the cover sheet with the sheet manifest produced by the plan extraction process
- Three types of discrepancy:
  1. **Sheet in index but missing from binder** — listed but not submitted
  2. **Sheet in binder but missing from index** — submitted but not listed
  3. **Description mismatch** — sheet exists but index description doesn't match content

**Cross-reference:** The `adu-targeted-page-viewer` skill produces a `sheet-manifest.json` that maps sheet IDs to page numbers. This manifest is the ground truth for this check.

---

## 6. Vicinity Map

> Code confidence: **MEDIUM** (city requirement, not CBC) | Visual confidence: **MEDIUM**

### 6A. Vicinity Map or Location Map

**Requirement:** Plans should include a small-scale map showing the project location relative to nearby streets and landmarks.

**Code basis:**
- City-specific submittal requirements — most California cities require a vicinity map
- Not explicitly required by CBC, but near-universally expected on residential plan sets

**Visual identification:**
- Small map graphic, typically upper portion of cover sheet or on the site plan sheet
- Shows streets, intersections, and a marker or arrow indicating the project location
- May include a north arrow and approximate scale
- Sometimes sourced from a map service printout embedded in the drawing

**Common deficiencies:**
- No vicinity map at all
- Map present but project location not marked
- Map too zoomed in — doesn't show enough surrounding context for a reviewer to locate the site
- Map on site plan sheet but not on cover (acceptable for some cities, not others)

---

## 7. General Notes

> Code confidence: **MEDIUM** | Visual confidence: **MEDIUM** (presence) / **LOW** (completeness)

### 7A. General Construction Notes

**Requirement:** Plans should include general construction notes applicable to the project.

**Code basis:**
- Professional standard
- City submittal requirements

**Commonly required notes:**
- "Contractor shall verify all dimensions in field prior to construction"
- "Report any discrepancies to architect/designer before proceeding"
- "Do not scale drawings"
- "All work shall comply with [governing codes]"
- Foundation notes (if on cover rather than structural sheet)

**Visual identification:**
- Dense text block titled "General Notes," "Construction Notes," or simply "Notes"
- Often numbered or bulleted
- May be on cover sheet or on a separate general notes sheet (G1)

**Common deficiencies:**
- No general notes at all
- Notes present but too generic (boilerplate without project-specific content)
- Missing code-required notes (e.g., special inspection requirements per CBC § 1704)

### 7B. Special Inspection Requirements

**Requirement:** Projects requiring special inspections must identify them on the plans.

**Code basis:**
- CBC § 1704 — Special inspections and tests; general requirements
- CBC § 1705 — Required special inspections (concrete, structural steel, masonry, wood shear walls, etc.)
- CBC Table 1705.3 — Required verifications and inspections of steel construction
- CBC Table 1705.5 — Required verifications and inspections of wood construction

**Visual identification:**
- Section titled "Special Inspections" or "Required Special Inspections"
- May be included within general notes or as a separate table
- References to CBC § 1704, § 1705, or specific table numbers

**Common deficiencies:**
- No special inspection notes when structural work is proposed
- Generic notes that don't identify which specific inspections are required for this project
- Present on structural sheet but not referenced on cover sheet

**Note:** For most single-story wood-frame ADUs, special inspections may be limited. For two-story ADUs, concrete, or steel construction, the list grows significantly. This is a check where code confidence is HIGH (the law is clear that special inspections must be identified) but visual completeness confidence is LOW (determining whether ALL applicable inspections are listed requires engineering knowledge).

---

## Confidence Summary

| # | Check | Code Confidence | Visual Confidence | Notes |
|---|-------|----------------|-------------------|-------|
| 1A | Design professional stamp present | HIGH | HIGH | Distinct graphic element |
| 1A | Stamp signed and dated | HIGH | MEDIUM | Requires reading small text within stamp |
| 1B | Wet signature on cover sheet | HIGH | MEDIUM | Distinguishing original from photocopy is hard |
| 2A | Governing codes list present | HIGH | HIGH | Recognizable text block with code abbreviations |
| 2A | All required codes listed | HIGH | HIGH | Enumerable — check against known required set |
| 2A | Correct edition year | HIGH | HIGH | Numeric comparison against known current cycle |
| 2B | Local municipal code named | MEDIUM | HIGH | Specific city name in code list |
| 3A | Project address on plans | HIGH | HIGH | Text in title block |
| 3A | APN present | HIGH | HIGH | Numeric string, usually labeled |
| 3B | Scope of work described | HIGH | HIGH | Text block with ADU keywords |
| 4A | Building data table present | HIGH | HIGH | Structured data block |
| 4A | Building data complete | HIGH | MEDIUM | Requires checking each field against expected set |
| 4A | Building data accurate vs. other sheets | HIGH | LOW | Requires cross-sheet comparison |
| 5A | Sheet index present | MEDIUM | HIGH | Recognizable table format |
| 5B | Sheet index matches binder | MEDIUM | HIGH | Mechanical cross-check against sheet manifest |
| 6A | Vicinity map present | MEDIUM | MEDIUM | Graphic detection, less structured |
| 7A | General notes present | MEDIUM | MEDIUM | Text block detection |
| 7B | Special inspections identified | HIGH | LOW | Requires reading dense text and engineering judgment |

---

## Cross-Sheet Checks That Originate on the Cover Sheet

These findings START with the cover sheet data but require viewing other sheets to verify. They are listed here for awareness — the actual cross-checks are performed when those other sheets are reviewed.

| Cover Sheet Claim | Verify Against | Target Sheet Type |
|-------------------|----------------|-------------------|
| Building area (sq ft) | Calculated area on floor plan | Floor plan |
| Building height (ft) | Dimension callouts on elevations | Elevations |
| Number of stories | Section cuts and elevation views | Elevations, building sections |
| Construction type | Framing details and structural notes | Structural sheets |
| Fire sprinkler (yes/no) | Sprinkler plan, plumbing notes, or fire protection sheet | Plumbing / FP sheets |
| Climate zone | Title 24 compliance forms | Energy compliance sheets |
| Sheet index vs. actual set | Sheet manifest from plan extraction | All sheets |
| Scope (new vs. conversion) | Site plan showing existing + proposed conditions | Site plan |

---

## What This Checklist Does NOT Cover

- **Engineering adequacy** — Whether structural calculations are correct, whether the foundation design is adequate, whether the framing is properly sized. These require licensed professional review. Flag for `[REVIEWER]`.
- **Code interpretation disputes** — Where a requirement is ambiguous or a design professional has made a judgment call. Flag for `[REVIEWER]`.
- **City-specific submittal requirements** — Requirements beyond state building code (e.g., city-specific forms, fee receipts, supplemental documents). Supplement with city-specific checklist from `adu-city-research` findings.
- **Aesthetic or design review** — Prohibited for ADUs per Gov. Code § 66314(b)(1). ADUs are approved ministerially using objective standards only. If a finding requires subjective judgment, it should NOT be included in the corrections letter.
- **Content on other sheets** — This file covers the cover sheet only. Separate checklist files cover site plan, floor plan, elevations, structural, and energy compliance sheets.

---

## Key Code Sections

- B&P Code § 5536.1 — Architect stamp, signature, and date requirements
- B&P Code § 5537 — Exemptions from architect licensure (single-story wood-frame dwellings)
- B&P Code § 5802 — Professional engineering practice
- B&P Code § 6735 — Civil/structural engineering; stamp requirement
- CBC § 101.4 — Referenced codes and standards
- CBC § 107.1 — Submittal documents for building permits
- CBC § 107.2.1 — Construction documents; project description, applicable codes
- CBC § 1704 — Special inspections; general requirements
- CBC § 1705 — Required special inspections and tests
- Gov. Code § 66311 — Standards shall not unreasonably restrict ADU creation
- Gov. Code § 66313(i) — Definition of objective standards
- Gov. Code § 66314(b)(1) — Objective standards required; ministerial review
- Gov. Code § 66314(d)(4)-(5) — ADU size limits
- Gov. Code § 66314(d)(7) — Setback rules (new vs. conversion distinction)
- Gov. Code § 66314(d)(12) — Fire sprinkler requirement follows primary residence
- Gov. Code § 66321(b)(4) — Height limits
- Gov. Code § 66324 — Fee exemption threshold (≤ 750 sq ft interior livable)
