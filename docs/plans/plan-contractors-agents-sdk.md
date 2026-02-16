# Agent SDK Backend Plan — Corrections Flow

## Goal

**Run the ADU corrections pipeline programmatically via the Claude Agent SDK**, so the two-skill flow (analysis + response generation) can be triggered from code instead of through the Claude Code CLI. This unlocks wiring the pipeline to a Next.js frontend where contractors upload files, answer questions, and receive their response package.

### The Problem

The corrections flow works great through the CLI: you feed in a corrections letter + plan binder, the agent uses skills, spawns subagents, researches codes, and produces output. But the CLI is interactive and manual. To demo this as a product, we need a programmatic backend that:

1. Accepts file uploads (corrections letter PNG/PDF + plan binder PDF)
2. Runs Skill 1 (`adu-corrections-flow`) — analysis + question generation (~4-8 min)
3. Returns `contractor_questions.json` to the UI
4. Accepts contractor answers
5. Runs Skill 2 (`adu-corrections-complete`) — response generation (~1-2 min)
6. Returns the 4 deliverables (response letter, professional scope, corrections report, sheet annotations)

### Context

- **Hackathon deadline:** Mon Feb 16, 12:00 PM PST
- **Today is:** Wed Feb 12 (Day 3 of 6)
- **Proven foundation:** Agent SDK config validated in Dec 2025 (demand letter pipeline in Vercel Sandbox)
- **Skills are built:** All 6 skills exist with SKILL.md files, reference docs, and subagent prompts
- **Test data exists:** Placentia corrections letter + plan binder in `test-assets/`
- **Priority:** Everything runs locally. No cloud deployment.

### Key Difference from Mako

The Mako demand letter project was built for production — it needed cloud deployment (Cloud Run + Vercel Sandbox) to handle the 60-second Vercel free-tier timeout for 10-20 minute agent runs. That took a full day of deployment work, and every change required push → build → 10-minute test cycles.

**CrossBeam is a hackathon demo.** We don't need cloud deployment:
- Next.js API routes on localhost have **no timeout limit**
- Testing locally is fast — change code, re-run, see results immediately
- The hackathon doesn't require full deployment (nice-to-have, not judged on it)
- Cloud deployment would eat a full day we don't have

If we want to deploy later, the learnings from Mako carry over. But for now: **everything local, everything fast.**

---

## Two Environments: CLI Dev vs Agent SDK Runtime

**Critical concept:** We use the Claude Code CLI to *build* the Agent SDK app. These are two separate environments:

| | Claude Code CLI (dev) | Agent SDK (runtime) |
|---|---|---|
| **Purpose** | Us building the app | The app running the corrections pipeline |
| **Skills needed** | Everything — shadcn, react-best-practices, nano-banana, cc-guide, etc. | ONLY the 6 ADU skills |
| **`.claude/skills/`** | Parent project root (13 skills) | Backend subdirectory (6 skills) |
| **Permissions** | Interactive — prompts us for approval | `bypassPermissions` — headless |
| **Model** | Whatever we're using to code | `claude-opus-4-6` always |

**The problem:** If we point the Agent SDK's `cwd` at the project root, `settingSources: ['project']` loads ALL 13 skills from `.claude/skills/` — including nano-banana, react-best-practices, and other junk that wastes tokens and confuses the agent.

**The solution:** Backend subdirectory with its own `.claude/skills/` containing only ADU skills, symlinked from `adu-skill-development/skill/`.

### Project Structure

```
CC-Crossbeam/                           ← Claude Code CLI works here (parent)
├── .claude/
│   └── skills/                         ← ALL skills (13) — for CLI dev
│       ├── adu-city-research/          (these are fine for CLI)
│       ├── adu-corrections-interpreter/
│       ├── cc-guide/
│       ├── nano-banana/                (irrelevant to Agent SDK)
│       ├── react-best-practices/       (irrelevant to Agent SDK)
│       ├── shadcn/                     (irrelevant to Agent SDK)
│       └── ...
│
├── adu-skill-development/
│   └── skill/                          ← SOURCE OF TRUTH for ADU skills (edit here!)
│       ├── california-adu/             (28 reference files)
│       ├── adu-corrections-flow/       (Skill 1)
│       ├── adu-corrections-complete/   (Skill 2)
│       ├── adu-city-research/
│       ├── adu-targeted-page-viewer/
│       └── buena-park-adu/
│
├── agents-crossbeam/                   ← Agent SDK app (deployable unit)
│   ├── .claude/
│   │   └── skills/                     ← ONLY ADU skills (6) — symlinked
│   │       ├── california-adu → ../../../adu-skill-development/skill/california-adu
│   │       ├── adu-corrections-flow → ...
│   │       ├── adu-corrections-complete → ...
│   │       ├── adu-city-research → ...
│   │       ├── adu-targeted-page-viewer → ...
│   │       └── buena-park-adu → ...
│   ├── src/
│   │   ├── flows/                      ← One file per Agent SDK flow
│   │   │   ├── corrections-analysis.ts   (Skill 1 — query() wrapper)
│   │   │   ├── corrections-response.ts   (Skill 2 — query() wrapper)
│   │   │   └── city-prescreening.ts      (Future: city perspective flow)
│   │   ├── tests/                      ← Leveled test suite (L0-L4)
│   │   │   ├── test-l0-smoke.ts
│   │   │   ├── test-l1-skill-invoke.ts
│   │   │   ├── test-l2-subagent-bash.ts
│   │   │   ├── test-l3-mini-pipeline.ts
│   │   │   ├── test-l3b-skill2-only.ts
│   │   │   └── test-l4-full-pipeline.ts
│   │   └── utils/
│   │       ├── config.ts               ← Shared base config factory
│   │       ├── session.ts              ← Session directory management
│   │       ├── progress.ts             ← Progress event handler
│   │       └── verify.ts              ← Post-run file verification
│   ├── sessions/                       ← Runtime output (gitignored)
│   ├── package.json                    (@anthropic-ai/claude-agent-sdk)
│   ├── tsconfig.json
│   └── .env                            (ANTHROPIC_API_KEY)
│
├── test-assets/                        ← Test data (shared across all tools)
│   ├── corrections/                    ← Placentia full corrections data
│   ├── correction-01/                  ← Alternate Placentia data path
│   ├── approved/                       ← Long Beach approved plans
│   ├── mini/                           ← Mini test data (L3 — create this)
│   │   ├── corrections-mini.png          (2-3 items cropped)
│   │   ├── plan-page-A1.png              (single extracted page)
│   │   └── sheet-manifest-mini.json      (pre-made 2-sheet manifest)
│   └── mock-session/                   ← Pre-made Skill 1 outputs (L3b — create this)
│       ├── corrections_parsed.json
│       ├── corrections_categorized.json
│       ├── contractor_answers.json
│       └── ...
│
└── frontend/                           ← Next.js app (later)
    ├── app/
    │   └── api/                        (API routes call agents-crossbeam/)
    └── package.json
```

