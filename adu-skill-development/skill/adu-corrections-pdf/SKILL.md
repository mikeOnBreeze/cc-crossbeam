---
name: adu-corrections-pdf
description: "Formats a draft corrections letter (markdown) into a professional PDF. Single-purpose formatting sub-agent — no research. Receives markdown from the research agent, generates a styled PDF using the document-skills/pdf primitive, and returns a screenshot for QA. If the main agent finds issues in the screenshot, it will re-invoke this skill with fix instructions."
---

# ADU Corrections PDF Generator

## Overview

Take a draft corrections letter in markdown and produce a professional PDF. This is a **formatting-only** sub-agent invoked by the research agent at the end of the pipeline.

**Depends on:** `document-skills/pdf` — the primitive PDF skill. Load it for the actual PDF generation tools (reportlab for Python, pdf-lib for JavaScript). This skill adds the domain-specific formatting on top.

## What This Skill Does and Does NOT Do

| Does | Does NOT |
|------|----------|
| Apply city letterhead styling | Research codes or review plans |
| Format sections, tables, confidence badges | Modify correction content |
| Generate paginated PDF | Make judgment calls about findings |
| Return screenshot for QA | Decide what goes in the letter |

## Inputs

| Input | Format | Required |
|-------|--------|----------|
| Draft corrections markdown | `.md` file path | Yes |
| City name | String | Yes |
| Project address | String | Yes |
| Project info | Object: applicant, designer, engineer, scope, dates | Yes |
| Output path | File path for the `.pdf` | Yes |
| Fix instructions | String (only on re-invocation after failed QA) | No |

## Outputs

| Output | Format |
|--------|--------|
| Corrections letter PDF | `.pdf` at specified output path |
| QA screenshot | `.png` of page 1 — returned to calling agent |

## Workflow

### Step 1: Read Draft Markdown

Read the `.md` file. Validate expected structure: header block, notice, numbered sections, summary tables. Log warnings on unexpected structure but don't fail.

If `fix_instructions` are provided (re-invocation after failed QA), apply them before generating. Fix instructions might say: "Header is cut off — add more top margin" or "Table overflows page — reduce font size."

### Step 2: Generate PDF

**Use the `document-skills/pdf` primitive skill** for the actual PDF generation. Two recommended approaches:

**Approach A: reportlab (Python — best for structured layouts)**

Use `reportlab.platypus` (SimpleDocTemplate, Paragraph, Table, Spacer, PageBreak) to build the letter programmatically. See `document-skills/pdf/SKILL.md` for reportlab patterns. This gives the most control over pagination, headers/footers, and table formatting.

Key reportlab elements for this letter:
- `SimpleDocTemplate` with letter pagesize and margins
- `Paragraph` with custom styles for section headers, item titles, body text, code citations
- `Table` + `TableStyle` for the review summary and sheet manifest tables
- Custom `PageTemplate` for the city letterhead header and draft footer on every page

**Approach B: markdown → HTML → PDF (faster to implement)**

1. Convert markdown to HTML (use `marked` npm or Python `markdown` library)
2. Inject into HTML template with `references/letter-styles.css`
3. Render to PDF using puppeteer, `md-to-pdf`, or `wkhtmltopdf`

See `document-skills/pdf/reference.md` for pypdfium2 rendering and pdf-lib JavaScript options.

### Step 3: Screenshot for QA

Convert page 1 of the generated PDF to a PNG. Use `document-skills/pdf` tools:

```python
# Using pypdfium2 (from document-skills/pdf/reference.md)
import pypdfium2 as pdfium
pdf = pdfium.PdfDocument("corrections_letter.pdf")
bitmap = pdf[0].render(scale=2.0)
img = bitmap.to_pil()
img.save("qa_screenshot.png")
```

Or command line:
```bash
pdftoppm -png -r 200 -f 1 -l 1 corrections_letter.pdf qa_screenshot
```

Return the screenshot path to the calling agent. **The calling agent handles the QA decision — this skill just provides the screenshot.**

## Letter Format Spec

### Page Layout
- **Size:** US Letter (8.5" x 11")
- **Margins:** 1" top/bottom, 0.75" left/right
- **Font:** Arial/Helvetica — 10pt body, 12pt section headers, 14pt city name
- **Line spacing:** 1.3

### Header (every page)
```
CITY OF [CITY NAME]
BUILDING AND SAFETY DIVISION
PLAN CHECK CORRECTIONS — AI-ASSISTED DRAFT
```

### AI Notice Banner (page 1 only)
Light yellow box with amber border:
> NOTICE: This is an AI-generated DRAFT corrections letter. Items flagged [VERIFY] require closer inspection. Items flagged [REVIEWER] require licensed professional assessment. A human plan checker must review and approve before issuance.

### Confidence Badges (inline, color-coded)
- **CONFIRM** → green (quick check, HIGH confidence)
- **VERIFY** → amber (needs closer look, MEDIUM confidence)
- **REVIEWER** → red (requires licensed professional)
- **COMPLETE** → gray (human must fill in entirely)

### Footer (every page)
```
Page [N] of [M]
AI-Assisted Draft — Not For Issuance Without Review
CrossBeam ADU Plan Review | [Timestamp]
```

### Section Order
1. Planning / Zoning
2. Building
3. Site / Civil
4. Fire / Life Safety
5. Structural [REVIEWER]
6. Process Notes (Informational)
7. Review Summary (tables)

## Dependencies

| Skill | What It Provides |
|-------|-----------------|
| `document-skills/pdf` | PDF generation primitives — reportlab, pypdf, pdf-lib, pypdfium2, command-line tools |

## References

| File | Contents |
|------|----------|
| `references/letter-styles.css` | CSS stylesheet — only used if taking the HTML→PDF approach |

## Important Notes

- **Never modify correction content.** Format exactly as received. Content issues are the research agent's problem.
- **Every page must say DRAFT.** Header, footer, and notice banner. This document cannot be mistaken for an official city issuance.
- **Fail gracefully.** If styling breaks, produce a plain-formatted PDF anyway. A plain PDF beats no PDF.
- **Accept fix instructions.** When re-invoked after a failed QA, the main agent will provide specific fix instructions. Apply them and regenerate.
