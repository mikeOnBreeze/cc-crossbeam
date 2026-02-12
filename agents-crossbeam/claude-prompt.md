# agents-crossbeam — Development Prompt

You are building the **Agent SDK backend** for CrossBeam — an AI ADU permit assistant that helps contractors respond to city corrections letters. Work is organized into **phases** — complete all tasks in a phase, then stop for verification.

## Project Overview

**Goal**: Run the ADU corrections pipeline programmatically via the Claude Agent SDK, so the two-skill flow (analysis + response generation) can be triggered from code instead of through the Claude Code CLI. This unlocks wiring the pipeline to a Next.js frontend.

**Key Files**:
- `agents-crossbeam/claude-task.json` — Phases and tasks (your roadmap)
- `plan-contractors-agents-sdk.md` — Complete architecture spec (config patterns, gotchas, flow design)
- `testing-agents-sdk.md` — Testing strategy (L0-L4 test suite, mock data, Buena Park shortcut)
- `adu-skill-development/skill/` — Source of truth for all ADU skills (symlink targets)
- `test-assets/corrections/` — Placentia corrections letter PNGs + plan binder PDF
- `test-assets/correction-01/` — Complete CLI run outputs (pre-extracted pages, all JSON artifacts, all deliverables) — USE THESE as mock-session fixtures

## How Phases Work

The project is divided into 7 phases. Each phase has:
- Multiple tasks to complete
- A verification checkpoint at the end

**Your job**: Complete ALL tasks in the current phase, then STOP and give me the verification steps to test.

## Session Startup

1. **Read `agents-crossbeam/claude-task.json`** — Find the current phase (first one where `status` is not `"complete"`)
2. **Find incomplete tasks** — In that phase, find tasks where `passes: false`
3. **Work through them** — Complete each task, mark `passes: true`
4. **When phase is done** — Output the verification steps and STOP

## Workflow

