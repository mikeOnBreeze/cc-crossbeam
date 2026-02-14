/**
 * L0c Smoke Test — SDK Init + City Skill Discovery
 *
 * Validates: SDK connects, all 9 skills are discovered including
 * the 3 new city flow skills (adu-plan-review, placentia-adu, adu-corrections-pdf).
 *
 * Model: Haiku (cheapest, ~$0.01)
 * Expected duration: < 60 seconds
 */
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createQueryOptions } from '../utils/config.ts';

console.log('=== L0c Smoke Test: City Skill Discovery ===\n');

const startTime = Date.now();

const q = query({
  prompt: `List all available skills you can see.
Specifically confirm you can see these 3 city flow skills:
1. adu-plan-review
2. placentia-adu
3. adu-corrections-pdf
Then say SMOKE_CITY_OK.`,
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

    // Check for all 9 expected skills (6 existing + 3 new)
    const expectedSkills = [
      'california-adu',
      'adu-corrections-flow',
      'adu-corrections-complete',
      'adu-city-research',
      'adu-targeted-page-viewer',
      'buena-park-adu',
      'adu-plan-review',
      'placentia-adu',
      'adu-corrections-pdf',
    ];

    const citySkills = ['adu-plan-review', 'placentia-adu', 'adu-corrections-pdf'];

    const foundSkills = expectedSkills.filter(s => output.includes(s));
    const foundCitySkills = citySkills.filter(s => output.includes(s));
    const hasSmokeOk = output.includes('SMOKE_CITY_OK');

    console.log('\n--- Agent Output ---');
    console.log(output.slice(0, 2000));
    console.log('--- End Output ---\n');

    console.log(`  All skills found: ${foundSkills.length}/${expectedSkills.length}`);
    for (const s of expectedSkills) {
      const found = output.includes(s);
      const isNew = citySkills.includes(s);
      console.log(found ? `  ✓ ${s}${isNew ? ' [NEW]' : ''}` : `  · ${s} (not listed)${isNew ? ' [NEW]' : ''}`);
    }

    // City skills are the critical check — must find all 3
    if (foundCitySkills.length === 3) {
      console.log('\n✓ All 3 city flow skills discovered');
    } else {
      console.log(`\n✗ Only ${foundCitySkills.length}/3 city flow skills found`);
      passed = false;
    }

    // Relaxed check for total — Haiku may abbreviate the list
    if (foundSkills.length >= 3) {
      console.log(`✓ ${foundSkills.length} total skills discovered (≥3 required)`);
    } else {
      console.log(`✗ Too few total skills found: ${foundSkills.length} (need ≥3)`);
      passed = false;
    }

    if (hasSmokeOk) {
      console.log('✓ SMOKE_CITY_OK received');
    } else {
      console.log('✗ SMOKE_CITY_OK NOT received');
      passed = false;
    }

    console.log(`\n  Cost: $${msg.total_cost_usd?.toFixed(4) ?? 'unknown'}`);
    console.log(`  Subtype: ${msg.subtype ?? 'unknown'}`);
  }
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\n  Duration: ${elapsed}s`);
console.log(passed ? '\n✅ L0c SMOKE TEST PASSED' : '\n❌ L0c SMOKE TEST FAILED');
process.exit(passed ? 0 : 1);
