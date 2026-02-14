import ms from 'ms';

// --- Sandbox & Agent Defaults ---

export const CONFIG = {
  SANDBOX_TIMEOUT: ms('30m'),
  SANDBOX_VCPUS: 4,
  RUNTIME: 'node22' as const,
  MODEL: 'claude-opus-4-6',
};

export const SKIP_FILES = ['.DS_Store', 'Thumbs.db', '.gitkeep'];

// --- Paths inside the Vercel Sandbox ---

export const SANDBOX_FILES_PATH = '/vercel/sandbox/project-files';
export const SANDBOX_OUTPUT_PATH = '/vercel/sandbox/project-files/output';
export const SANDBOX_SKILLS_BASE = '/vercel/sandbox/.claude/skills';

// --- Flow Types ---
// 'city-review' and 'corrections-analysis' are stored in projects.flow_type
// 'corrections-response' is an internal flow type for Phase 2 of the contractor flow
export type InternalFlowType = 'city-review' | 'corrections-analysis' | 'corrections-response';

// --- Budget per Flow ---

export const FLOW_BUDGET: Record<InternalFlowType, { maxTurns: number; maxBudgetUsd: number }> = {
  'city-review':          { maxTurns: 100, maxBudgetUsd: 20.00 },
  'corrections-analysis': { maxTurns: 80,  maxBudgetUsd: 15.00 },
  'corrections-response': { maxTurns: 40,  maxBudgetUsd: 8.00  },
};

// --- Skills per Flow ---
// Which skill directories to copy into the sandbox for each flow type.
// Skills are read from server/skills/<name>/ on disk.

export const FLOW_SKILLS: Record<InternalFlowType, string[]> = {
  'city-review': [
    'california-adu',
    'adu-plan-review',
    'adu-targeted-page-viewer',
    'adu-city-research',
    'adu-corrections-pdf',
    'buena-park-adu',
    'placentia-adu',
  ],
  'corrections-analysis': [
    'california-adu',
    'adu-corrections-flow',
    'adu-targeted-page-viewer',
    'adu-city-research',
    'adu-corrections-pdf',
    'buena-park-adu',
    'placentia-adu',
  ],
  'corrections-response': [
    'california-adu',
    'adu-corrections-complete',
    'buena-park-adu',
    'placentia-adu',
  ],
};

// --- Prompt Builders ---

