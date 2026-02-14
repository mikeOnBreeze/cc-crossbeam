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

## Why Vision-First (with Tesseract Cross-Reference)

Four text extraction methods were tested head-to-head on real construction PDFs.
Vision wins on every page type for structure and layout. See
`references/extraction-findings.md` for the full comparison data.

| Method | Drawing Pages | Text-Heavy Pages | Rasterized (Title 24) |
|--------|--------------|-----------------|----------------------|
| pdftotext | Garbage | Usable | Empty |
| pdfplumber | Reversed text | Good | 367 chars |
| Tesseract OCR | Garbled | Good | Good |
| **Claude Vision** | **Excellent** | **Excellent** | **Excellent** |

**Vision is the primary extraction method.** It handles structure, spatial
understanding, watermark transparency, drawing interpretation, and rasterized
content reading. No other method comes close on construction PDFs.

**Tesseract supplements vision for numeric accuracy.** Testing on dense cover
sheets revealed that vision at 1568px resolution can hallucinate specific
numeric values — "65.0 sq ft" becomes "856", "475 sq ft" gets missed entirely.
Tesseract's character-level OCR reliably captures exact digits even on dense
pages. The hybrid approach: run both, give subagents both outputs, and
cross-reference numbers. On drawing-heavy pages where Tesseract produces
garbage, subagents are instructed to ignore it.

**Do NOT use pdftotext or pdfplumber for construction PDFs.** pdftotext
produces garbage on drawings and empty output on rasterized pages. pdfplumber
produces reversed text (`*TEEHS REVOC*`) — completely unusable.

At ~1,500 tokens per page PNG, a full 30-page binder costs ~45K tokens for
complete vision extraction — trivial at production pricing.

## Extraction Process

### Step 1: Prepare Output Directory

Create the output directory structure:

```
{output-dir}/
├── pages-png/           # One PNG per PDF page (resized to 1568px max)
├── pages-text/          # Tesseract OCR text per page (numeric cross-ref)
├── pages-vision/        # Per-page outputs from vision subagents:
│   ├── page-NN.md       #   Structured markdown (detailed content)
│   └── page-NN.json     #   Manifest fragment (routing entry)
└── binder-manifest.json # Assembled manifest (routing artifact)
```

### Step 2: Extract Page PNGs + Tesseract Text

Run `scripts/extract-pages.sh` to split the PDF into page PNGs, resize them
for API consumption, and run Tesseract OCR:

```bash
scripts/extract-pages.sh INPUT.pdf OUTPUT_DIR
```

The script does three things:

1. **Split PDF** — Uses `pdftoppm` at 200 DPI. Each page becomes
   `pages-png/page-01.png`, `page-02.png`, etc.
2. **Resize PNGs to 1568px max** — Claude's API internally resizes images
   to 1568px on the longest side. Construction PDFs at 200 DPI on D-size
   sheets produce 7200x4800 PNGs — resizing before upload saves bandwidth
   and avoids the 32MB API payload limit without losing any information
   the model would actually see. Uses ImageMagick (Linux) or `sips` (macOS).
3. **Tesseract OCR** — Runs `tesseract` on each resized PNG to produce
   `pages-text/page-01.txt`, etc. These raw text dumps supplement vision
   extraction by providing reliable numeric values for cross-reference.
   On drawing-heavy pages, Tesseract output will be garbage — subagents
   are instructed to recognize and ignore it.

> **Note:** CAD-generated construction PDFs commonly produce Poppler warnings
> like `"Syntax Error: insufficient arguments for Marked Content"`. These are
> harmless — the PNGs render correctly. The script suppresses these via
> `2>/dev/null`.

If `pdftoppm` is not available, fall back to ImageMagick:
```bash
magick -density 200 input.pdf -quality 90 output-dir/pages-png/page-%02d.png
```
Then manually resize and run Tesseract on the resulting PNGs.

### Step 3: Vision Extract Every Page (Rolling Window)

Vision extraction is the most time-intensive step. Use a **rolling window**
of parallel subagents — one page per subagent, max 3 in flight at any time.
The full prompt template is in `prompts/vision-extract-page.md` — read it
and use it as the prompt for each subagent.

#### Why One Page Per Subagent

Each subagent conversation accumulates every image it reads into the message
history. With multi-page batches, by the time the subagent processes page 3,
all 3 PNGs are in context for every API call. This causes:

- **API image limits**: Claude's API enforces a 2000px-per-image cap when
  >20 images are in the conversation. Construction PNGs at 200 DPI are
  typically 7200x4800 — well over this limit.
- **Token waste**: Each additional image in context costs ~1,500 tokens per
  API round-trip, even when only analyzing the current page.
- **Quality degradation**: More images in context = more noise for the model.

One page per subagent means exactly one image in context. No multi-image
limits, cleaner extraction, and the Tesseract text file provides numeric
cross-reference without adding image tokens.

#### Resource Constraints

