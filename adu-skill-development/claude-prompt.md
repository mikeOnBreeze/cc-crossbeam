# California ADU Skill Builder - Development Prompt

You are building a **Claude Code skill** that converts the California HCD ADU Handbook (January 2025, 54 pages) into a structured regulatory decision engine with ~30 reference files. Work is organized into **phases** — complete all tasks in a phase, then stop for verification.

## Project Overview

**Goal**: Create a skill at `skill/california-adu/` with a SKILL.md decision tree router, an AGENTS.md reference catalog, and ~27 focused reference files that an AI agent can selectively load when answering ADU permitting questions — instead of loading all 54 pages every time.

**Key Files**:
- `claude-task.json` — Phases and tasks (your roadmap and progress tracker)
- `HCD-ADU-Handbook-2025-raw.md` — The raw text extraction of the handbook (1,323 lines, 126KB). This is your **source material**. Page markers like `<!-- Page X -->` help you find specific content.
- `plan-skill-aduHandbook.md` — The full plan with architecture details, decision tree design, thresholds table, and reference file format specification. **Read this first** to understand the target architecture.

## How Phases Work

The project is divided into 7 phases. Each phase has:
- Multiple tasks to complete
- A verification checkpoint at the end

**Your job**: Complete ALL tasks in the current phase, then STOP and give me the verification steps to test.

## Session Startup

1. **Read `claude-task.json`** — Find the current phase (first one where `status` is not `"complete"`)
2. **Read `plan-skill-aduHandbook.md`** — Refresh on architecture, file format, and design decisions
3. **Find incomplete tasks** — In the current phase, find tasks where `passes: false`
4. **Work through them** — Complete each task, update `passes: true` in claude-task.json
5. **When phase is done** — Output the verification steps and STOP

## Workflow

```
For current phase:
  For each task where passes: false:
    1. Read the relevant pages from HCD-ADU-Handbook-2025-raw.md
    2. Create the reference file following the format spec
    3. Mark passes: true in claude-task.json
    4. Git commit: "task-XXX: description"

  When all tasks in phase are done:
    1. Update phase status to "complete" in claude-task.json
    2. Output: "Phase X complete. Verification steps:"
    3. List the verification.steps from the phase
    4. STOP and wait for user confirmation
```

## Reference File Format

Every reference file MUST follow this structure:

```yaml
---
title: [Clear topic title]
category: [unit-types|standards|permit|zoning|ownership|special|compliance|legislative]
relevance: [When to read this file — 1-2 sentences]
key_code_sections: [Gov. Code §§ XXXXX]
---

## [Topic Title]

[Core rules extracted from handbook — use Q&A format where the source uses it,
otherwise use clear rule statements with legal citations]

### Cross-References
- See also: [filename.md] — [why it's related]

### Key Code Sections
- Gov. Code § XXXXX — [brief description]
```

**Important format rules**:
- YAML frontmatter is required on every reference file
- Keep each file focused on ONE topic — under ~3K if possible
- Use the handbook's own Q&A format where it exists (many sections are structured as FAQ)
- Always include the specific Gov. Code section numbers from the source
- Cross-references should point to other reference files by filename (not full path)
- Content should be extracted/synthesized from the raw markdown, not invented

## Rules

### Keep Going Within a Phase
- Do NOT stop after each task — complete ALL tasks in the current phase before stopping
- Only stop at phase boundaries

### Git Commits
After each task:
```bash
git add -A && git commit -m "task-XXX: Brief description"
```
If git is not initialized, skip git commits and just continue.

### Marking Progress
When a task is done, update `claude-task.json`:
- Set the task's `passes: true`
- When all tasks in a phase are done, set the phase's `status: "complete"`

### Reading Source Material
- The raw markdown has `<!-- Page X -->` markers — use these to find the pages listed in each task
- Read only the pages you need for the current task to conserve context
- When a topic spans multiple pages, read all relevant pages before writing the reference file

### Never Do These
- Do NOT skip phases — work sequentially
- Do NOT work on tasks from future phases
- Do NOT mark tasks complete without creating the actual files
- Do NOT continue past a phase boundary without user verification
- Do NOT invent rules or citations — only extract from the source material
- Do NOT create files not listed in the plan without noting the addition

## Current Phases

| Phase | Name | Tasks | Description |
|-------|------|-------|-------------|
| 1 | Skeleton + Root Files | 3 | Create directory, SKILL.md, AGENTS.md, CLAUDE.md symlink |
| 2 | Unit Types | 4 | 4 foundational unit-type classification files |
| 3 | Development Standards | 7 | Height, size, setbacks, parking, fire, solar, design |
| 4 | Permitting + Fees | 3 | Process timelines, fees, funding sources |
| 5 | Zoning + Ownership | 6 | Zoning rules, hazards, owner-occupancy, HOA, sales |
| 6 | Special + Compliance + Glossary + Legislative | 8 | Manufactured homes, SB 9, unpermitted, ordinances, glossary, legislative |
| 7 | Review + Cross-Reference Pass | 5 | Completeness, cross-refs, citations, routing, size check |

## File Structure Target

```
adu-skill-development/skill/california-adu/
├── SKILL.md                          # Decision tree router (~200 lines)
├── AGENTS.md                         # Reference file catalog (~120 lines)
├── CLAUDE.md → AGENTS.md             # Symlink
└── references/
    ├── glossary.md
    ├── unit-types-66323.md
    ├── unit-types-adu-general.md
    ├── unit-types-jadu.md
    ├── unit-types-multifamily.md
    ├── standards-height.md
    ├── standards-size.md
    ├── standards-setbacks.md
    ├── standards-parking.md
    ├── standards-fire.md
    ├── standards-solar.md
    ├── standards-design.md
    ├── permit-process.md
    ├── permit-fees.md
    ├── permit-funding.md
    ├── zoning-general.md
    ├── zoning-hazards.md
    ├── zoning-nonconforming.md
    ├── ownership-use.md
    ├── ownership-sales.md
    ├── ownership-hoa.md
    ├── special-manufactured.md
    ├── special-sb9.md
    ├── compliance-unpermitted.md
    ├── compliance-ordinances.md
    ├── compliance-housing.md
    ├── compliance-utilities.md
    └── legislative-changes.md
```

## Technical Decisions

- **SKILL.md** uses a 4-step decision tree (not a category table) — see plan for full design
- **Thresholds table** in SKILL.md has 17 key numbers that come up in almost every query
- **Prefix naming** groups files by category: `unit-types-`, `standards-`, `permit-`, `zoning-`, `ownership-`, `special-`, `compliance-`, `legislative-`
- **YAML frontmatter** on every reference file enables programmatic discovery
- **Cross-references** use filenames only (e.g., `standards-height.md`), not full paths
- State law **preempts** local law — reference files should note where cities cannot be more restrictive

## Questions?

If you're unsure about something:
1. Read `plan-skill-aduHandbook.md` for detailed architecture and design decisions
2. Check `claude-task.json` for task details and steps
3. Read the relevant pages from `HCD-ADU-Handbook-2025-raw.md`
4. Ask the user for clarification

---

**Now read `claude-task.json`, find the current phase, and begin working through its tasks.**
