# Binder Manifest JSON Schema

The `binder-manifest.json` file is the routing layer that enables an agent to
navigate a construction plan binder without loading every page into context.

## Top-Level Structure

```json
{
  "project": { ... },
  "pages": [ ... ]
}
```

## Project Object

Basic project metadata extracted from the cover sheet.

| Field | Type | Description |
|-------|------|-------------|
| `address` | string | Full project address |
| `type` | string | Project type (e.g., "New Detached ADU", "ADU Conversion") |
| `adu_address` | string | ADU unit address if different from main |
| `main_home_address` | string | Primary dwelling address |
| `designer` | string | Architect/designer name and location |
| `structural_engineer` | string | Structural engineer firm |
| `energy_consultant` | string | Title 24 consultant if applicable |
| `owner` | string | Property owner name |
| `adu_size_sqft` | number | Proposed ADU square footage |
| `existing_home_sqft` | number | Existing home square footage |
| `lot_size_sqft` | number | Total lot size |

## Page Object

One entry per PDF page.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `page_number` | number | yes | 1-based page number in the PDF |
| `sheet_id` | string | yes | Sheet identifier from title block (e.g., "A2", "S1", "CS") |
| `sheet_title` | string | yes | Full title from title block |
| `category` | string | yes | One of: general, architectural, structural, energy, code_compliance, mechanical, plumbing, electrical |
| `subcategory` | string | yes | More specific type (e.g., "floor_plan", "elevations_sections", "structural_notes") |
| `prepared_by` | string | yes | Firm/person who prepared this sheet |
| `description` | string | yes | 1-3 sentence description of page contents |
| `key_content` | string[] | yes | Specific items on this page, detailed enough to match correction letter items |
| `topics` | string[] | yes | Keyword tags for routing queries to this page |
| `drawing_zones` | object[] | yes | Spatial map of content locations |
| `title_block_address` | string | no | Project address as read from this page's title block (for cross-page consistency checking) |
| `vision_extracted` | boolean | yes | Whether structured markdown has been generated via vision for this page |

## Drawing Zone Object

| Field | Type | Description |
|-------|------|-------------|
| `zone` | string | Spatial location descriptor (e.g., "top-left", "center", "detail-8 (mid-left)") |
| `content` | string | What's in that zone |

### Zone Naming Conventions

For standard layouts:
- `top-left`, `top-center`, `top-right`
- `middle-left`, `middle-center`, `middle-right`
- `bottom-left`, `bottom-center`, `bottom-right`
- `left-half`, `right-half`, `full-page`
- `left-third`, `center-third`, `right-third`
- `left-column`, `center-column`, `right-column`

For detail sheets with numbered bubbles:
- `detail-N (position)` — e.g., `detail-7 (top-left)`, `detail-3 (bottom-center)`

## Category Values

| Category | Use For |
|----------|---------|
| `general` | Cover sheets, general notes, abbreviations |
| `code_compliance` | CalGreen checklists, code compliance matrices |
| `architectural` | Site plans, floor plans, elevations, sections, roof plans, demo plans |
| `structural` | Structural notes, foundation plans, framing plans, detail sheets |
| `energy` | Title 24 CF1R reports, mandatory requirements summaries |
| `mechanical` | HVAC plans and schedules |
| `plumbing` | Plumbing plans and riser diagrams |
| `electrical` | Electrical plans and panel schedules |

## Topic Keywords

Use consistent topic keywords across pages for reliable routing. Common topics:

**Architectural**: site plan, floor plan, elevations, sections, roof plan, demolition,
window schedule, door schedule, setbacks, property lines, ADU placement

**Structural**: foundation plan, floor framing, shearwall schedule, holdowns,
nailing schedule, anchors, structural wood, seismic design, concrete specs,
rebar, footings, headers, joists, hurricane ties, DTC clips

**Energy**: Title 24, CF1R, energy compliance, HVAC, fenestration, U-factor,
SHGC, building envelope, HERS, water heating, heat pump, insulation R-values,
PV solar, mandatory requirements

**Code**: CalGreen, green building, water efficiency, VOC limits, pollutant
control, fire protection, sprinklers

**General**: project info, scope of work, lot coverage, general notes, code
references, abbreviations

## Example Entry

```json
{
  "page_number": 11,
  "sheet_id": "S2",
  "sheet_title": "Structural Details (Holdowns, Shearwalls, Slab)",
  "category": "structural",
  "subcategory": "structural_details",
  "prepared_by": "GSE - Gonzalez Structural Engineering",
  "description": "Structural detail sheet with holdown schedule, shearwall schedule, slab edge detail, and connection details. 9 detail zones.",
  "key_content": [
    "Holdown schedule: Mark 1 = HD12 (6-SD25212, 4x4 post, 3,075 lbs)",
    "Shearwall schedule: Mark 1 (15/32 STR, 6\"/12\", 340 PLF), Mark 2 (15/32 STR, 4\"/12\", 510 PLF)",
    "Slab edge detail with #4 T&B @ 16\" O.C."
  ],
  "topics": ["holdowns", "shearwall schedule", "slab edge", "connection details", "PLF ratings"],
  "drawing_zones": [
    {"zone": "detail-7 (top-left)", "content": "Holdown schedule and footing section"},
    {"zone": "detail-8 (mid-left)", "content": "Shearwall Schedule table"},
    {"zone": "detail-2 (mid-right)", "content": "Stud wall and shear wall sections"}
  ],
  "title_block_address": "1232 N. Jefferson St., Placentia, CA 92870",
  "vision_extracted": true
}
```