**Maximum 3 concurrent subagents. One page per subagent.**

This is a hard constraint for deployment to Vercel sandboxes (4 GB RAM total).
The orchestrator + 3 subagents = 4 processes, each getting ~1 GB RAM. Do not
exceed 3 concurrent subagents under any circumstances.

#### Rolling Window Orchestration

Instead of fixed rounds (launch 3, wait for all 3, launch next 3), use a
rolling window: launch 3 subagents, and as each one completes, immediately
launch the next. This keeps 3 subagents in flight at all times until all
pages are processed.

```
Task tool parameters (per subagent):
  name:            "vision-page-NN"
  subagent_type:   "general-purpose"
  mode:            "bypassPermissions"
  run_in_background: true
  prompt:          (read from prompts/vision-extract-page.md,
                    replace {{PAGE_PNG}}, {{TEXT_FILE}}, {{OUTPUT_MD}},
                    {{OUTPUT_JSON}}, and {{SKILL_DIR}} with actual paths)
```

1. Count the total page PNGs in `pages-png/`
2. Launch subagents for pages 1, 2, and 3 (3 in parallel)
3. As each subagent completes, immediately launch the next page
4. Continue until all pages are queued
5. Wait for the final subagents to complete
6. Verify all `pages-vision/page-NN.md` AND `page-NN.json` files exist

#### Throughput

| Binder Size | Subagents | Max Concurrent | Approx. Wall Time |
|-------------|-----------|----------------|-------------------|
| 9 pages     | 9         | 3              | ~3x single page   |
| 15 pages    | 15        | 3              | ~5x single page   |
| 26 pages    | 26        | 3              | ~9x single page   |
| 30 pages    | 30        | 3              | ~10x single page  |

Each subagent takes ~3-4 minutes (read references, read PNG, write .md,
write .json). With 3 concurrent, a 26-page binder completes in ~30 minutes.

#### Output Format

Each subagent writes **two files per page** to `pages-vision/`:

1. **`page-NN.md`** — Structured markdown with full extracted content:
   - Title block identification (sheet number, title, firm)
   - All text content (tables, notes, schedules, specifications)
   - Spatial zone mapping for every content element
   - Drawing descriptions for non-text content
   - Confidence annotations for watermark-obscured or low-resolution content

2. **`page-NN.json`** — Manifest fragment for routing:
   - Page metadata (sheet_id, category, subcategory)
   - `key_content` array with specific values (guided by extraction priorities)
   - `topics` keyword tags for corrections letter matching
   - `drawing_zones` spatial map
   - `"NOT SHOWN: [item]"` entries for expected-but-absent content
   - Cover sheet fragment includes `_project` metadata

The extraction priorities reference (`references/adu-extraction-priorities.md`)
guides subagents on what to capture with specificity and what to flag as absent
for each content type. This produces manifest entries targeted for corrections
letter routing without any decision-making about compliance.

See `prompts/vision-extract-page.md` for the full prompt template including
both output formats.

### Step 4: Assemble the Manifest

The manifest is what makes everything else useful. It enables an agent to
route to the correct page(s) without loading all pages into context.

Since each vision subagent already wrote a JSON manifest fragment per page
(in Step 3), assembly is deterministic — no LLM needed.

Run the assembly script:

```bash
python3 scripts/assemble-manifest.py {output}/pages-vision {output}/binder-manifest.json
```

The script:
1. Reads all `page-NN.json` fragments from `pages-vision/`
2. Extracts `_project` metadata from the cover sheet fragment
3. Combines into `{ "project": {...}, "pages": [...] }`
4. Validates required fields and page numbering
5. Writes `binder-manifest.json`

**Exit codes:** 0 = clean, 1 = assembled with issues, 2 = fatal error.

**The orchestrator MUST always review the assembled manifest** (see Step 4a).
The assembly script is deterministic but not smart — it can concatenate JSON
but it cannot catch semantic issues like a wrong category, a vague
`key_content` entry, or a missing `_project` field that should have been
extracted. A quick orchestrator read-through catches things the script never
could.

The assembled manifest follows the schema in `references/manifest-schema.md`.
Each page entry captures:

1. **Sheet ID and title** — from the title block
2. **Category** — general, architectural, structural, energy, code_compliance,
   mechanical, plumbing, electrical
3. **What's on the page** — key content items with exact values, specific
   enough to match correction letter items
4. **What's NOT on the page** — `"NOT SHOWN: [item]"` entries for expected-
   but-absent content (guided by extraction priorities)
5. **Topics** — keyword tags for routing
6. **Drawing zones** — spatial map of where things are on the page

### Step 4a: Orchestrator Review (ALWAYS — Not Optional)

After the assembly script runs, the orchestrator **must** read
`binder-manifest.json` and review it. This takes seconds and catches
things the script cannot.

