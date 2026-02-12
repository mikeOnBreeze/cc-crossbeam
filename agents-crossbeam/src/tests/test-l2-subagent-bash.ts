/**
 * L2 Subagent + Bash + Image Reading Test
 *
 * Validates: Task tool spawns subagents in SDK context,
 * Bash tool executes, agent can read images.
 *
 * Model: Sonnet (balance of cost/capability)
 * Expected duration: < 5 minutes
 * Expected cost: < $2.00
 */
import fs from 'fs';
import path from 'path';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createQueryOptions, PROJECT_ROOT } from '../utils/config.ts';
import { createSession } from '../utils/session.ts';

console.log('=== L2 Subagent + Bash + Image Reading Test ===\n');

const startTime = Date.now();
const sessionDir = createSession('l2');
console.log(`  Session: ${sessionDir}`);

const testPage = path.resolve(PROJECT_ROOT, 'test-assets/mini/plan-page-A1.png');
console.log(`  Test image: ${testPage}`);
console.log(`  Image exists: ${fs.existsSync(testPage)}\n`);

const q = query({
  prompt: `You have a single plan sheet image at: ${testPage}

Your task:
1. Use the Task tool to spawn a subagent. The subagent must:
   a. Read the plan sheet image using the Read tool
   b. Identify the sheet ID from the title block (e.g., "A1", "S1", "CS")
   c. Describe what the sheet contains
   d. Return the result

You MUST use the Task tool to delegate this work — do NOT read the image yourself directly.
This test validates that the Task tool works for spawning subagents in the SDK context.

2. After receiving the subagent's result, write the final answer to: ${sessionDir}/test-sheet-id.json

Format: { "sheet_id": "string", "description": "string", "confidence": "high|medium|low" }`,
  options: {
    ...createQueryOptions({
      model: 'claude-sonnet-4-5-20250929',
      maxTurns: 20,
      maxBudgetUsd: 2.00,
    }),
  },
});

let passed = true;
let sawTaskTool = false;

for await (const msg of q) {
  if (msg.type === 'system') {
    console.log('✓ SDK initialized');
  }

  if (msg.type === 'assistant' && msg.message?.content) {
    for (const block of msg.message.content) {
      if (block.type === 'tool_use') {
        console.log(`  → Tool: ${block.name}`);
        if (block.name === 'Task') sawTaskTool = true;
      }
    }
  }

  if (msg.type === 'result') {
    console.log('\n--- Checking outputs ---');

    // Check subagent was spawned
    if (sawTaskTool) {
      console.log('✓ Task tool used (subagent spawned)');
    } else {
      console.log('✗ Task tool NOT used — agent did not spawn a subagent');
      passed = false;
    }

    // Check file output
    const filePath = `${sessionDir}/test-sheet-id.json`;
    const fileExists = fs.existsSync(filePath);

    if (fileExists) {
      console.log('✓ Sheet ID file written');
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        console.log(`  Sheet ID: ${data.sheet_id}`);
        console.log(`  Description: ${data.description}`);
        console.log(`  Confidence: ${data.confidence}`);

        if (data.sheet_id && typeof data.sheet_id === 'string' && data.sheet_id.length > 0) {
          console.log('✓ Valid sheet ID returned');
        } else {
          console.log('✗ Sheet ID is empty or missing');
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
    console.log(`  Turns: ${msg.num_turns ?? 'unknown'}`);
    console.log(`  Subtype: ${msg.subtype ?? 'unknown'}`);
  }
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\n  Duration: ${elapsed}s`);
console.log(passed ? '\n✅ L2 SUBAGENT TEST PASSED' : '\n❌ L2 SUBAGENT TEST FAILED');
process.exit(passed ? 0 : 1);
