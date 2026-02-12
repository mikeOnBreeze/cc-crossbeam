# Testing Strategy — Agent SDK Pipeline

## Why This Doc Exists

Full corrections pipeline = 15-20 min per test. Agent SDK wiring **always** has first-run issues (wrong presets, skills not discovered, subagents fail, files not written). We need to iterate in seconds/minutes, not quarter-hours.

This doc defines a layered testing approach — smoke tests that run in 30 seconds, up to full pipeline acceptance tests.

**Reference:** `plan-contractors-agents-sdk.md` for architecture. This doc covers testing only.

---

## Test Data Inventory

### What We Already Have

| Location | Contents | Use For |
|----------|----------|---------|
| `test-assets/corrections/` | Placentia corrections letter (2 PNGs + PDF) + plan binder PDF | L4 full pipeline |
| `test-assets/correction-01/` | Same Placentia data (alternate path) | L4 full pipeline |
| `test-assets/approved/` | Long Beach approved plans PDF (26 pages) | Sheet manifest testing |
| `test-assets/05-extract-test/` | Long Beach 326 Flint Ave (26 pages, extracted) | Page viewer testing |
| `test-assets/buena-park/` | Buena Park test data (if populated) | L3 mini pipeline |

### What We Need to Create

| Asset | Purpose | How to Create |
|-------|---------|---------------|
| `test-assets/mini/corrections-mini.png` | 2-3 correction items only | Crop from Placentia letter |
| `test-assets/mini/plan-page-A1.png` | Single plan sheet (pre-extracted) | Extract page 5 from binder |
| `test-assets/mini/sheet-manifest-mini.json` | Pre-made manifest with 2 sheets | Hand-write from known data |
| `test-assets/mock-session/` | Pre-populated Phase 1-4 outputs | Copy from a successful CLI run |
| `test-assets/mock-session/corrections_parsed.json` | Parsed corrections | From CLI test |
| `test-assets/mock-session/corrections_categorized.json` | Categorized with research | From CLI test |
| `test-assets/mock-session/sheet-manifest.json` | Full manifest | From CLI test |
| `test-assets/mock-session/contractor_answers.json` | Mock contractor responses | Hand-write |
| `test-assets/mock-session/state_law_findings.json` | State law research | From CLI test |

