---
name: adu-pdf-extraction
description: "This skill extracts construction PDF plan binders into agent-consumable formats. It should be used when a contractor or homeowner provides a PDF binder of construction plans (site plans, floor plans, structural drawings, Title 24 reports) that needs to be parsed for permit review, corrections response, or plan check analysis. Produces three outputs: page PNGs for vision analysis, structured markdown per page via vision extraction, and a JSON manifest for routing."
---

# Construction PDF Binder Extraction

## Purpose

Extract multi-page construction plan PDF binders into a vision-first structure
that enables an AI agent to efficiently navigate, reference, and respond to
specific pages and drawing zones within the plans.

Construction PDFs are uniquely challenging because:
- Single PDF pages often contain multiple sub-pages composited together
- Text is rendered by CAD software in non-extractable ways
- Watermarks (e.g., "Study Set - Not For Construction") inject diagonal
  characters that pollute text extraction
- Drawing content (dimensions, callouts, symbols) carries critical meaning
  that only vision can interpret
- Title 24 energy reports are often rasterized images, not selectable text

## When to Use

Invoke this skill when:
- A PDF binder of construction plans is provided (typically 10-30+ pages)
- Plan check corrections need to reference specific sheets and locations
- A permit checklist needs to be generated from submitted plans
- Any construction document needs to be made queryable by an AI agent

## Why Vision-Only

Four text extraction methods were tested head-to-head on real construction PDFs.
Vision wins on every page type. See `references/extraction-findings.md` for the
full comparison data.

| Method | Drawing Pages | Text-Heavy Pages | Rasterized (Title 24) |
|--------|--------------|-----------------|----------------------|
| pdftotext | Garbage | Usable | Empty |
| pdfplumber | Reversed text | Good | 367 chars |
| Tesseract OCR | Garbled | Good | Good |
| **Claude Vision** | **Excellent** | **Excellent** | **Excellent** |

**Do NOT use pdftotext, pdfplumber, or Tesseract for construction PDFs.** They
each fail on different page types. Vision handles everything consistently:
structured markdown output, spatial understanding, watermark transparency,
drawing interpretation, and rasterized content reading.

At ~1,500 tokens per page PNG, a full 30-page binder costs ~45K tokens for
complete vision extraction — trivial at production pricing.

## Extraction Process

### Step 1: Prepare Output Directory

Create the output directory structure:

```
{output-dir}/
├── pages-png/           # One PNG per PDF page (input for vision)
├── pages-vision/        # Structured markdown per page (vision extraction)
└── binder-manifest.json # Structured page index (the routing artifact)
```

### Step 2: Extract Page PNGs

Run `scripts/extract-pages.sh` to split the PDF into individual page PNGs:

```bash
scripts/extract-pages.sh INPUT.pdf OUTPUT_DIR
```

This uses `pdftoppm` at 200 DPI. Each page becomes `page-01.png`,
`page-02.png`, etc. These PNGs are the **input for vision extraction**.

> **Note:** CAD-generated construction PDFs commonly produce Poppler warnings
> like `"Syntax Error: insufficient arguments for Marked Content"`. These are
> harmless — the PNGs render correctly. The script suppresses these via
> `2>/dev/null`.

If `pdftoppm` is not available, fall back to ImageMagick:
```bash
magick -density 200 input.pdf -quality 90 output-dir/pages-png/page-%02d.png
```

### Step 3: Vision Extract Every Page (Parallel Subagents)

Vision extraction is the most time-intensive step. Use parallel subagents to
process pages concurrently. The full prompt template is in
`prompts/vision-extract-batch.md` — read it and use it as the prompt for each
subagent.

#### Resource Constraints

**Maximum 3 concurrent subagents. Maximum 3 pages per subagent.**

This is a hard constraint for deployment to Vercel sandboxes (4 GB RAM total).
The orchestrator + 3 subagents = 4 processes, each getting ~1 GB RAM. Do not
exceed 3 concurrent subagents under any circumstances.

