/**
 * Corrections Response Flow — Skill 2 query() wrapper
 *
 * Runs the adu-corrections-complete skill: reads research artifacts
 * + contractor answers, generates 4 deliverables.
 *
 * This skill runs cold — no conversation history from Skill 1.
 * Everything it needs is in the session directory files.
 */
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createQueryOptions } from '../utils/config.ts';

// Skill 2 doesn't need web or bash — pure file reading + writing
const SKILL2_TOOLS = [
  'Skill', 'Task', 'Read', 'Write', 'Edit', 'Glob', 'Grep',
];

export type ResponseOptions = {
  sessionDir: string;        // Session dir with Phase 1-4 files + contractor_answers.json
  onProgress?: (msg: any) => void;
  maxBudgetUsd?: number;
  maxTurns?: number;
  model?: string;
  abortController?: AbortController;
};

export type ResponseResult = {
  success: boolean;
  sessionId?: string;
  cost?: number;
  turns?: number;
  duration: number;
  subtype?: string;
};

export async function runResponseGeneration(opts: ResponseOptions): Promise<ResponseResult> {
  const startTime = Date.now();

  const prompt = `You have a session directory with corrections analysis files and contractor answers.

SESSION DIRECTORY: ${opts.sessionDir}

Use the adu-corrections-complete skill to generate the response package.

The session directory contains these files from the analysis phase:
- corrections_parsed.json — raw correction items with original wording
- corrections_categorized.json — items with categories + research context (the backbone)
- sheet-manifest.json — sheet ID to page number mapping
- state_law_findings.json — per-code-section lookups
- contractor_questions.json — what questions were asked
- contractor_answers.json — the contractor's responses

Read these files and generate all four deliverables:
1. response_letter.md — professional letter to the building department
2. professional_scope.md — work breakdown grouped by professional
3. corrections_report.md — status dashboard with checklist
4. sheet_annotations.json — per-sheet breakdown of changes

Write ALL output files to the session directory: ${opts.sessionDir}

Follow the adu-corrections-complete skill instructions exactly.`;

  const q = query({
    prompt,
    options: {
      ...createQueryOptions({
        model: opts.model,
        maxTurns: opts.maxTurns ?? 40,
        maxBudgetUsd: opts.maxBudgetUsd ?? 8.00,
        allowedTools: SKILL2_TOOLS,
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
