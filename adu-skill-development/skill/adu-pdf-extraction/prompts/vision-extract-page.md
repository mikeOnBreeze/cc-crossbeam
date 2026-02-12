# Vision Extract Page — Subagent Prompt Template

Use this prompt template when spawning subagents via the Task tool to vision-
extract a **single page** PNG into structured markdown AND a manifest JSON
fragment.

## How to Use

Replace `{{PAGE_PNG}}`, `{{OUTPUT_MD}}`, `{{OUTPUT_JSON}}`,
`{{TEXT_FILE}}`, and `{{SKILL_DIR}}` with actual paths. Each subagent
processes exactly **one page**. Run up to 3 subagents concurrently using
a rolling window.

```
Task tool parameters:
  subagent_type: "general-purpose"
  mode: "bypassPermissions"  (or "default" if permission prompts are acceptable)
  run_in_background: true     (enables parallel execution)
```

## Prompt Template

---

You are extracting a single construction PDF plan page via vision into two
outputs: a structured **markdown file** for detailed content and a **JSON
manifest fragment** for routing.

You have two inputs:
1. **The PNG image** — your primary source. Use vision to read it.
2. **The Tesseract OCR text file** (if available) — a raw text dump from
   OCR. Use this to cross-reference exact numeric values (sq ft, dimensions,
   percentages, PSI, PLF, etc.) that vision may misread at low resolution.

### Before Starting

Read the extraction priorities reference for domain-aware guidance on what
to capture and what to flag as absent:

```
{{SKILL_DIR}}/references/adu-extraction-priorities.md
```

Read the manifest schema for the JSON fragment structure:

```
{{SKILL_DIR}}/references/manifest-schema.md
```

Read the Tesseract text file for this page (if it exists):

```
{{TEXT_FILE}}
```

**How to use Tesseract text:** Tesseract output is raw OCR — no structure,
columns may be interleaved, drawing pages produce garbage. Do NOT rely on
it for layout or structure. DO use it to verify specific numeric values.
When your vision extraction reads a number (sq ft, setback dimension, PSI,
percentage), check if Tesseract captured the same number. If they conflict,
**prefer Tesseract for digits** — character-level OCR is more reliable for
numbers than vision at 1568px resolution. If the Tesseract output is
clearly garbage (garbled nonsense from a drawing page), ignore it entirely.

### Write TWO Files

#### Output 1: Structured Markdown

```markdown
# Page NN — Sheet XX: Sheet Title

> **Source:** page-NN.png (vision extraction)
> **Watermark:** (note any watermark text, or "None")

## Title Block (Bottom-Right Corner)
- **Project:** ...
- **Address:** ...
- **Sheet Number:** ...
- **Sheet Title:** ...
- **Firm:** ...

## [Major Content Section] ([Spatial Zone])
(Extracted content: tables as markdown tables, notes as numbered lists,
dimensions and specifications as structured data)

## [Next Section] ([Zone])
...

## Confidence Notes
### High Confidence Extractions
- (List what was clearly legible)
### Lower Confidence / Partially Obscured
- (List anything affected by watermarks, small text, etc.)
```

#### Output 2: Manifest JSON Fragment

Write a JSON file with the page's manifest entry. Follow the Page Object
schema from `references/manifest-schema.md`. Use the extraction priorities
reference to guide `key_content` specificity and flag absent items.

```json
{
  "page_number": NN,
  "sheet_id": "XX",
  "sheet_title": "Full Title from Title Block",
  "category": "one of: general, architectural, structural, energy, code_compliance, mechanical, plumbing, electrical",
  "subcategory": "specific type (e.g., floor_plan, structural_details, title_24_cf1r)",
  "prepared_by": "Firm name from title block",
  "description": "1-3 sentences describing page contents",
  "key_content": [
    "Specific item with exact values (e.g., 'Shearwall schedule: Mark 1 (5'-0\" STR O.S., edge 4, field 12)')",
    "NOT SHOWN: setback dimensions (flag if expected but absent per extraction priorities)"
  ],
  "topics": ["keyword1", "keyword2"],
  "drawing_zones": [
    {"zone": "top-left", "content": "What is in this zone"}
  ],
  "title_block_address": "Project address as shown in THIS page's title block",
  "vision_extracted": true
}
```

