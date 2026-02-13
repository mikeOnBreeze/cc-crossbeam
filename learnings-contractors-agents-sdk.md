# Learnings: Contractors Agent SDK Build

What we learned building `agents-crossbeam/` — the Agent SDK backend for the corrections pipeline. Use this as a reference when building the next Agent SDK integration (city flow, or any multi-skill pipeline).

## The Winning Config Pattern

This is the exact config that works. Don't deviate without reason.

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

const options = {
  tools: { type: 'preset', preset: 'claude_code' },
  systemPrompt: {
    type: 'preset',
    preset: 'claude_code',
    append: 'Your domain-specific system prompt here',
  },
  cwd: AGENTS_ROOT,                    // The agents-xxx/ directory (where .claude/skills/ lives)
  settingSources: ['project'],          // CRITICAL — without this, skills aren't discovered
  permissionMode: 'bypassPermissions',
  allowDangerouslySkipPermissions: true,
  allowedTools: ['Skill', 'Task', 'Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep', 'WebSearch', 'WebFetch'],
  additionalDirectories: [PROJECT_ROOT], // So agent can read test-assets/, skills, etc.
  maxTurns: 80,
  maxBudgetUsd: 15.00,
  model: 'claude-opus-4-6',
  includePartialMessages: true,
  abortController: new AbortController(),
};

const q = query({ prompt, options });
for await (const msg of q) { /* handle messages */ }
```

### What Each Setting Does

| Setting | Why It Matters |
|---------|---------------|
| `preset: 'claude_code'` (both tools + systemPrompt) | Gives the agent access to Claude Code tools (Skill, Task, Read, Write, etc.) |
| `settingSources: ['project']` | **Skill discovery.** Without this, the agent has tools but no skills. Skills live in `.claude/skills/` under `cwd`. |
| `cwd: AGENTS_ROOT` | Where the agent "lives." Must be the directory that contains `.claude/skills/`. |
| `additionalDirectories` | Lets the agent read files outside `cwd` (test data, shared resources). |
| `permissionMode: 'bypassPermissions'` + `allowDangerouslySkipPermissions` | Both required. Without them the agent hangs waiting for user approval. |
| `allowedTools` | Whitelist of tools. Removing tools (e.g., WebSearch) forces offline behavior. |
| `includePartialMessages: true` | Lets you see tool calls as they happen (for progress logging). |

## Project Structure That Works

```
agents-xxx/
├── .claude/skills/          # Symlinks to skill directories
│   ├── skill-a -> ../../../path/to/skill-a
│   └── skill-b -> ../../../path/to/skill-b
├── .env.local               # ANTHROPIC_API_KEY (gitignored)
├── package.json             # type: "module", @anthropic-ai/claude-agent-sdk
├── tsconfig.json            # ESNext, NodeNext, noEmit: true
├── claude-task.json         # Phase-based task tracker
├── sessions/                # Timestamped output directories (gitignored)
└── src/
    ├── flows/               # query() wrappers per skill/pipeline
    ├── tests/               # Test scripts (L0, L1, L2, L3, etc.)
    └── utils/               # Shared config, session management, progress, verify
