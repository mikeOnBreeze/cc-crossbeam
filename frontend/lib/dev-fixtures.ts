import type { MessageRole } from '@/types/database'

export interface ScriptedMessage {
  percent: number // 0-100 timeline position
  phase: number // phase index
  role: MessageRole
  content: string
}

// ============================================
// CONTRACTOR FLOW — Corrections Analysis
// Phases: Extract, Analyze, Research, Categorize, Prepare
// ============================================
export const CONTRACTOR_MESSAGES: ScriptedMessage[] = [
  // Phase 0: Extract (0-20%)
  { percent: 1, phase: 0, role: 'system', content: 'Starting corrections letter analysis...' },
  { percent: 4, phase: 0, role: 'tool', content: 'Extracting page 1 of corrections letter...' },
  { percent: 7, phase: 0, role: 'tool', content: 'Extracting page 2 of corrections letter...' },
  { percent: 10, phase: 0, role: 'assistant', content: 'Found 11 correction items across 2 review sections (Building Plan Check + 2nd Review Comments)' },
  { percent: 14, phase: 0, role: 'tool', content: 'Parsing code citations: CPC Ch.7, CRC R302.1, ASCE 7-16 §30.11, B&P Code 5536.1...' },
  { percent: 17, phase: 0, role: 'assistant', content: 'Extracting sheet manifest from plan binder — 15 sheets identified' },
  { percent: 20, phase: 0, role: 'system', content: 'Extraction complete — 11 items parsed with code references and sheet mappings' },

  // Phase 1: Analyze (20-40%)
  { percent: 22, phase: 1, role: 'system', content: 'Analyzing correction items for complexity and required action...' },
  { percent: 25, phase: 1, role: 'tool', content: 'Reviewing sheet observations for CS, A1, A1.1, A2, A3...' },
  { percent: 28, phase: 1, role: 'assistant', content: 'Item 1 (resubmittal) — straightforward administrative requirement' },
  { percent: 31, phase: 1, role: 'assistant', content: 'Item 4 (utility connections) — requires contractor field data: sewer size, water meter, connection points' },
  { percent: 34, phase: 1, role: 'assistant', content: 'Item 5 (covered patio structural) — requires structural engineer: brace details, C&C wind calcs' },
  { percent: 37, phase: 1, role: 'tool', content: 'Cross-referencing corrections with plan sheets A1, A3, S1, S3...' },
  { percent: 40, phase: 1, role: 'system', content: 'Analysis complete — items classified by action type' },

  // Phase 2: Research (40-65%)
  { percent: 42, phase: 2, role: 'system', content: 'Researching California state building codes...' },
  { percent: 45, phase: 2, role: 'tool', content: 'Looking up CPC Chapter 7 — waste line and water supply sizing by fixture units...' },
  { percent: 48, phase: 2, role: 'assistant', content: 'CPC Table 703.2: 3" drain = 35 DFU, 4" drain = 216 DFU. ADU adds ~12 DFU.' },
  { percent: 50, phase: 2, role: 'tool', content: 'Looking up CRC R302.1 — fire separation distance requirements...' },
  { percent: 52, phase: 2, role: 'tool', content: 'Looking up ASCE 7-16 Section 30.11 — component & cladding wind loads...' },
  { percent: 55, phase: 2, role: 'system', content: 'Searching Placentia municipal code and building department resources...' },
  { percent: 57, phase: 2, role: 'tool', content: 'Found: ADU Sewer Connection Standard Detail at placentia.org/DocumentCenter/View/14798' },
  { percent: 59, phase: 2, role: 'tool', content: 'Checking PMC Chapter 20.40 — grading requirements: 5% landscape, 2% hardscape, 15ft adjacency' },
  { percent: 62, phase: 2, role: 'assistant', content: 'City research complete — 6 specific findings mapped to correction items' },
  { percent: 65, phase: 2, role: 'system', content: 'Research phase complete — state and city code references compiled' },

  // Phase 3: Categorize (65-80%)
  { percent: 67, phase: 3, role: 'system', content: 'Categorizing corrections by required action...' },
  { percent: 69, phase: 3, role: 'assistant', content: 'Items 1, 2, 9, 10 → AUTO_FIXABLE (4 items)' },
  { percent: 72, phase: 3, role: 'assistant', content: 'Items 4, 11 → NEEDS_CONTRACTOR_INPUT (2 items — utility data + drainage elevations)' },
  { percent: 75, phase: 3, role: 'assistant', content: 'Items 3, 5, 12, 13, 14 → NEEDS_PROFESSIONAL (5 items — stamps, structural, roof/fire)' },
  { percent: 78, phase: 3, role: 'tool', content: 'Building annotation map — 12 sheets affected across 10 revision actions' },
  { percent: 80, phase: 3, role: 'system', content: 'Categorization complete: 4 auto-fix, 2 contractor-input, 5 professional' },

  // Phase 4: Prepare (80-100%)
  { percent: 82, phase: 4, role: 'system', content: 'Generating questions for contractor...' },
  { percent: 85, phase: 4, role: 'assistant', content: 'Created 5 questions for Item 4 (utility connections — sewer, water, electrical, gas)' },
  { percent: 88, phase: 4, role: 'assistant', content: 'Created 3 questions for Item 11 (drainage — elevations, flow direction, surface materials)' },
  { percent: 91, phase: 4, role: 'tool', content: 'Adding context questions from professional items (structural status, ridge direction)' },
  { percent: 94, phase: 4, role: 'assistant', content: 'Preparing professional scope summaries for Designer, Structural Engineer, HERS Rater...' },
  { percent: 97, phase: 4, role: 'assistant', content: 'Analysis complete — 10 questions ready for contractor input' },
  { percent: 100, phase: 4, role: 'system', content: 'Completed in 847 seconds (14m 7s) — cost $3.42' },
]