**If the page is a Cover Sheet**, also include a `_project` key at the top
level with project metadata:

```json
{
  "_project": {
    "address": "Full project address",
    "type": "New Detached ADU / ADU Conversion / JADU / etc.",
    "adu_address": "ADU unit address if different",
    "main_home_address": "Primary dwelling address",
    "designer": "Architect/designer name and firm",
    "structural_engineer": "Structural engineer firm",
    "energy_consultant": "Title 24 consultant if listed",
    "owner": "Property owner name",
    "adu_size_sqft": 600,
    "existing_home_sqft": 1854,
    "lot_size_sqft": null
  },
  "page_number": 1,
  "sheet_id": "CS",
  ...
}
```

Use `null` for any project fields not found on the cover sheet.

### Extraction Guidelines

1. Identify the title block first (usually bottom-right or right edge)
2. Determine the content type (site plan, floor plan, structural, etc.) by
   looking at what is ON the page, then consult the extraction priorities
   reference for that content type
3. Extract ALL text content — schedules as markdown tables, notes as numbered
   lists, specifications as structured data
4. Map each section to a spatial zone (top-left, center, bottom-right, etc.)
5. For drawings that cannot be converted to text, describe what they show
6. Note any watermark text present on the page
7. Flag confidence levels — mark anything obscured by watermarks or unreadable
8. For `key_content` in the JSON fragment: be specific enough that a keyword
   search from a corrections letter item would match. Include exact values.
9. For absent items: check the extraction priorities for what SHOULD be on
   this content type. If something expected is missing, add
   `"NOT SHOWN: [item]"` to `key_content`
10. **Always capture `title_block_address`** — read the project address from
    THIS page's title block independently. Do not copy from memory or from
    other pages. Read the digits carefully. This field is used for cross-page
    consistency checking to catch vision misreads.

### Category Assignment

Assign category by content, not sheet number prefix (which varies by firm):

| Category | Identify By |
|----------|------------|
| `general` | Project overview, scope of work, governing codes, sheet index |
| `code_compliance` | CalGreen checklists, compliance checkboxes, VOC tables |
| `architectural` | Site plans, floor plans, elevations, sections, roof plans |
| `structural` | Structural notes, foundation plans, framing plans, detail sheets |
| `energy` | CF-1R forms, Title 24 compliance tables, mandatory requirements |
| `mechanical` | HVAC plans and schedules |
| `plumbing` | Plumbing plans and riser diagrams |
| `electrical` | Electrical plans and panel schedules |

### Process This Page

Read the Tesseract text file first (if it exists), then read the PNG.
Write both the markdown file and the JSON fragment. Cross-reference any
numeric values between vision and Tesseract as described above.

- {{PAGE_PNG}}
  → Tesseract text: {{TEXT_FILE}}
  → Write markdown: {{OUTPUT_MD}}
  → Write JSON:     {{OUTPUT_JSON}}

---

## Example Orchestrator Usage

The orchestrator reads this template, substitutes the placeholders, and
launches one subagent per page in a rolling window of 3 concurrent:

```python
# Pseudocode for rolling window
template = read("prompts/vision-extract-page.md")
pages = glob("pages-png/page-*.png")  # sorted

in_flight = []
for page_png in pages:
    nn = extract_page_number(page_png)  # "01", "02", etc.
    text_file = f"pages-text/page-{nn}.txt"  # may not exist
    prompt = template
        .replace("{{PAGE_PNG}}", page_png)
        .replace("{{TEXT_FILE}}", text_file)
        .replace("{{OUTPUT_MD}}", f"pages-vision/page-{nn}.md")
        .replace("{{OUTPUT_JSON}}", f"pages-vision/page-{nn}.json")
        .replace("{{SKILL_DIR}}", skill_dir)

    if len(in_flight) >= 3:
        wait_for_any(in_flight)  # wait for one to finish

    in_flight.append(launch_subagent(prompt, background=True))

wait_for_all(in_flight)  # wait for remaining
```

In Claude Code, this translates to: launch 3 Task tools in one message,
then as each completes (via notification), launch the next in a new message.
