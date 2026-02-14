# Testing Strategy — City Plan Review Pipeline (Agent SDK)

## Why This Doc Exists

Full city plan review pipeline = 10-15 min per test. PDF extraction, 5 review subagents, 2 compliance subagents, merge, PDF generation — that's a lot to debug all at once. We need to iterate in seconds, not quarter-hours.

This doc defines a layered testing approach for the city flow, adapted from the proven contractor flow testing strategy (`testing-agents-sdk.md`). Same ladder concept, different skill and output files.

**Reference:**
- `plan-city-agents-sdk.md` — City flow architecture
- `testing-agents-sdk.md` — Contractor flow testing (the pattern we're adapting)
- `learnings-contractors-agents-sdk.md` — What worked and what broke

---

## Test Data Inventory

### What We Already Have

| Location | Contents | Use For |
|----------|----------|---------|
| `test-assets/corrections/Binder-1232-N-Jefferson.pdf` | Placentia plan binder (15 pages) | L2c extraction, L4c full pipeline |
| `test-assets/corrections/DRAFT-CORRECTIONS-1232-N-Jefferson.md` | CLI-generated draft corrections (23 items) | L3d Phase 5 input, L4c validation baseline |
| `test-assets/city-flow/test-01-analysis.md` | CLI test analysis (70% accuracy scorecard) | L4c comparison |
| `adu-skill-development/skill/placentia-adu/` | Onboarded city skill (12 reference files) | Tier 3 offline city testing |
| `adu-skill-development/skill/buena-park-adu/` | Onboarded city skill (partial) | Offline city shortcut |
| `adu-skill-development/skill/adu-plan-review/references/checklist-cover.md` | Cover sheet review checklist (450 lines) | L3c administrative review |

### Pre-Extracted Fixtures — READY

**DONE (2026-02-12).** The following fixtures are pre-populated and ready for L3c shortcuts:

| Asset | Status | Source |
|-------|--------|--------|
| `test-assets/city-flow/mock-session/sheet-manifest.json` | **READY** | Copied from contractor L4 session |
| `test-assets/city-flow/mock-session/pages-png/` (15 PNGs) | **READY** | Copied from `test-assets/04-extract-test/` |
| `test-assets/corrections/DRAFT-CORRECTIONS-1232-N-Jefferson.md` | **EXISTS** | CLI-generated draft (use for L3d Phase 5 input) |

Sheet manifest has 15 sheets: CS, AIA.1, AIA.2, A1, A1.1, A2, A3, SN1, SN2, S1, S2, S3, T-1, T-2, T-3.

**Additional pre-extracted sources (backup):**
| Location | Pages | Project |
|----------|-------|---------|
| `test-assets/04-extract-test/pages-png/` | 15 PNGs | 1232 N Jefferson, Placentia (same project) |
| `test-assets/05-extract-test/pages-png/` | 26 PNGs | 326 Flint Ave, Long Beach (different city) |
| `agents-crossbeam/sessions/l4-*/pages-png/` | 15 PNGs + title blocks | 1232 N Jefferson (from contractor L4) |

### What Still Needs to Be Created (After First Runs)

| Asset | Purpose | How to Create |
|-------|---------|---------------|
| `test-assets/city-flow/mock-session/sheet_findings.json` | Review findings fixture for L3d/L4c isolation | Copy from first successful L3c run |
| `test-assets/city-flow/mock-session/draft_corrections.json` | Structured corrections data | Copy from first successful L3c/L4c run |

These will be populated after the first L3c run succeeds — they're downstream fixtures, not blockers.

---

## Session Files — City Flow

Different from the contractor flow. **DONE** — `getReviewSessionFiles()` added to `session.ts` (2026-02-12).

```typescript
export function getReviewSessionFiles(sessionDir: string) {
  return {
    // Phase 1: Extract & Map
    sheetManifest: path.join(sessionDir, 'sheet-manifest.json'),
    // Phase 2: Sheet-by-Sheet Review
    sheetFindings: path.join(sessionDir, 'sheet_findings.json'),
    // Phase 3: Code Compliance
    stateCompliance: path.join(sessionDir, 'state_compliance.json'),
    cityCompliance: path.join(sessionDir, 'city_compliance.json'),
    // Phase 4: Draft Corrections Letter
    draftCorrectionsJson: path.join(sessionDir, 'draft_corrections.json'),
    draftCorrectionsMd: path.join(sessionDir, 'draft_corrections.md'),
    reviewSummary: path.join(sessionDir, 'review_summary.json'),
    // Phase 5: PDF Generation
    correctionsLetterPdf: path.join(sessionDir, 'corrections_letter.pdf'),
    qaScreenshot: path.join(sessionDir, 'qa_screenshot.png'),
  };
}
```

### Phase Detection — City Flow — DONE

**Added to `verify.ts`** (2026-02-12): `detectReviewPhases()`, `findFileByPattern()`, and `REVIEW_FILE_PATTERNS` constant.

See `agents-crossbeam/src/utils/verify.ts` for implementation.

---

## Testing Levels

### L0c: Smoke Test — SDK Init + City Skill Discovery (~30 sec, ~$0.01)

**What it tests:** Do the 3 new skills (adu-plan-review, placentia-adu, adu-corrections-pdf) show up alongside the existing 6?

```typescript
// tests/test-l0c-smoke-city.ts
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createQueryOptions } from '../utils/config.ts';

console.log('=== L0c: City Skill Discovery ===\n');

const q = query({
  prompt: `List all available skills you can see.
Specifically confirm you can see these 3 skills:
1. adu-plan-review
2. placentia-adu
3. adu-corrections-pdf

Then say SMOKE_CITY_OK.`,
  options: {
    ...createQueryOptions({ model: 'claude-haiku-4-5-20251001' }),
    maxTurns: 3,
    maxBudgetUsd: 0.10,
  }
});

for await (const msg of q) {
  if (msg.type === 'system') {
    console.log('✓ SDK initialized');
    console.log('  Model:', msg.model);
    const hasSkill = msg.tools?.includes('Skill');
    console.log(hasSkill ? '  ✓ Skill tool available' : '  ✗ Skill tool MISSING');
  }
  if (msg.type === 'result') {
    const text = msg.result ?? '';
    const hasPlanReview = text.includes('adu-plan-review');
    const hasPlacentia = text.includes('placentia-adu');
    const hasPdf = text.includes('adu-corrections-pdf');

    console.log(hasPlanReview ? '  ✓ adu-plan-review found' : '  ✗ adu-plan-review MISSING');
    console.log(hasPlacentia ? '  ✓ placentia-adu found' : '  ✗ placentia-adu MISSING');
    console.log(hasPdf ? '  ✓ adu-corrections-pdf found' : '  ✗ adu-corrections-pdf MISSING');
    console.log(`  Cost: $${msg.total_cost_usd?.toFixed(4)}`);
    console.log(`  ${msg.subtype === 'success' ? '✓' : '✗'} ${msg.subtype}`);
  }
}
```

**What this catches:**
- Symlinks not created or broken
- `settingSources` not loading the new skills
- Wrong `cwd` — skills directory not found

**Pass criteria:** Agent lists all 9 skills (6 existing + 3 new) and says SMOKE_CITY_OK.

---

### L1c: Skill Read + Checklist Access + Subagent File Access (~1-2 min, ~$0.50)

**What it tests:** Can the agent read the adu-plan-review skill AND access its checklist reference files? **CRITICAL: Also tests whether a Task subagent can read checklist files** — this is the #1 risk for Phase 2 review subagents.

```typescript
// tests/test-l1c-skill-read.ts
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createQueryOptions, PROJECT_ROOT } from '../utils/config.ts';
import { createSession } from '../utils/session.ts';
import fs from 'fs';
import path from 'path';

const sessionDir = createSession('l1c');
const checklistPath = `${PROJECT_ROOT}/adu-skill-development/skill/adu-plan-review/references/checklist-cover.md`;

console.log('=== L1c: Skill Read + Checklist Access + Subagent File Access ===\n');
console.log(`Session: ${sessionDir}\n`);

const q = query({
  prompt: `Do FOUR things:

1. Read the adu-plan-review skill and tell me how many phases it has.
2. Read the checklist reference file at:
   ${checklistPath}
   Count how many check categories exist (e.g., "1. Architect/Engineer Stamps").
3. Read the placentia-adu skill and list the reference files it contains.
4. **CRITICAL TEST:** Spawn a Task subagent. The subagent must:
   a. Read the file at: ${checklistPath}
   b. Count the number of categories
   c. Write its count to: ${sessionDir}/subagent-check.json
   Format: { "categories_found": number, "first_category": "string" }
   The subagent should have access to Read and Write tools.

Write YOUR findings (steps 1-3) as JSON to: ${sessionDir}/skill-check.json

Format:
{
  "plan_review_phases": number,
  "checklist_categories": number,
  "placentia_reference_files": string[]
}

Wait for the subagent to complete before finishing.`,
  options: {
    ...createQueryOptions({ model: 'claude-haiku-4-5-20251001' }),
    maxTurns: 20,
    maxBudgetUsd: 1.00,
  }
});

for await (const msg of q) {
  if (msg.type === 'assistant') {
    for (const block of msg.message.content) {
      if (block.type === 'tool_use') {
        console.log(`  [Tool] ${block.name}${block.name === 'Task' ? ' (subagent spawn)' : ''}`);
      }
    }
  }
  if (msg.type === 'result') {
    // 2-second delay for file flush
    await new Promise(r => setTimeout(r, 2000));

    const filePath = path.join(sessionDir, 'skill-check.json');
    const fileExists = fs.existsSync(filePath);
    console.log(fileExists ? '\n✓ skill-check.json written' : '\n✗ skill-check.json NOT written');

    if (fileExists) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      console.log(`  Plan review phases: ${data.plan_review_phases} (expected: 5)`);
      console.log(`  Checklist categories: ${data.checklist_categories} (expected: 7)`);
      console.log(`  Placentia references: ${data.placentia_reference_files?.length} files (expected: 12)`);

      const phasesOk = data.plan_review_phases === 5;
      const checklistOk = data.checklist_categories >= 6; // flexible on exact count
      const placentiaOk = data.placentia_reference_files?.length >= 10;

      console.log(`\n${phasesOk && checklistOk && placentiaOk ? '✓' : '✗'} Main agent checks ${phasesOk && checklistOk && placentiaOk ? 'PASSED' : 'FAILED'}`);
    }

    // CRITICAL: Check subagent file access
    const subagentPath = path.join(sessionDir, 'subagent-check.json');
    const subagentExists = fs.existsSync(subagentPath);
    console.log(`\n${subagentExists ? '✓' : '✗'} subagent-check.json ${subagentExists ? 'written' : 'NOT written — SUBAGENT FILE ACCESS FAILED'}`);

    if (subagentExists) {
      const subData = JSON.parse(fs.readFileSync(subagentPath, 'utf-8'));
      console.log(`  Subagent found ${subData.categories_found} categories`);
      console.log(`  First category: ${subData.first_category}`);
      console.log('\n✓ SUBAGENT CAN READ CHECKLIST FILES — Phase 2 approach confirmed');
    } else {
      console.log('\n✗ SUBAGENT CANNOT READ CHECKLIST FILES');
      console.log('  → Fallback: Inline checklist content in subagent prompts');
      console.log('  → This adds ~450 lines per subagent prompt but guarantees access');
    }

    console.log(`\n  Cost: $${msg.total_cost_usd?.toFixed(4)}`);
  }
}
```

**What this catches:**
- Skill tool not invoking properly
- Reference files inside skill directories not accessible
- **Subagent file access through symlinked paths** — the critical unknown
- Path resolution issues with symlinked skills
- `additionalDirectories` inheritance by subagents

**Pass criteria:**
1. `skill-check.json` exists with correct counts — 5 phases, ~7 checklist categories, ~12 Placentia reference files
2. **`subagent-check.json` exists** — proves Task subagents can read checklist files via absolute path
3. If #2 fails, Phase 2 must use inlined checklist content in subagent prompts (Option B fallback)

---

### L2c: Phase 1 — PDF Extraction + Sheet Manifest (~2-3 min, ~$1.50)

**What it tests:** Can the agent extract pages from the plan binder PDF and build a correct sheet manifest? This is the same extraction that the contractor flow uses (via `adu-targeted-page-viewer`), so it should work. But we need to validate the manifest for the Placentia binder specifically.

```typescript
// tests/test-l2c-extraction.ts
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createQueryOptions, PROJECT_ROOT } from '../utils/config.ts';
import { createSession } from '../utils/session.ts';
import fs from 'fs';
import path from 'path';

const sessionDir = createSession('l2c');
const binderPath = path.join(PROJECT_ROOT, 'test-assets/corrections/Binder-1232-N-Jefferson.pdf');

console.log('=== L2c: PDF Extraction + Sheet Manifest ===\n');
console.log(`Session: ${sessionDir}`);
console.log(`Binder: ${binderPath}\n`);

const q = query({
  prompt: `Extract pages from this PDF and build a sheet manifest.

PLAN BINDER PDF: ${binderPath}
OUTPUT DIRECTORY: ${sessionDir}

Steps:
1. Use Bash to run: pdftoppm -png "${binderPath}" "${sessionDir}/pages-png/page"
   (Create the pages-png directory first)
2. Read the cover sheet (page 1) to find the sheet index
3. Read title blocks on other pages to identify sheet IDs
4. Write sheet-manifest.json to: ${sessionDir}/sheet-manifest.json

The manifest should map each sheet ID to its page number and PNG file path.
Format: { "total_pages": number, "sheets": [{ "sheet_id": "A1", "page_number": 1, "file": "path", "description": "..." }] }`,
  options: {
    ...createQueryOptions({ model: 'claude-sonnet-4-5-20250929' }),
    maxTurns: 25,
    maxBudgetUsd: 3.00,
  }
});

const startTime = Date.now();

for await (const msg of q) {
  if (msg.type === 'assistant') {
    for (const block of msg.message.content) {
      if (block.type === 'tool_use') {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
        console.log(`  [${elapsed}s] ${block.name}`);
      }
    }
  }
  if (msg.type === 'result') {
    const manifestPath = path.join(sessionDir, 'sheet-manifest.json');
    const manifestExists = fs.existsSync(manifestPath);
    const pngDir = path.join(sessionDir, 'pages-png');
    const pngsExist = fs.existsSync(pngDir);

    console.log(`\n${manifestExists ? '✓' : '✗'} sheet-manifest.json ${manifestExists ? 'written' : 'MISSING'}`);
    console.log(`${pngsExist ? '✓' : '✗'} pages-png/ directory ${pngsExist ? 'exists' : 'MISSING'}`);

    if (pngsExist) {
      const pngCount = fs.readdirSync(pngDir).filter(f => f.endsWith('.png')).length;
      console.log(`  PNG count: ${pngCount} (expected: 15 for Placentia binder)`);
    }

    if (manifestExists) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      console.log(`  Total pages: ${manifest.total_pages}`);
      console.log(`  Indexed sheets: ${manifest.sheets?.length}`);
      // Spot-check: the Placentia binder should have CS, A1, A2, S1, T-1, etc.
      const sheetIds = manifest.sheets?.map((s: any) => s.sheet_id);
      console.log(`  Sheet IDs: ${sheetIds?.join(', ')}`);
    }

    console.log(`\n  Cost: $${msg.total_cost_usd?.toFixed(2)}`);
    console.log(`  Duration: ${((Date.now() - startTime) / 1000).toFixed(0)}s`);
    console.log(`  ${msg.subtype === 'success' ? '✓' : '✗'} ${msg.subtype}`);
  }
}
```

**What this catches:**
- `pdftoppm` not installed (`brew install poppler`)
- Bash tool not working for extraction scripts
- Image reading from extracted PNGs
- Sheet manifest structure issues
- Path resolution for PNGs written to session directory

**Pass criteria:** 15 PNGs extracted, `sheet-manifest.json` has correct sheet count and reasonable sheet IDs.

**Bonus:** Save the manifest as `test-assets/city-flow/mock-session/sheet-manifest.json` for L3c shortcut.

---

### L3c: Administrative Review — Cover Sheet Only (~4-6 min, ~$5-8)

**What it tests:** The core review loop — can the agent review the cover sheet against `checklist-cover.md`, verify findings against state + city code, and produce a draft corrections letter? This uses `administrative` scope to limit to the cover sheet only.

Uses the **L3c shortcut:** Pre-populated fixtures are **READY** at `test-assets/city-flow/mock-session/` (15 PNGs + sheet-manifest.json). Skips Phase 1 extraction (~90 sec saved per test).

```typescript
// tests/test-l3c-admin-review.ts
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createQueryOptions, PROJECT_ROOT } from '../utils/config.ts';
import { createSession } from '../utils/session.ts';
import fs from 'fs';
import path from 'path';

const sessionDir = createSession('l3c');
const binderPath = path.join(PROJECT_ROOT, 'test-assets/corrections/Binder-1232-N-Jefferson.pdf');

console.log('=== L3c: Administrative Review (Cover Sheet Only) ===\n');
console.log(`Session: ${sessionDir}\n`);

// L3c SHORTCUT: Pre-populate sheet manifest from previous L2c run or contractor L4 session
const mockManifestSource = path.join(PROJECT_ROOT, 'test-assets/city-flow/mock-session/sheet-manifest.json');
if (fs.existsSync(mockManifestSource)) {
  fs.copyFileSync(mockManifestSource, path.join(sessionDir, 'sheet-manifest.json'));
  console.log('  ✓ Pre-populated sheet-manifest.json (skipping Phase 1)\n');
}

// Also copy over the extracted PNGs if available
const mockPngDir = path.join(PROJECT_ROOT, 'test-assets/city-flow/mock-session/pages-png');
if (fs.existsSync(mockPngDir)) {
  const destPngDir = path.join(sessionDir, 'pages-png');
  fs.mkdirSync(destPngDir, { recursive: true });
  for (const file of fs.readdirSync(mockPngDir)) {
    fs.copyFileSync(path.join(mockPngDir, file), path.join(destPngDir, file));
  }
  console.log(`  ✓ Pre-populated ${fs.readdirSync(mockPngDir).length} PNGs\n`);
}

const prePopulated = fs.existsSync(path.join(sessionDir, 'sheet-manifest.json'));

const prompt = `Review this ADU plan binder from the city's perspective.
Use the adu-plan-review skill with ADMINISTRATIVE scope (cover sheet checks only).

PLAN BINDER PDF: ${binderPath}
CITY: Placentia
PROJECT ADDRESS: 1232 N. Jefferson St., Unit 'A', Placentia, CA 92870
SESSION DIRECTORY: ${sessionDir}

${prePopulated ? `IMPORTANT: The sheet manifest is ALREADY built at ${sessionDir}/sheet-manifest.json.
Extracted PNGs are in ${sessionDir}/pages-png/. Skip Phase 1 — go directly to Phase 2.` : ''}

Scope: ADMINISTRATIVE — only review the cover sheet and title sheet against checklist-cover.md.
Do NOT review floor plans, elevations, structural, MEP, or other sheets.

YOU MUST COMPLETE ALL PHASES — do NOT stop after Phase 2.
Write ALL of these files to ${sessionDir}:
- sheet_findings.json (Phase 2 — cover sheet findings only)
- state_compliance.json (Phase 3A — verify findings against state law)
- city_compliance.json (Phase 3B — verify findings against Placentia rules)
- draft_corrections.json (Phase 4 — filtered corrections with code citations)
- draft_corrections.md (Phase 4 — formatted corrections letter)
- review_summary.json (Phase 4 — stats and reviewer action items)

The job is NOT done until all 6 files exist.`;

const q = query({
  prompt,
  options: {
    ...createQueryOptions({ model: 'claude-opus-4-6' }),
    maxTurns: 60,
    maxBudgetUsd: 10.00,
    // Remove web tools — Placentia is onboarded (Tier 3, offline)
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
    // 2-second delay for file flush (from learnings doc)
    await new Promise(r => setTimeout(r, 2000));

    console.log(`\n${msg.subtype === 'success' ? '✓' : '✗'} L3c ${msg.subtype}`);
    console.log(`  Cost: $${msg.total_cost_usd?.toFixed(2)}`);
    console.log(`  Turns: ${msg.num_turns}`);
    console.log(`  Duration: ${((Date.now() - startTime) / 1000 / 60).toFixed(1)} min`);

    // Verify output files
    const expectedFiles = [
      'sheet_findings.json',
      'state_compliance.json',
      'draft_corrections.json',
      'draft_corrections.md',
      'review_summary.json',
    ];
    // city_compliance.json is optional for Tier 3 cities (may merge into state_compliance)
    const optionalFiles = ['city_compliance.json'];

    for (const f of expectedFiles) {
      const fp = path.join(sessionDir, f);
      const exists = fs.existsSync(fp);
      const size = exists ? fs.statSync(fp).size : 0;
      console.log(`  ${exists ? '✓' : '✗'} ${f} (${size} bytes)`);
    }
    for (const f of optionalFiles) {
      const fp = path.join(sessionDir, f);
      const exists = fs.existsSync(fp);
      if (exists) console.log(`  ✓ ${f} (${fs.statSync(fp).size} bytes) [optional]`);
    }

    // Read draft corrections and show item count
    const draftPath = path.join(sessionDir, 'draft_corrections.md');
    if (fs.existsSync(draftPath)) {
      const draft = fs.readFileSync(draftPath, 'utf-8');
      const lines = draft.split('\n').length;
      console.log(`\n  Draft corrections: ${lines} lines`);
    }

    const summaryPath = path.join(sessionDir, 'review_summary.json');
    if (fs.existsSync(summaryPath)) {
      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
      console.log(`  Total findings: ${summary.total_findings ?? 'N/A'}`);
      console.log(`  HIGH confidence: ${summary.high_confidence ?? 'N/A'}`);
      console.log(`  VERIFY needed: ${summary.verify_needed ?? 'N/A'}`);
      console.log(`  REVIEWER blanks: ${summary.reviewer_blanks ?? 'N/A'}`);
    }
  }
}
```

**The L3c shortcut explained:**
- Pre-populate `sheet-manifest.json` + extracted PNGs from a previous L2c run
- Skip Phase 1 (extraction) — saves ~90 sec per test
- Remove WebSearch/WebFetch from allowedTools — Placentia is Tier 3 (offline)
- Focus the test on Phase 2-4: review → compliance → corrections letter

**What this catches:**
- Checklist reference file loading in review subagent
- State law verification against california-adu skill
- City rules verification against placentia-adu skill
- Phase 4 merge + filter logic
- The `[VERIFY]` and `[REVIEWER]` flag system
- Correct code citations in corrections

**Pass criteria:**
- All 5-6 required files exist with non-trivial size (>500 bytes each)
- `draft_corrections.md` contains numbered corrections with code citations
- No false positives — every correction has a code basis
- Cover sheet items caught: stamps/signatures, governing codes, sheet index, project data

---

### L3d: Phase 5 Isolation — PDF Generation (~2-3 min, ~$2-3)

**What it tests:** Can the agent take a pre-made `draft_corrections.md` and produce a professional PDF via the `adu-corrections-pdf` skill? This is isolated from the review pipeline — we feed it a known-good markdown file.

```typescript
// tests/test-l3d-pdf-generation.ts
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createQueryOptions, PROJECT_ROOT } from '../utils/config.ts';
import { createSession } from '../utils/session.ts';
import fs from 'fs';
import path from 'path';

const sessionDir = createSession('l3d');

console.log('=== L3d: Phase 5 — PDF Generation ===\n');
console.log(`Session: ${sessionDir}\n`);

// Use existing CLI-generated draft as input
const draftSource = path.join(PROJECT_ROOT, 'test-assets/corrections/DRAFT-CORRECTIONS-1232-N-Jefferson.md');
const draftDest = path.join(sessionDir, 'draft_corrections.md');
fs.copyFileSync(draftSource, draftDest);
console.log('  ✓ Copied draft_corrections.md from CLI test output\n');

const prompt = `You have a draft corrections letter in markdown format.

DRAFT CORRECTIONS: ${draftDest}
CITY: Placentia
PROJECT ADDRESS: 1232 N. Jefferson St., Unit 'A', Placentia, CA 92870
OUTPUT PDF: ${sessionDir}/corrections_letter.pdf
QA SCREENSHOT: ${sessionDir}/qa_screenshot.png

Use the adu-corrections-pdf skill to generate a professional PDF from this markdown.

Project info for the header:
- Applicant/Owner: Kiet Le
- Designer: Ideal Designs, Inc. (Oscar Sanchez)
- Plan Date: 06/19/2025
- Review Date: 2026-02-12 (AI-assisted draft)
- Scope: New detached 600 SF one-story ADU

After generating the PDF:
1. Create a QA screenshot of page 1
2. Review the screenshot yourself
3. If it looks good, write a qa_result.json with { "status": "pass", "notes": "..." }
4. If it has issues, re-invoke the skill with fix instructions (max 2 retries)

Write qa_result.json to: ${sessionDir}/qa_result.json

The job is NOT done until corrections_letter.pdf AND qa_screenshot.png exist.`;

const q = query({
  prompt,
  options: {
    ...createQueryOptions({ model: 'claude-opus-4-6' }),
    maxTurns: 30,
    maxBudgetUsd: 5.00,
    // PDF generation needs Bash (for pdftoppm screenshot), Write, Read
    // Also Skill (to invoke adu-corrections-pdf + document-skills/pdf)
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
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
        console.log(`  [${elapsed}s] ${block.name}`);
      }
    }
  }
  if (msg.type === 'result') {
    await new Promise(r => setTimeout(r, 2000));

    console.log(`\n${msg.subtype === 'success' ? '✓' : '✗'} L3d ${msg.subtype}`);
    console.log(`  Cost: $${msg.total_cost_usd?.toFixed(2)}`);
    console.log(`  Duration: ${((Date.now() - startTime) / 1000).toFixed(0)}s`);

    const pdfPath = path.join(sessionDir, 'corrections_letter.pdf');
    const screenshotPath = path.join(sessionDir, 'qa_screenshot.png');
    const qaResultPath = path.join(sessionDir, 'qa_result.json');

    const pdfExists = fs.existsSync(pdfPath);
    const ssExists = fs.existsSync(screenshotPath);
    const qaExists = fs.existsSync(qaResultPath);

    console.log(`  ${pdfExists ? '✓' : '✗'} corrections_letter.pdf (${pdfExists ? fs.statSync(pdfPath).size + ' bytes' : 'MISSING'})`);
    console.log(`  ${ssExists ? '✓' : '✗'} qa_screenshot.png (${ssExists ? fs.statSync(screenshotPath).size + ' bytes' : 'MISSING'})`);
    console.log(`  ${qaExists ? '✓' : '✗'} qa_result.json`);

    if (qaExists) {
      const qaResult = JSON.parse(fs.readFileSync(qaResultPath, 'utf-8'));
      console.log(`  QA status: ${qaResult.status}`);
      console.log(`  QA notes: ${qaResult.notes}`);
    }
  }
}
```

**Why isolate Phase 5:**
- PDF generation is a self-contained task: markdown in → PDF out
- We already have a CLI-generated draft corrections MD — perfect fixture
- Can iterate on PDF quality without re-running the 10-min review pipeline
- Tests `adu-corrections-pdf` + `document-skills/pdf` skill chain
- Validates the QA loop (screenshot → review → optional retry)

**What this catches:**
- Python/reportlab not installed (if using Approach A)
- `pdftoppm` not installed (for screenshot generation)
- Skill chaining (adu-corrections-pdf invokes document-skills/pdf)
- PDF formatting issues (margins, fonts, confidence badges)
- QA screenshot generation

**Pass criteria:** PDF file exists (>10KB), screenshot exists, QA result is "pass" or has actionable notes.

---

### L4c: Full Pipeline — All Phases, Real Data (~10-15 min, ~$10-18)

**What it tests:** End-to-end: PDF extraction → sheet review → code compliance → corrections letter → PDF generation. The acceptance test. Run sparingly.

```typescript
// tests/test-l4c-full-review.ts
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createQueryOptions, PROJECT_ROOT } from '../utils/config.ts';
import { createSession } from '../utils/session.ts';
import fs from 'fs';
import path from 'path';

const sessionDir = createSession('l4c');
const binderPath = path.join(PROJECT_ROOT, 'test-assets/corrections/Binder-1232-N-Jefferson.pdf');

console.log('=== L4c: Full City Plan Review Pipeline ===\n');
console.log(`Session: ${sessionDir}`);
console.log(`Binder: ${binderPath}\n`);

const prompt = `Review this ADU plan binder from the city's perspective.
Use the adu-plan-review skill with FULL scope.

PLAN BINDER PDF: ${binderPath}
CITY: Placentia
PROJECT ADDRESS: 1232 N. Jefferson St., Unit 'A', Placentia, CA 92870
SESSION DIRECTORY: ${sessionDir}

Complete ALL 5 phases:
1. Extract PDF → PNGs + sheet-manifest.json
2. Sheet-by-sheet review → sheet_findings.json
3. Code compliance (state + city) → state_compliance.json, city_compliance.json
4. Generate corrections letter → draft_corrections.json, draft_corrections.md, review_summary.json
5. Generate PDF → corrections_letter.pdf, qa_screenshot.png

Project info for the PDF header:
- Applicant/Owner: Kiet Le
- Designer: Ideal Designs, Inc. (Oscar Sanchez)
- Structural Engineer: GSE / Gonzalez Structural Engineering
- Plan Date: 06/19/2025
- Scope: New detached 600 SF one-story ADU; demolition of two trellises

YOU MUST COMPLETE ALL 5 PHASES — do NOT stop after spawning subagents.
The job is NOT done until ALL of these files exist in ${sessionDir}:
- sheet-manifest.json
- sheet_findings.json
- state_compliance.json
- draft_corrections.json
- draft_corrections.md
- review_summary.json
- corrections_letter.pdf

Do NOT return success without writing ALL of these files.`;

const q = query({
  prompt,
  options: {
    ...createQueryOptions({
      model: 'claude-opus-4-6',
      maxTurns: 100,
      maxBudgetUsd: 20.00,
    }),
    // Placentia is Tier 3 (onboarded) — no web search needed
    // But include web tools in case city skill gaps require fallback
    allowedTools: [
      'Skill', 'Task', 'Read', 'Write', 'Edit',
      'Bash', 'Glob', 'Grep', 'WebSearch', 'WebFetch',
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
    await new Promise(r => setTimeout(r, 2000));

    console.log(`\n${'='.repeat(50)}`);
    console.log(`${msg.subtype === 'success' ? '✓' : '✗'} L4c FULL PIPELINE ${msg.subtype}`);
    console.log(`  Cost: $${msg.total_cost_usd?.toFixed(2)}`);
    console.log(`  Turns: ${msg.num_turns}`);
    console.log(`  Duration: ${((Date.now() - startTime) / 1000 / 60).toFixed(1)} min`);
    console.log('');

    // Verify all output files
    const requiredFiles = [
      'sheet-manifest.json',
      'sheet_findings.json',
      'state_compliance.json',
      'draft_corrections.json',
      'draft_corrections.md',
      'review_summary.json',
      'corrections_letter.pdf',
    ];
    const optionalFiles = [
      'city_compliance.json',
      'qa_screenshot.png',
    ];

    let allPresent = true;
    for (const f of requiredFiles) {
      const fp = path.join(sessionDir, f);
      const exists = fs.existsSync(fp);
      const size = exists ? fs.statSync(fp).size : 0;
      console.log(`  ${exists ? '✓' : '✗'} ${f} (${size} bytes)`);
      if (!exists) allPresent = false;
    }
    for (const f of optionalFiles) {
      const fp = path.join(sessionDir, f);
      if (fs.existsSync(fp)) {
        console.log(`  ✓ ${f} (${fs.statSync(fp).size} bytes) [optional]`);
      }
    }

    // Count extracted PNGs
    const pngDir = path.join(sessionDir, 'pages-png');
    if (fs.existsSync(pngDir)) {
      const pngCount = fs.readdirSync(pngDir).filter(f => f.endsWith('.png')).length;
      console.log(`\n  Extracted PNGs: ${pngCount}`);
    }

    // Read draft corrections and compare against CLI baseline
    const draftPath = path.join(sessionDir, 'draft_corrections.md');
    if (fs.existsSync(draftPath)) {
      const draft = fs.readFileSync(draftPath, 'utf-8');
      const lines = draft.split('\n').length;
      console.log(`  Draft corrections: ${lines} lines`);
    }

    // Read review summary
    const summaryPath = path.join(sessionDir, 'review_summary.json');
    if (fs.existsSync(summaryPath)) {
      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
      console.log(`\n  Review Summary:`);
      console.log(`    Total findings: ${summary.total_findings ?? 'N/A'}`);
      console.log(`    HIGH confidence: ${summary.high_confidence ?? 'N/A'}`);
      console.log(`    VERIFY needed: ${summary.verify_needed ?? 'N/A'}`);
      console.log(`    REVIEWER blanks: ${summary.reviewer_blanks ?? 'N/A'}`);
    }

    // Check PDF size (should be >50KB for a multi-page letter)
    const pdfPath = path.join(sessionDir, 'corrections_letter.pdf');
    if (fs.existsSync(pdfPath)) {
      const pdfSize = fs.statSync(pdfPath).size;
      console.log(`\n  PDF size: ${(pdfSize / 1024).toFixed(0)} KB ${pdfSize > 50000 ? '✓' : '(small — check content)'}`);
    }

    console.log(`\n  All required files present: ${allPresent ? '✓ YES' : '✗ NO'}`);
    console.log('='.repeat(50));
  }
}
```

**Validation against CLI baseline:**

After L4c runs, manually compare `draft_corrections.md` against:
- `test-assets/corrections/DRAFT-CORRECTIONS-1232-N-Jefferson.md` (CLI output, 23 items)
- `test-assets/city-flow/test-01-analysis.md` (analysis scorecard: 7/10 matches, 0 false positives)

Expect:
- 15+ correction items (CLI found 23, but Agent SDK may find fewer due to single-pass vs interactive)
- 0 false positives (every item has a code citation)
- Cover sheet items present (stamps, governing codes, sheet index mismatches)
- `[REVIEWER]` blanks for structural items
- `[VERIFY]` flags for LOW visual confidence items

**Run only after L0c-L3d all pass.**

---

## Phase Checkpointing — City Flow

Same concept as the contractor flow. The city pipeline writes files after each phase. Use them to skip completed phases on retry.

### Skip Map

| Phase | Output File(s) | If exists, skip to... |
|-------|---------------|----------------------|
| Phase 1 | `sheet-manifest.json` + `pages-png/` | Phase 2 |
| Phase 2 | `sheet_findings.json` | Phase 3 |
| Phase 3A | `state_compliance.json` | Phase 3B |
| Phase 3B | `city_compliance.json` | Phase 4 |
| Phase 4 | `draft_corrections.json` + `draft_corrections.md` | Phase 5 |
| Phase 5 | `corrections_letter.pdf` | Done |

### Checkpoint Resume Prompt Pattern

```
SESSION DIRECTORY: ${sessionDir}

The following phases are ALREADY COMPLETE (files exist, do not redo):
- Phase 1: sheet-manifest.json ✓ (15 pages extracted)
- Phase 2: sheet_findings.json ✓ (cover sheet reviewed)

Resume from Phase 3. Verify findings against state law and city rules.
```

---

## Cost Estimation Per Level

| Level | Model | Est. Turns | Est. Cost | maxBudgetUsd | When to Run |
|-------|-------|-----------|-----------|--------------|-------------|
| L0c | Haiku | 3 | $0.01 | $0.10 | Every config/symlink change |
| L1c | Haiku | 10-15 | $0.20-0.50 | $1.00 | After L0c passes |
| L2c | Sonnet | 15-25 | $1.00-2.00 | $3.00 | After L1c passes |
| L3c | Opus | 30-60 | $5-8 | $10.00 | After L2c passes |
| L3d | Opus | 15-30 | $2-3 | $5.00 | After L1c passes (independent of L2c/L3c) |
| L4c | Opus | 60-100 | $10-18 | $20.00 | Acceptance test only |

**Total test ladder (one pass through all levels):** ~$20-30

**Cost-saving rules:**
- Use Haiku for L0c-L1c — testing wiring, not output quality
- Use Sonnet for L2c — extraction doesn't need Opus reasoning
- Switch to Opus for L3c+ where review quality matters
- L3d is independent of the review pipeline — can run anytime after L1c

---

## Test Dependencies & Execution Order

```
L0c (smoke)
  │
  ├── L1c (skill read)
  │     │
  │     ├── L2c (extraction)
  │     │     │
  │     │     └── L3c (admin review)
  │     │           │
  │     │           └── L4c (full pipeline)
  │     │
  │     └── L3d (PDF generation) ← independent branch
  │
```

L3d (PDF generation) can run as soon as L1c passes — it doesn't depend on L2c or L3c because it uses a pre-made markdown file. This means you can develop/test PDF generation in parallel with the review pipeline.

### Execution Order

| Order | Test | Time | Depends On |
|-------|------|------|-----------|
| 0 | Pre-extract fixtures + update shared utils | — | None | **DONE** |
| 1 | **L0c** — add symlinks, run smoke test | 5 min | Symlinks created | TODO |
| 2 | **L1c** — skill read + checklist + **subagent file access** | 5 min | L0c passes | TODO — **CRITICAL** |
| 3 | **L2c** — PDF extraction + manifest (optional — fixtures ready) | 5 min | L1c passes | OPTIONAL |
| 4 | **L3c** — admin review (pre-populated fixtures) | 10-15 min | L1c passes | TODO |
| 5 | **L3d** — PDF generation (parallel with L3c) | 5-8 min | L1c passes | TODO |
| 6 | **L4c** — full pipeline (only if L3c + L3d both pass) | 15-20 min | L3c + L3d pass | TODO |

**Clock time (sequential):** ~40-55 min (faster — fixtures pre-populated, L2c optional)
**Clock time (L3c + L3d parallel):** ~30-40 min
**L2c is now optional** — can jump from L1c straight to L3c using pre-populated fixtures

---

## Flexible File Naming (from Learnings) — DONE

**Moved to `verify.ts`** (2026-02-12). Use `findFileByPattern()` and `REVIEW_FILE_PATTERNS` from `agents-crossbeam/src/utils/verify.ts`.

```typescript
import { findFileByPattern, REVIEW_FILE_PATTERNS } from '../utils/verify.ts';

// Example: find sheet findings regardless of naming
const findingsPath = findFileByPattern(sessionDir, REVIEW_FILE_PATTERNS[0]);
// Checks: sheet_findings.json, review_findings.json, sheet_review.json
```

---

## What Breaks First — City Flow Ordered Checklist

Adapted from the contractor flow experience, with city-specific additions:

| # | Failure | Symptom | Fix | Test Level |
|---|---------|---------|-----|-----------|
| 1 | New symlinks broken | `adu-plan-review` skill not found | Verify `ls -la agents-crossbeam/.claude/skills/adu-plan-review` resolves | L0c |
| 2 | Checklist reference inaccessible | Agent can't read `checklist-cover.md` inside skill dir | Check `additionalDirectories` includes parent, verify symlink chain | L1c |
| 3 | `pdftoppm` not installed | Bash extraction fails | `brew install poppler` | L2c |
| 4 | Sheet manifest wrong format | Agent can't parse manifest in later phases | Strengthen manifest schema in prompt, or pre-populate | L2c |
| 5 | Review subagent can't read PNGs | Phase 2 subagent reports "can't see the image" | Verify PNG paths are absolute, check `additionalDirectories` | L3c |
| 6 | Review subagent can't read checklist | Phase 2 produces generic findings (no code citations) | Inline checklist content in subagent prompt, or verify skill dir access | L3c |
| 7 | State compliance subagent fails | No `state_compliance.json` written | Check california-adu skill access from subagent context | L3c |
| 8 | Phase 4 merge drops findings | Corrections letter has fewer items than sheet_findings | Check filter logic — are legitimate findings being incorrectly dropped? | L3c |
| 9 | Agent returns success at Phase 2 | Files missing for Phases 3-4 | Strengthen completion requirements in prompt (list all files) | L3c |
| 10 | PDF dependencies missing | reportlab or pypdfium2 not installed | `pip install reportlab pypdfium2` or use markdown→HTML→PDF approach | L3d |
| 11 | PDF QA loop infinite | Agent retries more than 2x | Check max retry limit in prompt | L3d |
| 12 | Budget exceeded at Phase 3 | 7 subagents burn through $20 | Raise budget or use Sonnet for review subagents | L4c |

---

## Notes

- **Always check `msg.subtype`** — `'success'` vs `'error_max_turns'` vs `'error_max_budget_usd'`
- **2-second delay before file verification** — subagent-written files may not have flushed yet (from learnings doc)
- ~~**Save L2c manifest as a fixture**~~ **DONE** — `test-assets/city-flow/mock-session/` has 15 PNGs + sheet-manifest.json
- **L3d is your iteration loop for PDF quality** — run it repeatedly with the same draft MD to dial in formatting
- **The CLI baseline is your ground truth** — `DRAFT-CORRECTIONS-1232-N-Jefferson.md` is what the agent produced interactively. The Agent SDK should match or exceed this quality.
- **If you get a Buena Park binder** — create an L4c-buena-park variant. Same test structure, different input PDF + city name. The `buena-park-adu` skill gives you Tier 3 offline testing for a second city.
- **Onboarded cities only (hackathon)** — city flow requires Tier 3 city skill (placentia-adu or buena-park-adu). No WebSearch/WebFetch needed. This eliminates the 14-minute city research bottleneck from the contractor flow.
- **Shared utilities updated** — `config.ts` (flow-neutral prompt), `session.ts` (`getReviewSessionFiles()`), `verify.ts` (`detectReviewPhases()` + `findFileByPattern()` + `REVIEW_FILE_PATTERNS`) are all ready.
- **L1c is the critical gate** — the subagent file access test determines whether Phase 2 subagents can read checklist files via absolute path. If it fails, inline the checklist content in subagent prompts (adds ~450 lines per prompt but guaranteed to work).
