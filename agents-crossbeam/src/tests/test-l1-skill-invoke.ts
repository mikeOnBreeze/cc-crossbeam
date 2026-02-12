/**
 * L1 Skill Invocation Test — california-adu Skill
 *
 * Validates: Skill tool works in SDK context, reference files load
 * (28 california-adu files), agent writes output to session directory.
 *
 * Model: Haiku (testing wiring, not quality)
 * Expected duration: < 3 minutes
 * Expected cost: < $1.00
 */
import fs from 'fs';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createQueryOptions } from '../utils/config.ts';
import { createSession } from '../utils/session.ts';

console.log('=== L1 Skill Invocation Test: california-adu ===\n');

const startTime = Date.now();
const sessionDir = createSession('l1');
console.log(`  Session: ${sessionDir}\n`);

const q = query({
  prompt: `Use the california-adu skill to answer this question:
What are the 2026 California state setback requirements for a DETACHED ADU
on a single-family residential lot? Include rear and side setback minimums.

Write your answer as JSON to: ${sessionDir}/test-state-law.json

Format: { "rear_setback_ft": number, "side_setback_ft": number, "source": "string" }`,
  options: {
    ...createQueryOptions({
      model: 'claude-haiku-4-5-20251001',
      maxTurns: 15,
      maxBudgetUsd: 1.00,
    }),
  },
});

let passed = true;

for await (const msg of q) {
  if (msg.type === 'system') {
    console.log('✓ SDK initialized');
  }

  // Log assistant tool calls for visibility
  if (msg.type === 'assistant' && msg.message?.content) {
    for (const block of msg.message.content) {
      if (block.type === 'tool_use') {
        console.log(`  → Tool: ${block.name}${block.name === 'Skill' ? ` (${JSON.stringify(block.input?.skill ?? '')})` : ''}`);
      }
    }
  }

  if (msg.type === 'result') {
    console.log('\n--- Checking outputs ---');

    const filePath = `${sessionDir}/test-state-law.json`;
    const fileExists = fs.existsSync(filePath);

    if (fileExists) {
      console.log('✓ File written');
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        console.log(`  Rear setback: ${data.rear_setback_ft} ft`);
        console.log(`  Side setback: ${data.side_setback_ft} ft`);
        console.log(`  Source: ${data.source}`);

        // 2026 California ADU setbacks for detached: 4 ft rear, 4 ft side
        const correct = data.rear_setback_ft === 4 && data.side_setback_ft === 4;
        if (correct) {
          console.log('✓ Values correct (4 ft rear, 4 ft side)');
        } else {
          console.log('✗ Values WRONG — expected rear=4, side=4');
          passed = false;
        }
      } catch (e) {
        console.log('✗ JSON parse error:', (e as Error).message);
        passed = false;
      }
    } else {
      console.log('✗ File NOT written');
      passed = false;
    }

    console.log(`\n  Cost: $${msg.total_cost_usd?.toFixed(4) ?? 'unknown'}`);
    console.log(`  Subtype: ${msg.subtype ?? 'unknown'}`);
  }
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\n  Duration: ${elapsed}s`);
console.log(passed ? '\n✅ L1 SKILL INVOCATION TEST PASSED' : '\n❌ L1 SKILL INVOCATION TEST FAILED');
process.exit(passed ? 0 : 1);
