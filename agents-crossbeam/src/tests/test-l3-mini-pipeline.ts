/**
 * L3 Mini Pipeline Test — Buena Park Shortcut
 *
 * Validates: Multi-skill orchestration across phases.
 * Uses Buena Park offline skill instead of live city web search.
 * Pre-populates sheet manifest to skip PDF extraction.
 *
 * Includes subagent lifecycle tracking for pipeline debugging:
 * - Per-subagent spawn/resolve timing
 * - File timestamp analysis (which research file was written when)
 * - Bottleneck identification
 *
 * Model: Opus (testing skill behavior)
 * Expected duration: 5-10 minutes
 * Expected cost: $2-5
 */
import fs from 'fs';
import path from 'path';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createQueryOptions, PROJECT_ROOT } from '../utils/config.ts';
import { createSession } from '../utils/session.ts';
import { handleProgressMessage, SubagentTracker } from '../utils/progress.ts';
import { verifySessionFiles } from '../utils/verify.ts';

console.log('=== L3 Mini Pipeline Test — Buena Park Shortcut ===\n');

const startTime = Date.now();
const sessionDir = createSession('l3');
console.log(`  Session: ${sessionDir}`);

// --- Pre-populate sheet manifest (skip Phase 2 — PDF extraction already tested in L2) ---
const miniManifestSrc = path.resolve(PROJECT_ROOT, 'test-assets/mini/sheet-manifest-mini.json');
const manifestData = JSON.parse(fs.readFileSync(miniManifestSrc, 'utf-8'));

// Resolve plan page paths to absolute paths
const planPagesDir = path.resolve(PROJECT_ROOT, 'test-assets/mini');
for (const sheet of manifestData.sheets) {
  sheet.file = path.resolve(planPagesDir, sheet.file);
}

const manifestDest = path.join(sessionDir, 'sheet-manifest.json');
fs.writeFileSync(manifestDest, JSON.stringify(manifestData, null, 2));
console.log(`  Pre-populated sheet manifest: ${manifestData.sheets.length} sheets`);

// --- Corrections file ---
const correctionsFile = path.resolve(PROJECT_ROOT, 'test-assets/corrections/1232-n-jefferson-corrections-p1.png');
console.log(`  Corrections: ${correctionsFile}`);
console.log(`  Corrections exists: ${fs.existsSync(correctionsFile)}\n`);

// --- Subagent tracker ---
const tracker = new SubagentTracker(startTime);

// --- Build prompt ---
const prompt = `You have a corrections letter and a pre-built sheet manifest for an ADU permit.

CORRECTIONS LETTER: ${correctionsFile}
SHEET MANIFEST (already built — do NOT rebuild): ${manifestDest}
SESSION DIRECTORY: ${sessionDir}
CITY: Buena Park

Use the adu-corrections-flow skill to analyze these corrections.

IMPORTANT MODIFICATIONS FOR THIS TEST:
- The sheet manifest is ALREADY BUILT at ${manifestDest} — skip Phase 2 entirely (do NOT extract PDF pages or rebuild the manifest)
- Use the buena-park-adu skill for city research instead of adu-city-research (no web search needed)
- Use the california-adu skill for state law research
- Do NOT use WebSearch or WebFetch — all research is offline
- Process all corrections visible in the letter image
- Write all output files to: ${sessionDir}

YOU MUST COMPLETE ALL 4 PHASES — do NOT stop after spawning subagents:

Phase 1: Read corrections letter → write corrections_parsed.json
Phase 3: Spawn research subagents (state law, city, sheets) → WAIT for all results
Phase 4 (CRITICAL — do NOT skip): After ALL subagents return, YOU must merge the research findings and:
  a. Categorize each correction item (AUTO_FIXABLE / NEEDS_CONTRACTOR_INPUT / NEEDS_PROFESSIONAL)
  b. Write corrections_categorized.json — each item with category + research context
  c. Generate contractor questions for NEEDS_CONTRACTOR_INPUT items
  d. Write contractor_questions.json — UI-ready question data

The job is NOT done until corrections_categorized.json AND contractor_questions.json are written.
These are the most important output files. Do NOT return success without writing them.

Stop after writing contractor_questions.json. Do NOT generate response letter or other deliverables.`;