**Strategy:** Run the corrections flow once through the CLI (as we've done before), then copy the output JSONs into `test-assets/mock-session/`. This gives us real test fixtures for Skill 2 isolation testing.

---

## Testing Levels

### L0: Smoke Test — SDK Init + Skill Discovery (~30 sec, ~$0.01)

**What it tests:** Does `query()` initialize? Are skills discovered from `.claude/skills/`? Are tools available?

```typescript
// tests/test-l0-smoke.ts
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createQueryOptions } from '../utils/config.js';

const q = query({
  prompt: 'List all available skills you can see. Then say SMOKE_OK.',
  options: {
    ...createQueryOptions({ model: 'claude-haiku-4-5-20251001' }), // Cheapest model
    maxTurns: 3,
    maxBudgetUsd: 0.10,
  }
});

for await (const msg of q) {
  if (msg.type === 'system') {
    console.log('✓ SDK initialized');
    console.log('  Model:', msg.model);
    console.log('  Tools:', msg.tools.join(', '));
    const hasSkill = msg.tools.includes('Skill');
    console.log(hasSkill ? '  ✓ Skill tool available' : '  ✗ Skill tool MISSING');
  }
  if (msg.type === 'result') {
    const hasSkills = msg.result.includes('california-adu');
    console.log(hasSkills ? '✓ Skills discovered' : '✗ Skills NOT found');
    console.log(`  Cost: $${msg.total_cost_usd?.toFixed(4)}`);
    console.log(`  Subtype: ${msg.subtype}`);
  }
}
```

**What this catches:**
- Wrong `cwd` → skills not found
- Missing `settingSources: ['project']` → skills not loaded
- Broken symlinks → skills directory empty
- Wrong model name → init failure
- Missing `ANTHROPIC_API_KEY` → auth error

**Pass criteria:** Agent lists skill names (california-adu, adu-corrections-flow, etc.) and says SMOKE_OK.

---

### L1: Single Skill Invocation (~1-2 min, ~$0.50)

**What it tests:** Can the agent invoke a specific skill via the Skill tool? Do reference files load?

```typescript
// tests/test-l1-skill-invoke.ts
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createQueryOptions, createSession } from '../utils/config.js';

const sessionDir = createSession();

const q = query({
  prompt: `Use the california-adu skill to answer this question:
What are the 2026 California state setback requirements for a DETACHED ADU
on a single-family residential lot? Include rear and side setback minimums.

Write your answer as JSON to: ${sessionDir}/test-state-law.json

Format: { "rear_setback_ft": number, "side_setback_ft": number, "source": "string" }`,
  options: {
    ...createQueryOptions({ model: 'claude-haiku-4-5-20251001' }),
    maxTurns: 15,
    maxBudgetUsd: 1.00,
  }
});

for await (const msg of q) {
  if (msg.type === 'result') {
    const fileExists = fs.existsSync(`${sessionDir}/test-state-law.json`);
    console.log(fileExists ? '✓ File written' : '✗ File NOT written');
    if (fileExists) {
      const data = JSON.parse(fs.readFileSync(`${sessionDir}/test-state-law.json`, 'utf-8'));
      console.log('  Rear setback:', data.rear_setback_ft, 'ft');
      console.log('  Side setback:', data.side_setback_ft, 'ft');
      // Expected: rear=4, side=4 for detached ADU
      const correct = data.rear_setback_ft === 4 && data.side_setback_ft === 4;
      console.log(correct ? '✓ Values correct' : '✗ Values WRONG');
    }
    console.log(`  Cost: $${msg.total_cost_usd?.toFixed(4)}`);
  }
}
```

**What this catches:**
- Skill tool not working in SDK context
- Reference files not loading (28 california-adu files)
- File write permissions / path issues
- `additionalDirectories` needed for parent paths

**Pass criteria:** JSON file exists with correct setback values.

---

### L2: Subagent + Bash Script (~2-3 min, ~$1.00)

**What it tests:** Can the agent spawn a subagent via Task tool? Does Bash work for shell scripts? Can it read images?

```typescript
// tests/test-l2-subagent-bash.ts
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createQueryOptions, createSession } from '../utils/config.js';
import path from 'path';

const sessionDir = createSession();
const PROJECT_ROOT = path.resolve(import.meta.dirname, '../..');

// Use a pre-extracted single page PNG if available, otherwise use a small PDF
const testPage = path.resolve(PROJECT_ROOT, 'test-assets/mini/plan-page-A1.png');

const q = query({
  prompt: `You have a single plan sheet image at: ${testPage}

Your task:
1. Read this image using the Read tool
2. Identify what sheet this is (look for a sheet ID like "A1", "S1", "CS" in the title block)
3. Write the result to: ${sessionDir}/test-sheet-id.json

Format: { "sheet_id": "string", "description": "string", "confidence": "high|medium|low" }

If you need to spawn a subagent to help, do so via the Task tool.`,
  options: {
    ...createQueryOptions({ model: 'claude-sonnet-4-5-20250929' }),
    maxTurns: 20,
    maxBudgetUsd: 2.00,
  }
});

for await (const msg of q) {
  if (msg.type === 'assistant') {
    for (const block of msg.message.content) {
      if (block.type === 'tool_use') {
        console.log(`  [Tool] ${block.name}`);
      }
    }
  }
  if (msg.type === 'result') {
    const fileExists = fs.existsSync(`${sessionDir}/test-sheet-id.json`);
    console.log(fileExists ? '✓ Sheet ID file written' : '✗ File NOT written');
    console.log(`  Cost: $${msg.total_cost_usd?.toFixed(4)}`);
    console.log(`  Turns: ${msg.num_turns}`);
  }
}
```

**What this catches:**
- Task tool spawning subagents in SDK context
- Bash tool execution (for extraction scripts)
- Image reading capabilities
- File path resolution across directories

**Pass criteria:** JSON file exists with a valid sheet ID.

---

### L3: Mini Pipeline — The Buena Park Shortcut (~5-7 min, ~$3-5)

**What it tests:** Multi-skill orchestration across phases. Uses Buena Park offline skill instead of live city web search (saves 5-10 min).

```typescript
// tests/test-l3-mini-pipeline.ts
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createQueryOptions, createSession, getSessionFiles } from '../utils/config.js';
import path from 'path';
import fs from 'fs';

const sessionDir = createSession();
const PROJECT_ROOT = path.resolve(import.meta.dirname, '../..');
const files = getSessionFiles(sessionDir);

// Use mini test data (2-3 corrections, 1 plan page)
const correctionsFile = path.resolve(PROJECT_ROOT, 'test-assets/mini/corrections-mini.png');
const planPage = path.resolve(PROJECT_ROOT, 'test-assets/mini/plan-page-A1.png');

// Pre-populate sheet manifest (skip Phase 2 — PDF extraction already tested in L2)
const miniManifest = {
  source_pdf: 'plan-page-A1.png',
  total_pages: 1,
  indexed_sheets: 1,
  sheets: [
    { sheet_id: 'A1', page_number: 1, file: planPage, description: 'Floor Plan' }
  ],
  unindexed_pages: []
};
fs.writeFileSync(files.sheetManifest, JSON.stringify(miniManifest, null, 2));

const prompt = `
You have a corrections letter and a pre-built sheet manifest for an ADU permit.

CORRECTIONS LETTER: ${correctionsFile}
SHEET MANIFEST (already built): ${files.sheetManifest}
SESSION DIRECTORY: ${sessionDir}
CITY: Buena Park

Use the adu-corrections-flow skill to analyze these corrections.

IMPORTANT MODIFICATIONS FOR THIS TEST:
- The sheet manifest is already built — skip Phase 2 (PDF extraction)
- Use the buena-park-adu skill for city research instead of live web search
- Do NOT use adu-city-research skill (no web search/fetch needed)
- Process only the corrections visible in the letter
- Write all output files to: ${sessionDir}
`;

const q = query({
  prompt,
  options: {
    ...createQueryOptions({ model: 'claude-opus-4-6' }),
    maxTurns: 50,
    maxBudgetUsd: 8.00,
    // Remove WebSearch/WebFetch — force offline city research
    allowedTools: [
      'Skill', 'Task', 'Read', 'Write', 'Edit',
      'Bash', 'Glob', 'Grep',
    ],
  }
});

const startTime = Date.now();

for await (const msg of q) {
  if (msg.type === 'assistant') {
    for (const block of msg.message.content) {
      if (block.type === 'tool_use') {
        const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
        console.log(`  [${elapsed}m] ${block.name}`);
      }
    }
  }
  if (msg.type === 'result') {
    console.log(`\n${msg.subtype === 'success' ? '✓' : '✗'} Mini pipeline ${msg.subtype}`);
    console.log(`  Cost: $${msg.total_cost_usd?.toFixed(2)}`);
    console.log(`  Turns: ${msg.num_turns}`);
    console.log(`  Duration: ${((msg.duration_ms ?? 0) / 1000 / 60).toFixed(1)} min`);

    // Verify expected output files
    const expectedFiles = [
      files.correctionsParsed,
      files.stateLawFindings,
      files.correctionsCategorized,
      files.contractorQuestions,
    ];
    for (const f of expectedFiles) {
      const exists = fs.existsSync(f);
      console.log(`  ${exists ? '✓' : '✗'} ${path.basename(f)}`);
    }
  }
}
```

**The Buena Park Shortcut explained:**
- `adu-city-research` skill does live WebSearch + WebFetch + optional browser automation = 5-10 min
- `buena-park-adu` skill is an offline reference (like california-adu) = ~30 sec
- By removing WebSearch/WebFetch from `allowedTools`, we force the agent to use offline skills
- The corrections still get categorized and questions generated — just with offline city data
- When we're ready for full testing, add WebSearch/WebFetch back and let adu-city-research run

---

### L3b: Skill 2 Isolation Test (~2-3 min, ~$2-3)

**What it tests:** Response generation from pre-made artifacts. No dependency on Skill 1.

```typescript
// tests/test-l3b-skill2-only.ts
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createQueryOptions, createSession, getSessionFiles } from '../utils/config.js';
import path from 'path';
import fs from 'fs';

const sessionDir = createSession();
const PROJECT_ROOT = path.resolve(import.meta.dirname, '../..');
const files = getSessionFiles(sessionDir);

// Copy pre-made test fixtures into session directory
const mockDir = path.resolve(PROJECT_ROOT, 'test-assets/mock-session');
const fixtures = [
  'corrections_parsed.json',
  'corrections_categorized.json',
  'sheet-manifest.json',
  'contractor_answers.json',
  'state_law_findings.json',
];
for (const fixture of fixtures) {
  const src = path.join(mockDir, fixture);
  const dest = path.join(sessionDir, fixture);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  Copied ${fixture}`);
  } else {
    console.log(`  ✗ Missing fixture: ${fixture}`);
  }
}

