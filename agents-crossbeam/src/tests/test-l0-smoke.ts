/**
 * L0 Smoke Test — SDK Init + Skill Discovery
 *
 * Validates: SDK connects, skills are discovered from .claude/skills/,
 * tools are available, and the agent responds.
 *
 * Model: Haiku (cheapest, ~$0.01)
 * Expected duration: < 60 seconds
 */
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createQueryOptions } from '../utils/config.ts';

console.log('=== L0 Smoke Test: SDK Init + Skill Discovery ===\n');

const startTime = Date.now();

const q = query({
  prompt: 'List all available skills you can see. Then say SMOKE_OK.',
  options: {
    ...createQueryOptions({
      model: 'claude-haiku-4-5-20251001',
      maxTurns: 3,
      maxBudgetUsd: 0.10,
    }),
  },
});

let passed = true;

for await (const msg of q) {
  if (msg.type === 'system') {
    console.log('✓ SDK initialized');
    console.log('  Model:', msg.model);
    console.log('  Tools:', msg.tools?.join(', ') ?? '(none)');
    const hasSkill = msg.tools?.includes('Skill');
    if (hasSkill) {
      console.log('  ✓ Skill tool available');
    } else {
      console.log('  ✗ Skill tool MISSING');
      passed = false;
    }
  }

  if (msg.type === 'result') {
    const output = msg.result ?? '';

    // Check for all 6 expected ADU skills
    const expectedSkills = [
      'california-adu',
      'adu-corrections-flow',
      'adu-corrections-complete',
      'adu-city-research',
      'adu-targeted-page-viewer',
      'buena-park-adu',
    ];
    const foundSkills = expectedSkills.filter(s => output.includes(s));
    const hasSmokeOk = output.includes('SMOKE_OK');

    console.log('\n--- Agent Output ---');
    console.log(output.slice(0, 2000));
    console.log('--- End Output ---\n');

    console.log(`  ADU skills found: ${foundSkills.length}/${expectedSkills.length}`);
    for (const s of expectedSkills) {
      const found = output.includes(s);
      console.log(found ? `  ✓ ${s}` : `  · ${s} (not listed)`);
    }

    // Pass if at least 3 ADU skills are found — Haiku may abbreviate the list
    if (foundSkills.length >= 3) {
      console.log('✓ ADU skills discovered (≥3 found)');
    } else {
      console.log('✗ Too few ADU skills found (need ≥3)');
      passed = false;
    }

    if (hasSmokeOk) {
      console.log('✓ SMOKE_OK received');
    } else {
      console.log('✗ SMOKE_OK NOT received');
      passed = false;
    }

    console.log(`\n  Cost: $${msg.total_cost_usd?.toFixed(4) ?? 'unknown'}`);
    console.log(`  Subtype: ${msg.subtype ?? 'unknown'}`);
  }
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\n  Duration: ${elapsed}s`);
console.log(passed ? '\n✅ L0 SMOKE TEST PASSED' : '\n❌ L0 SMOKE TEST FAILED');
process.exit(passed ? 0 : 1);
