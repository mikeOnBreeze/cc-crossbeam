/**
 * L4 Full Pipeline Acceptance Test
 *
 * End-to-end: Skill 1 (analysis) → simulated contractor answers → Skill 2 (response generation)
 *
 * Uses real Placentia data:
 * - Corrections letter: 1232 N Jefferson St (2 pages)
 * - Plan binder: Binder-1232-N-Jefferson.pdf (15 sheets)
 * - City: Placentia (live web search for city rules)
 *
 * Contractor answers are pre-made from Cameron's actual responses.
 *
 * Model: Opus for both skills
 * Expected duration: 15-20 minutes total
 * Expected cost: $10-18 total
 */
import fs from 'fs';
import path from 'path';
import { createSession } from '../utils/session.ts';
import { handleProgressMessage, SubagentTracker } from '../utils/progress.ts';
import { verifySessionFiles } from '../utils/verify.ts';
import { runCorrectionsAnalysis } from '../flows/corrections-analysis.ts';
import { runResponseGeneration } from '../flows/corrections-response.ts';
import { PROJECT_ROOT } from '../utils/config.ts';

console.log('=== L4 Full Pipeline Acceptance Test ===\n');

const startTime = Date.now();
const sessionDir = createSession('l4');
console.log(`  Session: ${sessionDir}`);

// --- Input files ---
const correctionsFile = path.resolve(PROJECT_ROOT, 'test-assets/corrections/1232-n-jefferson-corrections-p1.png');
const planBinderFile = path.resolve(PROJECT_ROOT, 'test-assets/corrections/Binder-1232-N-Jefferson.pdf');
const contractorAnswersSrc = path.resolve(PROJECT_ROOT, 'test-assets/mock-session/contractor_answers.json');

console.log(`  Corrections: ${correctionsFile}`);
console.log(`  Plan binder: ${planBinderFile}`);
console.log(`  Corrections exists: ${fs.existsSync(correctionsFile)}`);
console.log(`  Binder exists: ${fs.existsSync(planBinderFile)}`);
console.log(`  Contractor answers source: ${fs.existsSync(contractorAnswersSrc)}\n`);

let passed = true;

// ============================================================
// PHASE A: Skill 1 — Corrections Analysis
// ============================================================
console.log('━━━ PHASE A: Corrections Analysis (Skill 1) ━━━\n');

const skill1Tracker = new SubagentTracker(startTime);

const skill1Result = await runCorrectionsAnalysis({
  correctionsFile,
  planBinderFile,
  sessionDir,
  city: 'Placentia',
  maxBudgetUsd: 15.00,
  maxTurns: 80,
  onProgress: (msg) => handleProgressMessage(msg, startTime, skill1Tracker),
});

// Brief pause for file writes
await new Promise(r => setTimeout(r, 2000));

skill1Tracker.printSummary();
skill1Tracker.analyzeFileTimestamps(sessionDir);

console.log(`\n  Skill 1 result: ${skill1Result.success ? 'SUCCESS' : 'FAILED'}`);
console.log(`  Skill 1 cost: $${skill1Result.cost?.toFixed(4) ?? 'unknown'}`);
console.log(`  Skill 1 turns: ${skill1Result.turns ?? 'unknown'}`);
console.log(`  Skill 1 duration: ${(skill1Result.duration / 1000 / 60).toFixed(1)} min`);

// --- Verify Skill 1 outputs ---
console.log('\n--- Skill 1 Output Verification ---');

const skill1Core = [
  'corrections_parsed.json',
  'corrections_categorized.json',
  'contractor_questions.json',
];

// Research files — accept multiple naming patterns
const researchPatterns = [
  { names: ['state_law_findings.json', 'research_state_law.json', 'research_state.json'], label: 'State law' },
  { names: ['sheet_observations.json', 'research_sheet_observations.json', 'research_sheets.json'], label: 'Sheets' },
  { names: ['city_research_findings.json', 'research_city_rules.json', 'research_city.json', 'city_discovery.json'], label: 'City' },
];

const coreResult = verifySessionFiles(sessionDir, skill1Core);
for (const f of coreResult.found) {
  console.log(`  ✓ ${f.file} (${f.size} bytes)`);
}
for (const f of coreResult.missing) {
  console.log(`  ✗ ${f} MISSING`);
  passed = false;
}

// Check manifest
const manifestNames = ['sheet-manifest.json'];
const manifestResult = verifySessionFiles(sessionDir, manifestNames);
for (const f of manifestResult.found) {
  console.log(`  ✓ ${f.file} (${f.size} bytes)`);
}
for (const f of manifestResult.missing) {
  console.log(`  ✗ ${f} MISSING`);
  passed = false;
}

// Check research files
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

if (!skill1Result.success) {
  console.log('\n  ✗ Skill 1 failed — cannot proceed to Skill 2');
  passed = false;
}

