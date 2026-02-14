/**
 * City Plan Review Flow — single query() wrapper
 *
 * Runs the adu-plan-review skill: extracts plan pages,
 * reviews sheets against code-grounded checklists,
 * verifies findings against state + city law,
 * generates a draft corrections letter.
 *
 * Produces 6 required files in the session directory.
 * Single invocation — no human-in-the-loop pause.
 */
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createQueryOptions, DEFAULT_TOOLS } from '../utils/config.ts';

export type PlanReviewOptions = {
  planBinderFile: string;                    // Path to plan binder PDF
  sessionDir: string;                        // Where to write output files
  city: string;                              // City name (required — used for city routing)
  projectAddress?: string;                   // Improves city research and PDF header
  reviewScope?: 'full' | 'administrative';   // Defaults to 'full'
  onProgress?: (msg: any) => void;
  allowedTools?: string[];                   // Override default tools (e.g., remove WebSearch for offline)
  maxBudgetUsd?: number;
  maxTurns?: number;
  model?: string;
  abortController?: AbortController;
};

export type PlanReviewResult = {
  success: boolean;
  sessionId?: string;
  cost?: number;
  turns?: number;
  duration: number;
  subtype?: string;
};

const CITY_SYSTEM_PROMPT = `You are reviewing an ADU plan submittal from the city's perspective.
Your job is to identify issues that violate state or city code and produce a draft corrections letter.

CRITICAL RULES:
- NO false positives. Every correction MUST have a specific code citation.
- Drop findings that lack code basis — err on the side of missing items (the human reviewer catches them).
- Use [REVIEWER: ...] blanks for structural, engineering, and judgment items.
- ADUs can ONLY be subject to objective standards (Gov. Code § 66314(b)(1)).
- State law preempts city rules — if city is more restrictive, flag the conflict.
- Report BOTH code confidence and visual confidence for every finding.`;

function buildPlanReviewPrompt(opts: PlanReviewOptions): string {
  const scope = opts.reviewScope ?? 'full';
  const addressLine = opts.projectAddress
    ? `PROJECT ADDRESS: ${opts.projectAddress}`
    : '';

  const scopeInstruction = scope === 'administrative'
    ? `Scope: ADMINISTRATIVE — only review the cover sheet and title sheet against checklist-cover.md.
Do NOT review floor plans, elevations, structural, MEP, or other sheets.`
    : `Scope: FULL — review all sheets against their relevant checklists.
Group sheets by discipline and spawn review subagents (3-at-a-time rolling window).`;

  return `Review this ADU plan binder from the city's perspective.
Use the adu-plan-review skill.

PLAN BINDER PDF: ${opts.planBinderFile}
CITY: ${opts.city}
${addressLine}
SESSION DIRECTORY: ${opts.sessionDir}

${scopeInstruction}

Complete ALL phases of the adu-plan-review skill:
1. Extract PDF → PNGs + sheet-manifest.json (Phase 1)
2. Sheet-by-sheet review → sheet_findings.json (Phase 2)
3. Code compliance (state + city) → state_compliance.json, city_compliance.json (Phase 3)
4. Generate corrections letter → draft_corrections.json, draft_corrections.md, review_summary.json (Phase 4)

YOU MUST COMPLETE ALL PHASES — do NOT stop after spawning subagents.
The job is NOT done until ALL of these files exist in ${opts.sessionDir}:
- sheet-manifest.json
- sheet_findings.json
- state_compliance.json
- draft_corrections.json
- draft_corrections.md
- review_summary.json

Do NOT return success without writing ALL of these files.`;
}

export async function runPlanReview(opts: PlanReviewOptions): Promise<PlanReviewResult> {
  const startTime = Date.now();
  const prompt = buildPlanReviewPrompt(opts);

  const q = query({
    prompt,
    options: {
      ...createQueryOptions({
        model: opts.model,
        maxTurns: opts.maxTurns ?? 100,
        maxBudgetUsd: opts.maxBudgetUsd ?? 20.00,
        allowedTools: opts.allowedTools ?? DEFAULT_TOOLS,
        systemPromptAppend: CITY_SYSTEM_PROMPT,
        abortController: opts.abortController,
      }),
    },
  });

  for await (const msg of q) {
    if (opts.onProgress) opts.onProgress(msg);

    if (msg.type === 'result') {
      return {
        success: msg.subtype === 'success',
        sessionId: msg.session_id,
        cost: msg.total_cost_usd,
        turns: msg.num_turns,
        duration: Date.now() - startTime,
        subtype: msg.subtype,
      };
    }
  }

  return {
    success: false,
    duration: Date.now() - startTime,
    subtype: 'no_result',
  };
}