#### Standard Review Checklist
1. Read the full `binder-manifest.json`
2. Verify `project` metadata is populated (address, type, owner, sqft)
3. Verify page count matches PNG count
4. Spot-check `sheet_id` values look reasonable
5. Check that `key_content` arrays have specific values, not vague entries
6. If the script reported issues (exit code 1), fix them
7. Fix any JSON errors, missing fields, or wrong categories

#### Cross-Page Consistency Check (Critical)

Vision models can hallucinate individual digits — a "3" read as "2", a "5"
as "6". When this happens on the cover sheet, the wrong value cascades into
`project` metadata and poisons everything downstream.

**Every page's JSON fragment includes a `title_block_address` field** — the
address as read independently from that page's title block. The orchestrator
must use these to verify project-level values:

1. **Collect all `title_block_address` values** from every page entry
2. **Majority vote on the address**: the value that appears on the most pages
   is the correct address. If the `project.address` differs from the majority,
   **fix it**.
3. **Apply the same logic to other repeated values**: project type, designer
   firm, and structural engineer firm appear on multiple title blocks. When
   there's a conflict, the majority wins.
4. **Log any corrections**: when the orchestrator overrides a value, note
   what was changed and why (e.g., "Fixed address from 1222 to 1232 — cover
   sheet hallucination, 14/15 pages read 1232").

This check exists because in testing, the vision model misread "1232" as
"1222" on one page, and that single error propagated through the entire
manifest. With 15 pages each independently reading the title block, a
single-page hallucination is trivially detectable.

This review is cheap (one file read + a few string comparisons) and prevents
the scenario where subagents did great work but a single hallucination or
script assembly glitch ruins the output.

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

The full extraction workflow. **Hard limit: max 3 concurrent subagents,
1 page per subagent** (4 GB RAM deployment environment).

Example for a 15-page binder:

```
Step 1: mkdir -p {output}/pages-png {output}/pages-text {output}/pages-vision

Step 2: bash scripts/extract-pages.sh INPUT.pdf {output}
        → Split PDF into PNGs (200 DPI)
        → Resize PNGs to 1568px max (API internal limit)
        → Run Tesseract OCR → pages-text/page-01.txt through page-15.txt
        → produces pages-png/page-01.png through page-15.png

Step 3: Rolling window of vision subagents (prompts/vision-extract-page.md)
        → Launch page-01, page-02, page-03 in parallel (3 in flight)
        → page-01 completes → launch page-04 (still 3 in flight)
        → page-03 completes → launch page-05
        → ... continue until all 15 pages queued ...
        → Wait for final subagents to complete
        → Verify: pages-vision/page-NN.md AND page-NN.json exist for all 15

Step 4: python3 scripts/assemble-manifest.py {output}/pages-vision {output}/binder-manifest.json
        → Reads all page-NN.json fragments
        → Assembles binder-manifest.json (deterministic, no LLM)

Step 4a: Orchestrator reads binder-manifest.json (ALWAYS, not optional)
        → Cross-page consistency check: majority-vote address + repeated values
        → Verifies project metadata, page count, key_content quality
        → Fixes any assembly issues, hallucinations, or missing fields

Step 5: Validate all outputs
```

Steps 1-2 are sequential (bash). Step 3 uses a rolling window — as each
subagent finishes, the next page launches immediately. Each subagent reads
one PNG, writes one .md and one .json. Step 4 is a fast Python script
(no LLM call). Step 5 is orchestrator validation.

**Why one page per subagent?** Each subagent's conversation accumulates
every image it reads. With 3 pages per subagent, the 3rd page's API calls
include all 3 PNGs in context — wasting tokens, risking API image limits
(2000px cap for >20 images in conversation), and degrading quality.
One-per-subagent keeps exactly one image in context at all times.

**Why inline fragments?** Each vision subagent already has the page image in
context and has done the deep analysis. Writing a manifest entry at that point
is nearly free — just reformatting what it already knows into JSON. This is
faster and more accurate than a separate manifest subagent re-reading all the
markdown files.

## Resources

### scripts/
- `extract-pages.sh` — Split PDF into per-page PNGs (200 DPI), resize to 1568px,
  run Tesseract OCR for hybrid text cross-reference
- `assemble-manifest.py` — Assemble page JSON fragments into binder-manifest.json

### prompts/
- `vision-extract-page.md` — Subagent prompt template for single-page vision extraction
  (produces both markdown and JSON manifest fragment for one page)
- `vision-extract-batch.md` — Legacy batch prompt (retained for reference;
  the single-page approach in vision-extract-page.md supersedes this)
- `build-manifest.md` — Legacy manifest subagent prompt (retained for reference;
  the inline fragment approach supersedes this)

### references/
- `manifest-schema.md` — JSON schema and field descriptions for binder-manifest.json
- `adu-extraction-priorities.md` — Domain-aware extraction guide: what to capture,
  what to flag as absent, and corrections letter terminology by content type
- `extraction-findings.md` — Lessons learned from testing on real construction PDFs
