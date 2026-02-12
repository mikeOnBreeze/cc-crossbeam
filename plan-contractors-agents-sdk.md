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
├── backend/                            ← Agent SDK app lives here
│   ├── .claude/
│   │   └── skills/                     ← ONLY ADU skills (6) — symlinked
│   │       ├── california-adu → ../../../adu-skill-development/skill/california-adu
│   │       ├── adu-corrections-flow → ../../../adu-skill-development/skill/adu-corrections-flow
│   │       ├── adu-corrections-complete → ../../../adu-skill-development/skill/adu-corrections-complete
│   │       ├── adu-city-research → ../../../adu-skill-development/skill/adu-city-research
│   │       ├── adu-targeted-page-viewer → ../../../adu-skill-development/skill/adu-targeted-page-viewer
│   │       └── buena-park-adu → ../../../adu-skill-development/skill/buena-park-adu
│   ├── src/
│   │   ├── harness.ts
│   │   ├── run-skill-1.ts
│   │   ├── run-skill-2.ts
│   │   ├── test-full-flow.ts
│   │   └── utils/
│   ├── package.json                    (@anthropic-ai/claude-agent-sdk)
│   └── .env.local                      (ANTHROPIC_API_KEY)
│
└── frontend/                           ← Next.js app (later)
    ├── app/
    │   └── api/                        (API routes call backend/)
    └── package.json
```

### Why Symlinks Are Key

**Editing skills directly in `.claude/skills/` triggers permission prompts in Claude Code CLI.** That's painful when iterating quickly.

With symlinks:
1. Edit skills in `adu-skill-development/skill/` — no permission prompts, fast iteration
2. Symlinks in `backend/.claude/skills/` auto-propagate changes
3. Agent SDK picks up the latest skill content on every `query()` call
4. Parent `.claude/skills/` stays untouched — CLI dev environment is unaffected

This is the same pattern from Mako (parent repo + subrepo with its own `.claude/`) but without needing a separate git repo. The `backend/` directory acts as the Agent SDK's project root.

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

    // Skills discovery — loads backend/.claude/skills/ (only ADU skills)
    cwd: BACKEND_ROOT,  // path.resolve(__dirname, '..')  → backend/
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

    // Limits
    maxTurns: 80,           // High — skills spawn many subagents
    maxBudgetUsd: 8.00,     // Corrections flow uses multiple Opus calls
    model: 'claude-opus-4-6',

    // Streaming for progress monitoring
    includePartialMessages: true,
  }
});
```

### Critical Gotchas (from Dec 2025)

| Gotcha | Details |
|--------|---------|
| **`tools` and `systemPrompt` presets are required** | Without `{ type: 'preset', preset: 'claude_code' }`, the agent hallucinates tool usage — says "I'll write the file" but creates nothing |
| **`settingSources: ['project']` required for skills** | Without this, agent won't discover `.claude/skills/` directories |
| **Model name must be full alias** | Use `'claude-opus-4-6'`, not `'opus'` |
| **`cwd` must point to `backend/`** | Skills are loaded relative to `cwd` — must contain `.claude/skills/` with only ADU skills. Do NOT point to parent project root (loads 13 skills including nano-banana). |
| **Always verify file creation** | Agent reports success even when tools aren't configured. Check files exist after run. |

---

## Implementation Plan

### Step 1: Backend Subdirectory + Skills Setup

Create the `backend/` directory with its own `.claude/skills/` containing only ADU skills. This is the Agent SDK's project root — `cwd` in every `query()` call points here.

```bash
# Create backend structure
mkdir -p backend/.claude/skills backend/src/utils

# Symlink ADU skills from source of truth
cd backend/.claude/skills
ln -s ../../../adu-skill-development/skill/california-adu california-adu
ln -s ../../../adu-skill-development/skill/adu-corrections-flow adu-corrections-flow
ln -s ../../../adu-skill-development/skill/adu-corrections-complete adu-corrections-complete
ln -s ../../../adu-skill-development/skill/adu-city-research adu-city-research
ln -s ../../../adu-skill-development/skill/adu-targeted-page-viewer adu-targeted-page-viewer
ln -s ../../../adu-skill-development/skill/buena-park-adu buena-park-adu
cd ../../..

# Verify symlinks resolve
ls -la backend/.claude/skills/
```

**Backend directory structure:**
```
backend/
├── .claude/
│   └── skills/                     ← 6 ADU skills only (symlinked)
├── src/
│   ├── harness.ts                  # Core query() wrapper with config
│   ├── run-skill-1.ts              # Invocation 1: corrections analysis
│   ├── run-skill-2.ts              # Invocation 2: response generation
│   ├── test-full-flow.ts           # End-to-end test with real data
│   ├── types.ts                    # TypeScript types for JSON schemas
│   └── utils/
│       ├── session.ts              # Session directory management
│       ├── progress.ts             # Progress event handler
│       └── verify.ts               # Post-run file verification
├── sessions/                       ← Created at runtime (per-job directories)
├── package.json
├── tsconfig.json
└── .env.local                      ← ANTHROPIC_API_KEY
```