```
For current phase:
  For each task where passes: false:
    1. Read the task description and steps from claude-task.json
    2. Implement the task
    3. Mark passes: true in claude-task.json
    4. Git commit: "task-XXX: description"

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
After each task, stage only the agents-crossbeam/ and test-assets/ directories (NOT the parent repo):
```bash
git add agents-crossbeam/ test-assets/ && git commit -m "task-XXX: Brief description"
```

### Marking Progress
When a task is done, update `agents-crossbeam/claude-task.json`:
- Set task's `passes: true`
- When all tasks in phase done, set phase's `status: "complete"`

### Running SDK Tests (IMPORTANT — Bash Timeouts)
Agent SDK tests take 30 seconds to 20 minutes. The Bash tool defaults to 2 minutes. Use extended timeouts:
- **L0/L1**: `timeout: 180000` (3 min)
- **L2/L3/L3b**: `timeout: 600000` (10 min)
- **L4**: Use `run_in_background: true`, then poll with `TaskOutput` or `tail`

### If Stuck
If a task fails after 3 attempts with the same error, **STOP and ask the user**. Don't burn budget on repeat failures. Report: what you tried, what failed, your best theory on the root cause.

### API Keys Are Expendable
All API keys in this project are temporary hackathon/test keys. Do NOT worry about viewing, reading, or handling them in code. They will be deleted before production. Never hold up work because of key sensitivity concerns.

### When You Have SDK Questions — Use CC Guide
If you're unsure about Agent SDK behavior, configuration, or API details, use the **cc-guide skill** (`/cc-guide <your question>`). It has access to the full latest Anthropic docs and can answer questions about `query()`, options, hooks, tools, skills, etc. Use it liberally — it's faster than guessing.

### Never Do These
- Do NOT skip phases
- Do NOT work on tasks from future phases
- Do NOT mark tasks complete without implementing them
- Do NOT continue past a phase boundary without user verification
- Do NOT delete or remove test files
- Do NOT modify skills in `adu-skill-development/skill/` — those are the source of truth

## Current Phases

| Phase | Name | Tasks | Key Milestone |
|-------|------|-------|---------------|
| 1 | Project Scaffolding + Shared Config | 7 | Directory structure, symlinks, npm install, config.ts, session.ts |
| 2 | L0 Smoke Test | 2 | SDK connects, skills discovered, SMOKE_OK |
| 3 | L1 Skill Invocation | 2 | california-adu skill runs, writes correct JSON |
| 4 | L2 Subagent + Bash | 3 | Task tool spawns subagents, image reading works |
| 5 | Flow Wrappers + L3 Mini Pipeline | 7 | Multi-skill orchestration with Buena Park shortcut |
| 6 | Skill 2 Isolation (L3b) | 3 | Response generation from pre-made fixtures |
| 7 | Full Pipeline Acceptance (L4) | 2 | Real Placentia data, live city search, end-to-end |

## File Structure Target

```
agents-crossbeam/                   ← Agent SDK project root (cwd for query() calls)
├── .claude/
│   └── skills/                     ← 6 ADU skills (symlinked from adu-skill-development/skill/)
│       ├── california-adu → ../../../adu-skill-development/skill/california-adu
│       ├── adu-corrections-flow → ...
│       ├── adu-corrections-complete → ...
│       ├── adu-city-research → ...
│       ├── adu-targeted-page-viewer → ...
│       └── buena-park-adu → ...
├── src/
│   ├── flows/
│   │   ├── corrections-analysis.ts   # Skill 1 query() wrapper (Phases 1-4)
│   │   └── corrections-response.ts   # Skill 2 query() wrapper (Phase 5)
│   ├── tests/
│   │   ├── test-l0-smoke.ts          # SDK init + skill discovery (~30s, $0.01)
│   │   ├── test-l1-skill-invoke.ts   # Single skill + file write (~2min, $0.50)
│   │   ├── test-l2-subagent-bash.ts  # Task tool + Bash + images (~3min, $1)
│   │   ├── test-l3-mini-pipeline.ts  # Multi-skill orchestration (~7min, $5)
│   │   ├── test-l3b-skill2-only.ts   # Skill 2 from fixtures (~3min, $3)
│   │   └── test-l4-full-pipeline.ts  # Real data acceptance (~20min, $15)
│   └── utils/
│       ├── config.ts                 # Shared base config factory (ALL flows/tests import this)
│       ├── session.ts                # Session directory management
│       ├── progress.ts               # Progress event handler
│       └── verify.ts                 # Post-run file verification
├── sessions/                         ← Runtime output (gitignored)
├── package.json                      # @anthropic-ai/claude-agent-sdk
├── tsconfig.json                     # Node 24 ESM, noEmit (no build step)
├── .env.local                        # ANTHROPIC_API_KEY
├── .gitignore                        # sessions/, node_modules/, .env*
├── claude-task.json                  # THIS FILE — your roadmap
└── claude-prompt.md                  # THIS FILE — your instructions
```

## Technical Decisions

### Runtime Environment
- **Node 24.9** — `--experimental-strip-types` strips TypeScript natively, no build step needed
- **ESM modules** — `"type": "module"` in package.json, use `import.meta.dirname`
- **Run command**: `node --env-file .env.local --experimental-strip-types ./src/tests/test-X.ts`

### Agent SDK Configuration (PROVEN PATTERN)
This exact config is proven from Dec 2025 + Feb 2026 work. DO NOT deviate:

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

const result = query({
  prompt: constructedPrompt,
  options: {
    tools: { type: 'preset', preset: 'claude_code' },          // REQUIRED — without this, agent hallucinates tools
    systemPrompt: {
      type: 'preset',
      preset: 'claude_code',
      append: CROSSBEAM_SYSTEM_PROMPT,                          // Our custom context
    },
    cwd: AGENTS_ROOT,                                           // agents-crossbeam/ — NOT the parent project
    settingSources: ['project'],                                // REQUIRED — loads .claude/skills/
    permissionMode: 'bypassPermissions',                        // Headless — no interactive prompts
    allowDangerouslySkipPermissions: true,                      // Required with bypassPermissions
    allowedTools: ['Skill', 'Task', 'Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep', 'WebSearch', 'WebFetch'],
    additionalDirectories: [PROJECT_ROOT],                      // Access to test-assets/ in parent
    maxTurns: 80,
    maxBudgetUsd: 15.00,
    model: 'claude-opus-4-6',                                   // Full alias required
    includePartialMessages: true,
    abortController: new AbortController(),
  }
});
```

