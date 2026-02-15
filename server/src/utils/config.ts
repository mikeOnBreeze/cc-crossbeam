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
  'city-review':          { maxTurns: 500, maxBudgetUsd: 50.00 },
  'corrections-analysis': { maxTurns: 500, maxBudgetUsd: 50.00 },
  'corrections-response': { maxTurns: 150, maxBudgetUsd: 20.00 },
};

// --- Onboarded Cities ---
// Cities with dedicated, verified skill data. These use offline reference files
// instead of web search — faster, more reliable, higher quality.
// Key: city slug (lowercase, hyphenated). Value: skill directory name.
export const ONBOARDED_CITIES: Record<string, string> = {
  'placentia': 'placentia-adu',
  'buena-park': 'buena-park-adu',
};

/** Normalize city name to slug for lookup */
export function citySlug(city: string): string {
  return city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/** Check if a city has a dedicated skill */
export function isCityOnboarded(city: string): boolean {
  return citySlug(city) in ONBOARDED_CITIES;
}

/** Get the skill name for an onboarded city */
export function getCitySkillName(city: string): string | null {
  return ONBOARDED_CITIES[citySlug(city)] ?? null;
}

// --- Skills per Flow ---
// Returns the skill list dynamically based on flow type and city.
// City-review: NO web search — onboarded cities only, use dedicated skill.
// Corrections-analysis: web search available as fallback, but onboarded cities use dedicated skill.
// Corrections-response: no research needed — just generates deliverables.

export function getFlowSkills(flowType: InternalFlowType, city: string): string[] {
  const citySkill = getCitySkillName(city);

  if (flowType === 'city-review') {
    // NO adu-city-research — city review only works with onboarded cities
    // NO adu-corrections-pdf — PDF generation happens post-sandbox on Cloud Run
    const skills = [
      'california-adu',
      'adu-plan-review',
      'adu-targeted-page-viewer',
    ];
    if (citySkill) skills.push(citySkill);
    return skills;
  }

  if (flowType === 'corrections-analysis') {
    // NO adu-corrections-pdf — PDF generation happens post-sandbox on Cloud Run
    const skills = [
      'california-adu',
      'adu-corrections-flow',
      'adu-targeted-page-viewer',
    ];
    if (citySkill) {
      // Onboarded city — use dedicated skill, skip web search
      skills.push(citySkill);
    } else {
      // Non-onboarded city — need web search
      skills.push('adu-city-research');
    }
    return skills;
  }

  // corrections-response — no research, just deliverables
  const skills = [
    'california-adu',
    'adu-corrections-complete',
  ];
  if (citySkill) skills.push(citySkill);
  return skills;
}

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

  // Build city routing instruction
  const citySkillName = getCitySkillName(city);
  const onboarded = isCityOnboarded(city);

  if (flowType === 'city-review') {
    const cityRouting = onboarded
      ? `CITY ROUTING: ${city} is an onboarded city with a dedicated skill (${citySkillName}).
Use the ${citySkillName} skill reference files for ALL city-level research in Phase 3B.
Do NOT use adu-city-research. Do NOT use WebSearch or WebFetch for city rules.
The ${citySkillName} skill has complete, verified data — it is better than any web search.
For Phase 3B, load the ${citySkillName} reference files and check findings against city-specific amendments, standard details, and IBs. This is Tier 3 (offline, ~30 sec).`
      : `CITY ROUTING: ${city} is NOT an onboarded city. Use adu-city-research for city rules.`;

    return `You are reviewing an ADU permit submission from the city's perspective.

PROJECT FILES: ${SANDBOX_FILES_PATH}/
CITY: ${city}
${addressLine}
${preExtractedNotice}
${cityRouting}

Use the adu-plan-review skill to:
1. Build the sheet manifest (read ONLY the cover sheet + title block crops — do NOT read full plan PNGs yourself)
2. Spawn subagents for sheet-by-sheet review (each subagent gets 2-3 sheet PNGs + checklist — see Phase 2 in skill)
3. Spawn subagents for code compliance (state law + city rules — see Phase 3 in skill)
4. Merge findings and generate draft corrections letter

SUBAGENT ARCHITECTURE — MANDATORY:
You are the orchestrator. You MUST use subagents for all image-heavy work:
- Phase 1: You read the cover sheet (1 image) to get the sheet index. If page count != index count, spawn subagents to read title block crops (small images) in batches.
- Phase 2: Spawn 3-5 review subagents grouped by discipline (Architectural, Site/Civil, Structural, MEP). Each subagent receives its assigned sheet PNGs + checklist reference file. Rolling window: 3 in flight at a time.
- Phase 3: Spawn subagents for state law lookup + city rules lookup (concurrent).
- Phase 4: YOU merge all subagent findings and write the output files. No images needed — just text.
Do NOT read full plan sheet PNGs (page-XX.png) in your main context. They will fill your context window and you will fail before completing the review.

Write all output files to ${SANDBOX_OUTPUT_PATH}/

CRITICAL RULES:
- Every correction MUST have a specific code citation. No false positives.
- ADUs are subject to OBJECTIVE standards only (Gov. Code 66314(b)(1)).
- State law preempts city rules — if city is more restrictive, flag the conflict.
- Use [REVIEWER: ...] blanks for structural, engineering, and judgment items.

PDF GENERATION: Do NOT generate PDFs. Do NOT use adu-corrections-pdf. Do NOT install reportlab, puppeteer, or any PDF tools.
Your job ends at draft_corrections.md. PDF conversion happens externally after this agent completes.

YOU MUST COMPLETE ALL PHASES. The job is NOT done until these files exist:
- sheet-manifest.json
- sheet_findings.json
- state_compliance.json
- draft_corrections.json
- draft_corrections.md
- review_summary.json`;
  }

  if (flowType === 'corrections-analysis') {
    const cityRouting = onboarded
      ? `CITY ROUTING: ${city} is an onboarded city with a dedicated skill (${citySkillName}).
For Phase 3B (city research), use the ${citySkillName} skill reference files INSTEAD of adu-city-research.
Do NOT use WebSearch or WebFetch for city rules — the ${citySkillName} skill has complete, verified data.
Load ${citySkillName} reference files and check corrections against city-specific amendments, standard details, and IBs.
Skip Phase 3.5 (city extraction) and Browser Fallback entirely — they are not needed for onboarded cities.`
      : `CITY ROUTING: ${city} is NOT an onboarded city. Use adu-city-research for Phase 3B city rules (Discovery → Extraction → optional Browser Fallback).`;

    return `You are analyzing corrections for an ADU permit on behalf of the contractor.

PROJECT FILES: ${SANDBOX_FILES_PATH}/
CITY: ${city}
${addressLine}
${preExtractedNotice}
${cityRouting}

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

CONTEXT MANAGEMENT — MANDATORY:
- NEVER read full-size plan sheet PNGs (page-XX.png) in your main context. They are large images that will fill your context window.
- The ONLY images you may read directly are: the cover sheet (page-01.png) and title block crops (title-block-XX.png, which are small).
- ALL sheet review work MUST happen in subagents. Spawn one subagent per discipline group (see adu-plan-review skill Phase 2). Each subagent reads only its assigned 2-3 sheet PNGs.
- Your main context handles orchestration: build the manifest, spawn review subagents, collect their text findings, merge with code research, write output files.
- If you read more than 2 full-size plan PNGs in your main context, you WILL run out of context and fail to complete the job.

CRITICAL RULES:
- NO false positives. Every correction MUST have a specific code citation.
- Drop findings that lack code basis.
- ADUs can ONLY be subject to objective standards (Gov. Code 66314(b)(1)).
- State law preempts city rules.
- Do NOT generate PDFs. Do NOT install Python, reportlab, or any PDF tools. Your job ends at draft_corrections.md.`;

export const CORRECTIONS_SYSTEM_APPEND = `You are working on CrossBeam, an ADU permit assistant for California.
Use available skills to research codes, analyze plans, and generate professional output.
Always write output files to the output directory provided in the prompt.

You are analyzing corrections for an ADU permit on behalf of a contractor.
Your goal is to categorize each correction item, research the relevant codes,
and prepare materials for a professional response.

CONTEXT MANAGEMENT — MANDATORY:
- NEVER read full-size plan sheet PNGs (page-XX.png) in your main context. They are large images that will fill your context window.
- Read the corrections letter PNGs directly (1-3 small pages — that's fine).
- Read the cover sheet (page-01.png) for the sheet index — that's fine.
- ALL plan sheet viewing MUST happen in subagents. Spawn subagents that each read only their assigned 2-3 sheet PNGs.
- Your main context handles orchestration: read corrections, build manifest, spawn research subagents, merge results, write output files.`;

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