```

### Key Decisions

- **Symlinked skills**: Skills live in one place (`adu-skill-development/skill/`), symlinked into each agent project's `.claude/skills/`. Keeps skills DRY across projects.
- **No build step**: Node 24 with `--experimental-strip-types` runs TypeScript natively. Run scripts with `node --env-file .env.local --experimental-strip-types ./src/tests/test-xxx.ts`.
- **Session directories**: Timestamped dirs (`sessions/l4-2026-02-13T01-16-14/`) keep each run isolated. Agent writes all output here.
- **ESM only**: `"type": "module"` in package.json. Use `.ts` extensions in imports.

## Test Ladder: Build Bottom-Up

The test ladder validates capabilities incrementally. Each level builds on the previous one. **Do not skip levels** — bugs compound.

| Level | What It Tests | Model | Budget | Duration | Notes |
|-------|--------------|-------|--------|----------|-------|
| L0 | SDK init, skill discovery | Haiku | $0.10 | ~10s | Does the agent see your skills? |
| L1 | Single skill invocation | Sonnet | $1.00 | ~1m | Can it invoke a skill and write output? |
| L2 | Subagent + Bash + image | Sonnet | $2.00 | ~3m | Can it spawn subagents via Task tool? |
| L3 | Mini pipeline (offline) | Opus | $8.00 | ~11m | Multi-skill orchestration with shortcuts |
| L3b | Skill 2 isolation | Opus | $6.00 | ~5m | Second skill from pre-made fixtures |
| L4 | Full pipeline (live web) | Opus | $15+$8 | ~24m | End-to-end acceptance test |

### L0-L2: Fast Iteration

- Use **Haiku** for L0 (skill discovery only — no real work).
- Use **Sonnet** for L1-L2 (good enough for single-skill and subagent validation, much cheaper than Opus).
- These tests should take < 3 minutes each. If they don't, something's wrong.

### L3: The Shortcut Pattern

The most valuable testing pattern. Create an "offline shortcut" that removes expensive operations:

1. **Pre-populate intermediate files** (e.g., sheet manifest) so the agent skips expensive extraction phases.
2. **Remove WebSearch/WebFetch from allowedTools** to force the agent to use an offline skill (e.g., `buena-park-adu`) instead of live web search.
3. This lets you test multi-skill orchestration for ~$3 instead of ~$6, and in 11 min instead of 24 min.

```typescript
// Remove web tools to force offline city research
const offlineTools = [
  'Skill', 'Task', 'Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep',
  // WebSearch and WebFetch intentionally omitted
];
```

### L3b: Fixture-Based Skill Testing

Copy outputs from a successful CLI run into `test-assets/mock-session/`. Then test Skill 2 independently by copying those fixtures into a fresh session directory. This lets you iterate on Skill 2 output quality without re-running Skill 1 every time.

## Bugs We Hit and How We Fixed Them

### 1. Agent Returns "Success" Without Finishing

**Symptom**: Agent spawns subagents, then immediately returns success without waiting for results or running the merge phase.

**Root cause**: The prompt wasn't explicit enough about completing all phases.

**Fix**: Add explicit completion requirements to the prompt:
```
YOU MUST COMPLETE ALL 4 PHASES — do NOT stop after spawning subagents.
The job is NOT done until [final_file_1] AND [final_file_2] are written.
```

**Takeaway**: With multi-phase pipelines, be extremely explicit in the prompt about what "done" means. List the files that must exist. Say "do NOT return success without writing them."

### 2. File Verification Race Condition

**Symptom**: Test checks for output files immediately after agent returns "success," but files written by subagents haven't flushed to disk yet.

**Fix**: Add a 2-second delay before verification:
```typescript
if (msg.type === 'result') {
  await new Promise(r => setTimeout(r, 2000));
  // Now verify files
}
```

### 3. Subagent File Naming Mismatch

**Symptom**: Test expects `state_law_findings.json` but subagent writes `research_state_law.json`.

**Root cause**: Subagents choose their own filenames. You can't control this reliably.

**Fix**: Accept multiple naming patterns per expected file:
```typescript
const researchPatterns = [
  { names: ['state_law_findings.json', 'research_state_law.json', 'research_state.json'], label: 'State law' },
  { names: ['city_research_findings.json', 'research_city.json', 'city_discovery.json'], label: 'City' },
];
```

**Takeaway**: Be flexible on file naming in verification. Alternatively, make the prompt very specific about exact filenames — but even then, subagents may deviate.

### 4. PDF Extraction is Expensive in Agent SDK

The agent used Bash to run `pdftoppm` for PDF→PNG conversion, then read all 15 pages as images for the sheet manifest. This worked but consumed significant context. For the L3 shortcut, we pre-populated the manifest to skip this entirely.

**Takeaway**: If a phase is expensive and already validated, pre-populate its output for downstream tests.

## Subagent Timing and Bottleneck Analysis

### What We Built

A `SubagentTracker` class in `progress.ts` that:
- Tracks when each subagent spawns (from `tool_use` blocks where `name === 'Task'`)
- Tracks polling events (from `TaskOutput` tool calls)
- Marks all as resolved when the parent agent gets its result
- Prints a timing summary table with fastest/slowest/wall-clock-wait
- Analyzes file timestamps in the session directory to retroactively determine completion order

### What We Learned About Subagent Timing

From the L4 run (real Placentia data, live web search):

```
File Timestamp Analysis:
  [  5.2m] city_discovery.json          — City discovery (fast, just URL finding)
  [  6.4m] state_law_findings.json      — State law research
  [  6.9m] sheet_observations.json      — Sheet viewer
  [ 14.2m] city_research_findings.json  — City content extraction (BOTTLENECK)