### Critical Gotchas (MUST READ)
| Gotcha | What Happens | Fix |
|--------|-------------|-----|
| Missing `tools` preset | Agent says "I'll write the file" but nothing appears | `tools: { type: 'preset', preset: 'claude_code' }` |
| Missing `settingSources` | Skills not discovered | `settingSources: ['project']` |
| Wrong `cwd` | Loads 13 skills from parent (nano-banana, etc.) | Point to `agents-crossbeam/`, not `CC-Crossbeam/` |
| Wrong model name | Init failure | Use `'claude-opus-4-6'`, not `'opus'` |
| Missing `additionalDirectories` | Can't access `test-assets/` | Add `[PROJECT_ROOT]` |
| Permission prompts hang | Agent waits for approval forever | `permissionMode: 'bypassPermissions'` + `allowDangerouslySkipPermissions: true` |
| Subagents can't find skills | Subagent Skill tool fails | Test in L2. If broken: restructure so parent does all skill calls |

### Testing Ladder — WHY It Matters
The full corrections pipeline takes 15-20 minutes per run. **We cannot iterate at that speed.** The testing ladder lets us isolate and fix each layer:

| Level | Tests | Time | Cost | Model | What It Validates |
|-------|-------|------|------|-------|-------------------|
| L0 | SDK connection | 30s | $0.01 | Haiku | Config, auth, skill discovery |
| L1 | Skill invocation | 2m | $0.50 | Haiku | Skill tool, reference files, file I/O |
| L2 | Subagent + Bash | 3m | $1 | Sonnet | Task tool, Bash, image reading |
| L3 | Mini pipeline | 7m | $5 | Opus | Multi-skill orchestration (offline) |
| L3b | Skill 2 isolation | 3m | $3 | Opus | Response generation (from fixtures) |
| L4 | Full pipeline | 20m | $15 | Opus | Real data, live search, end-to-end |

**Rule: Use Haiku/Sonnet for L0-L2** (testing wiring, not quality). **Use Opus for L3+** (testing skill behavior).

### The Buena Park Shortcut (L3)
- `adu-city-research` does live WebSearch + WebFetch = 5-10 min
- `buena-park-adu` is an offline reference skill = ~30 sec
- Remove WebSearch/WebFetch from allowedTools → forces offline city research
- Same pipeline orchestration, just faster city data
- When ready for L4: add WebSearch/WebFetch back

### Two Environments (CLI vs Agent SDK)
- **Claude Code CLI** (us building the app) — runs from `CC-Crossbeam/`, sees ALL 13 skills
- **Agent SDK** (the app running the pipeline) — runs from `agents-crossbeam/`, sees ONLY 6 ADU skills
- Symlinks in `agents-crossbeam/.claude/skills/` point to source of truth in `adu-skill-development/skill/`
- Edit skills in `adu-skill-development/skill/` — changes auto-propagate via symlinks

### Existing Test Data (GOLDMINE)
`test-assets/correction-01/` has complete outputs from a CLI run:
- `corrections_parsed.json` — parsed corrections
- `corrections_categorized.json` — categorized with research
- `sheet-manifest.json` — full sheet manifest (15 sheets: CS, AIA.1, AIA.2, A1, A1.1, A2, A3, SN1, SN2, S1, S2, S3, T-1, T-2, T-3)
- `contractor_questions.json` — generated questions
- `contractor_answers.json` — mock contractor answers
- `state_law_findings.json` — state law research
- `sheet_observations.json` — sheet analysis
- `pages-png/page-01.png` through `page-15.png` — pre-extracted plan pages
- `response_letter.md`, `professional_scope.md`, `corrections_report.md`, `sheet_annotations.json` — all 4 deliverables

**NOT present** in correction-01/: `city_discovery.json`, `city_research_findings.json` (city research was done differently in the CLI run). These are optional for Skill 2 testing.

**Page-to-sheet mapping** (from the manifest — important for L2 test data):
- `page-01.png` = CS (Cover Sheet) — do NOT use this as "A1"
- `page-04.png` = A1 (Site Plan)
- `page-06.png` = A2 (Floor Plan) — good for corrections testing
- `page-07.png` = A3 (Sections & Elevations)

**USE THESE** for mock-session fixtures (L3b) and mini test data (L2/L3).

## Questions?

If you're unsure about something:
1. **Use `/cc-guide <question>`** — the CC Guide skill has full Agent SDK docs and is your best resource for SDK-specific questions
2. Read `plan-contractors-agents-sdk.md` for detailed architecture
3. Read `testing-agents-sdk.md` for testing details
4. Check `agents-crossbeam/claude-task.json` for task details
5. Ask the user for clarification

---

**Now read `agents-crossbeam/claude-task.json`, find the current phase, and begin working through its tasks.**