#### Subagent Orchestration

1. Count the total page PNGs in `pages-png/`
2. Divide pages into batches of **at most 3 pages each**
3. Process batches in **rounds of 3 subagents max**:

```
Task tool parameters (per subagent):
  name:            "vision-batch-N"
  subagent_type:   "general-purpose"
  mode:            "bypassPermissions"
  run_in_background: true
  prompt:          (read from prompts/vision-extract-batch.md,
                    replace {{PAGE_LIST}} with this batch's pages)
```

4. Launch up to 3 batches in a single message (parallel execution)
5. Wait for all 3 to complete before launching the next round
6. Repeat until all pages are extracted
7. Verify all `pages-vision/page-NN.md` files were created

#### Batching Strategy

| Binder Size | Pages/Batch | Rounds | Subagents/Round | Total Batches |
|-------------|-------------|--------|-----------------|---------------|
| 9 pages     | 3           | 1      | 3               | 3             |
| 15 pages    | 3           | 2      | 3, then 2       | 5             |
| 21 pages    | 3           | 3      | 3, 3, 1         | 7             |
| 30 pages    | 3           | 4      | 3, 3, 3, 1      | 10            |

**Never exceed 3 pages per subagent** — more pages means more image tokens
in context, which degrades extraction quality and risks memory pressure.
**Never exceed 3 concurrent subagents** — the deployment environment has 4 GB
RAM shared across all processes.

#### Output Format

Each subagent writes structured markdown files to `pages-vision/page-NN.md`.
See `prompts/vision-extract-batch.md` for the full markdown template and
extraction guidelines. Key elements:

- Title block identification (sheet number, title, firm)
- All text content extracted (tables, notes, schedules, specifications)
- Spatial zone mapping for every content element
- Drawing descriptions for non-text content
- Confidence annotations for watermark-obscured or low-resolution content

### Step 4: Build the Page Manifest (Subagent)

The manifest is what makes everything else useful. It enables an agent to
route to the correct page(s) without loading all pages into context.

After all vision extraction batches complete, spawn a single manifest-building
subagent. The full prompt template is in `prompts/build-manifest.md`.

```
Task tool parameters:
  name:          "build-manifest"
  subagent_type: "general-purpose"
  mode:          "bypassPermissions"
  prompt:        (read from prompts/build-manifest.md,
                  replace {{VISION_DIR}}, {{PNG_DIR}}, {{OUTPUT_PATH}})
```

This subagent reads all vision markdown files (text, not images) and produces
`binder-manifest.json` following the schema in `references/manifest-schema.md`.

For each page entry, the manifest captures:

1. **Sheet ID and title** — from the title block (usually bottom-right corner)
2. **Category** — general, architectural, structural, energy, code_compliance,
   mechanical, plumbing, electrical
3. **What's on the page** — key content items, described specifically enough
   to match correction letter items
4. **Topics** — keyword tags for routing (e.g., "shearwall", "setbacks",
   "Title 24")
5. **Drawing zones** — spatial map of where things are on the page
   (top-left, center, bottom-right, etc.)

#### Reading Title Blocks

Construction plan title blocks follow consistent conventions:

- **Location**: Bottom-right corner or right edge of each sheet
- **Contains**: Sheet number (e.g., "A2", "S1"), sheet title,
  designer/engineer name, project info, revision dates
- **Sheet numbering convention**:
  - `CS` = Cover Sheet
  - `A` prefix = Architectural (site plans, floor plans, elevations)
  - `S` prefix = Structural (foundation, framing, details)
  - `SN` prefix = Structural Notes
  - `T` prefix = Title 24 / Energy
  - `AIA` prefix = CalGreen/code checklists
  - `M` prefix = Mechanical
  - `P` prefix = Plumbing
  - `E` prefix = Electrical

#### Drawing Zone Mapping

