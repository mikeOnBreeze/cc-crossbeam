# Construction Plan Sheet Conventions

## Sheet Numbering System

Construction plan sets use a standard prefix system to organize sheets by discipline:

| Prefix | Discipline | Common Sheets |
|--------|-----------|---------------|
| **CS** | Cover Sheet | Project info, sheet index, general notes, code references |
| **A** | Architectural | Site plans, floor plans, elevations, roof plans, sections, details |
| **S** | Structural | Structural notes, foundation plans, framing plans, structural details |
| **M** | Mechanical | HVAC layout, duct plans, equipment schedules |
| **P** | Plumbing | Plumbing plans, riser diagrams, fixture schedules |
| **E** | Electrical | Electrical plans, panel schedules, lighting plans |
| **T** | Title 24 / Energy | Energy compliance reports, CF-1R forms, insulation details |
| **L** | Landscape | Landscape plans (less common in ADU sets) |
| **G** | Grading | Grading plans, drainage, earthwork |
| **C** | Civil | Civil engineering, utilities, site improvements |

### Numbering Convention

Sheets use `PREFIX + NUMBER.SEQUENCE` format:
- **S1.0**, **S1.1** = Structural notes (page 1, page 2)
- **S2.0** = Foundation plan
- **S2.1** = Floor framing plan
- **S2.2** = Roof framing plan (or roof plan)
- **S3.0**, **S3.1**, **S3.2**... = Typical structural details (multiple pages)
- **A1** = Site plan (or combined site plan + floor plan)
- **A2** = Floor plan (or ADU plan with schedules)
- **A3** = Elevations and/or roof plan
- **A3.1** or **A5.1** = Sections and details

The first digit after the prefix generally indicates the category:
- X1.x = Notes
- X2.x = Plans (foundation, framing, floor)
- X3.x = Details
- X4.x = Additional details
- X5.x = Sections

### Special Sheets

| Sheet | What It Is |
|-------|-----------|
| **CS** / **CS.1** | Cover sheet, city forms |
| **AIA.1**, **AIA.2** | CalGreen checklists (California-specific) |
| **WSWH1**, **WSWH2** | Wood shear wall / hold-down details |
| **T-1**, **T-2**, **T-3** | Title 24 energy compliance reports |

## Where Things Are on a Sheet

### Title Block (Bottom-Right Corner)
Every sheet has a title block in the bottom-right corner containing:
- **Sheet number** (e.g., S2.0)
- **Sheet title** (e.g., "Foundation Plan")
- **Project name and address**
- **Designer/firm name and stamp**
- **Date and revision info**
- **Scale**

The title block is the most reliable way to identify a sheet. It occupies roughly the bottom-right 20-30% of the page.

### Detail Callouts
When a sheet contains multiple details, they are numbered and typically arranged in a grid:
- **Detail 1**, **Detail 2**, etc.
- Referenced as `DETAIL#/SHEET` (e.g., "Detail 2/A3" means Detail 2 on Sheet A3)
- Details are usually arranged left-to-right, top-to-bottom
- Each detail has its own title, scale, and border

### Plan Sheets vs. Detail Sheets
- **Plan sheets** (A1, A2, S2.0): Show the full building layout — one main drawing per sheet
- **Detail sheets** (A3.1, S3.0-S3.4): Show multiple smaller detail drawings arranged in a grid — 4-8 details per sheet
- **Elevation sheets** (A3): Show building elevations — typically 2-4 views per sheet

### Border and Margins
- Construction drawings have a thick border with revision blocks along the right edge
- The drawing area is inside this border
- North arrow and scale indicators are usually near the plan drawing

## The Sheet Index

The sheet index appears on the cover sheet (CS), usually in the top-right or right-side area. It lists:

```
SHEET NO.  &  DESCRIPTION
CS         COVER SHEET
AIA.1      2022 CALGREEN AIA CHECKLIST
A1         (E) & (N) SITE PLAN
A2         (N) ADU FLOOR PLAN W/ SCHEDULES
A3         ELEVATIONS & PROPOSED ROOF PLAN
S1.0       STRUCTURAL NOTES
S2.0       FOUNDATION PLAN
...
```

### Index vs. PDF Page Numbers

**The sheet index order generally matches the PDF page order**, but there can be mismatches:
- Extra pages not in the index (city forms, checklists, watermarked covers)
- Pages added after the index was created (addenda, revision sheets)
- The index might have 12 entries but the PDF has 15 pages

**To resolve**: Read the title block of each page to get the actual sheet ID, then match against the index. The title block is the ground truth — the index is just a guide.

## Common ADU Plan Set Sizes

| Project Type | Typical Pages | Typical Sheets |
|-------------|---------------|----------------|
| Small ADU conversion | 8-12 | CS, A1-A2, S1-S2, T-1 |
| New detached ADU | 15-30 | CS, A1-A3, S1-S6, T1-T3, + details |
| ADU above garage | 20-35 | CS, A1-A5, S1-S6, T1-T3, + details |
