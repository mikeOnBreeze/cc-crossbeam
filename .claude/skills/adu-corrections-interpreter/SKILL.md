---
name: adu-corrections-interpreter
description: Interprets ADU (Accessory Dwelling Unit) permit corrections letters from California city building departments. This skill should be used when a user provides a corrections letter (PDF, PNG, or image) from a plan check review and needs to understand what each correction means, what code is being cited, and what the contractor needs to do to fix it. Triggers on tasks involving permit corrections, plan check comments, building department review letters, or ADU compliance questions.
---

# ADU Corrections Interpreter

## Overview

Interpret ADU permit corrections letters by reading the letter, identifying each correction item, researching the referenced building codes and city-specific requirements, and producing an actionable breakdown the contractor can hand to their design team.

## Workflow

### Phase 1: Read the Corrections Letter

Read the corrections letter using vision capabilities. The letter will typically be 1-3 pages of typed text, provided as PNG images or a PDF.

Extract from the letter:
- **Project info**: address, jurisdiction number, job description, date, reviewer name/contact
- **Each numbered correction item**, noting:
  - The correction comment text
  - Any **code references** (e.g., CRC R302.1, ASCE 7-16 §30.11, CBC Chapter 7A)
  - Any **plan sheet references** (e.g., "Sheet S1", "Detail 2/A3", "Calc Sheet 3 of 37")
  - Whether it is a **1st review** (outstanding) or **2nd review** (new) comment
  - Whether it is bold/emphasized (indicates new or escalated concern)

### Phase 2: Categorize the Corrections

Group each correction into one of these categories:

1. **Administrative / Plan Formatting** — stamps, signatures, sheet index, governing codes on cover sheet, labeling (e.g., "For Reference Only"). These are drafter fixes, no engineering required.

2. **Utility Connections** — sewer, water, gas, electrical. Typically requires showing connection details per city standard details and justifying pipe/meter sizing.

3. **Structural / Engineering** — calculations, load paths, wind loads, seismic, bracing details. Requires a structural engineer to update calcs and provide details.

4. **Fire & Life Safety** — fire separation distance, fire-rated assemblies, property line setbacks. Requires showing code-compliant details on plans.

5. **Site / Grading / Drainage** — drainage slopes, grading plans, site conditions. Requires showing slopes and directions on site plan.

6. **Plan Consistency** — elevation views not matching roof plan, details not matching conditions. Requires the drafter/architect to reconcile drawings.

### Phase 3: Research the Codes

For each correction that references a building code or city requirement, research it using web browser tools and/or parallel subagents.

**Strategy for parallel research:**
- Launch one subagent per major code topic (not per correction item — group related items)
- Typical groupings: (1) city municipal code / local requirements, (2) CRC/CBC structural or fire codes, (3) ASCE or other engineering standards
- Three parallel subagents is the sweet spot — keeps research fast without overwhelming

**For city-specific requirements:**
1. Search for `"City of [Name]" municipal code` on Google
2. Look for the city's code on ecode360.com, library.municode.com, qcode.us, or the city's own website
3. Search the city website for standard details (e.g., ADU sewer connection details, which cities often publish as PDFs)
4. Identify the specific municipal code chapters relevant to ADU construction — typically building code adoption (with local amendments), grading/excavation, and zoning/ADU regulations

**For state/national codes (CRC, CBC, ASCE, etc.):**
1. Search for the specific section number (e.g., "CRC R302.1 fire separation distance")
2. Use up.codes, ICC digital codes, or engineering forums (eng-tips.com) for interpretation
3. Focus on what the code **requires** and what **options** satisfy the requirement

See `references/common-adu-codes.md` for a quick-reference of codes that frequently appear in California ADU corrections letters.

### Phase 4: Compile the Actionable Breakdown

Produce a structured summary organized by correction item number. For each item include:

- **What the reviewer is asking for** (plain English)
- **What the code requires** (the actual standard, with options if applicable)
- **What the contractor/design team needs to do** (specific deliverable)
- **Who needs to do it** (drafter, structural engineer, or architect)
- **Links to relevant resources** (city standard details, code sections, municipal code URLs)

Format the output as a markdown document with:
- A header block with project info
- A table of key reference links
- Each correction item as its own section
- Clear delineation between 1st review (outstanding) and 2nd review (new) comments

### Phase 5: Flag the High-Effort Items

At the end of the breakdown, call out:
- Which items require **professional engineering work** (structural calcs, fire-rated assembly details)
- Which items are **drafter fixes** (labeling, formatting, reconciling drawings)
- Which items may require **city coordination** (utility connections, grading clarifications)

This helps the contractor prioritize and assign work efficiently.

## Important Notes

- This skill reads corrections letters visually — no PDF text extraction pipeline is needed. Vision capabilities handle 1-3 page typed letters directly.
- The skill does NOT cross-reference corrections against the actual construction plan set. It interprets what the reviewer is asking and researches the codes. Cross-referencing with plans is a separate workflow.
- Always note when a correction references a specific plan sheet/detail — the contractor needs this to locate what needs to change.
- City standard details (like sewer connection details) are often published as PDFs on the city's website. Search for them directly.

## References

This skill includes a quick-reference for common California ADU building codes:

- `references/common-adu-codes.md` — Frequently cited codes in ADU corrections letters with brief explanations of what each covers