const prompt = `
You have a session directory with completed corrections analysis and contractor answers.

SESSION DIRECTORY: ${sessionDir}

Use the adu-corrections-complete skill to generate the response package:
- response_letter.md
- professional_scope.md
- corrections_report.md
- sheet_annotations.json

Write ALL output files to: ${sessionDir}
`;

const q = query({
  prompt,
  options: {
    ...createQueryOptions({ model: 'claude-opus-4-6' }),
    maxTurns: 30,
    maxBudgetUsd: 6.00,
    allowedTools: ['Skill', 'Read', 'Write', 'Edit', 'Glob', 'Grep'],
  }
});

for await (const msg of q) {
  if (msg.type === 'result') {
    console.log(`\n${msg.subtype === 'success' ? '✓' : '✗'} Skill 2 ${msg.subtype}`);
    console.log(`  Cost: $${msg.total_cost_usd?.toFixed(2)}`);

    const deliverables = [
      files.responseLetter,
      files.professionalScope,
      files.correctionsReport,
      files.sheetAnnotations,
    ];
    for (const f of deliverables) {
      const exists = fs.existsSync(f);
      const size = exists ? fs.statSync(f).size : 0;
      console.log(`  ${exists ? '✓' : '✗'} ${path.basename(f)} (${size} bytes)`);
    }
  }
}
```

**Why this test is gold:**
- Skill 2 runs cold from files only — perfect for isolation testing
- No dependency on Skill 1 completing successfully
- Can iterate on response quality without re-running the expensive analysis
- Pre-made fixtures mean instant setup

---

### L4: Full Pipeline (~15-20 min, ~$10-15)

**What it tests:** Real data, real city search, all phases, end-to-end.

This is the acceptance test. Run sparingly — once Skill 1 and Skill 2 work individually.

Uses `test-full-flow.ts` from the main plan doc. Same as what's described in `plan-contractors-agents-sdk.md` Step 6, but with:
- Real Placentia corrections letter + plan binder
- Live city web search (adu-city-research skill)
- Full budget ($15 for Skill 1, $8 for Skill 2)
- All tools enabled

**Run only after L0-L3b all pass.**

---

## Phase Checkpointing Strategy

The corrections pipeline writes JSON files after each phase. We can exploit this for faster testing:

### Skip Map

| Phase | Output File | If it exists, skip to... |
|-------|------------|--------------------------|
| Phase 1 | `corrections_parsed.json` | Phase 2 |
| Phase 2 | `sheet-manifest.json` | Phase 3 |
| Phase 3A | `state_law_findings.json` | Phase 3B |
| Phase 3B | `city_discovery.json` | Phase 3C |
| Phase 3C | `sheet_observations.json` | Phase 3.5 |
| Phase 3.5 | `city_research_findings.json` | Phase 4 |
| Phase 4 | `corrections_categorized.json` + `contractor_questions.json` | Done (Skill 1) |

### How to Use Checkpoints

1. Run L4 once. It writes files as it goes.
2. If it fails at Phase 3.5, the session dir has Phase 1-3C outputs.
3. Next run: copy those outputs into a new session dir, tell the prompt to skip completed phases.
4. Or: pre-populate from `test-assets/mock-session/` and test only the phase you're working on.

### Prompt Pattern for Checkpoint Resume

```
SESSION DIRECTORY: ${sessionDir}