### Why Symlinks Are Key

**Editing skills directly in `.claude/skills/` triggers permission prompts in Claude Code CLI.** That's painful when iterating quickly.

With symlinks:
1. Edit skills in `adu-skill-development/skill/` — no permission prompts, fast iteration
2. Symlinks in `agents-crossbeam/.claude/skills/` auto-propagate changes
3. Agent SDK picks up the latest skill content on every `query()` call
4. Parent `.claude/skills/` stays untouched — CLI dev environment is unaffected

This is the same pattern from Mako (parent repo + subrepo with its own `.claude/`) but without needing a separate git repo. The `agents-crossbeam/` directory acts as the Agent SDK's project root.

---

## Architecture: Two `query()` Calls, Not One

The corrections flow has a natural pause — the contractor answers questions between Skill 1 and Skill 2. This maps perfectly to the Agent SDK's design:

```
INVOCATION 1                          INVOCATION 2
────────────                          ────────────
query({                               query({
  prompt: "Run corrections flow..."     prompt: "Generate response package..."
  // Skill 1 runs Phases 1-4            // Skill 2 runs Phase 5
})                                    })
  │                                     │
  ├── Writes 8 JSON files               ├── Reads 9 JSON files
  ├── Uses 3 sub-skills                 ├── No sub-skills needed
  ├── Spawns 5+ subagents              ├── Pure writing from files
  └── Returns contractor_questions.json └── Returns 4 deliverables
          │                                     │
          ▼                                     ▼
    UI renders questions              UI renders results
    Contractor answers                Contractor downloads
          │
          ▼
    contractor_answers.json
    saved to session directory
```

**Why two calls, not one:**
- Agent SDK `query()` returns when the agent finishes — there's no built-in "pause and wait for user input" mechanism
- Skill 2 runs cold (no conversation history) by design — it reads from files only
- Separating the calls means: Skill 1 can run on upload, contractor can answer hours later, Skill 2 runs on submit
- Each invocation has its own cost tracking, error handling, and timeout

---

## The Proven Config Pattern

From Dec 2025 Vercel Sandbox learnings (`docs/claude-agents/agentsSDK-vercelSandbox-learnings-1210.md`), this is the config that works:

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

const result = query({
  prompt: constructedPrompt,
  options: {
    // Tools and system prompt — CRITICAL
    tools: { type: 'preset', preset: 'claude_code' },
    systemPrompt: {
      type: 'preset',
      preset: 'claude_code',
      append: CROSSBEAM_SYSTEM_PROMPT  // Our custom instructions
    },

    // Skills discovery — loads agents-crossbeam/.claude/skills/ (only ADU skills)
    cwd: AGENTS_ROOT,  // path.resolve(__dirname, '..')  → agents-crossbeam/
    settingSources: ['project'],

    // Permissions — bypass for programmatic use
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,

    // Tools the agent can use
    allowedTools: [
      'Skill', 'Task',           // Skills + subagents
      'Read', 'Write', 'Edit',   // File operations
      'Bash', 'Glob', 'Grep',    // System + search
      'WebSearch', 'WebFetch',   // Web research
    ],

    // Filesystem access — agent needs parent dir for test-assets
    additionalDirectories: [PROJECT_ROOT],  // CC-Crossbeam/ (parent)

    // Limits
    maxTurns: 80,           // High — skills spawn many subagents
    maxBudgetUsd: 15.00,    // Opus 4.6 is ~5x Sonnet; 5+ subagents adds up
    model: 'claude-opus-4-6',

    // Streaming for progress monitoring
    includePartialMessages: true,

    // Cancellation control (Ctrl+C support)
    abortController: new AbortController(),
  }
});
```

### Critical Gotchas (from Dec 2025 + Feb 2026 SDK research)

| Gotcha | Details |
|--------|---------|
| **`tools` and `systemPrompt` presets are required** | Without `{ type: 'preset', preset: 'claude_code' }`, the agent hallucinates tool usage — says "I'll write the file" but creates nothing |
| **`settingSources: ['project']` required for skills** | Without this, agent won't discover `.claude/skills/` directories |
| **Model name must be full alias** | Use `'claude-opus-4-6'`, not `'opus'` (SDK docs say shorthand works, but Dec 2025 learnings say use full alias — play it safe) |
| **`cwd` must point to `agents-crossbeam/`** | Skills are loaded relative to `cwd` — must contain `.claude/skills/` with only ADU skills. Do NOT point to parent project root (loads 13 skills including nano-banana). |
| **Always verify file creation** | Agent reports success even when tools aren't configured. Check files exist after run. |
| **`additionalDirectories` needed** | Agent's `cwd` is `agents-crossbeam/` but test data lives in `../test-assets/`. Without `additionalDirectories: [PROJECT_ROOT]`, filesystem access may be restricted. |
| **Subagent skill inheritance unclear** | SDK docs say "subagents inherit allowedTools but NOT skills." If Task-spawned subagents can't invoke skills, fall back to `agents` config with inline prompts. **Test this in L2.** |
| **Node 22.6+ required** | `--experimental-strip-types` + `import.meta.dirname` need Node 22.6+. Current: v24.9.0 ✓ |
| **ANTHROPIC_API_KEY must be in `.env`** | The project `.env` currently has GEMINI and FAL keys only. Add `ANTHROPIC_API_KEY=sk-ant-...` before running. |

---

## Shared Base Config — Modularity Pattern

All flows and tests import from one config factory (`src/utils/config.ts`). This gives us:

1. **One place to change the model** — swap Opus/Sonnet/Haiku across everything
2. **One place to raise budgets** — no hunting through multiple files
3. **Multiple flows, shared foundation** — corrections flow, city prescreening flow, future flows all use the same base
4. **Tests override what they need** — L0 uses Haiku ($0.01), L4 uses Opus ($15)

```typescript
// src/utils/config.ts — the shared foundation
import path from 'path';
import type { Options } from '@anthropic-ai/claude-agent-sdk';

