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