// ============================================
// CITY FLOW — Plan Review
// Phases: Extract, Research, Review, Generate
// ============================================
export const CITY_MESSAGES: ScriptedMessage[] = [
  // Phase 0: Extract (0-25%)
  { percent: 1, phase: 0, role: 'system', content: 'Starting plan review for 1232 N. Jefferson St., Placentia...' },
  { percent: 4, phase: 0, role: 'tool', content: 'Extracting sheet manifest from plan binder...' },
  { percent: 7, phase: 0, role: 'assistant', content: 'Found 15 sheets across 5 disciplines' },
  { percent: 10, phase: 0, role: 'tool', content: 'Parsing sheet CS — Cover Sheet: governing codes, project data, vicinity map...' },
  { percent: 13, phase: 0, role: 'tool', content: 'Parsing sheets A1, A1.1, A2, A3 — Architectural: site plan, demo plan, floor plan, elevations...' },
  { percent: 16, phase: 0, role: 'tool', content: 'Parsing sheets SN1, SN2, S1, S2, S3 — Structural: notes, foundation, framing, details...' },
  { percent: 19, phase: 0, role: 'tool', content: 'Parsing sheets T-1, T-2, T-3 — Energy/Title 24: CF1R performance compliance...' },
  { percent: 22, phase: 0, role: 'assistant', content: 'Sheet manifest complete — 15 sheets indexed with discipline groups' },
  { percent: 25, phase: 0, role: 'system', content: 'Extraction complete — plan binder fully parsed' },

  // Phase 1: Research (25-45%)
  { percent: 27, phase: 1, role: 'system', content: 'Researching applicable codes for Placentia ADU...' },
  { percent: 30, phase: 1, role: 'tool', content: 'Checking Gov. Code § 66314 — California ADU standards...' },
  { percent: 33, phase: 1, role: 'assistant', content: 'ADU setbacks: 4 ft side/rear meets state minimum (§ 66314(d)(7))' },
  { percent: 35, phase: 1, role: 'tool', content: 'Reviewing CRC R302.1 — fire separation distance requirements...' },
  { percent: 38, phase: 1, role: 'tool', content: 'Searching Placentia municipal code for ADU-specific standards...' },
  { percent: 40, phase: 1, role: 'assistant', content: 'Found PMC § 23.73.060 — ADU development standards (10ft separation, materials match)' },
  { percent: 42, phase: 1, role: 'tool', content: 'Checking state preemption flags against city requirements...' },
  { percent: 45, phase: 1, role: 'assistant', content: '2 potential preemption issues identified — "entrance visibility" and "match architectural style" are potentially subjective' },

  // Phase 2: Review (45-80%)
  { percent: 47, phase: 2, role: 'system', content: 'Starting discipline-by-discipline plan review...' },
  { percent: 49, phase: 2, role: 'tool', content: 'Reviewing Architectural (Part A): cover sheet, site plan, demo plan...' },
  { percent: 52, phase: 2, role: 'assistant', content: 'Architectural A: 21 checks — 16 pass, 5 unclear' },
  { percent: 55, phase: 2, role: 'tool', content: 'Reviewing Architectural (Part B): floor plan, elevations, sections, roof plan...' },
  { percent: 58, phase: 2, role: 'assistant', content: 'Architectural B: 26 checks — 21 pass, 5 unclear' },
  { percent: 61, phase: 2, role: 'tool', content: 'Reviewing Site/Civil: grading, drainage, setbacks, lot coverage, utilities...' },
  { percent: 64, phase: 2, role: 'assistant', content: 'Site/Civil: 28 checks — 17 pass, 8 unclear, 1 N/A' },
  { percent: 67, phase: 2, role: 'tool', content: 'Reviewing Structural: foundations, framing, shear walls, connections...' },
  { percent: 70, phase: 2, role: 'assistant', content: 'Structural: 30 checks — 29 pass, 1 unclear (requires independent engineering review)' },
  { percent: 73, phase: 2, role: 'tool', content: 'Reviewing Energy/Title 24: CF1R compliance, climate zone, solar PV, HERS...' },
  { percent: 76, phase: 2, role: 'assistant', content: 'Energy: 25 checks — 23 pass, 2 unclear' },
  { percent: 79, phase: 2, role: 'system', content: 'All disciplines reviewed — 137 total checks: 115 pass, 0 fail, 21 unclear' },

  // Phase 3: Generate (80-100%)
  { percent: 81, phase: 3, role: 'system', content: 'Filtering 21 unclear findings for actionable corrections...' },
  { percent: 84, phase: 3, role: 'assistant', content: 'Dropped 14 findings with no code basis' },
  { percent: 86, phase: 3, role: 'assistant', content: 'Dropped 5 findings resolved by cross-referencing other sheets' },
  { percent: 88, phase: 3, role: 'tool', content: 'Running state compliance check against 21 findings...' },
  { percent: 90, phase: 3, role: 'tool', content: 'Running city compliance check — 6 city-level findings evaluated...' },
  { percent: 92, phase: 3, role: 'assistant', content: '7 items included as corrections: 3 site/civil, 2 building, 2 planning/zoning' },
  { percent: 95, phase: 3, role: 'tool', content: 'Drafting corrections letter with code citations and reviewer action tags...' },
  { percent: 97, phase: 3, role: 'assistant', content: 'Review complete — 137 checks, 7 corrections, 6 VERIFY items, 1 COMPLETE item' },
  { percent: 100, phase: 3, role: 'system', content: 'Completed in 723 seconds (12m 3s) — cost $2.87' },
]

// ============================================
// CAMERON'S ANSWERS — Auto-fill for contractor questions form
// Maps question_key → answer_text (serialized as string)
// ============================================
export const CAMERON_ANSWERS: Record<string, string> = {
  q_4_0: '4" ABS',
  q_4_1: '3/4"',
  q_4_2: 'Left side of main house, approximately 15 feet north of rear wall near back porch. Wye fitting into existing 4" ABS lateral. New two-way cleanout at connection point. 4" ABS from ADU at 2% slope.',
  q_4_3: 'New subpanel at ADU fed from main panel',
  q_4_4: 'All-electric (no gas)',
  q_11_0: 'Yes — I have surveyed elevations',
  q_11_1: 'Rear toward alley/property line',
  q_11_2: 'Mix — hardscape near ADU, landscape further out',
  q_5_0: 'Yes — engineer is working on it',
  q_12_0: 'Ridge runs east-west (parallel to street)',
}

// ============================================
// PROJECT IDS
// ============================================
export const DEMO_CITY_PROJECT_ID = 'a0000000-0000-0000-0000-000000000001'
export const DEMO_CONTRACTOR_PROJECT_ID = 'a0000000-0000-0000-0000-000000000002'
