/**
 * Corrections Analysis Flow — Skill 1 query() wrapper
 *
 * Runs the adu-corrections-flow skill: reads corrections letter,
 * builds sheet manifest, researches codes, categorizes items,
 * generates contractor questions.
 *
 * Produces 8 JSON files in the session directory.
 * Stops after contractor_questions.json — does NOT generate deliverables.
 */
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createQueryOptions, DEFAULT_TOOLS } from '../utils/config.ts';

export type AnalysisOptions = {
  correctionsFile: string;   // Path to corrections letter (PNG or PDF)
  planBinderFile: string;    // Path to plan binder PDF
  sessionDir: string;        // Where to write output files
  city?: string;             // City name (auto-detected from letter if omitted)
  onProgress?: (msg: any) => void;
  allowedTools?: string[];   // Override default tools (e.g., remove WebSearch for offline)
  maxBudgetUsd?: number;
  maxTurns?: number;
  model?: string;
  abortController?: AbortController;
};

export type AnalysisResult = {
  success: boolean;
  sessionId?: string;
  cost?: number;
  turns?: number;
  duration: number;
  subtype?: string;
};

export async function runCorrectionsAnalysis(opts: AnalysisOptions): Promise<AnalysisResult> {
  const startTime = Date.now();

  const cityInstruction = opts.city
    ? `CITY: ${opts.city} — use this as the city for city research.`
    : 'Auto-detect the city name from the corrections letter.';

  const prompt = `You have a corrections letter and a plan binder PDF for an ADU permit.

CORRECTIONS LETTER: ${opts.correctionsFile}
PLAN BINDER PDF: ${opts.planBinderFile}
SESSION DIRECTORY: ${opts.sessionDir}
${cityInstruction}

Use the adu-corrections-flow skill to analyze these corrections.

The skill runs a 4-phase workflow:
1. Read the corrections letter → corrections_parsed.json
2. Build the sheet manifest from the plan binder → sheet-manifest.json
3. Research state law, city rules, and plan sheets → state_law_findings.json, city_discovery.json, city_research_findings.json, sheet_observations.json
4. Categorize corrections and generate contractor questions → corrections_categorized.json, contractor_questions.json

Write ALL output files to the session directory: ${opts.sessionDir}

IMPORTANT:
- Follow the adu-corrections-flow skill instructions exactly
- Write all 8 output files to the session directory
- Do NOT generate Phase 5 outputs (response letter, professional scope, etc.)
- Stop after writing contractor_questions.json`;

  const q = query({
    prompt,
    options: {
      ...createQueryOptions({
        model: opts.model,
        maxTurns: opts.maxTurns ?? 80,
        maxBudgetUsd: opts.maxBudgetUsd ?? 15.00,
        allowedTools: opts.allowedTools ?? DEFAULT_TOOLS,
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