**Package dependencies:**
```json
{
  "name": "crossbeam-backend",
  "type": "module",
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "latest"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

**Run command (no build step needed):**
```bash
cd backend && node --env-file .env.local --experimental-strip-types ./src/test-full-flow.ts
```

### Why `backend/` as a Separate Directory (Not a Subrepo)

In Mako, the Agent SDK lived in a separate git repo (`mako/` inside the parent). That made sense for production — the subrepo could be deployed independently.

For the hackathon, a subdirectory is simpler:
- No extra git repo to manage
- Same git history for everything
- Easy to reference test assets via relative paths (`../test-assets/`)
- Can still deploy independently later if needed (just copy `backend/`)

The key thing is the **separate `.claude/skills/`**. That's what isolates the two environments.

### Step 2: Session Directory Management

Each corrections job gets its own session directory under `backend/sessions/`:

```typescript
// src/utils/session.ts
import fs from 'fs';
import path from 'path';

export function createSession(backendRoot: string): string {
  const sessionId = `correction-${Date.now()}`;
  const sessionDir = path.join(backendRoot, 'sessions', sessionId);
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
  backendRoot: string;       // backend/ dir with its own .claude/skills/ (only ADU skills)
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
      cwd: opts.backendRoot,  // backend/ — has .claude/skills/ with only ADU skills
      settingSources: ['project'],
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
      allowedTools: [
        'Skill', 'Task', 'Read', 'Write', 'Edit',
        'Bash', 'Glob', 'Grep', 'WebSearch', 'WebFetch',
      ],
      maxTurns: 80,
      maxBudgetUsd: 8.00,
      model: 'claude-opus-4-6',
      includePartialMessages: true,
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
  backendRoot: string;       // backend/ dir with its own .claude/skills/ (only ADU skills)
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
      cwd: opts.backendRoot,  // backend/ — has .claude/skills/ with only ADU skills
      settingSources: ['project'],
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
      allowedTools: [
        'Skill', 'Task', 'Read', 'Write', 'Edit',
        'Bash', 'Glob', 'Grep',
        // No WebSearch/WebFetch needed — Skill 2 is pure writing
      ],
      maxTurns: 40,
      maxBudgetUsd: 4.00,
      model: 'claude-opus-4-6',
      includePartialMessages: true,
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

// backend/ is the Agent SDK's project root (has .claude/skills/ with only ADU skills)
const BACKEND_ROOT = path.resolve(import.meta.dirname, '..');
// Test assets are in the parent project
const PROJECT_ROOT = path.resolve(BACKEND_ROOT, '..');

// Create session inside backend/sessions/
const sessionDir = createSession(BACKEND_ROOT);
console.log(`Session: ${sessionDir}`);

// --- SKILL 1: Analysis ---
console.log('\n=== SKILL 1: Corrections Analysis ===\n');

const skill1Result = await runCorrectionsAnalysis({
  correctionsFile: path.resolve(PROJECT_ROOT, 'test-assets/correction-01/corrections-letter.png'),
  planBinderFile: path.resolve(PROJECT_ROOT, 'test-assets/correction-01/plan-binder.pdf'),
  sessionDir,
  backendRoot: BACKEND_ROOT,
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
  backendRoot: BACKEND_ROOT,
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
| **Budget limits** | Prevent runaway costs | `maxBudgetUsd: 8.00` |

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
| `backend/` directory + symlinks setup | 10 min | P0 |
| `run-skill-1.ts` — Skill 1 query wrapper | 30 min | P0 |
| `run-skill-2.ts` — Skill 2 query wrapper | 20 min | P0 |
| `test-full-flow.ts` — End-to-end test | 30 min | P0 |
| Session directory management | 15 min | P0 |
| Progress event handler (console) | 20 min | P1 |
| File verification utility | 15 min | P1 |
| **Total backend harness** | **~2-3 hours** | |

---

## Open Questions / Decisions

### ~~1. Skill Loading Strategy~~ → RESOLVED

**Answer: Separate `backend/` directory with symlinked skills.** See "Two Environments" section above. Skills are symlinked from `adu-skill-development/skill/` into `backend/.claude/skills/`. The Agent SDK's `cwd` points to `backend/`, so it only discovers the 6 ADU skills. The parent `.claude/skills/` (with 13 skills) is untouched and used only by the CLI dev environment.

### 2. Subagent Orchestration

The corrections flow SKILL.md describes spawning 5+ subagents. In the CLI, this happens naturally via the Task tool. In the SDK:

- The `claude_code` preset includes the Task tool
- Agents spawned via Task get their own context windows
- Subagents inherit the parent's tools and skills
- The `agents` option in `query()` can define custom subagent types programmatically

**Key question:** Do we need to define custom `AgentDefinition` objects, or will the Skill's subagent prompts (in `references/subagent-prompts.md`) work through the natural Task tool?

**Expected answer:** The Skill's prompts should work. The agent reads `subagent-prompts.md`, then uses the Task tool to spawn subagents with those prompts. This is the same pattern as the CLI. But we should test this — if subagents don't get the right skills context, we may need to use `agents` config to pre-define them.

### 3. PDF Extraction Script

Phase 2 uses `scripts/extract-pages.sh` via Bash tool. This script requires:
- `poppler-utils` (for `pdftoppm`) — needs to be installed
- Write access to create PNG files

**For local dev:** Install poppler (`brew install poppler`)
**For sandbox/container:** Include in setup script

### 4. Cost Estimation

Based on Dec 2025 learnings (demand letter was $2-3 with Sonnet 4.5):

| Invocation | Model | Est. Turns | Est. Cost |
|------------|-------|------------|-----------|
| Skill 1 | claude-opus-4-6 | 60-80 | $4-8 |
| Skill 2 | claude-opus-4-6 | 20-30 | $2-4 |
| **Total** | | | **$6-12 per job** |

For hackathon: set `maxBudgetUsd: 10.00` per invocation. We have budget.

### 5. Frontend Integration Path (Local-Only)

After the backend harness works:

```
Next.js API Route (localhost)    Backend Harness         Filesystem
─────────────────────────       ───────────────         ──────────
POST /api/analyze           →   runCorrectionsAnalysis  → backend/sessions/
GET  /api/status/:sessionId →   poll session dir for progress
GET  /api/questions/:id     →   read contractor_questions.json
POST /api/answers/:id       →   write contractor_answers.json
POST /api/generate/:id      →   runResponseGeneration   → backend/sessions/
GET  /api/results/:id       →   read 4 deliverables
```

**No timeout issue.** On localhost, Next.js API routes have no timeout limit. The 60-second Vercel free-tier limit only applies to deployed serverless functions. This is the big advantage of running locally for the hackathon — we can let agent runs take 5-10 minutes without any timeout infrastructure.

**How the API route handles long-running agents:**
```typescript
// app/api/analyze/route.ts
export async function POST(req: Request) {
  const { correctionsFile, planBinderFile } = await req.json();
  const sessionDir = createSession(BACKEND_ROOT);

  // Fire and forget — the agent writes files to sessionDir
  // Don't await — return immediately with session ID
  runCorrectionsAnalysis({
    correctionsFile,
    planBinderFile,
    sessionDir,
    backendRoot: BACKEND_ROOT,
  }).catch(console.error);

  return Response.json({ sessionId: path.basename(sessionDir) });
}

// app/api/status/[id]/route.ts — frontend polls this
export async function GET(req: Request, { params }) {
  const sessionDir = path.join(BACKEND_ROOT, 'sessions', params.id);
  const files = fs.readdirSync(sessionDir);
  const done = files.includes('contractor_questions.json');
  return Response.json({ status: done ? 'ready' : 'processing', files });
}
```

**If we want to deploy later:** The Mako learnings apply — Cloud Run backend to handle long agent runs, with the Next.js frontend deployed to Vercel calling Cloud Run via API. But that's a post-hackathon concern.

---

## Execution Order

1. **Create `backend/` + symlinks** — mkdir, symlinks, verify with `ls -la` (5 min)
2. **Install Agent SDK** — `cd backend && npm init -y && npm install @anthropic-ai/claude-agent-sdk` (5 min)
3. **Write harness** — `run-skill-1.ts`, `run-skill-2.ts`, session management (1 hour)
4. **First test** — Run Skill 1 against Placentia test data (wait ~5 min for result)
5. **Verify outputs** — Check all 8 JSON files were written correctly
6. **Debug/iterate** — Fix any skill loading or subagent issues
7. **Run Skill 2** — With mock contractor answers
8. **Verify deliverables** — Check all 4 output files
9. **Full flow test** — End-to-end with real test data
10. **If time: progress monitoring** — Hook up progress events

**Goal:** Both skills run programmatically from `backend/`, produce correct output, and the full Skill 1 → answers → Skill 2 pipeline works end-to-end. After this, the frontend can call these functions via Next.js API routes on localhost (no timeout issues).

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
