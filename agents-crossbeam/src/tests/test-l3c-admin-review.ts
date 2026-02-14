/**
 * L3c Administrative Review — Cover Sheet Only
 *
 * Core review test: Phases 2-4 with pre-populated fixtures (skip Phase 1).
 * Uses runPlanReview() from the flow wrapper to validate both the
 * review pipeline AND the flow wrapper itself.
 *
 * Pre-populates sheet manifest + PNGs from mock-session fixtures.
 * Reviews cover sheet only (administrative scope) against checklist-cover.md.
 * Placentia is Tier 3 (onboarded) — no web search needed.
 *
 * Model: Opus (testing review quality)
 * Expected duration: 4-8 minutes
 * Expected cost: $5-8
 */
import fs from 'fs';
import path from 'path';
import { PROJECT_ROOT } from '../utils/config.ts';
import { createSession } from '../utils/session.ts';
import { handleProgressMessage, SubagentTracker } from '../utils/progress.ts';
import { verifySessionFiles, findFileByPattern, REVIEW_FILE_PATTERNS } from '../utils/verify.ts';
import { runPlanReview } from '../flows/plan-review.ts';

console.log('=== L3c: Administrative Review (Cover Sheet Only) ===\n');

const startTime = Date.now();
const sessionDir = createSession('l3c');
const binderPath = path.join(PROJECT_ROOT, 'test-assets/corrections/Binder-1232-N-Jefferson.pdf');

console.log(`  Session: ${sessionDir}`);
console.log(`  Binder: ${binderPath}`);
console.log(`  Binder exists: ${fs.existsSync(binderPath)}\n`);

// --- Pre-populate fixtures (skip Phase 1 extraction) ---
const mockSessionDir = path.join(PROJECT_ROOT, 'test-assets/city-flow/mock-session');
const mockManifestSrc = path.join(mockSessionDir, 'sheet-manifest.json');
const mockPngDir = path.join(mockSessionDir, 'pages-png');

// Copy PNGs first
const destPngDir = path.join(sessionDir, 'pages-png');
if (fs.existsSync(mockPngDir)) {
  fs.mkdirSync(destPngDir, { recursive: true });
  const pngFiles = fs.readdirSync(mockPngDir).filter(f => f.endsWith('.png'));
  for (const file of pngFiles) {
    fs.copyFileSync(path.join(mockPngDir, file), path.join(destPngDir, file));
  }
  console.log(`  ✓ Pre-populated ${pngFiles.length} PNGs to ${destPngDir}`);
}

// Copy manifest with absolute path rewriting
if (fs.existsSync(mockManifestSrc)) {
  const manifestData = JSON.parse(fs.readFileSync(mockManifestSrc, 'utf-8'));
  // CRITICAL: Rewrite file paths to point at the SESSION COPY, not the mock source
  for (const sheet of manifestData.sheets) {
    sheet.file = path.resolve(destPngDir, sheet.file);
  }
  fs.writeFileSync(
    path.join(sessionDir, 'sheet-manifest.json'),
    JSON.stringify(manifestData, null, 2),
  );
  console.log(`  ✓ Pre-populated sheet-manifest.json (${manifestData.sheets.length} sheets, paths rewritten to session)`);
}

console.log('');

// --- Subagent tracker ---
const tracker = new SubagentTracker(startTime);

// --- No web tools — Placentia is Tier 3 (offline) ---
const offlineTools = [
  'Skill', 'Task', 'Read', 'Write', 'Edit',
  'Bash', 'Glob', 'Grep',
];

// --- Run via flow wrapper ---
const result = await runPlanReview({
  planBinderFile: binderPath,
  sessionDir,
  city: 'Placentia',
  projectAddress: '1232 N. Jefferson St., Unit \'A\', Placentia, CA 92870',
  reviewScope: 'administrative',
  model: 'claude-opus-4-6',
  maxTurns: 60,
  maxBudgetUsd: 10.00,
  allowedTools: offlineTools,
  onProgress: (msg: any) => handleProgressMessage(msg, startTime, tracker),
});

// --- Brief pause for file flush ---
await new Promise(r => setTimeout(r, 2000));

// --- Subagent timing analysis ---
tracker.printSummary();
tracker.analyzeFileTimestamps(sessionDir);

// --- File verification ---
console.log('\n--- Output Verification ---');

let passed = result.success;

// Required files (Phase 2-4 outputs)
const coreRequired = [
  'sheet_findings.json',
  'state_compliance.json',
  'draft_corrections.json',
  'draft_corrections.md',
  'review_summary.json',
];

// Also check pre-populated manifest
const allExpected = ['sheet-manifest.json', ...coreRequired];
const coreResult = verifySessionFiles(sessionDir, allExpected);

for (const f of coreResult.found) {
  const isPrePopulated = f.file === 'sheet-manifest.json';
  const sizeOk = isPrePopulated || f.size > 500;
  console.log(`  ${sizeOk ? '✓' : '⚠'} ${f.file} (${f.size} bytes)${isPrePopulated ? ' [pre-populated]' : ''}${!sizeOk ? ' — too small' : ''}`);
  if (!sizeOk && !isPrePopulated) passed = false;
}
for (const f of coreResult.missing) {
  // Try flexible naming patterns
  const pattern = REVIEW_FILE_PATTERNS.find(p => p.names[0] === f);
  const altPath = pattern ? findFileByPattern(sessionDir, pattern) : null;
  if (altPath) {
    const size = fs.statSync(altPath).size;
    console.log(`  ✓ ${path.basename(altPath)} (${size} bytes) [alt name for ${f}]`);
  } else {
    console.log(`  ✗ ${f} MISSING`);
    passed = false;
  }
}

// Optional file
const cityCompliancePath = path.join(sessionDir, 'city_compliance.json');
if (fs.existsSync(cityCompliancePath)) {
  console.log(`  ✓ city_compliance.json (${fs.statSync(cityCompliancePath).size} bytes) [optional]`);
}

// --- Draft corrections preview ---
const draftPath = path.join(sessionDir, 'draft_corrections.md');
if (fs.existsSync(draftPath)) {
  const draft = fs.readFileSync(draftPath, 'utf-8');
  const lines = draft.split('\n');
  console.log(`\n  Draft corrections: ${lines.length} lines`);
  // Show first few non-empty content lines
  const contentLines = lines.filter(l => l.trim().length > 0).slice(0, 8);
  for (const line of contentLines) {
    console.log(`    ${line.slice(0, 120)}`);
  }
}

// --- Review summary stats ---
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

// --- Final stats ---
console.log('\n--- Run Stats ---');
console.log(`  Cost: $${result.cost?.toFixed(2) ?? 'unknown'}`);
console.log(`  Turns: ${result.turns ?? 'unknown'}`);
console.log(`  Subtype: ${result.subtype ?? 'unknown'}`);

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`  Duration: ${elapsed}s (${(parseFloat(elapsed) / 60).toFixed(1)} min)`);
console.log(passed ? '\n✅ L3c ADMIN REVIEW TEST PASSED' : '\n❌ L3c ADMIN REVIEW TEST FAILED');
process.exit(passed ? 0 : 1);
