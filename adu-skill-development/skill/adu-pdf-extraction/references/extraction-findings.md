# Extraction Findings — Lessons from Real Construction PDFs

Documented from testing on a 15-page ADU plan binder (1232 N. Jefferson St.,
Placentia, CA — New Detached ADU, 600 sq ft).

## Key Finding: Vision-Only Wins

Four text extraction methods were tested head-to-head on the same pages.
**Claude Vision is the only method that works reliably across all page types.**
The others each fail on different content — and construction binders always
contain a mix of all content types.

### Head-to-Head: Page 6 (Floor Plan w/ Electrical — hardest page type)

| Method | Bytes | Content Quality |
|--------|-------|-----------------|
| pdftotext | 10.7K | Garbage — headers + blank lines + watermark chars (~90% waste) |
| pdfplumber | 1.7K | Bad — reversed text from rotated title blocks (`*TEEHS REVOC*`) |
| Tesseract OCR | 11.6K | Fair — real data, some column interleaving |
| **Claude Vision** | **9.4K** | **Best — structured markdown, real tables, zone-organized** |

### Head-to-Head: Page 7 (A3 Elevations/Sections — drawing-heavy page)

| Method | Result |
|--------|--------|
| pdftotext | Garbage — blank lines and watermark scatter |
| pdfplumber | Poor — reversed text fragments |
| Tesseract OCR | **Garbage** — garbled nonsense like `=tasienianianienientanton` |
| **Claude Vision** | **Good — identifies elevations, materials, dimensions, detail callouts** |

### Head-to-Head: Page 13 (Title 24 CF1R — rasterized content)

| Method | Result |
|--------|--------|
| pdftotext | 32 lines — all watermark noise, zero data |
| pdfplumber | 367 chars — reversed text fragments |
| Tesseract OCR | 9.8K chars — full CF1R data (only non-vision method that works here) |
| **Claude Vision** | **Also reads it well via image** |

### Why Each Method Fails

**pdftotext** — Reads the PDF text layer directly. Fails because:
- CAD software stores text as individual character glyphs, not logical runs
- Diagonal watermarks scatter characters across dozens of blank output lines
- Rasterized pages (Title 24) have no text layer at all
- Produces massive token waste from blank line padding

**pdfplumber** — Python library, reads PDF text layer with better layout
awareness. Slightly better at tables but still fails because:
- Rotated text in title blocks produces reversed strings
- Same rasterized-content blindness as pdftotext
- Still can't handle CAD-rendered text on drawing sheets

**Tesseract OCR** — Reads rendered pixels from page PNGs. Better than text
layer tools but still fails because:
- Drawing-heavy pages produce garbled nonsense (can't distinguish lines,
  symbols, and dimension arrows from text)
- Interleaves text from adjacent columns on complex layouts
- Only reliable on text-heavy pages (structural notes, Title 24 reports)
- Works on roughly 5 of 15 pages — the text-heavy ones

**Claude Vision** — Reads page PNGs via multimodal vision. Wins because:
- Structured markdown output with headers and tables
- Spatial understanding (organizes by drawing zones)
- Interprets symbols, dimensions, and detail callouts
- Reads through watermarks naturally
- Works on all 15 page types without exception
- Distinguishes drawings from text (describes drawings, extracts text)

### Final Decision: Vision-Only

Given that:
1. Vision works on every page type (15/15)
2. Tesseract only works on ~5/15 pages
3. pdftotext and pdfplumber fail on most pages
4. Token cost is ~1,500 per page PNG — trivial at production pricing
5. A full 30-page binder costs ~45K tokens total for complete extraction

There is no reason to maintain a Tesseract or text extraction pipeline.
Vision-only is simpler, more reliable, and produces better output.

## Performance Characteristics

Tested on a 15-page ADU binder (14.2 MB PDF):

| Operation | Time | Output Size |
|-----------|------|-------------|
| PNG extraction (pdftoppm, 200 DPI) | ~85s | 48 MB (15 PNGs) |
| Vision extraction (1 page) | ~60-120s | ~5-10 KB structured markdown |
| Vision extraction (15 pages, parallel) | ~5-8 min | ~100-150 KB total |
| Manifest creation (from vision output) | ~2-3 min | ~28 KB JSON |
| **Total (PNG + vision + manifest)** | **~10-15 min** | **~48 MB + ~180 KB** |

Pages can be vision-extracted in parallel batches of 3-5.

## Watermark Handling

Common watermarks in construction PDFs:
- "Study Set - Not For Construction"
- "Prepped for City Submittal"
- "PRELIMINARY - NOT FOR CONSTRUCTION"
- "FOR REVIEW ONLY"
- "DRAFT"

These appear as diagonal text overlays. Vision reads through them naturally,
noting the watermark text in the extraction and reading the underlying content.
Text-layer tools (pdftotext, pdfplumber) produce scattered single characters.
Tesseract sometimes reads watermark text mixed in with real content.

## Manifest as Routing Layer

The manifest JSON is the key innovation. Without it, an agent must either:
- Load all 15 pages into context (~22,500 vision tokens) for every query, or
- Guess which pages to look at

With the manifest, the agent can:
1. Search `topics` and `key_content` arrays for keyword matches
2. Load only 1-3 relevant page PNGs or vision markdown files
3. Reference specific `drawing_zones` in its response

Example routing: correction says "provide shearwall nailing schedule"
-> manifest search finds "nailing schedule" in SN2 topics and "shearwall
schedule" in S2 topics -> agent loads pages 9 and 11 only.

## Vision Extraction Quality (Page 6 Deep Dive)

When Claude Vision extracted page 6 (Sheet A2 — Floor Plan), it produced:
- Window Schedule: 3 entries with sizes, glazing, materials, types
- Door Schedule: 5 entries with frames, materials, lock types
- 14+ Kitchen Electrical Notes with NEC code references
- 7 Smoke/CO Alarm requirements with CRC R314/R315 refs
- Plumbing Fixture flow rates (1.8 GPM kitchen, 1.2 GPM lavatory, 1.28 GPF WC)
- Bedroom egress standards (5.7 sq ft, 20" width, 24" height, 44" max sill)
- Confidence annotations flagging watermark-obscured sections

Limitations observed:
- Dense fine-print notes partially obscured by watermark
- Small in-drawing dimensions unreadable at 200 DPI
- Some code reference numbers may have minor transcription errors
- Could be improved by zooming into specific regions for dense content
