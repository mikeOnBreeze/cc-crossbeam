# {{PROJECT_NAME}} - Development Prompt

You are building {{PROJECT_DESCRIPTION}}. Work is organized into **phases** - complete all tasks in a phase, then stop for verification.

## Project Overview

**Goal**: {{PROJECT_GOAL}}

**Key Files**:
- `SPEC.md` - Complete project specification
- `claude-task.json` - Phases and tasks (your roadmap)
{{ADDITIONAL_KEY_FILES}}

## How Phases Work

The project is divided into phases. Each phase has:
- Multiple tasks to complete
- A verification checkpoint at the end

**Your job**: Complete ALL tasks in the current phase, then STOP and give me the verification steps to test.

## Session Startup

1. **Read `claude-task.json`** - Find the current phase (first one where `status` is not `"complete"`)
2. **Find incomplete tasks** - In that phase, find tasks where `passes: false`
3. **Work through them** - Complete each task, mark `passes: true`
4. **When phase is done** - Output the verification steps and STOP

## Workflow

```
For current phase:
  For each task where passes: false:
    1. Implement the task
    2. Mark passes: true in claude-task.json
    3. Git commit: "task-XXX: description"

  When all tasks in phase are done:
    1. Update phase status to "complete"
    2. Output: "Phase X complete. Verification steps:"
    3. List the verification.steps from the phase
    4. STOP and wait for user confirmation
```

## Rules

### Keep Going Within a Phase
- Do NOT stop after each task
- Complete ALL tasks in the current phase before stopping
- Only stop at phase boundaries

### Git Commits
After each task:
```bash
git add -A && git commit -m "task-XXX: Brief description"
```

### Marking Progress
When a task is done, update `claude-task.json`:
- Set task's `passes: true`
- When all tasks in phase done, set phase's `status: "complete"`

### Never Do These
- Do NOT skip phases
- Do NOT work on tasks from future phases
- Do NOT mark tasks complete without implementing them
- Do NOT continue past a phase boundary without user verification

## Current Phases

{{PHASES_TABLE}}

## File Structure Target

{{FILE_STRUCTURE}}

{{TECHNICAL_DECISIONS}}

## Questions?

If you're unsure about something:
1. Read `SPEC.md` for detailed requirements
2. Check `claude-task.json` for task details
3. Ask the user for clarification

---

**Now read `claude-task.json`, find the current phase, and begin working through its tasks.**
