/**
 * L3d Phase 5 Isolation — PDF Generation
 *
 * Tests PDF generation in isolation: takes a pre-made draft_corrections.md
 * and produces a professional corrections_letter.pdf via adu-corrections-pdf skill.
 *
 * Independent of L2c/L3c — uses CLI-generated draft as input.
 * Can run in parallel with L3c.
 *
 * Model: Opus (testing skill chain: adu-corrections-pdf → document-skills/pdf)
 * Expected duration: 2-5 minutes
 * Expected cost: $2-3
 */
import fs from 'fs';
import path from 'path';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createQueryOptions, PROJECT_ROOT } from '../utils/config.ts';
import { createSession } from '../utils/session.ts';
import { handleProgressMessage, SubagentTracker } from '../utils/progress.ts';

console.log('=== L3d: Phase 5 — PDF Generation ===\n');

const startTime = Date.now();
const sessionDir = createSession('l3d');

// Use existing CLI-generated draft as input
const draftSource = path.join(PROJECT_ROOT, 'test-assets/corrections/DRAFT-CORRECTIONS-1232-N-Jefferson.md');
if (!fs.existsSync(draftSource)) {
  console.log(`  ✗ Draft corrections source NOT FOUND: ${draftSource}`);
  process.exit(1);
}

const draftDest = path.join(sessionDir, 'draft_corrections.md');
fs.copyFileSync(draftSource, draftDest);
console.log(`  Session: ${sessionDir}`);
console.log(`  ✓ Copied draft_corrections.md (${fs.statSync(draftDest).size} bytes)\n`);

const tracker = new SubagentTracker(startTime);

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
    ...createQueryOptions({
      model: 'claude-opus-4-6',
      maxTurns: 30,
      maxBudgetUsd: 5.00,
      allowedTools: [
        'Skill', 'Task', 'Read', 'Write', 'Edit',
        'Bash', 'Glob', 'Grep',
      ],
    }),
  },
});

let passed = true;

for await (const msg of q) {
  handleProgressMessage(msg, startTime, tracker);

  if (msg.type === 'result') {
    await new Promise(r => setTimeout(r, 2000));

    tracker.printSummary();

    console.log('\n--- Output Verification ---');

    const pdfPath = path.join(sessionDir, 'corrections_letter.pdf');
    const screenshotPath = path.join(sessionDir, 'qa_screenshot.png');
    const qaResultPath = path.join(sessionDir, 'qa_result.json');

    const pdfExists = fs.existsSync(pdfPath);
    const ssExists = fs.existsSync(screenshotPath);
    const qaExists = fs.existsSync(qaResultPath);

    const pdfSize = pdfExists ? fs.statSync(pdfPath).size : 0;
    const ssSize = ssExists ? fs.statSync(screenshotPath).size : 0;

    console.log(`  ${pdfExists ? '✓' : '✗'} corrections_letter.pdf (${pdfExists ? `${(pdfSize / 1024).toFixed(0)} KB` : 'MISSING'})`);
    console.log(`  ${ssExists ? '✓' : '✗'} qa_screenshot.png (${ssExists ? `${(ssSize / 1024).toFixed(0)} KB` : 'MISSING'})`);
    console.log(`  ${qaExists ? '✓' : '✗'} qa_result.json`);

    if (!pdfExists) passed = false;
    if (pdfExists && pdfSize < 10000) {
      console.log('  ⚠ PDF smaller than 10KB — check content');
    }
    if (!ssExists) passed = false;

    if (qaExists) {
      try {
        const qaResult = JSON.parse(fs.readFileSync(qaResultPath, 'utf-8'));
        console.log(`\n  QA status: ${qaResult.status}`);
        console.log(`  QA notes: ${qaResult.notes}`);
      } catch {
        console.log('  ⚠ qa_result.json parse error');
      }
    }

    console.log('\n--- Run Stats ---');
    console.log(`  Cost: $${msg.total_cost_usd?.toFixed(2) ?? 'unknown'}`);
    console.log(`  Turns: ${msg.num_turns ?? 'unknown'}`);
    console.log(`  Subtype: ${msg.subtype ?? 'unknown'}`);
  }
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`  Duration: ${elapsed}s (${(parseFloat(elapsed) / 60).toFixed(1)} min)`);
console.log(passed ? '\n✅ L3d PDF GENERATION TEST PASSED' : '\n❌ L3d PDF GENERATION TEST FAILED');
process.exit(passed ? 0 : 1);