// ============================================================
// PHASE B: Inject Contractor Answers
// ============================================================
console.log('\n━━━ PHASE B: Inject Contractor Answers ━━━\n');

const answersDest = path.join(sessionDir, 'contractor_answers.json');
if (fs.existsSync(contractorAnswersSrc)) {
  fs.copyFileSync(contractorAnswersSrc, answersDest);
  const answers = JSON.parse(fs.readFileSync(answersDest, 'utf-8'));
  const answerCount = Object.keys(answers.answers ?? {}).length;
  console.log(`  Injected contractor_answers.json (${answerCount} answers from ${answers.answered_by ?? 'unknown'})`);
} else {
  console.log('  ✗ No contractor answers source file — Skill 2 will have TODO items');
}

// ============================================================
// PHASE C: Skill 2 — Response Generation
// ============================================================
console.log('\n━━━ PHASE C: Response Generation (Skill 2) ━━━\n');

const skill2Start = Date.now();
const skill2Tracker = new SubagentTracker(skill2Start);

const skill2Result = await runResponseGeneration({
  sessionDir,
  maxBudgetUsd: 8.00,
  maxTurns: 40,
  onProgress: (msg) => handleProgressMessage(msg, skill2Start, skill2Tracker),
});

await new Promise(r => setTimeout(r, 2000));

skill2Tracker.printSummary();

console.log(`\n  Skill 2 result: ${skill2Result.success ? 'SUCCESS' : 'FAILED'}`);
console.log(`  Skill 2 cost: $${skill2Result.cost?.toFixed(4) ?? 'unknown'}`);
console.log(`  Skill 2 turns: ${skill2Result.turns ?? 'unknown'}`);
console.log(`  Skill 2 duration: ${(skill2Result.duration / 1000 / 60).toFixed(1)} min`);

// --- Verify Skill 2 outputs ---
console.log('\n--- Skill 2 Output Verification ---');

const deliverables = [
  'response_letter.md',
  'professional_scope.md',
  'corrections_report.md',
  'sheet_annotations.json',
];

const skill2Check = verifySessionFiles(sessionDir, deliverables);
for (const f of skill2Check.found) {
  const sizeOk = f.size > 500;
  const marker = sizeOk ? '✓' : '⚠';
  console.log(`  ${marker} ${f.file} (${f.size} bytes)${sizeOk ? '' : ' — suspiciously small'}`);
  if (!sizeOk) passed = false;
}
for (const f of skill2Check.missing) {
  console.log(`  ✗ ${f} MISSING`);
  passed = false;
}

if (!skill2Result.success) {
  console.log('\n  ✗ Skill 2 failed');
  passed = false;
}

// ============================================================
// FINAL SUMMARY
// ============================================================
console.log('\n━━━ FINAL SUMMARY ━━━\n');

const totalCost = (skill1Result.cost ?? 0) + (skill2Result.cost ?? 0);
const totalDuration = Date.now() - startTime;

// Response letter preview
const letterPath = path.join(sessionDir, 'response_letter.md');
if (fs.existsSync(letterPath)) {
  const letter = fs.readFileSync(letterPath, 'utf-8');
  const lines = letter.split('\n');
  console.log(`  Response letter: ${lines.length} lines, ${letter.length} chars`);
  console.log('  Preview:');
  for (const line of lines.slice(0, 5)) {
    console.log(`    ${line}`);
  }
}

// Sheet annotations summary
const annotationsPath = path.join(sessionDir, 'sheet_annotations.json');
if (fs.existsSync(annotationsPath)) {
  try {
    const ann = JSON.parse(fs.readFileSync(annotationsPath, 'utf-8'));
    console.log(`\n  Annotations: ${ann.annotations?.length ?? 0} sheets, ${ann.revision_table?.length ?? 0} revisions`);
  } catch {}
}

// All files in session
console.log('\n--- All Session Files ---');
try {
  const files = fs.readdirSync(sessionDir);
  for (const file of files.sort()) {
    const size = fs.statSync(path.join(sessionDir, file)).size;
    console.log(`  ${file.padEnd(40)} ${(size / 1024).toFixed(1).padStart(8)} KB`);
  }
} catch {}

console.log(`\n--- Pipeline Stats ---`);
console.log(`  Skill 1 cost: $${skill1Result.cost?.toFixed(4) ?? 'unknown'}`);
console.log(`  Skill 2 cost: $${skill2Result.cost?.toFixed(4) ?? 'unknown'}`);
console.log(`  Total cost:   $${totalCost.toFixed(4)}`);
console.log(`  Total turns:  ${(skill1Result.turns ?? 0) + (skill2Result.turns ?? 0)}`);
console.log(`  Total duration: ${(totalDuration / 1000).toFixed(1)}s (${(totalDuration / 1000 / 60).toFixed(1)} min)`);

console.log(passed ? '\n✅ L4 FULL PIPELINE TEST PASSED' : '\n❌ L4 FULL PIPELINE TEST FAILED');
process.exit(passed ? 0 : 1);
