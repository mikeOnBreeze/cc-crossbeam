import path from 'path';

// Resolve project roots from this file's location (src/utils/)
export const AGENTS_ROOT = path.resolve(import.meta.dirname, '../..');  // agents-crossbeam/
export const PROJECT_ROOT = path.resolve(AGENTS_ROOT, '..');            // CC-Crossbeam/

const CROSSBEAM_PROMPT = `You are working on CrossBeam, an ADU permit assistant for California.
Use available skills to research codes, analyze plans, and generate professional output.
Always write output files to the session directory provided in the prompt.`;

export const DEFAULT_TOOLS = [
  'Skill', 'Task', 'Read', 'Write', 'Edit',
  'Bash', 'Glob', 'Grep', 'WebSearch', 'WebFetch',
];

export type FlowConfig = {
  model?: string;
  maxTurns?: number;
  maxBudgetUsd?: number;
  allowedTools?: string[];
  systemPromptAppend?: string;
  abortController?: AbortController;
};

export function createQueryOptions(flow: FlowConfig = {}) {
  const systemAppend = flow.systemPromptAppend
    ? `${CROSSBEAM_PROMPT}\n\n${flow.systemPromptAppend}`
    : CROSSBEAM_PROMPT;

  return {
    tools: { type: 'preset' as const, preset: 'claude_code' as const },
    systemPrompt: {
      type: 'preset' as const,
      preset: 'claude_code' as const,
      append: systemAppend,
    },
    cwd: AGENTS_ROOT,
    settingSources: ['project' as const],
    permissionMode: 'bypassPermissions' as const,
    allowDangerouslySkipPermissions: true,
    allowedTools: flow.allowedTools ?? DEFAULT_TOOLS,
    additionalDirectories: [PROJECT_ROOT],
    maxTurns: flow.maxTurns ?? 80,
    maxBudgetUsd: flow.maxBudgetUsd ?? 15.00,
    model: flow.model ?? 'claude-opus-4-6',
    includePartialMessages: true,
    abortController: flow.abortController ?? new AbortController(),
  };
}
