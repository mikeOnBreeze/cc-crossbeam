/**
 * Post-Run File Verification
 *
 * Checks which expected output files exist in a session directory,
 * reports sizes, and detects completed pipeline phases.
 */
import fs from 'fs';
import path from 'path';

export type VerifyResult = {
  found: { file: string; size: number }[];
  missing: string[];
  allPresent: boolean;
};

/**
 * Verify which expected files exist in a session directory.
 */
export function verifySessionFiles(sessionDir: string, expectedFiles: string[]): VerifyResult {
  const found: { file: string; size: number }[] = [];
  const missing: string[] = [];

  for (const file of expectedFiles) {
    const filePath = path.join(sessionDir, file);
    if (fs.existsSync(filePath)) {
      const size = fs.statSync(filePath).size;
      found.push({ file, size });
    } else {
      missing.push(file);
    }
  }

  return {
    found,
    missing,
    allPresent: missing.length === 0,
  };
}

/**
 * Detect which pipeline phases have completed based on output files.
 *
 * Phase mapping (from adu-corrections-flow SKILL.md):
 * - Phase 1: corrections_parsed.json
 * - Phase 2: sheet-manifest.json
 * - Phase 3A: state_law_findings.json
 * - Phase 3B: city_discovery.json
 * - Phase 3C: sheet_observations.json
 * - Phase 3.5: city_research_findings.json
 * - Phase 4: corrections_categorized.json + contractor_questions.json
 * - Phase 5 (Skill 2): response_letter.md + professional_scope.md + corrections_report.md + sheet_annotations.json
 */
export function detectCompletedPhases(sessionDir: string): string[] {
  const phases: string[] = [];
  const has = (file: string) => fs.existsSync(path.join(sessionDir, file));

  if (has('corrections_parsed.json')) phases.push('Phase 1 (Parse)');
  if (has('sheet-manifest.json')) phases.push('Phase 2 (Manifest)');
  if (has('state_law_findings.json')) phases.push('Phase 3A (State Law)');
  if (has('city_discovery.json')) phases.push('Phase 3B (City Discovery)');
  if (has('sheet_observations.json')) phases.push('Phase 3C (Sheet Viewer)');
  if (has('city_research_findings.json')) phases.push('Phase 3.5 (City Extraction)');
  if (has('corrections_categorized.json') && has('contractor_questions.json')) {
    phases.push('Phase 4 (Categorize + Questions)');
  }
  if (has('response_letter.md') && has('professional_scope.md') &&
      has('corrections_report.md') && has('sheet_annotations.json')) {
    phases.push('Phase 5 (Response Package)');
  }

  return phases;
}

/**
 * Detect which city plan review phases have completed based on output files.
 *
 * Phase mapping (from adu-plan-review SKILL.md):
 * - Phase 1: sheet-manifest.json + pages-png/
 * - Phase 2: sheet_findings.json
 * - Phase 3A: state_compliance.json
 * - Phase 3B: city_compliance.json
 * - Phase 4: draft_corrections.json + draft_corrections.md + review_summary.json
 * - Phase 5: corrections_letter.pdf
 */
export function detectReviewPhases(sessionDir: string): string[] {
  const phases: string[] = [];
  const has = (file: string) => fs.existsSync(path.join(sessionDir, file));

  if (has('sheet-manifest.json')) phases.push('Phase 1 (Extract & Map)');
  if (has('sheet_findings.json')) phases.push('Phase 2 (Sheet Review)');
  if (has('state_compliance.json')) phases.push('Phase 3A (State Law)');
  if (has('city_compliance.json')) phases.push('Phase 3B (City Rules)');
  if (has('draft_corrections.json') && has('draft_corrections.md')) {
    phases.push('Phase 4 (Corrections Letter)');
  }
  if (has('review_summary.json')) phases.push('Phase 4 (Review Summary)');
  if (has('corrections_letter.pdf')) phases.push('Phase 5 (PDF Generation)');

  return phases;
}

/**
 * Find a file in sessionDir by checking multiple naming patterns.
 * Subagents name files however they want — accept multiple variants.
 */
export function findFileByPattern(
  sessionDir: string,
  patterns: { names: string[]; label: string },
): string | null {
  for (const name of patterns.names) {
    const fp = path.join(sessionDir, name);
    if (fs.existsSync(fp)) return fp;
  }
  return null;
}

/** Common file naming patterns for city review outputs. */
export const REVIEW_FILE_PATTERNS = [
  { names: ['sheet_findings.json', 'review_findings.json', 'sheet_review.json'], label: 'Sheet findings' },
  { names: ['state_compliance.json', 'state_law_findings.json', 'state_verification.json'], label: 'State compliance' },
  { names: ['city_compliance.json', 'city_findings.json', 'city_rules.json'], label: 'City compliance' },
  { names: ['draft_corrections.json', 'corrections_draft.json', 'corrections.json'], label: 'Draft corrections (JSON)' },
  { names: ['draft_corrections.md', 'corrections_letter.md', 'corrections_draft.md'], label: 'Draft corrections (MD)' },
  { names: ['review_summary.json', 'summary.json', 'review_stats.json'], label: 'Review summary' },
  { names: ['corrections_letter.pdf', 'draft_corrections.pdf', 'letter.pdf'], label: 'PDF' },
];