// --- No web tools — force offline city research ---
const offlineTools = [
  'Skill', 'Task', 'Read', 'Write', 'Edit',
  'Bash', 'Glob', 'Grep',
];

const q = query({
  prompt,
  options: {
    ...createQueryOptions({
      model: 'claude-opus-4-6',
      maxTurns: 50,
      maxBudgetUsd: 8.00,
      allowedTools: offlineTools,
    }),
  },
});

// --- Stream progress with subagent tracking ---
let passed = true;

for await (const msg of q) {
  handleProgressMessage(msg, startTime, tracker);

  if (msg.type === 'result') {
    // Brief pause to let any final subagent file writes flush
    await new Promise(r => setTimeout(r, 2000));

    // --- Subagent timing analysis ---
    tracker.printSummary();
    tracker.analyzeFileTimestamps(sessionDir);

    // --- File verification ---
    console.log('\n--- Output Verification ---');

    // Core required files (the Phase 4 outputs that matter most)
    const coreRequired = [
      'corrections_parsed.json',
      'corrections_categorized.json',
      'contractor_questions.json',
    ];

    // Research files — accept multiple naming patterns (subagents name freely)
    const researchPatterns = [
      { names: ['state_law_findings.json', 'research_state_law.json', 'research_state.json'], label: 'State law' },
      { names: ['sheet_observations.json', 'research_sheet_observations.json', 'research_sheets.json'], label: 'Sheets' },
      { names: ['city_research_findings.json', 'research_city_rules.json', 'research_city.json'], label: 'City' },
    ];

    // Check core files
    const coreResult = verifySessionFiles(sessionDir, coreRequired);
    for (const f of coreResult.found) {
      console.log(`  ✓ ${f.file} (${f.size} bytes)`);
    }
    for (const f of coreResult.missing) {
      console.log(`  ✗ ${f} MISSING`);
      passed = false;
    }

    // Check research files (accept any matching name)
    let researchCount = 0;
    for (const { names, label } of researchPatterns) {
      let found = false;
      for (const name of names) {
        const check = verifySessionFiles(sessionDir, [name]);
        if (check.found.length > 0) {
          console.log(`  ✓ ${check.found[0].file} (${check.found[0].size} bytes) [${label}]`);
          researchCount++;
          found = true;
          break;
        }
      }
      if (!found) {
        console.log(`  · ${label} research file not found`);
      }
    }
    if (researchCount >= 1) {
      console.log(`  ✓ ${researchCount}/3 research files found (≥1 required)`);
    } else {
      console.log('  ✗ No research files found');
      passed = false;
    }

    // Check pre-populated manifest
    const manifestResult = verifySessionFiles(sessionDir, ['sheet-manifest.json']);
    for (const f of manifestResult.found) {
      console.log(`  · ${f.file} (${f.size} bytes) [pre-populated]`);
    }

    // --- Questions analysis ---
    const questionsPath = path.join(sessionDir, 'contractor_questions.json');
    if (fs.existsSync(questionsPath)) {
      try {
        const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
        const summary = questions.summary ?? questions.metadata ?? {};
        console.log('\n  Questions summary:');
        if (summary.total_items !== undefined) console.log(`    Total items: ${summary.total_items}`);
        if (summary.auto_fixable !== undefined) console.log(`    Auto-fixable: ${summary.auto_fixable}`);
        if (summary.needs_contractor_input !== undefined) console.log(`    Needs contractor: ${summary.needs_contractor_input}`);
        if (summary.needs_professional !== undefined) console.log(`    Needs professional: ${summary.needs_professional}`);

        const items = questions.items ?? questions.questions ?? questions.correction_items ?? [];
        if (Array.isArray(items) && items.length > 0) {
          console.log(`    Question items: ${items.length}`);
          console.log('  ✓ contractor_questions.json has valid content');
        } else if (summary.total_items > 0) {
          console.log('  ✓ contractor_questions.json has summary data');
        } else {
          console.log('  ✗ contractor_questions.json appears empty');
          passed = false;
        }
      } catch (e) {
        console.log(`  ✗ JSON parse error: ${(e as Error).message}`);
        passed = false;
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
console.log(passed ? '\n✅ L3 MINI PIPELINE TEST PASSED' : '\n❌ L3 MINI PIPELINE TEST FAILED');
process.exit(passed ? 0 : 1);
