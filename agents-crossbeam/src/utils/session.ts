import fs from 'fs';
import path from 'path';
import { AGENTS_ROOT } from './config.ts';

/**
 * Create a timestamped session directory under agents-crossbeam/sessions/.
 * Returns the absolute path to the new session directory.
 */
export function createSession(prefix: string = 'session'): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const sessionDir = path.join(AGENTS_ROOT, 'sessions', `${prefix}-${timestamp}`);
  fs.mkdirSync(sessionDir, { recursive: true });
  return sessionDir;
}

/**
 * Returns an object with absolute paths to all 13 expected output files for a session.
 */
export function getSessionFiles(sessionDir: string) {
  return {
    // Phase 1-4 outputs (Skill 1 — corrections analysis)
    correctionsParsed: path.join(sessionDir, 'corrections_parsed.json'),
    sheetManifest: path.join(sessionDir, 'sheet-manifest.json'),
    stateLawFindings: path.join(sessionDir, 'state_law_findings.json'),
    cityDiscovery: path.join(sessionDir, 'city_discovery.json'),
    cityResearchFindings: path.join(sessionDir, 'city_research_findings.json'),
    sheetObservations: path.join(sessionDir, 'sheet_observations.json'),
    correctionsCategorized: path.join(sessionDir, 'corrections_categorized.json'),
    contractorQuestions: path.join(sessionDir, 'contractor_questions.json'),
    contractorAnswers: path.join(sessionDir, 'contractor_answers.json'),
    // Phase 5 outputs (Skill 2 — response generation)
    responseLetter: path.join(sessionDir, 'response_letter.md'),
    professionalScope: path.join(sessionDir, 'professional_scope.md'),
    correctionsReport: path.join(sessionDir, 'corrections_report.md'),
    sheetAnnotations: path.join(sessionDir, 'sheet_annotations.json'),
  };
}
