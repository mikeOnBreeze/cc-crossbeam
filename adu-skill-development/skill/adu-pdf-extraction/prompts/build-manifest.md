# Build Manifest — Subagent Prompt Template

Use this prompt template when spawning a subagent via the Task tool to build
the binder-manifest.json from completed vision extraction files.

## How to Use

Replace `{{VISION_DIR}}`, `{{PNG_DIR}}`, and `{{OUTPUT_PATH}}` with actual
paths. This subagent runs after all vision extraction batches have completed.

```
Task tool parameters:
  subagent_type: "general-purpose"
  mode: "bypassPermissions"  (or "default" if permission prompts are acceptable)
```

## Prompt Template

---

You are building a structured JSON manifest for a construction plan binder.
The manifest is the routing layer that enables an agent to find the right
page(s) without loading every page into context.

Read all vision extraction markdown files from {{VISION_DIR}} and the
manifest schema from the reference file below. Produce a single JSON file
at {{OUTPUT_PATH}}.

### Manifest Schema Reference

Read the schema at: `references/manifest-schema.md` (relative to the skill
directory). Follow it exactly.

### Process

1. Read every `page-NN.md` file in {{VISION_DIR}} to understand each page
2. For the `project` object, extract metadata from the cover sheet (page-01.md)
3. For each page, create a page entry with:
   - `page_number`: 1-based, matching the NN in the filename
   - `sheet_id`: from the title block in the vision markdown
   - `sheet_title`: from the title block
   - `category`: classify as general, architectural, structural, energy,
     code_compliance, mechanical, plumbing, or electrical
   - `subcategory`: more specific type (e.g., "floor_plan", "site_plan")
   - `prepared_by`: firm name from title block
   - `description`: 1-3 sentences summarizing what is on the page
   - `key_content`: array of specific items — be detailed enough to match
     correction letter items (e.g., "Shearwall schedule: Mark 1 (15/32 STR,
     6\"/12\", 340 PLF)")
   - `topics`: keyword tags for routing (use consistent terms from the schema)
   - `drawing_zones`: spatial map of content (zone name + what is there)
   - `vision_extracted`: true (since all pages have been vision-extracted)
4. Validate the JSON is well-formed before writing
5. Verify the page count matches the number of vision markdown files

### Key Content Guidelines

The `key_content` array is the most important field for corrections routing.
Each entry should be specific enough that a keyword search from a correction
letter item would match it. Examples:

Good: "Holdown schedule: Mark 1 = HD12 (6-SD25212, 4x4 post, 3,075 lbs)"
Bad: "Holdown information"

Good: "Window Schedule: 3 entries (6'0\"x4' slider, 4'0\"x4' vinyl, 6'0\"x4' vinyl)"
Bad: "Window schedule table"

Good: "Nailing schedule with 26 connection types and nail specifications"
Bad: "Nailing information"

### Topic Keywords

Use these consistent topic keywords for reliable routing:

- **Architectural**: site plan, floor plan, elevations, sections, roof plan,
  demolition, window schedule, door schedule, setbacks, property lines
- **Structural**: foundation plan, floor framing, shearwall schedule, holdowns,
  nailing schedule, anchors, structural wood, seismic design, concrete specs,
  rebar, footings, headers, joists, DTC clips
- **Energy**: Title 24, CF1R, energy compliance, HVAC, fenestration, U-factor,
  SHGC, building envelope, insulation R-values, PV solar, mandatory requirements
- **Code**: CalGreen, green building, water efficiency, VOC limits, pollutant
  control, fire protection
- **General**: project info, scope of work, lot coverage, general notes,
  abbreviations

Write the completed manifest JSON to {{OUTPUT_PATH}}.

---

## Notes

This subagent reads markdown files (not PNGs), so it stays within text token
limits. For a 30-page binder with ~100-150 KB of vision markdown, this fits
comfortably in a single subagent context.

If the binder is very large (40+ pages), consider having this subagent read
pages in two passes: first pass for the page entries, second pass to backfill
`key_content` arrays with additional detail.
