/**
 * L4c Full Pipeline — All Phases, Real Data
 *
 * End-to-end acceptance test: PDF extraction → sheet review →
 * code compliance → corrections letter. Uses runPlanReview() from
 * the flow wrapper with FULL scope.
 *
 * Run ONLY after L3c + L3d both pass.
 *
 * Model: Opus
 * Expected duration: 10-15 minutes
 * Expected cost: $10-18
 */
import fs from 'fs';
import path from 'path';
import { PROJECT_ROOT } from '../utils/config.ts';
import { createSession } from '../utils/session.ts';
import { handleProgressMessage, SubagentTracker } from '../utils/progress.ts';
import { verifySessionFiles, findFileByPattern, REVIEW_FILE_PATTERNS } from '../utils/verify.ts';
import { runPlanReview } from '../flows/plan-review.ts';

console.log('=== L4c: Full City Plan Review Pipeline ===\n');

const startTime = Date.now();
const sessionDir = createSession('l4c');
const binderPath = path.join(PROJECT_ROOT, 'test-assets/corrections/Binder-1232-N-Jefferson.pdf');

console.log(`  Session: ${sessionDir}`);
console.log(`  Binder: ${binderPath}`);
console.log(`  Binder exists: ${fs.existsSync(binderPath)}\n`);

const tracker = new SubagentTracker(startTime);

// --- Run full pipeline via flow wrapper ---
const result = await runPlanReview({
  planBinderFile: binderPath,
  sessionDir,
  city: 'Placentia',
  projectAddress: '1232 N. Jefferson St., Unit \'A\', Placentia, CA 92870',
  reviewScope: 'full',
  model: 'claude-opus-4-6',
  maxTurns: 100,
  maxBudgetUsd: 20.00,
  // Include web tools as fallback, but Placentia is Tier 3 (offline)
  onProgress: (msg: any) => handleProgressMessage(msg, startTime, tracker),
});

// Brief pause for file flush
await new Promise(r => setTimeout(r, 2000));

// --- Subagent timing analysis ---
console.log('\n' + '='.repeat(50));
tracker.printSummary();
tracker.analyzeFileTimestamps(sessionDir);

// --- File verification ---
console.log('\n--- Output Verification ---');

let passed = result.success;

const requiredFiles = [
  'sheet-manifest.json',
  'sheet_findings.json',
  'state_compliance.json',
  'draft_corrections.json',
  'draft_corrections.md',
  'review_summary.json',
];
const optionalFiles = [
  'city_compliance.json',
  'corrections_letter.pdf',
  'qa_screenshot.png',
];

let allPresent = true;
for (const f of requiredFiles) {
  const fp = path.join(sessionDir, f);
  const exists = fs.existsSync(fp);
  if (!exists) {
    // Try flexible naming
    const pattern = REVIEW_FILE_PATTERNS.find(p => p.names[0] === f);
    const altPath = pattern ? findFileByPattern(sessionDir, pattern) : null;
    if (altPath) {
      const size = fs.statSync(altPath).size;
      console.log(`  ✓ ${path.basename(altPath)} (${size} bytes) [alt name for ${f}]`);
    } else {
      console.log(`  ✗ ${f} MISSING`);
      allPresent = false;
      passed = false;
    }
  } else {
    const size = fs.statSync(fp).size;
    console.log(`  ✓ ${f} (${size} bytes)`);
  }
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

// Read draft corrections
const draftPath = path.join(sessionDir, 'draft_corrections.md');
if (fs.existsSync(draftPath)) {
  const draft = fs.readFileSync(draftPath, 'utf-8');
  const lines = draft.split('\n');
  console.log(`  Draft corrections: ${lines.length} lines`);
  // Show first few non-empty content lines
  const contentLines = lines.filter(l => l.trim().length > 0).slice(0, 8);
  for (const line of contentLines) {
    console.log(`    ${line.slice(0, 120)}`);
  }
}

// Read review summary
const summaryPath = path.join(sessionDir, 'review_summary.json');
if (fs.existsSync(summaryPath)) {
  try {
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
    console.log('\n  Review Summary:');
    console.log(`    Total findings: ${summary.total_findings ?? summary.totalFindings ?? 'N/A'}`);
    console.log(`    HIGH confidence: ${summary.high_confidence ?? summary.highConfidence ?? 'N/A'}`);
    console.log(`    VERIFY needed: ${summary.verify_needed ?? summary.verifyNeeded ?? 'N/A'}`);
    console.log(`    REVIEWER blanks: ${summary.reviewer_blanks ?? summary.reviewerBlanks ?? 'N/A'}`);
  } catch {
    console.log('  ⚠ review_summary.json parse error');
  }
}

// Check PDF if generated
const pdfPath = path.join(sessionDir, 'corrections_letter.pdf');
if (fs.existsSync(pdfPath)) {
  const pdfSize = fs.statSync(pdfPath).size;
  console.log(`\n  PDF size: ${(pdfSize / 1024).toFixed(0)} KB ${pdfSize > 50000 ? '✓' : '(small — check content)'}`);
}

// --- Final stats ---
console.log('\n' + '='.repeat(50));
console.log(`${passed ? '✓' : '✗'} L4c FULL PIPELINE ${result.subtype}`);
console.log(`  Cost: $${result.cost?.toFixed(2) ?? 'unknown'}`);
console.log(`  Turns: ${result.turns ?? 'unknown'}`);

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`  Duration: ${elapsed}s (${(parseFloat(elapsed) / 60).toFixed(1)} min)`);
console.log(`  All required files present: ${allPresent ? '✓ YES' : '✗ NO'}`);
console.log('='.repeat(50));
console.log(passed ? '\n✅ L4c FULL PIPELINE TEST PASSED' : '\n❌ L4c FULL PIPELINE TEST FAILED');
process.exit(passed ? 0 : 1);
