# Vision Extract Batch — Subagent Prompt Template

Use this prompt template when spawning subagents via the Task tool to vision-
extract batches of page PNGs into structured markdown.

## How to Use

Replace `{{PAGE_LIST}}` with the actual page assignments for each subagent.
Each batch should contain **at most 3 pages**. Launch up to 3 batches per round.

```
Task tool parameters:
  subagent_type: "general-purpose"
  mode: "bypassPermissions"  (or "default" if permission prompts are acceptable)
  run_in_background: true     (enables parallel execution)
```

## Prompt Template

---

You are extracting construction PDF plan pages via vision into structured
markdown. Read each PNG image using the Read tool and write a structured
markdown file for it.

For each page, follow this structure:

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

Guidelines:
1. Identify the title block first (usually bottom-right or right edge)
2. Extract ALL text content — schedules as markdown tables, notes as numbered
   lists, specifications as structured data
3. Map each section to a spatial zone (top-left, center, bottom-right, etc.)
4. For drawings that cannot be converted to text, describe what they show
   (e.g., "Foundation plan showing footing layout with dimensions and rebar
   callouts")
5. Note any watermark text present on the page
6. Flag confidence levels — mark anything obscured by watermarks or unreadable
   at 200 DPI resolution

Process these pages:
{{PAGE_LIST}}

Read each PNG using the Read tool, then write the markdown file. Do all pages
in this batch.

---

## Example {{PAGE_LIST}} block

```
- /path/to/pages-png/page-04.png → Write to /path/to/pages-vision/page-04.md
- /path/to/pages-png/page-05.png → Write to /path/to/pages-vision/page-05.md
- /path/to/pages-png/page-06.png → Write to /path/to/pages-vision/page-06.md
```

## Resource Constraints

**Maximum 3 concurrent subagents. Maximum 3 pages per subagent.**

This is a hard constraint for deployment to Vercel sandboxes (4 GB RAM total).
The orchestrator + 3 subagents = 4 processes, each getting ~1 GB RAM. Do not
exceed 3 concurrent subagents under any circumstances.

## Batching Strategy

| Binder Size | Pages/Batch | Rounds | Subagents/Round | Total Batches |
|-------------|-------------|--------|-----------------|---------------|
| 9 pages     | 3           | 1      | 3               | 3             |
| 15 pages    | 3           | 2      | 3, then 2       | 5             |
| 21 pages    | 3           | 3      | 3, 3, 1         | 7             |
| 30 pages    | 3           | 4      | 3, 3, 3, 1      | 10            |

Process batches in **rounds of up to 3 subagents**. Wait for all subagents
in a round to complete before launching the next round. Never exceed 3 pages
per subagent — more pages means more image tokens in context, which degrades
extraction quality and risks memory pressure.