The following phases are ALREADY COMPLETE (files exist, do not redo):
- Phase 1: corrections_parsed.json ✓
- Phase 2: sheet-manifest.json ✓
- Phase 3A: state_law_findings.json ✓

Resume from Phase 3B. Use the adu-corrections-flow skill starting from city discovery.
```

---

## Shared Base Config

All tests and flows import from one config factory. Change the model once, it changes everywhere.

```typescript
// src/utils/config.ts
import path from 'path';
import fs from 'fs';
import type { Options } from '@anthropic-ai/claude-agent-sdk';

export const AGENTS_ROOT = path.resolve(import.meta.dirname, '../..');  // agents-crossbeam/
export const PROJECT_ROOT = path.resolve(AGENTS_ROOT, '..');            // CC-Crossbeam/

const CROSSBEAM_PROMPT = `You are CrossBeam, an AI ADU permit assistant for California.
You help contractors respond to city corrections letters for ADU (Accessory Dwelling Unit) permits.
Use available skills to research codes, analyze plans, and generate professional responses.
Always write output files to the session directory provided in the prompt.`;

const DEFAULT_TOOLS = [
  'Skill', 'Task', 'Read', 'Write', 'Edit',
  'Bash', 'Glob', 'Grep', 'WebSearch', 'WebFetch',
];

