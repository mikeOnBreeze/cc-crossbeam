---
name: adu-targeted-page-viewer
description: Extracts construction plan PDFs into page PNGs, reads the sheet index to build a sheet-to-page manifest, and enables targeted viewing of specific sheets. This skill should be used when a corrections letter references specific plan sheets (e.g., "Sheet A3", "Detail 2/S3.1") and those sheets need to be located and analyzed within the PDF binder. Much faster than full plan extraction — builds the sheet manifest in under 2 minutes, then individual sheet lookups are instant. Triggers when a plan PDF needs to be navigated by sheet reference, or when the corrections interpreter needs to look at specific pages.
---

# ADU Targeted Page Viewer

## Overview

Extract a construction plan PDF into page PNGs and build a JSON manifest mapping sheet IDs to page numbers. This enables fast, targeted viewing of specific sheets referenced in corrections letters — without doing deep content extraction of every page.

**Speed**: Under 2 minutes for the manifest. Individual sheet lookups are instant after that.

**Key difference from full extraction**: This skill only identifies WHICH page is WHICH sheet. It does not extract content, dimensions, materials, or structural details from each page. That analysis happens on-demand when a specific sheet is requested.

## Prerequisites

- `pdftoppm` / `pdfinfo` (from poppler): `apt-get install poppler-utils` (Linux) or `brew install poppler` (macOS)
- `ImageMagick` (for resize + title block cropping): `apt-get install imagemagick` (Linux) or `brew install imagemagick` (macOS)

## Workflow

### Step 1: Extract All Pages to PNG

**Check first:** PNGs may already be pre-extracted. Look for `pages-png/page-01.png` in the project files directory. If PNGs already exist, **skip this step entirely** — go straight to Step 2.

If PNGs don't exist, run `scripts/extract-pages.sh` to split the PDF into individual page PNGs:

```bash
scripts/extract-pages.sh <input.pdf> <output-dir>
```

This produces `output-dir/pages-png/page-01.png`, `page-02.png`, etc. at 200 DPI (full resolution, no resize). Takes ~5 seconds for a 26-page set. The script is idempotent — if PNGs already exist it exits immediately.

### Step 2: Read the Cover Sheet and Find the Sheet Index

Read `pages-png/page-01.png` visually. The sheet index is typically in the **top-right or right-side area** of the cover sheet.

Extract the index as a list of entries:
```
CS    → Cover Sheet
A1    → Site Plan
A2    → Floor Plan
A3    → Elevations & Roof Plan
S1.0  → Structural Notes
S2.0  → Foundation Plan
...
```

This gives the list of expected sheets and their descriptions.

**If the index is not on page 1**, check page 2 — some sets have a separate title page before the cover sheet.

### Step 3: Match Sheet IDs to Page Numbers

The sheet index order generally matches the PDF page order, but there can be mismatches — the index might list 12 sheets while the PDF has 15 pages (extra city forms, checklists, etc.).

**To resolve the mismatch, read the title blocks:**

1. Check if title block crops already exist at `title-blocks/title-block-01.png`. If they do, skip the cropping step. Otherwise, run `scripts/crop-title-blocks.sh` to crop the bottom-right corner of each page:
```bash
scripts/crop-title-blocks.sh <output-dir>/pages-png <output-dir>/title-blocks
```

2. Read each title block image to extract the sheet ID. Title blocks are small crops, so this is fast — the sheet ID is prominently displayed.

3. Match each page's sheet ID against the index entries.

**Optimization**: If the page count matches the index count exactly, skip the title block reading — the index order IS the page order. Only do title block reading when there's a mismatch.

**Parallel processing**: When reading title blocks, launch parallel subagents (3-5 at a time) to read batches of title block crops. Each crop is tiny, so reading is fast.

### Step 4: Build the Sheet Manifest

Output a JSON manifest file:

```json
{
  "source_pdf": "plans.pdf",
  "total_pages": 15,
  "indexed_sheets": 12,
  "sheets": [
    {
      "sheet_id": "CS",
      "page_number": 1,
      "file": "page-01.png",
      "description": "Cover Sheet"
    },
    {
      "sheet_id": "A1",
      "page_number": 5,
      "file": "page-05.png",
      "description": "(E) & (N) Site Plan"
    },
    {
      "sheet_id": "S2.0",
      "page_number": 11,
      "file": "page-11.png",
      "description": "Foundation Plan"
    }
  ],
  "unindexed_pages": [
    {
      "page_number": 2,
      "file": "page-02.png",
      "title_block_text": "City of Long Beach Forms"
    }
  ]
}
```

Save this as `output-dir/sheet-manifest.json`.

### Step 5: Targeted Sheet Viewing (On Demand)

When a corrections letter references a specific sheet:

1. Look up the sheet ID in the manifest → get the page number and PNG path
2. Read that PNG visually
3. Analyze the specific area referenced (e.g., "Detail 2" → look for the detail numbered "2" on the sheet)
4. Report what is on the sheet and what needs to change

See `references/plan-sheet-conventions.md` for how to navigate construction plan sheets — where title blocks are, how detail callouts work, and the sheet numbering system.

## Integration with Corrections Interpreter

The corrections interpreter extracts sheet references from the corrections letter during its Phase 1 (reading the letter). It passes those references to this skill:

```
Corrections interpreter: "I need sheets A1, A3, S1.0, and S2.0"
    ↓
This skill: "A1 = page-05.png, A3 = page-07.png, S1.0 = page-09.png, S2.0 = page-11.png"
    ↓
Corrections interpreter reads those PNGs and produces targeted findings:
    "On Sheet A3 (page 7), Detail 2 in the lower-right shows a standard soffit.
     The patio is within 5' of the property line — replace with 1-hour fire-rated
     assembly detail showing 5/8" Type X gypsum on the underside."
```

## Important Notes

- **Do NOT do deep content extraction.** This skill builds the sheet-to-page map, nothing more. Content analysis happens on-demand for specific sheets.
- **Title block = ground truth.** The sheet index is a guide, but the title block on each page is the definitive source for which sheet that page is.
- **Contractors provide PDFs.** The input will always be a PDF. The PNGs are intermediate artifacts for analysis.
- **Cache the manifest.** Once built, the manifest is reusable for the entire corrections response process. No need to rebuild it.
- **Handle watermarks.** Some plan sets have diagonal watermarks ("Study Set", "Not For Construction", "Review Copy"). These don't affect sheet identification — the title block is still readable.

## Scripts

| Script | Purpose | Runtime |
|--------|---------|---------|
| `scripts/extract-pages.sh` | PDF → page PNGs at 200 DPI (full res, no resize). Idempotent. | ~5 sec for 26 pages |
| `scripts/crop-title-blocks.sh` | Crop bottom-right title block from each page. Idempotent. | ~2 sec for 26 pages |

## References

| File | Contents |
|------|----------|
| `references/plan-sheet-conventions.md` | Sheet numbering system, title block locations, detail callout conventions, common ADU plan set sizes |
