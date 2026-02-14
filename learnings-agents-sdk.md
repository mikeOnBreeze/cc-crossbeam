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

## City Flow Learnings (Added Feb 13)

We built the city plan review flow into the same `agents-crossbeam/` directory. Here's what we learned beyond the contractor flow:

### 5. systemPromptAppend Works Great for Multi-Flow Projects

The contractor flow doesn't use `systemPromptAppend` — it relies on the base `CROSSBEAM_PROMPT` alone. The city flow adds a role-specific append:

```typescript
const CITY_SYSTEM_PROMPT = `You are reviewing an ADU plan submittal from the city's perspective...`;

createQueryOptions({
  systemPromptAppend: CITY_SYSTEM_PROMPT,  // Concatenated after CROSSBEAM_PROMPT
});
```

`config.ts` line 26-28 handles the concatenation. This keeps the base prompt flow-neutral while each flow adds its own identity. **Pattern: One shared config, flow-specific systemPromptAppend.**

### 6. Manifest Path Rewriting is a Real Gotcha

When pre-populating fixtures from `test-assets/city-flow/mock-session/`, the sheet manifest has relative file paths (`"file": "page-01.png"`). These must be rewritten to absolute paths pointing at the **session copy**, not the mock source:

```typescript
const destPngDir = path.join(sessionDir, 'pages-png');
for (const sheet of manifestData.sheets) {
  sheet.file = path.resolve(destPngDir, sheet.file);  // Session copy, NOT mock source
}
```

The contractor L3 test does the same thing (lines 36-39). If you point at the mock source, it works for the main agent but subagents may not have access. **Always resolve to the session directory.**

### 7. Subagent File Access Through Symlinks Works

This was the #1 unknown going into the city flow build. L1c proved that Task subagents CAN read files through symlinked skill paths:

```
Checklist path: ${PROJECT_ROOT}/adu-skill-development/skill/adu-plan-review/references/checklist-cover.md
```

The subagent successfully read this file via absolute path. The `additionalDirectories: [PROJECT_ROOT]` setting in `createQueryOptions()` is what makes this work — it gives subagents access to the parent directory tree. **No need to inline checklist content in subagent prompts.**

### 8. Single query() Beats Two-Call Pipelines When There's No Human Pause

The contractor flow uses two `query()` calls with a human pause between them (contractor answers questions). The city flow has no natural pause point, so it uses a single `query()` call that runs all 4 phases continuously.

Benefits:
- Simpler error handling (one session to track)
- Agent keeps full context across phases (can reference Phase 1 findings in Phase 4)
- No need to serialize/deserialize state between calls

**Rule: Use single `query()` for fully autonomous pipelines. Use multi-call for human-in-the-loop.**

### 9. Onboarded Cities Are Way Faster and Cheaper

| Approach | Duration | Cost | Web Search? |
|----------|----------|------|------------|
| Contractor flow (Placentia, live web) | 24 min | $6.54 | Yes — 14 min bottleneck |
| City flow (Placentia, Tier 3 offline) | 20 min | $6.75 | No — reads local skill |

The city flow with Placentia (onboarded, 12 reference files) ran the full 5-subagent review pipeline in 20 min with no web search. Contractor flow with live web search had a 14-min city research bottleneck. **Onboard every target city before the demo.**

### 10. Test the Flow Wrapper Before the Expensive Test

L3c used `runPlanReview()` (the flow wrapper) instead of raw `query()`. This caught any wrapper bugs at $2.19 instead of waiting for L4c at $6.75. The L4c test was just a scope upgrade (admin → full), not a wrapper validation.

**Pattern: Your L3 test should use the flow wrapper, not raw query(). Then L4 is pure scope expansion.**

### 11. Haiku Abbreviates Skill Lists — Relax Your Smoke Test Thresholds

L0c initially failed because Haiku only listed 4 of 9 skills in its output text. The existing L0 contractor test already handled this with `≥3` threshold. For L0c we check that all 3 **new** city skills are found (strict) but only require `≥3` total skills (relaxed).

**Pattern: Check critical new skills strictly. Check total skill count loosely — Haiku abbreviates.**

### 12. Review Subagents Write Findings to Separate Files

The 5 Phase 2 review subagents each wrote their own findings file (`findings-arch-a.json`, `findings-arch-b.json`, `findings-site.json`, `findings-structural.json`, `findings-energy.json`). The main agent then read all 5 and merged them into `sheet_findings.json` (100,767 bytes).

This is different from the contractor flow where subagents wrote to a single shared file. **The merge step in Phase 4 is critical — it combines, deduplicates, and filters findings from multiple subagents.**

### 13. PDF Generation is Cheap and Fast with reportlab

L3d generated a 56KB, 6-page professional PDF with color-coded confidence badges for $0.74 in 4.2 min. The agent wrote a Python script using reportlab, ran it via Bash, then screenshotted page 1 with pdftoppm for QA.

**Pattern: Let the agent write a one-off Python script for PDF generation. reportlab + pdftoppm is the winning combo. Don't overthink the PDF pipeline — it just works.**

## City Flow Cost Benchmarks

| Test | Subagents | Cost | Duration | Notes |
|------|-----------|------|----------|-------|
| L0c (smoke) | 0 | $0.02 | 14s | Haiku, skill discovery only |
| L1c (skill read) | 1 | $0.10 | 62s | Haiku, subagent file access test |
| L3c (admin review) | 3 | $2.19 | 6.6 min | Opus, cover sheet only, pre-populated fixtures |
| L3d (PDF generation) | 0 | $0.74 | 4.2 min | Opus, markdown → 6-page PDF |
| L4c (full pipeline) | 7 | $6.75 | 20.4 min | Opus, all 15 sheets, 5 review + 2 compliance subagents |

**Total test ladder: $9.80** (estimated $18-30 — came in at 1/2 to 1/3 of budget).

The city flow is significantly cheaper per subagent than expected. Opus with 7 subagents at $6.75 vs. contractor flow with 4 subagents at $5.48. Offline city research (Tier 3) eliminates the expensive web search bottleneck.

## Applying This to Future Flows

When building the next Agent SDK integration:

1. **Start with the same scaffolding**: Copy the project structure, config.ts, session.ts, progress.ts, verify.ts. Change the system prompt and skill symlinks.

2. **Build the test ladder bottom-up**: L0 → L1 → L2 → L3. Don't skip levels.

3. **Create offline shortcuts early**: If the flow has expensive phases (web research, PDF extraction), create pre-populated fixtures and offline skills so you can test orchestration cheaply.

4. **Be explicit about completion**: In the prompt, list every file that must be written. Say "the job is not done until X, Y, and Z exist."

5. **Accept naming flexibility**: Subagents will name files however they want. Build verification that accepts multiple patterns.

6. **Track subagent lifecycles**: Use the SubagentTracker from the start. You'll want timing data to identify bottlenecks.

7. **Restrict tools per skill**: If a skill doesn't need web access or Bash, remove those tools. Reduces cost, prevents unexpected behavior, and makes the agent more predictable.

8. **Budget with headroom**: For multi-subagent Opus runs, budget 2-3x what you think you'll need. Actual costs came in at 1/3 of budget both times.

9. **Use systemPromptAppend for flow identity**: Keep the base prompt flow-neutral. Each flow adds its own role via systemPromptAppend.

10. **Test the flow wrapper at L3, not L4**: Catch wrapper bugs at $2-3, not $10-20.

11. **Onboard target cities**: Tier 3 (offline skill) eliminates web search bottlenecks. Worth 1-2 hours of research per city.

## File Reference

### Shared Utilities
| File | Purpose |
|------|---------|
| `agents-crossbeam/src/utils/config.ts` | Shared config factory (systemPromptAppend, tools, model) |
| `agents-crossbeam/src/utils/session.ts` | Session dirs + file path helpers (both flows) |
| `agents-crossbeam/src/utils/progress.ts` | Progress logging + SubagentTracker |
| `agents-crossbeam/src/utils/verify.ts` | File verification + phase detection (both flows) |

### Contractor Flow (Corrections Interpreter)
| File | Purpose |
|------|---------|
| `agents-crossbeam/src/flows/corrections-analysis.ts` | Skill 1 flow wrapper |
| `agents-crossbeam/src/flows/corrections-response.ts` | Skill 2 flow wrapper (restricted tools) |
| `agents-crossbeam/src/tests/test-l0-smoke.ts` through `test-l4-full-pipeline.ts` | 6 test levels |
| `plan-contractors-agents-sdk.md` | Architecture spec |
| `testing-agents-sdk.md` | Testing strategy |

### City Flow (Plan Review)
| File | Purpose |
|------|---------|
| `agents-crossbeam/src/flows/plan-review.ts` | Single query() flow wrapper |
| `agents-crossbeam/src/tests/test-l0c-smoke-city.ts` | Smoke test — 9 skills |
| `agents-crossbeam/src/tests/test-l1c-skill-read.ts` | Skill read + subagent file access |
| `agents-crossbeam/src/tests/test-l3c-admin-review.ts` | Admin review (cover sheet, pre-populated) |
| `agents-crossbeam/src/tests/test-l3d-pdf-generation.ts` | PDF generation (isolated Phase 5) |
| `agents-crossbeam/src/tests/test-l4c-full-review.ts` | Full pipeline acceptance |
| `plan-city-agents-sdk.md` | Architecture spec |
| `testing-agents-sdk-city.md` | Testing strategy |
