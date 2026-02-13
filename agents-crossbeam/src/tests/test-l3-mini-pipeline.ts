/**
 * L3 Mini Pipeline Test — Buena Park Shortcut
 *
 * Validates: Multi-skill orchestration across phases.
 * Uses Buena Park offline skill instead of live city web search.
 * Pre-populates sheet manifest to skip PDF extraction.
 *
 * Model: Opus (testing skill behavior)
 * Expected duration: 5-7 minutes
 * Expected cost: $3-5
 */
import fs from 'fs';
import path from 'path';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createQueryOptions, PROJECT_ROOT } from '../utils/config.ts';
import { createSession } from '../utils/session.ts';
import { handleProgressMessage } from '../utils/progress.ts';
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

// --- Stream progress ---
let passed = true;

for await (const msg of q) {
  handleProgressMessage(msg, startTime);

  if (msg.type === 'result') {
    // Brief pause to let any final subagent file writes complete
    await new Promise(r => setTimeout(r, 2000));
    console.log('\n--- Checking outputs ---');

    // Core required files (the Phase 4 outputs that matter most)
    const coreRequired = [
      'corrections_parsed.json',
      'corrections_categorized.json',
      'contractor_questions.json',
    ];

    // Research files — accept either naming pattern (subagents may name differently)
    const researchAlternatives = [
      { expected: 'state_law_findings.json', alt: 'research_state_law.json' },
      { expected: 'sheet_observations.json', alt: 'research_sheet_observations.json' },
      { expected: 'city_research_findings.json', alt: 'research_city_rules.json' },
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

    // Check research files (accept alternate names)
    let researchCount = 0;
    for (const { expected, alt } of researchAlternatives) {
      const check = verifySessionFiles(sessionDir, [expected]);
      if (check.found.length > 0) {
        console.log(`  ✓ ${check.found[0].file} (${check.found[0].size} bytes)`);
        researchCount++;
      } else {
        const altCheck = verifySessionFiles(sessionDir, [alt]);
        if (altCheck.found.length > 0) {
          console.log(`  ✓ ${altCheck.found[0].file} (${altCheck.found[0].size} bytes) [alt name for ${expected}]`);
          researchCount++;
        } else {
          console.log(`  · ${expected} not found [research file]`);
        }
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

    // Parse contractor_questions.json for summary stats
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

        // Basic validity check — should have at least 1 item
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

    console.log(`\n  Cost: $${msg.total_cost_usd?.toFixed(4) ?? 'unknown'}`);
    console.log(`  Turns: ${msg.num_turns ?? 'unknown'}`);
    console.log(`  Subtype: ${msg.subtype ?? 'unknown'}`);
  }
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\n  Duration: ${elapsed}s`);
console.log(passed ? '\n✅ L3 MINI PIPELINE TEST PASSED' : '\n❌ L3 MINI PIPELINE TEST FAILED');
process.exit(passed ? 0 : 1);