export const AGENTS_ROOT = path.resolve(import.meta.dirname, '../..');  // agents-crossbeam/
export const PROJECT_ROOT = path.resolve(AGENTS_ROOT, '..');            // CC-Crossbeam/

export type FlowConfig = {
  model?: string;                // Default: claude-opus-4-6
  maxTurns?: number;             // Default: 80
  maxBudgetUsd?: number;         // Default: 15.00
  allowedTools?: string[];       // Default: all tools
  systemPromptAppend?: string;   // Appended to base CrossBeam prompt
  abortController?: AbortController;
};

export function createQueryOptions(flow: FlowConfig = {}): Options {
  return {
    tools: { type: 'preset', preset: 'claude_code' },
    systemPrompt: {
      type: 'preset',
      preset: 'claude_code',
      append: buildSystemPrompt(flow.systemPromptAppend),
    },
    cwd: AGENTS_ROOT,
    settingSources: ['project'],
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    allowedTools: flow.allowedTools ?? DEFAULT_TOOLS,
    additionalDirectories: [PROJECT_ROOT],
    maxTurns: flow.maxTurns ?? 80,
    maxBudgetUsd: flow.maxBudgetUsd ?? 15.00,
    model: flow.model ?? 'claude-opus-4-6',
    includePartialMessages: true,
    abortController: flow.abortController ?? new AbortController(),
  };
}
```

**Each flow file is minimal** — just the prompt + any flow-specific overrides:
```typescript
// src/flows/corrections-analysis.ts
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createQueryOptions } from '../utils/config.js';

export async function runCorrectionsAnalysis(opts) {
  const q = query({
    prompt: buildCorrectionsPrompt(opts),
    options: createQueryOptions({
      maxBudgetUsd: 15.00,
      systemPromptAppend: 'Use the adu-corrections-flow skill...',
    }),
  });
  // ... iterate messages
}
```

**Future city prescreening flow uses the same pattern:**
```typescript
// src/flows/city-prescreening.ts — future
import { createQueryOptions } from '../utils/config.js';

export async function runCityPrescreening(opts) {
  const q = query({
    prompt: buildCityPrompt(opts),
    options: createQueryOptions({
      maxBudgetUsd: 5.00,
      systemPromptAppend: 'Use the california-adu skill + adu-city-research skill...',
    }),
  });
}
```

See `testing-agents-sdk.md` for the full config code including session management.

---

## Error Recovery & Phase Checkpointing

### The Problem

Skill 1 runs 60-80 turns over 5-10 minutes. If it fails at turn 60, you've burned $5+ and 8 minutes. We need recovery strategies.

### Strategy 1: Session Resume

Capture `session_id` from the SDK result message. If a run fails, you can resume:

```typescript
// On failure, capture session ID
if (result.subtype !== 'success') {
  console.log(`Failed: ${result.subtype}. Session: ${result.session_id}`);
  // Resume later:
  // query({ prompt: 'Continue...', options: { resume: result.session_id } })
}
```

### Strategy 2: Phase Checkpointing

The corrections pipeline writes JSON files after each phase. Check which files exist to know where it stopped:

```typescript
function detectCompletedPhases(sessionDir: string): string[] {
  const phases = [];
  if (fs.existsSync(path.join(sessionDir, 'corrections_parsed.json'))) phases.push('Phase 1');
  if (fs.existsSync(path.join(sessionDir, 'sheet-manifest.json'))) phases.push('Phase 2');
  if (fs.existsSync(path.join(sessionDir, 'state_law_findings.json'))) phases.push('Phase 3A');
  // ... etc
  return phases;
}
```

Then tell the next run to skip completed phases:
```
The following phases are ALREADY COMPLETE (files exist, do not redo):
${completedPhases.map(p => `- ${p} ✓`).join('\n')}

Resume from the next incomplete phase.
```

### Strategy 3: Reuse Previous Extractions

PDF extraction (Phase 2) is deterministic — same PDF always produces the same PNGs + manifest. Once you have a good manifest for a test PDF, save it and skip Phase 2 on subsequent runs.

---

## Testing Strategy

Full testing approach documented in **`testing-agents-sdk.md`** (separate file).

**Summary:**

| Level | What | Time | Cost | Model |
|-------|------|------|------|-------|
| L0 | SDK init + skill discovery | 30 sec | $0.01 | Haiku |
| L1 | Single skill invocation | 1-2 min | $0.50 | Haiku/Sonnet |
| L2 | Subagent + Bash script | 2-3 min | $1.00 | Sonnet |
| L3 | Mini pipeline (Buena Park shortcut) | 5-7 min | $3-5 | Opus |
| L3b | Skill 2 isolation (from mock data) | 2-3 min | $2-3 | Opus |
| L4 | Full pipeline (real data, live search) | 15-20 min | $10-15 | Opus |

**Key insight:** Use Haiku/Sonnet for L0-L2 (testing wiring, not quality). Use Opus for L3+ (testing skill behavior). The Buena Park offline skill replaces live city research in L3, saving 5-10 min per test.

---

## Implementation Plan

### Step 1: Backend Subdirectory + Skills Setup

Create the `agents-crossbeam/` directory with its own `.claude/skills/` containing only ADU skills. This is the Agent SDK's project root — `cwd` in every `query()` call points here.

```bash
# Create backend structure
mkdir -p agents-crossbeam/.claude/skills agents-crossbeam/src/utils