```

**City research is the bottleneck** — it takes ~14 min because it does web search, fetches multiple URLs, and synthesizes findings across topics (sewer, utilities, submittal requirements, etc.). State law and sheet viewer finish in ~6 min.

**Mitigation**: Create city-specific offline skills (like `buena-park-adu`) so the city subagent reads local files instead of doing web search. This cuts city research from ~14 min to ~2 min.

### What We Can't Track (Yet)

- **Per-subagent cost**: The SDK only reports aggregate `total_cost_usd` on the result message. No way to attribute cost to individual subagents.
- **Subagent tool turns**: We see the parent's tool calls but not what tools each subagent uses internally.
- **Exact resolve time per subagent**: `TaskOutput` polling doesn't tell you which specific subagent just completed. We use file timestamps as a proxy.

## Cost Benchmarks

| Pipeline | Skill 1 | Skill 2 | Total | Notes |
|----------|---------|---------|-------|-------|
| L3 (offline shortcut) | $3.47 | — | $3.47 | Buena Park offline, pre-populated manifest |
| L3b (Skill 2 only) | — | $1.12 | $1.12 | From mock fixtures |
| L4 (full pipeline) | $5.48 | $1.05 | $6.54 | Real Placentia data, live web search |

Skill 2 is consistently cheap (~$1) because it's pure file reading + writing — no subagents, no web search.

Skill 1 cost is dominated by the research subagents, especially city research.

## How to Invoke the Backend

```bash
# Run from the agents-crossbeam directory
cd agents-crossbeam

# Individual test levels
node --env-file .env.local --experimental-strip-types ./src/tests/test-l0-smoke.ts
node --env-file .env.local --experimental-strip-types ./src/tests/test-l1-skill-invoke.ts
node --env-file .env.local --experimental-strip-types ./src/tests/test-l2-subagent-bash.ts
node --env-file .env.local --experimental-strip-types ./src/tests/test-l3-mini-pipeline.ts
node --env-file .env.local --experimental-strip-types ./src/tests/test-l3b-skill2-only.ts
node --env-file .env.local --experimental-strip-types ./src/tests/test-l4-full-pipeline.ts
```

### Using the Flow Wrappers Programmatically

```typescript
import { runCorrectionsAnalysis } from './src/flows/corrections-analysis.ts';
import { runResponseGeneration } from './src/flows/corrections-response.ts';

// Skill 1: Analysis
const analysis = await runCorrectionsAnalysis({
  correctionsFile: '/path/to/corrections.png',
  planBinderFile: '/path/to/binder.pdf',
  sessionDir: '/path/to/session/',
  city: 'Placentia',
  onProgress: (msg) => console.log(msg),
});

// Inject contractor answers into sessionDir...

// Skill 2: Response generation
const response = await runResponseGeneration({
  sessionDir: '/path/to/session/',
  onProgress: (msg) => console.log(msg),
});
```

## Applying This to the City Flow

When building the city flow Agent SDK integration:

1. **Start with the same scaffolding**: Copy the project structure, config.ts, session.ts, progress.ts, verify.ts. Change the system prompt and skill symlinks.

2. **Build the test ladder bottom-up**: L0 → L1 → L2 → L3. Don't skip levels.

3. **Create offline shortcuts early**: If the city flow has expensive phases (web research, PDF extraction), create pre-populated fixtures and offline skills so you can test orchestration cheaply.

4. **Be explicit about completion**: In the prompt, list every file that must be written. Say "the job is not done until X, Y, and Z exist."

5. **Accept naming flexibility**: Subagents will name files however they want. Build verification that accepts multiple patterns.

6. **Track subagent lifecycles**: Use the SubagentTracker from the start. You'll want timing data to identify bottlenecks.

7. **Restrict tools per skill**: If a skill doesn't need web access or Bash, remove those tools. Reduces cost, prevents unexpected behavior, and makes the agent more predictable.

8. **Budget with headroom**: For multi-subagent Opus runs, budget 2-3x what you think you'll need. Skill 1 with 4 subagents needed $15 headroom even though it only used $5.48.

## File Reference

| File | Purpose |
|------|---------|
| `agents-crossbeam/src/utils/config.ts` | Shared config factory — copy this first |
| `agents-crossbeam/src/utils/session.ts` | Session directory management |
| `agents-crossbeam/src/utils/progress.ts` | Progress logging + SubagentTracker |
| `agents-crossbeam/src/utils/verify.ts` | Post-run file verification |
| `agents-crossbeam/src/flows/corrections-analysis.ts` | Skill 1 flow wrapper pattern |
| `agents-crossbeam/src/flows/corrections-response.ts` | Skill 2 flow wrapper pattern (restricted tools) |
| `agents-crossbeam/claude-task.json` | Phase-based task tracker (all 7 phases complete) |
| `agents-crossbeam/claude-prompt.md` | Development prompt for the agent building this |
| `plan-contractors-agents-sdk.md` | Architecture spec (the plan we followed) |
| `testing-agents-sdk.md` | Testing strategy doc |
