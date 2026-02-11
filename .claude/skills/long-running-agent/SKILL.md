---
name: long-running-agent
description: This skill converts planning docs and specs into phase-based task structures and prompts for long-running Claude agents. Use when setting up a multi-session agent workflow or breaking down a spec into phases with verification checkpoints.
---

# Long-Running Agent Setup

Convert specs and planning documents into phase-based task structures for autonomous multi-session execution.

## When to Use This Skill

- User has a spec or planning doc to execute with a long-running agent
- User wants to break down a project into phases with verification checkpoints
- User wants to create a `claude-prompt.md` for autonomous task execution

## Source of Truth

Before doing anything, fetch and read this blog post for the core patterns:
**https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents**

This blog from Anthropic's engineering team defines the effective patterns. Apply them directly.

## Core Workflow

### 1. Gather Inputs

Request from the user:
- **Spec/Planning Doc**: The document to convert (required)
- **Project Name**: Short identifier
- **Output Location**: Where to create files

### 2. Read the Blog

Fetch the Anthropic blog post above. The key patterns are:
- Phase-based work with verification checkpoints
- Explicit feature/task enumeration (granular, testable items)
- Task file as progress tracker
- Git checkpointing after each task
- Strong constraints (no test deletion, no skipping phases)

### 3. Decompose into Phases and Tasks

Break the spec into:

**Phases** (3-8 typically):
- Logical groupings of related work
- Each phase has verification steps to test completion
- Agent completes ALL tasks in a phase, then stops for user verification

**Tasks** (per phase):
- Granular, implementable units
- Each task has specific steps
- Uses `passes: true/false` to track completion

Example structure from a real project:
```
Phase 1: Project Foundation (3 tasks)
  - setup-001: Initialize project structure
  - setup-002: Create environment config
  - types-001: Define core interfaces
  Verification: "Run npx tsc --noEmit, confirm no errors"

Phase 2: Storage & Skills (5 tasks)
  - storage-001: Create storage interface
  - skill-001 to skill-004: Create skill files
  Verification: "Confirm skills load, storage works"

... etc
```

### 4. Generate claude-task.json

Create the task file using `assets/task-template.json` structure:
- `phases` array with verification steps
- `tasks` array with `passes: false` initially
- Tasks reference their parent phase

Output: `{project-root}/claude-task.json`

### 5. Generate claude-prompt.md

Use `assets/claude-prompt-template.md` as the base.

Key sections to customize:
- Project overview and goal
- Key files list (SPEC.md, claude-task.json, any API docs)
- Phases table showing all phases
- File structure target
- Technical decisions specific to the project

Output: `{project-root}/claude-prompt.md`

### 6. Keep the SPEC

The original spec should remain as `SPEC.md` for the agent to reference when it needs detailed requirements.

## Output Structure

```
{project-root}/
├── claude-prompt.md      # Agent instructions
├── claude-task.json      # Phases and tasks
└── SPEC.md               # Original planning doc (kept for reference)
```

## Starting the Agent

Instruct the user:
```
@claude-prompt.md
```

The agent will read claude-task.json, find the current phase, and work through tasks until phase completion.

## Key Patterns (from the blog)

1. **Phase boundaries = verification checkpoints** - Agent stops, user verifies, then continues
2. **Complete ALL tasks in phase** - No stopping mid-phase
3. **Git commit after each task** - `task-XXX: description`
4. **Never skip phases** - Sequential progression
5. **Task file is the source of truth** - Agent reads and updates it

## Reference Materials

- `assets/claude-prompt-template.md` - Template for claude-prompt.md
- `assets/task-template.json` - Template for claude-task.json structure