# Symlink ADU skills from source of truth
cd agents-crossbeam/.claude/skills
ln -s ../../../adu-skill-development/skill/california-adu california-adu
ln -s ../../../adu-skill-development/skill/adu-corrections-flow adu-corrections-flow
ln -s ../../../adu-skill-development/skill/adu-corrections-complete adu-corrections-complete
ln -s ../../../adu-skill-development/skill/adu-city-research adu-city-research
ln -s ../../../adu-skill-development/skill/adu-targeted-page-viewer adu-targeted-page-viewer
ln -s ../../../adu-skill-development/skill/buena-park-adu buena-park-adu
cd ../../..

# Verify symlinks resolve
ls -la agents-crossbeam/.claude/skills/
```

**Agents directory structure:**
```
agents-crossbeam/
├── .claude/
│   └── skills/                     ← 6 ADU skills only (symlinked)
├── src/
│   ├── flows/                      ← One file per Agent SDK pipeline
│   │   ├── corrections-analysis.ts   # Skill 1 query() wrapper
│   │   ├── corrections-response.ts   # Skill 2 query() wrapper
│   │   └── city-prescreening.ts      # Future: city perspective flow
│   ├── tests/                      ← Leveled test suite (see testing-agents-sdk.md)
│   │   ├── test-l0-smoke.ts
│   │   ├── test-l1-skill-invoke.ts
│   │   ├── test-l2-subagent-bash.ts
│   │   ├── test-l3-mini-pipeline.ts
│   │   ├── test-l3b-skill2-only.ts
│   │   └── test-l4-full-pipeline.ts
│   └── utils/
│       ├── config.ts               # Shared base config factory (all flows import this)
│       ├── session.ts              # Session directory management
│       ├── progress.ts             # Progress event handler
│       └── verify.ts               # Post-run file verification
├── sessions/                       ← Created at runtime, gitignored
├── package.json
├── tsconfig.json
└── .env.local                      ← ANTHROPIC_API_KEY ($500 hackathon credits)
```

**Package dependencies:**
```json
{
  "name": "agents-crossbeam",
  "type": "module",
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "latest"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

**Run commands (no build step needed — Node 24.9 strips types natively):**
```bash
# Run a specific test level
cd agents-crossbeam && node --env-file .env.local --experimental-strip-types ./src/tests/test-l0-smoke.ts

# Run a flow directly
cd agents-crossbeam && node --env-file .env.local --experimental-strip-types ./src/tests/test-l4-full-pipeline.ts
```

### Why `agents-crossbeam/` as a Separate Directory (Not a Subrepo)

In Mako, the Agent SDK lived in a separate git repo (`mako/` inside the parent). That made sense for production — the subrepo could be deployed independently.

For the hackathon, a subdirectory is simpler:
- No extra git repo to manage
- Same git history for everything
- Easy to reference test assets via relative paths (`../test-assets/`)
- Can still deploy independently later if needed (just copy `agents-crossbeam/`)

The key thing is the **separate `.claude/skills/`**. That's what isolates the two environments.

### Step 2: Session Directory Management

Each corrections job gets its own session directory under `agents-crossbeam/sessions/`:

```typescript
// src/utils/session.ts
import fs from 'fs';
import path from 'path';

export function createSession(agentsRoot: string): string {
  const sessionId = `correction-${Date.now()}`;
  const sessionDir = path.join(agentsRoot, 'sessions', sessionId);
  fs.mkdirSync(sessionDir, { recursive: true });
  return sessionDir;
}

export function getSessionFiles(sessionDir: string) {
  return {
    correctionsParsed: path.join(sessionDir, 'corrections_parsed.json'),
    sheetManifest: path.join(sessionDir, 'sheet-manifest.json'),
    stateLawFindings: path.join(sessionDir, 'state_law_findings.json'),
    cityDiscovery: path.join(sessionDir, 'city_discovery.json'),
    cityResearchFindings: path.join(sessionDir, 'city_research_findings.json'),
    sheetObservations: path.join(sessionDir, 'sheet_observations.json'),
    correctionsCategorized: path.join(sessionDir, 'corrections_categorized.json'),
    contractorQuestions: path.join(sessionDir, 'contractor_questions.json'),
    contractorAnswers: path.join(sessionDir, 'contractor_answers.json'),
    // Phase 5 outputs
    responseLetter: path.join(sessionDir, 'response_letter.md'),
    professionalScope: path.join(sessionDir, 'professional_scope.md'),
    correctionsReport: path.join(sessionDir, 'corrections_report.md'),
    sheetAnnotations: path.join(sessionDir, 'sheet_annotations.json'),
  };
}
```

### Step 3: Skill 1 Invocation — Analysis + Questions

```typescript
// src/run-skill-1.ts
import { query } from '@anthropic-ai/claude-agent-sdk';
import path from 'path';

export async function runCorrectionsAnalysis(opts: {
  correctionsFile: string;   // Path to corrections letter (PNG or PDF)
  planBinderFile: string;    // Path to plan binder PDF
  sessionDir: string;        // Where to write output files
  agentsRoot: string;       // agents-crossbeam/ dir with its own .claude/skills/ (only ADU skills)
  onProgress?: (event: any) => void;
}) {
  const prompt = `
You have a corrections letter and a plan binder PDF for an ADU permit.

CORRECTIONS LETTER: ${opts.correctionsFile}
PLAN BINDER PDF: ${opts.planBinderFile}
SESSION DIRECTORY: ${opts.sessionDir}

Use the adu-corrections-flow skill to:
1. Read the corrections letter (Phase 1)
2. Build the sheet manifest from the plan binder (Phase 2)
3. Research state law, city rules, and plan sheets (Phase 3)
4. Categorize corrections and generate contractor questions (Phase 4)

Write ALL output files to the session directory: ${opts.sessionDir}

IMPORTANT:
- Write corrections_parsed.json, sheet-manifest.json, state_law_findings.json,
  city_discovery.json, city_research_findings.json, sheet_observations.json,
  corrections_categorized.json, and contractor_questions.json
- Do NOT generate Phase 5 outputs (response letter, professional scope, etc.)
- Stop after writing contractor_questions.json
`;

  const q = query({
    prompt,
    options: {
      tools: { type: 'preset', preset: 'claude_code' },
      systemPrompt: {
        type: 'preset',
        preset: 'claude_code',
        append: `You are CrossBeam, an AI ADU permit assistant. You help contractors
respond to city corrections letters. Use the adu-corrections-flow skill to
analyze corrections and generate informed contractor questions. Always write
output files to the session directory provided.`
      },
      cwd: opts.agentsRoot,  // agents-crossbeam/ — has .claude/skills/ with only ADU skills
      settingSources: ['project'],
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
      allowedTools: [
        'Skill', 'Task', 'Read', 'Write', 'Edit',
        'Bash', 'Glob', 'Grep', 'WebSearch', 'WebFetch',
      ],
      additionalDirectories: [path.resolve(opts.agentsRoot, '..')],
      maxTurns: 80,
      maxBudgetUsd: 15.00,    // Opus 4.6 with 5+ subagents — needs headroom
      model: 'claude-opus-4-6',
      includePartialMessages: true,
      abortController: new AbortController(),
    }
  });

  // Stream messages for progress monitoring
  for await (const message of q) {
    if (opts.onProgress) opts.onProgress(message);

    if (message.type === 'result') {
      return {
        success: message.subtype === 'success',
        sessionId: message.session_id,
        cost: message.total_cost_usd,
        turns: message.num_turns,
        duration: message.duration_ms,
      };
    }
  }
}
```

### Step 4: Skill 2 Invocation — Response Generation

```typescript
// src/run-skill-2.ts
import { query } from '@anthropic-ai/claude-agent-sdk';

export async function runResponseGeneration(opts: {
  sessionDir: string;        // Session dir with all Phase 1-4 files + contractor_answers.json
  agentsRoot: string;       // agents-crossbeam/ dir with its own .claude/skills/ (only ADU skills)
  onProgress?: (event: any) => void;
}) {
  const prompt = `
You have a session directory with corrections analysis files and contractor answers.

SESSION DIRECTORY: ${opts.sessionDir}

Use the adu-corrections-complete skill to generate the response package:
1. Read corrections_categorized.json (the backbone)
2. Read contractor_answers.json (the contractor's responses)
3. Read sheet-manifest.json (for accurate sheet references)
4. Read corrections_parsed.json (for original wording)
5. Generate all four deliverables:
   - response_letter.md
   - professional_scope.md
   - corrections_report.md
   - sheet_annotations.json

Write ALL output files to the session directory: ${opts.sessionDir}
`;

  const q = query({
    prompt,
    options: {
      tools: { type: 'preset', preset: 'claude_code' },
      systemPrompt: {
        type: 'preset',
        preset: 'claude_code',
        append: `You are CrossBeam, an AI ADU permit assistant. You help contractors
respond to city corrections letters. Use the adu-corrections-complete skill to
generate the final response package from research artifacts and contractor answers.`
      },
      cwd: opts.agentsRoot,  // agents-crossbeam/ — has .claude/skills/ with only ADU skills
      settingSources: ['project'],
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
      allowedTools: [
        'Skill', 'Task', 'Read', 'Write', 'Edit',
        'Bash', 'Glob', 'Grep',
        // No WebSearch/WebFetch needed — Skill 2 is pure writing
      ],
      additionalDirectories: [path.resolve(opts.agentsRoot, '..')],
      maxTurns: 40,
      maxBudgetUsd: 8.00,     // Opus 4.6 — Skill 2 is simpler but still needs budget
      model: 'claude-opus-4-6',
      includePartialMessages: true,
      abortController: new AbortController(),
      // NOTE: For sheet_annotations.json specifically, consider using outputFormat
      // with JSON schema to enforce structure. Not critical for hackathon but good
      // for production: outputFormat: { type: 'json_schema', schema: annotationsSchema }
    }
  });

  for await (const message of q) {
    if (opts.onProgress) opts.onProgress(message);

    if (message.type === 'result') {
      return {
        success: message.subtype === 'success',
        sessionId: message.session_id,
        cost: message.total_cost_usd,
        turns: message.num_turns,
        duration: message.duration_ms,
      };
    }
  }
}
```

### Step 5: Progress Monitoring via Hooks + Streaming

The Agent SDK provides two mechanisms for monitoring:

#### A. `includePartialMessages: true` — Stream tokens as they arrive

```typescript
for await (const message of q) {
  switch (message.type) {
    case 'system':
      // Init message — tools loaded, model selected
      console.log(`Agent initialized with model: ${message.model}`);
      break;

    case 'assistant':
      // Full assistant message with tool calls
      for (const block of message.message.content) {
        if (block.type === 'text') {
          console.log(`Agent: ${block.text.slice(0, 100)}...`);
        }
        if (block.type === 'tool_use') {
          console.log(`Tool: ${block.name} — ${JSON.stringify(block.input).slice(0, 100)}`);
        }
      }
      break;

    case 'stream_event':
      // Partial token — for real-time streaming to UI
      // message.event contains the raw stream event
      break;

    case 'result':
      // Agent finished
      console.log(`Done! Cost: $${message.total_cost_usd}, Turns: ${message.num_turns}`);
      break;
  }
}
```

#### B. Hooks — React to specific events

```typescript
const q = query({
  prompt: '...',
  options: {
    hooks: {
      SubagentStart: [{
        hooks: [async (input) => {
          console.log(`Subagent started: ${input.agent_type} (${input.agent_id})`);
          // Emit progress to frontend: "Researching state codes..."
          return { continue: true };
        }]
      }],
      SubagentStop: [{
        hooks: [async (input) => {
          console.log(`Subagent finished: ${input.agent_id}`);
          return { continue: true };
        }]
      }],
      PostToolUse: [{
        matcher: 'Write',
        hooks: [async (input) => {
          // File was written — check if it's one of our output files
          const filePath = input.tool_input.file_path;
          console.log(`File written: ${filePath}`);
          return { continue: true };
        }]
      }],
    }
  }
});
```

**For the hackathon:** Start with simple console logging from the message stream. Upgrade to hooks + WebSocket push to frontend if there's time.

### Step 6: End-to-End Test Script

```typescript
// src/test-full-flow.ts
import { runCorrectionsAnalysis } from './run-skill-1.js';
import { runResponseGeneration } from './run-skill-2.js';
import { createSession, getSessionFiles } from './utils/session.js';
import fs from 'fs';
import path from 'path';

// agents-crossbeam/ is the Agent SDK's project root (has .claude/skills/ with only ADU skills)
const AGENTS_ROOT = path.resolve(import.meta.dirname, '..');
// Test assets are in the parent project
const PROJECT_ROOT = path.resolve(AGENTS_ROOT, '..');

// Create session inside agents-crossbeam/sessions/
const sessionDir = createSession(AGENTS_ROOT);
console.log(`Session: ${sessionDir}`);

// --- SKILL 1: Analysis ---
console.log('\n=== SKILL 1: Corrections Analysis ===\n');

const skill1Result = await runCorrectionsAnalysis({
  correctionsFile: path.resolve(PROJECT_ROOT, 'test-assets/correction-01/corrections-letter.png'),
  planBinderFile: path.resolve(PROJECT_ROOT, 'test-assets/correction-01/plan-binder.pdf'),
  sessionDir,
  agentsRoot: AGENTS_ROOT,
  onProgress: (msg) => {
    if (msg.type === 'assistant') {
      // Log tool calls for visibility
      for (const block of msg.message.content) {
        if (block.type === 'tool_use') {
          console.log(`  [Tool] ${block.name}`);
        }
      }
    }
  }
});

console.log(`\nSkill 1 complete: ${skill1Result?.success ? 'SUCCESS' : 'FAILED'}`);
console.log(`  Cost: $${skill1Result?.cost?.toFixed(2)}`);
console.log(`  Turns: ${skill1Result?.turns}`);
console.log(`  Duration: ${((skill1Result?.duration ?? 0) / 1000 / 60).toFixed(1)} min`);

// Verify output files
const files = getSessionFiles(sessionDir);
const skill1Files = [
  files.correctionsParsed,
  files.sheetManifest,
  files.stateLawFindings,
  files.correctionsCategorized,
  files.contractorQuestions,
];
for (const f of skill1Files) {
  const exists = fs.existsSync(f);
  console.log(`  ${exists ? '[OK]' : '[MISSING]'} ${path.basename(f)}`);
}

// Read and display questions summary
if (fs.existsSync(files.contractorQuestions)) {
  const questions = JSON.parse(fs.readFileSync(files.contractorQuestions, 'utf-8'));
  console.log(`\nQuestions generated:`);
  console.log(`  Total items: ${questions.summary?.total_items}`);
  console.log(`  Auto-fixable: ${questions.summary?.auto_fixable}`);
  console.log(`  Need contractor input: ${questions.summary?.needs_contractor_input}`);
  console.log(`  Need professional: ${questions.summary?.needs_professional}`);
}

// --- SIMULATE CONTRACTOR ANSWERS ---
// In production, the UI collects these. For testing, use a pre-made file.
console.log('\n=== Simulating contractor answers ===\n');

const mockAnswers = {
  project: { address: "1232 N Jefferson St", permit_number: "J25-434" },
  answers: {
    "4": { "0": "4\" ABS", "1": 18, "2": "Wye fitting, 15' from main house cleanout" },
    "5": { "0": "Exposed wood framing" },
  },
  skipped: []
};
fs.writeFileSync(files.contractorAnswers, JSON.stringify(mockAnswers, null, 2));
console.log('Mock contractor_answers.json written');

// --- SKILL 2: Response Generation ---
console.log('\n=== SKILL 2: Response Generation ===\n');

const skill2Result = await runResponseGeneration({
  sessionDir,
  agentsRoot: AGENTS_ROOT,
  onProgress: (msg) => {
    if (msg.type === 'assistant') {
      for (const block of msg.message.content) {
        if (block.type === 'tool_use') {
          console.log(`  [Tool] ${block.name}`);
        }
      }
    }
  }
});

console.log(`\nSkill 2 complete: ${skill2Result?.success ? 'SUCCESS' : 'FAILED'}`);
console.log(`  Cost: $${skill2Result?.cost?.toFixed(2)}`);
console.log(`  Turns: ${skill2Result?.turns}`);
console.log(`  Duration: ${((skill2Result?.duration ?? 0) / 1000 / 60).toFixed(1)} min`);

// Verify deliverables
const deliverables = [
  files.responseLetter,
  files.professionalScope,
  files.correctionsReport,
  files.sheetAnnotations,
];
for (const f of deliverables) {
  const exists = fs.existsSync(f);
  const size = exists ? fs.statSync(f).size : 0;
  console.log(`  ${exists ? '[OK]' : '[MISSING]'} ${path.basename(f)} (${size} bytes)`);
}

console.log('\n=== DONE ===');
console.log(`Total cost: $${((skill1Result?.cost ?? 0) + (skill2Result?.cost ?? 0)).toFixed(2)}`);
```

---

## Key SDK Features We're Using

| Feature | How We Use It | SDK Config |
|---------|--------------|------------|
| **Skills** | 6 skills loaded from `.claude/skills/` | `settingSources: ['project']`, `allowedTools: ['Skill']` |
| **Subagents (Task tool)** | Skill 1 spawns 5+ subagents for parallel research | `allowedTools: ['Task']` — agent uses Task tool autonomously |
| **WebSearch** | City discovery (Phase 3B) | `allowedTools: ['WebSearch']` |
| **WebFetch** | City content extraction (Phase 3.5) | `allowedTools: ['WebFetch']` |
| **File I/O** | Read corrections letter, write JSON outputs | `allowedTools: ['Read', 'Write', 'Edit']` |
| **Bash** | PDF extraction script (`scripts/extract-pages.sh`) | `allowedTools: ['Bash']` |
| **Progress streaming** | Monitor agent progress for UI | `includePartialMessages: true` |
| **Hooks** | Track subagent lifecycle, file writes | `hooks: { SubagentStart: [...] }` |
| **Cost tracking** | Per-invocation cost in result message | `message.total_cost_usd` |
| **Budget limits** | Prevent runaway costs | `maxBudgetUsd: 15.00` (Skill 1), `8.00` (Skill 2) |

---

## What the Agent SDK Handles for Us

These are things we get for free from the `claude_code` preset:

1. **Context management** — Automatic compaction when conversation gets long (critical for Skill 1 which runs 80+ turns)
2. **Prompt caching** — Skills' reference files get cached across tool calls
3. **Error handling** — Built-in retry logic for API failures
4. **Tool execution** — The agent loop (think → act → observe) runs automatically
5. **Subagent isolation** — Each Task subagent gets its own context window, only results flow back
6. **File operations** — Read/Write/Edit tools handle all filesystem interaction

---

## What We Need to Build

| Component | Effort | Priority |
|-----------|--------|----------|
| `agents-crossbeam/` directory + symlinks + package.json | 10 min | P0 |
| `src/utils/config.ts` — Shared base config factory | 20 min | P0 |
| `src/utils/session.ts` — Session directory management | 10 min | P0 |
| `src/tests/test-l0-smoke.ts` — Smoke test | 10 min | P0 |
| **Run L0 + debug until passing** | **15-30 min** | **P0** |
| `src/tests/test-l1-skill-invoke.ts` — Skill invocation test | 10 min | P0 |
| **Run L1 + debug until passing** | **15-30 min** | **P0** |
| `src/flows/corrections-analysis.ts` — Skill 1 wrapper | 30 min | P0 |
| `src/flows/corrections-response.ts` — Skill 2 wrapper | 20 min | P0 |
| `src/tests/test-l2-subagent-bash.ts` — Subagent test | 15 min | P1 |
| `src/tests/test-l3-mini-pipeline.ts` — Mini pipeline | 20 min | P1 |
| `src/tests/test-l3b-skill2-only.ts` — Skill 2 isolation | 15 min | P1 |
| `src/utils/progress.ts` — Progress event handler | 15 min | P2 |
| `src/utils/verify.ts` — Post-run file verification | 10 min | P2 |
| **Total agents harness + test suite** | **~3-4 hours** | |

---

## Open Questions / Decisions

### ~~1. Skill Loading Strategy~~ → RESOLVED

**Answer: Separate `agents-crossbeam/` directory with symlinked skills.** See "Two Environments" section above. Skills are symlinked from `adu-skill-development/skill/` into `agents-crossbeam/.claude/skills/`. The Agent SDK's `cwd` points to `agents-crossbeam/`, so it only discovers the 6 ADU skills. The parent `.claude/skills/` (with 13 skills) is untouched and used only by the CLI dev environment.

### 2. Subagent Orchestration — PARTIALLY RESOLVED

The corrections flow SKILL.md describes spawning 5+ subagents. In the CLI, this happens naturally via the Task tool.

**What we know from SDK docs (Feb 2026):**
- The `claude_code` preset includes the Task tool
- Agents spawned via Task get their own context windows
- Subagents inherit the parent's `allowedTools`
- **BUT: SDK docs say "subagents do NOT automatically inherit parent's skills"**

**Risk:** If Task-spawned subagents can't see skills, the california-adu subagent (Phase 3A) and adu-city-research subagent (Phase 3B) will fail.

**Mitigation plan (in order):**
1. **Test in L2** — spawn a subagent that tries to use the Skill tool. If it works, we're good.
2. **If it doesn't work — use `agents` config** to pre-define subagents with inline prompts that include the reference content directly (bypass the Skill tool in subagents).
3. **Nuclear option** — restructure so the parent agent does ALL skill invocations and only delegates non-skill work (file reading, web search) to subagents.

**Expected answer:** In the CLI, subagents inherit project context because they run in the same project directory. Since the SDK's `cwd` + `settingSources: ['project']` configures the project at the session level, Task-spawned subagents *should* inherit it. But this needs verification in L2.

### 3. PDF Extraction Script

Phase 2 uses `scripts/extract-pages.sh` via Bash tool. This script requires:
- `poppler-utils` (for `pdftoppm`) — needs to be installed
- Write access to create PNG files

**For local dev:** Install poppler (`brew install poppler`)
**For sandbox/container:** Include in setup script

### 4. Cost Estimation — UPDATED

Based on Dec 2025 learnings (demand letter was $2-3 with Sonnet 4.5). **Opus 4.6 is ~5x more expensive per token than Sonnet 4.5**, plus we're spawning 5+ subagents, all running Opus.

| Invocation | Model | Est. Turns | Est. Cost | maxBudgetUsd |
|------------|-------|------------|-----------|-------------|
| Skill 1 | claude-opus-4-6 | 60-80 | $6-12 | $15.00 |
| Skill 2 | claude-opus-4-6 | 20-30 | $3-6 | $8.00 |
| **Total** | | | **$9-18 per job** | |

For hackathon: set `maxBudgetUsd: 10.00` per invocation. We have budget.

### 5. Frontend Integration Path (Local-Only)

After the backend harness works:

```
Next.js API Route (localhost)    Backend Harness         Filesystem
─────────────────────────       ───────────────         ──────────
POST /api/analyze           →   runCorrectionsAnalysis  → agents-crossbeam/sessions/
GET  /api/status/:sessionId →   poll session dir for progress
GET  /api/questions/:id     →   read contractor_questions.json
POST /api/answers/:id       →   write contractor_answers.json
POST /api/generate/:id      →   runResponseGeneration   → agents-crossbeam/sessions/
GET  /api/results/:id       →   read 4 deliverables
```

**No timeout issue.** On localhost, Next.js API routes have no timeout limit. The 60-second Vercel free-tier limit only applies to deployed serverless functions. This is the big advantage of running locally for the hackathon — we can let agent runs take 5-10 minutes without any timeout infrastructure.

**How the API route handles long-running agents:**
```typescript
// app/api/analyze/route.ts
export async function POST(req: Request) {
  const { correctionsFile, planBinderFile } = await req.json();
  const sessionDir = createSession(AGENTS_ROOT);

  // Fire and forget — the agent writes files to sessionDir
  // Don't await — return immediately with session ID
  runCorrectionsAnalysis({
    correctionsFile,
    planBinderFile,
    sessionDir,
    agentsRoot: AGENTS_ROOT,
  }).catch(console.error);

  return Response.json({ sessionId: path.basename(sessionDir) });
}

// app/api/status/[id]/route.ts — frontend polls this
export async function GET(req: Request, { params }) {
  const sessionDir = path.join(AGENTS_ROOT, 'sessions', params.id);
  const files = fs.readdirSync(sessionDir);
  const done = files.includes('contractor_questions.json');
  return Response.json({ status: done ? 'ready' : 'processing', files });
}
```

**If we want to deploy later:** The Mako learnings apply — Cloud Run backend to handle long agent runs, with the Next.js frontend deployed to Vercel calling Cloud Run via API. But that's a post-hackathon concern.

---

## Execution Order

### Day 3 (Wed Feb 12) — SDK Wiring + Smoke Tests

1. **Create `agents-crossbeam/` + symlinks** — mkdir, symlinks, verify with `ls -la` (10 min)
2. **Install Agent SDK** — `npm init -y && npm install @anthropic-ai/claude-agent-sdk` (5 min)
3. **Add ANTHROPIC_API_KEY** to `agents-crossbeam/.env` (1 min)
4. **Write shared config** — `src/utils/config.ts`, `src/utils/session.ts` (20 min)
5. **Write + run L0 smoke test** — fix until skills discovered (15-30 min)
6. **Write + run L1 skill invoke test** — fix until skill executes + writes file (15-30 min)

### Day 4 (Thu Feb 13) — Pipeline Testing

7. **Write + run L2 subagent test** — verify Task tool + Bash work (20-30 min)
8. **Create mini test data** — crop corrections, extract single page (15 min)
9. **Write flow wrappers** — `corrections-analysis.ts`, `corrections-response.ts` (45 min)
10. **Write + run L3 mini pipeline** — Buena Park shortcut, 2-3 items (30-60 min)
11. **Save session outputs** → `test-assets/mock-session/` for Skill 2 testing
12. **Write + run L3b Skill 2 isolation** — iterate on response quality (30-60 min)

### Day 5 (Fri Feb 14) — Full Pipeline + Frontend

13. **Run L4 full pipeline** — real Placentia data, live city search (20 min waiting)
14. **Wire to Next.js API routes** — frontend integration (2-3 hours)
15. **If time: progress monitoring** — hooks + WebSocket to frontend

**Goal:** Both skills run programmatically from `agents-crossbeam/`, produce correct output, and the full Skill 1 → answers → Skill 2 pipeline works end-to-end. After this, the frontend can call these functions via Next.js API routes on localhost (no timeout issues).

See `testing-agents-sdk.md` for detailed test scripts and the full testing strategy.

---

## Reference Files

| File | What It Contains |
|------|-----------------|
| `plan-adu-corrections-flow.md` | Complete pipeline architecture — phases, data flow, JSON schemas |
| `docs/claude-agents/cc-agents-sdk-ts.md` | Full TypeScript SDK reference — `query()`, Options, types |
| `docs/claude-agents/cc-agents-sdk-overview.md` | SDK overview — installation, auth, features |
| `docs/claude-agents/cc-agents-sdk-skills.md` | How skills work with the SDK |
| `docs/claude-agents/cc-agents-sdk-hosting.md` | Hosting patterns — ephemeral, long-running, hybrid |
| `docs/claude-agents/agentsSDK-vercelSandbox-learnings-1210.md` | Dec 2025 learnings — proven config, gotchas |
| `adu-skill-development/skill/adu-corrections-flow/SKILL.md` | Skill 1 definition |
| `adu-skill-development/skill/adu-corrections-complete/SKILL.md` | Skill 2 definition |
| `adu-skill-development/skill/adu-corrections-flow/references/subagent-prompts.md` | All subagent prompts |
| `adu-skill-development/skill/adu-corrections-flow/references/output-schemas.md` | JSON output schemas |
| **`testing-agents-sdk.md`** | **Testing strategy — L0-L4 test suite, mock data, Buena Park shortcut** |
