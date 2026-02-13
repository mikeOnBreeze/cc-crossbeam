/**
 * L3b Skill 2 Isolation Test
 *
 * Validates: adu-corrections-complete skill generates all 4 deliverables
 * from pre-made mock-session fixtures. No dependency on Skill 1.
 *
 * Uses real Placentia data from correction-01/ (CLI run output).
 * Contractor answers already provided by Cameron (GC).
 *
 * Model: Opus (testing skill behavior)
 * Expected duration: 2-5 minutes
 * Expected cost: $2-5
 */
import fs from 'fs';
import path from 'path';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createQueryOptions, PROJECT_ROOT } from '../utils/config.ts';
import { createSession } from '../utils/session.ts';
import { handleProgressMessage, SubagentTracker } from '../utils/progress.ts';
import { verifySessionFiles } from '../utils/verify.ts';

console.log('=== L3b Skill 2 Isolation Test ===\n');

const startTime = Date.now();
const sessionDir = createSession('l3b');
console.log(`  Session: ${sessionDir}`);

// --- Copy mock-session fixtures into session directory ---
const mockDir = path.resolve(PROJECT_ROOT, 'test-assets/mock-session');
const fixtures = [
  'corrections_parsed.json',
  'corrections_categorized.json',
  'sheet-manifest.json',
  'contractor_answers.json',
  'state_law_findings.json',
  'sheet_observations.json',
  'contractor_questions.json',
];

let fixtureCount = 0;
for (const file of fixtures) {
  const src = path.join(mockDir, file);
  const dest = path.join(sessionDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    fixtureCount++;
  } else {
    console.log(`  ⚠ Fixture missing: ${file}`);
  }
}
console.log(`  Copied ${fixtureCount}/${fixtures.length} fixtures into session\n`);

// --- Subagent tracker ---
const tracker = new SubagentTracker(startTime);

// --- Build prompt ---
const prompt = `You have a session directory with corrections analysis files and contractor answers.

SESSION DIRECTORY: ${sessionDir}

Use the adu-corrections-complete skill to generate the response package.

The session directory contains these files from the analysis phase:
- corrections_parsed.json — raw correction items with original wording
- corrections_categorized.json — items with categories + research context (the backbone)
- sheet-manifest.json — sheet ID to page number mapping
- state_law_findings.json — per-code-section lookups
- sheet_observations.json — what's currently on each plan sheet
- contractor_questions.json — what questions were asked
- contractor_answers.json — the contractor's responses (answered by Cameron, the GC)

Read these files and generate all four deliverables:
1. response_letter.md — professional letter to the building department
2. professional_scope.md — work breakdown grouped by professional
3. corrections_report.md — status dashboard with checklist
4. sheet_annotations.json — per-sheet breakdown of changes

Write ALL output files to: ${sessionDir}

Follow the adu-corrections-complete skill instructions exactly.
Do NOT skip any deliverable. All 4 files must be written.`;

// --- Skill 2 tools: no web, no bash — pure file reading + writing ---
const skill2Tools = [
  'Skill', 'Task', 'Read', 'Write', 'Edit', 'Glob', 'Grep',
];

const q = query({
  prompt,
  options: {
    ...createQueryOptions({
      model: 'claude-opus-4-6',
      maxTurns: 30,
      maxBudgetUsd: 6.00,
      allowedTools: skill2Tools,
    }),
  },
});

// --- Stream progress ---
let passed = true;

for await (const msg of q) {
  handleProgressMessage(msg, startTime, tracker);

  if (msg.type === 'result') {
    await new Promise(r => setTimeout(r, 2000));

    tracker.printSummary();
    tracker.analyzeFileTimestamps(sessionDir);

    // --- File verification ---
    console.log('\n--- Output Verification ---');

    // The 4 deliverables
    const deliverables = [
      'response_letter.md',
      'professional_scope.md',
      'corrections_report.md',
      'sheet_annotations.json',
    ];

    const result = verifySessionFiles(sessionDir, deliverables);
    for (const f of result.found) {
      const sizeOk = f.size > 500;
      const marker = sizeOk ? '✓' : '⚠';
      console.log(`  ${marker} ${f.file} (${f.size} bytes)${sizeOk ? '' : ' — suspiciously small'}`);
      if (!sizeOk) passed = false;
    }
    for (const f of result.missing) {
      console.log(`  ✗ ${f} MISSING`);
      passed = false;
    }

    // Check fixtures still present
    const fixtureResult = verifySessionFiles(sessionDir, fixtures);
    console.log(`  · ${fixtureResult.found.length}/${fixtures.length} input fixtures present`);

    // --- sheet_annotations.json structure check ---
    const annotationsPath = path.join(sessionDir, 'sheet_annotations.json');
    if (fs.existsSync(annotationsPath)) {
      try {
        const annotations = JSON.parse(fs.readFileSync(annotationsPath, 'utf-8'));
        const annCount = annotations.annotations?.length ?? 0;
        const revCount = annotations.revision_table?.length ?? 0;
        console.log(`\n  Annotations: ${annCount} sheets, ${revCount} revision entries`);
        if (annCount > 0) {
          console.log('  ✓ sheet_annotations.json has valid structure');
        } else {
          console.log('  ⚠ sheet_annotations.json has no annotation entries');
        }
      } catch (e) {
        console.log(`  ✗ sheet_annotations.json parse error: ${(e as Error).message}`);
        passed = false;
      }
    }

    // --- Response letter preview ---
    const letterPath = path.join(sessionDir, 'response_letter.md');
    if (fs.existsSync(letterPath)) {
      const letter = fs.readFileSync(letterPath, 'utf-8');
      const lines = letter.split('\n');
      console.log(`\n  Response letter: ${lines.length} lines, ${letter.length} chars`);
      // Show first 5 lines as preview
      console.log('  Preview:');
      for (const line of lines.slice(0, 5)) {
        console.log(`    ${line}`);
      }
    }

    // --- Final stats ---
    console.log(`\n--- Run Stats ---`);
    console.log(`  Cost: $${msg.total_cost_usd?.toFixed(4) ?? 'unknown'}`);
    console.log(`  Turns: ${msg.num_turns ?? 'unknown'}`);
    console.log(`  Subtype: ${msg.subtype ?? 'unknown'}`);
  }
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`  Duration: ${elapsed}s (${(parseFloat(elapsed) / 60).toFixed(1)} min)`);
console.log(passed ? '\n✅ L3b SKILL 2 ISOLATION TEST PASSED' : '\n❌ L3b SKILL 2 ISOLATION TEST FAILED');
process.exit(passed ? 0 : 1);