export function buildPrompt(
  flowType: InternalFlowType,
  city: string,
  address?: string,
  contractorAnswersJson?: string,
  preExtracted?: boolean,
): string {
  const addressLine = address ? `ADDRESS: ${address}` : '';

  // Pre-extraction notice — PNGs and title blocks are already ready
  const preExtractedNotice = preExtracted ? `
PRE-EXTRACTED DATA:
- Page PNGs are ALREADY extracted at full DPI in ${SANDBOX_FILES_PATH}/pages-png/
- Title block crops are ALREADY in ${SANDBOX_FILES_PATH}/title-blocks/
- Do NOT run extract-pages.sh or crop-title-blocks.sh — they are already done.
- Go straight to reading the cover sheet and building the sheet manifest.
` : '';

  if (flowType === 'city-review') {
    return `You are reviewing an ADU permit submission from the city's perspective.

PROJECT FILES: ${SANDBOX_FILES_PATH}/
CITY: ${city}
${addressLine}
${preExtractedNotice}
Use the adu-plan-review skill to:
1. Extract and catalog the plan pages from the PDF binder
2. Research ${city} ADU requirements (state + city code)
3. Review each relevant sheet against code requirements
4. Generate a draft corrections letter with code citations

Write all output files to ${SANDBOX_OUTPUT_PATH}/

CRITICAL RULES:
- Every correction MUST have a specific code citation. No false positives.
- ADUs are subject to OBJECTIVE standards only (Gov. Code 66314(b)(1)).
- State law preempts city rules — if city is more restrictive, flag the conflict.
- Use [REVIEWER: ...] blanks for structural, engineering, and judgment items.

YOU MUST COMPLETE ALL PHASES. The job is NOT done until these files exist:
- sheet-manifest.json
- sheet_findings.json
- state_compliance.json
- draft_corrections.json
- draft_corrections.md
- review_summary.json`;
  }

  if (flowType === 'corrections-analysis') {
    return `You are analyzing corrections for an ADU permit on behalf of the contractor.

PROJECT FILES: ${SANDBOX_FILES_PATH}/
CITY: ${city}
${addressLine}
${preExtractedNotice}
The project-files directory contains:
- A plan binder PDF (the original submittal)
- Corrections letter PNG files (the city's correction items — may be multiple pages)

Use the adu-corrections-flow skill to:
1. Read the corrections letter (PNG files)
2. Build a sheet manifest from the plan binder PDF
3. Research state + city codes for each correction item
4. Categorize each correction (contractor fix vs needs engineer vs already compliant)
5. Generate contractor questions where items need clarification

Write all output files to ${SANDBOX_OUTPUT_PATH}/

IMPORTANT:
- Follow the adu-corrections-flow skill instructions exactly
- Write all 8 output files
- Do NOT generate Phase 5 deliverables (response letter, scope, etc.)
- Stop after writing contractor_questions.json`;
  }

  // corrections-response (Phase 2)
  return `You have a session directory with corrections analysis artifacts and contractor answers.

PROJECT FILES: ${SANDBOX_FILES_PATH}/
OUTPUT DIRECTORY: ${SANDBOX_OUTPUT_PATH}/
CITY: ${city}
${addressLine}

The project-files/output/ directory contains files from the analysis phase:
- corrections_parsed.json — raw correction items with original wording
- corrections_categorized.json — items with categories + research context
- sheet-manifest.json — sheet ID to page number mapping
- state_law_findings.json — per-code-section lookups
- contractor_questions.json — what questions were asked
- contractor_answers.json — the contractor's responses

${contractorAnswersJson ? `CONTRACTOR ANSWERS (also written to contractor_answers.json):
${contractorAnswersJson}` : ''}

Use the adu-corrections-complete skill to generate the response package.

Read the analysis files and generate ALL FOUR deliverables:
1. response_letter.md — professional letter to the building department
2. professional_scope.md — work breakdown grouped by professional
3. corrections_report.md — status dashboard with checklist
4. sheet_annotations.json — per-sheet breakdown of changes

Write ALL output files to ${SANDBOX_OUTPUT_PATH}/
Follow the adu-corrections-complete skill instructions exactly.`;
}

// --- System Prompt Appends ---

export const CITY_REVIEW_SYSTEM_APPEND = `You are working on CrossBeam, an ADU permit assistant for California.
Use available skills to research codes, analyze plans, and generate professional output.
Always write output files to the output directory provided in the prompt.

You are reviewing an ADU plan submittal from the city's perspective.
Your job is to identify issues that violate state or city code and produce a draft corrections letter.

CRITICAL RULES:
- NO false positives. Every correction MUST have a specific code citation.
- Drop findings that lack code basis.
- ADUs can ONLY be subject to objective standards (Gov. Code 66314(b)(1)).
- State law preempts city rules.`;

export const CORRECTIONS_SYSTEM_APPEND = `You are working on CrossBeam, an ADU permit assistant for California.
Use available skills to research codes, analyze plans, and generate professional output.
Always write output files to the output directory provided in the prompt.

You are analyzing corrections for an ADU permit on behalf of a contractor.
Your goal is to categorize each correction item, research the relevant codes,
and prepare materials for a professional response.`;

export const RESPONSE_SYSTEM_APPEND = `You are working on CrossBeam, an ADU permit assistant for California.
Use available skills to generate professional deliverables.
Always write output files to the output directory provided in the prompt.

You are generating a corrections response package for a contractor.
You have the analysis artifacts and the contractor's answers to clarifying questions.
Generate professional, code-cited deliverables.`;

export function getSystemAppend(flowType: InternalFlowType): string {
  switch (flowType) {
    case 'city-review': return CITY_REVIEW_SYSTEM_APPEND;
    case 'corrections-analysis': return CORRECTIONS_SYSTEM_APPEND;
    case 'corrections-response': return RESPONSE_SYSTEM_APPEND;
  }
}