export type FlowConfig = {
  model?: string;                // Default: claude-opus-4-6
  maxTurns?: number;             // Default: 80
  maxBudgetUsd?: number;         // Default: 15.00
  allowedTools?: string[];       // Default: all tools
  systemPromptAppend?: string;   // Appended to base prompt
  abortController?: AbortController;
};

export function createQueryOptions(flow: FlowConfig = {}): Options {
  return {
    tools: { type: 'preset', preset: 'claude_code' },
    systemPrompt: {
      type: 'preset',
      preset: 'claude_code',
      append: flow.systemPromptAppend
        ? `${CROSSBEAM_PROMPT}\n\n${flow.systemPromptAppend}`
        : CROSSBEAM_PROMPT,
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

// --- Session Management ---

export function createSession(prefix: string = 'session'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const sessionDir = path.join(AGENTS_ROOT, 'sessions', `${prefix}-${timestamp}`);
  fs.mkdirSync(sessionDir, { recursive: true });
  return sessionDir;
}

export function getSessionFiles(sessionDir: string) {
  return {
    // Phase 1-4 outputs (Skill 1)
    correctionsParsed: path.join(sessionDir, 'corrections_parsed.json'),
    sheetManifest: path.join(sessionDir, 'sheet-manifest.json'),
    stateLawFindings: path.join(sessionDir, 'state_law_findings.json'),
    cityDiscovery: path.join(sessionDir, 'city_discovery.json'),
    cityResearchFindings: path.join(sessionDir, 'city_research_findings.json'),
    sheetObservations: path.join(sessionDir, 'sheet_observations.json'),
    correctionsCategorized: path.join(sessionDir, 'corrections_categorized.json'),
    contractorQuestions: path.join(sessionDir, 'contractor_questions.json'),
    contractorAnswers: path.join(sessionDir, 'contractor_answers.json'),
    // Phase 5 outputs (Skill 2)
    responseLetter: path.join(sessionDir, 'response_letter.md'),
    professionalScope: path.join(sessionDir, 'professional_scope.md'),
    correctionsReport: path.join(sessionDir, 'corrections_report.md'),
    sheetAnnotations: path.join(sessionDir, 'sheet_annotations.json'),
  };
}
```

### Why This Matters

| Change | Edit in... | Affects... |
|--------|-----------|------------|
| Switch model | `config.ts` (one line) | All flows + all tests |
| Raise budget | `config.ts` (one line) | All flows |
| Add a tool | `config.ts` DEFAULT_TOOLS | All flows |
| New flow (city perspective) | New file in `flows/` | Nothing else |

---

## What Breaks First — Ordered Checklist

From experience building Agent SDK projects, here's the failure order:

| # | Failure | Symptom | Fix | Test Level |
|---|---------|---------|-----|-----------|
| 1 | Missing API key | Auth error on first call | Add `ANTHROPIC_API_KEY` to `.env` | L0 |
| 2 | Skills not discovered | Agent says "I don't have any skills" | Check `settingSources: ['project']`, `cwd`, symlinks | L0 |
| 3 | Agent hallucinates tools | Says "I'll write the file" but nothing appears | Need `tools: { type: 'preset', preset: 'claude_code' }` | L0 |
| 4 | Permission prompts block | Agent hangs waiting for approval | `permissionMode: 'bypassPermissions'` + `allowDangerouslySkipPermissions: true` | L0 |
| 5 | Skill invocation fails | Agent can't use Skill tool | Check `allowedTools` includes `'Skill'` | L1 |
| 6 | Reference files not found | Skill runs but gives wrong answers | Symlinks broken or reference files missing | L1 |
| 7 | File written to wrong dir | Outputs at cwd instead of session dir | Strengthen prompt instructions | L1 |
| 8 | Script path wrong | `extract-pages.sh: not found` | Symlink resolution issue — use absolute path | L2 |
| 9 | Subagents can't find skills | Parent works, subagents fail on Skill tool | May need `agents` config with inline prompts | L2 |
| 10 | Parent reads too many images | API 2000px limit hit | Single-page subagents (already in skill design) | L3 |
| 11 | Budget exceeded mid-run | `error_max_budget_usd` at turn 60 | Raise budget or use Sonnet for subagents | L3/L4 |
| 12 | Web search times out | City research hangs | Use Buena Park shortcut for testing | L4 only |

---

## Cost Estimation Per Level

| Level | Model | Est. Turns | Est. Cost | When to Run |
|-------|-------|-----------|-----------|-------------|
| L0 | Haiku | 3 | $0.01 | Every config change |
| L1 | Haiku/Sonnet | 10-15 | $0.20-0.50 | After L0 passes |
| L2 | Sonnet | 15-20 | $0.50-1.00 | After L1 passes |
| L3 | Opus | 30-50 | $3-5 | After L2 passes |
| L3b | Opus | 20-30 | $2-3 | After L1 passes (independent of L2/L3) |
| L4 | Opus | 60-80 | $10-15 | Acceptance test only |

**Cost-saving rule:** Use Haiku/Sonnet for L0-L2. The wiring is what we're testing, not output quality. Switch to Opus for L3+ where skill behavior matters.

---

## Test Run Management

### Session Directory Naming

```
agents-crossbeam/sessions/
├── l0-smoke-2026-02-12T14-30-00/          ← Auto-named with level prefix
├── l1-skill-2026-02-12T14-32-00/
├── l3-mini-2026-02-12T15-00-00/
├── l3b-skill2-2026-02-12T15-10-00/
├── l4-full-2026-02-12T16-00-00/
└── ...
```

Use the `prefix` param in `createSession()` to tag by level:
```typescript
const sessionDir = createSession('l3-mini');
```

### Cleanup

`sessions/` should be gitignored. To clean up between test rounds:
```bash
rm -rf agents-crossbeam/sessions/l0-*  # Clear smoke test runs
rm -rf agents-crossbeam/sessions/l1-*  # Clear skill test runs
```

Keep L3/L4 sessions — their output files become future mock-session fixtures.

---

## Execution Order

### Day 3 (Wed Feb 12) — SDK Wiring

| Order | Task | Time | Depends On |
|-------|------|------|-----------|
| 1 | Set up `agents-crossbeam/` directory + symlinks | 10 min | Nothing |
| 2 | Install Agent SDK, create config.ts | 10 min | Step 1 |
| 3 | Write L0 smoke test | 10 min | Step 2 |
| 4 | **Run L0** — fix until it passes | 15-30 min | Step 3 |
| 5 | Write L1 skill invoke test | 10 min | Step 4 |
| 6 | **Run L1** — fix until it passes | 15-30 min | Step 5 |

### Day 4 (Thu Feb 13) — Pipeline Testing

| Order | Task | Time | Depends On |
|-------|------|------|-----------|
| 7 | Write L2 subagent test | 15 min | L1 passes |
| 8 | **Run L2** — fix until it passes | 20-30 min | Step 7 |
| 9 | Create mini test data (crop corrections, extract page) | 15 min | Nothing |
| 10 | Write L3 mini pipeline test | 20 min | Step 8 + 9 |
| 11 | **Run L3** — fix until it passes | 30-60 min | Step 10 |
| 12 | Create mock-session fixtures from L3 output | 10 min | Step 11 |
| 13 | Write L3b Skill 2 isolation test | 15 min | Step 12 |
| 14 | **Run L3b** — iterate on response quality | 30-60 min | Step 13 |

### Day 5 (Fri Feb 14) — Full Pipeline + Frontend

| Order | Task | Time | Depends On |
|-------|------|------|-----------|
| 15 | **Run L4** — full pipeline acceptance test | 20 min (mostly waiting) | L3 + L3b pass |
| 16 | Wire to Next.js API routes | 2-3 hours | L4 passes |

---

## Notes

- **Always check `msg.subtype`** — `'success'` vs `'error_max_turns'` vs `'error_max_budget_usd'`
- **Capture `session_id`** from the system message — needed if you want to resume a failed run
- **The agent's `result` field** contains the final text response, but the real outputs are the files it wrote to the session directory
- **If a test hangs:** Check if the agent is waiting for permission (shouldn't happen with bypassPermissions, but verify in L0)
- **Pre-extracted PNGs save 2+ minutes** per test — always pre-extract when possible
- **Mock session data is the #1 time saver** — invest 10 min creating fixtures, save hours on Skill 2 iteration