To enable precise references like "Sheet S2, detail 8, mid-left quadrant":

- Divide each page into a grid (top/middle/bottom x left/center/right)
- For detail sheets with numbered detail bubbles, map bubble numbers to zones
- For plans, note which drawing is in which half (e.g., "left-half:
  foundation plan, right-half: framing plan")

### Step 5: Validate Outputs

After extraction, verify:
- PNG count matches PDF page count
- Vision markdown files exist for every page
- Manifest JSON is valid and has entries for every page
- Every `sheet_id` in the manifest matches what's visible in the PNG title block

## Using Extraction Results

### For Corrections Response (Flow 2)

When interpreting a corrections letter against extracted plans:

1. Parse each correction item for keywords
2. Match keywords against manifest `topics` and `key_content` arrays
3. Load only the matched page PNGs into context (vision) for verification
4. Use the `pages-vision/` markdown for quick text searches
5. Reference corrections by sheet ID and drawing zone:
   *"See Sheet S2 (page 11), Shearwall Schedule in the mid-left quadrant"*

### For Permit Checklist (Flow 1)

When generating a permit checklist from extracted plans:

1. Load the cover sheet manifest entry for project overview
2. Walk each category (architectural, structural, energy) loading relevant pages
3. Use vision markdown files for data extraction, PNGs for verification
4. Cross-reference against ADU regulatory skill requirements

## Typical Sheet Types in ADU Binders

For reference, a typical California ADU plan binder contains:

| Category | Typical Sheets | What to Look For |
|----------|---------------|-----------------|
| General | CS (Cover) | Scope of work, sheet index, lot coverage, general notes |
| Code | AIA.1, AIA.2 | CalGreen checklists, compliance checkboxes |
| Architectural | A1-A4 | Site plan, floor plan, elevations, sections, schedules |
| Structural | SN1-SN2, S1-S3 | Notes, foundation, framing, details, shearwall schedules |
| Energy | T-1 through T-3 | CF1R compliance, HVAC specs, mandatory requirements |
| MEP | M1, P1, E1 | Mechanical, plumbing, electrical (not always separate sheets) |

## Orchestration Summary

The full extraction workflow with subagents. **Hard limits: max 3 concurrent
subagents, max 3 pages per subagent** (4 GB RAM deployment environment).

Example for a 15-page binder:

```
Step 1: mkdir -p {output}/pages-png {output}/pages-vision

Step 2: bash scripts/extract-pages.sh INPUT.pdf {output}
        → produces pages-png/page-01.png through page-15.png

Step 3, Round 1: Launch 3 subagents (prompts/vision-extract-batch.md)
        → Subagent A: pages 1-3   (background)
        → Subagent B: pages 4-6   (background)
        → Subagent C: pages 7-9   (background)
        → Wait for all 3 to complete

Step 3, Round 2: Launch 2 subagents
        → Subagent D: pages 10-12 (background)
        → Subagent E: pages 13-15 (background)
        → Wait for both to complete
        → Verify: pages-vision/page-NN.md exists for all 15 pages

Step 4: Launch 1 manifest subagent (prompts/build-manifest.md)
        → Reads all pages-vision/*.md files
        → Produces binder-manifest.json

Step 5: Validate all outputs
```

Steps 1-2 are sequential (bash). Step 3 runs in rounds of up to 3 parallel
subagents. Step 4 runs after all Step 3 rounds complete. The manifest
subagent counts toward the 3-subagent limit but runs alone (no vision
subagents are active at that point).

## Resources

### scripts/
- `extract-pages.sh` — Split PDF into per-page PNGs using pdftoppm (200 DPI)

### prompts/
- `vision-extract-batch.md` — Subagent prompt template for parallel vision extraction
- `build-manifest.md` — Subagent prompt template for manifest generation

### references/
- `manifest-schema.md` — JSON schema and field descriptions for binder-manifest.json
- `extraction-findings.md` — Lessons learned from testing on real construction PDFs
