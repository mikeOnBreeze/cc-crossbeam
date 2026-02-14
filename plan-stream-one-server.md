# Stream 1: Server Build Brief

> **For:** Dedicated Claude Code instance building the CrossBeam server
> **Author:** Foreman Claude (orchestrating instance)
> **Date:** Thursday, Feb 13, 2026
> **Deadline:** Monday Feb 16, 12:00 PM PST (hackathon submission)
> **Estimated time:** 3-4 hours

---

## What Is CrossBeam

CrossBeam is an AI-powered ADU (Accessory Dwelling Unit) permit review assistant for California. It uses Claude Opus 4.6 running inside Vercel Sandboxes to analyze building plans and corrections letters. Two personas:

1. **City Reviewer** — Reviews a plan binder against state + city code, produces a draft corrections letter
2. **Contractor** — Receives a corrections letter, analyzes each item, asks the contractor clarifying questions, then generates a professional response package

This is a hackathon project for the "Built with Opus 4.6: Claude Code Hackathon" (Feb 10-16, 2026). The app must be live and working for judges to click through.

## Architecture

```
Frontend (Next.js on Vercel)
    │
    │  POST /generate  { project_id, user_id, flow_type }
    ▼
THIS SERVER (Express on Google Cloud Run)
    │
    │  1. Responds { status: "processing" } immediately
    │  2. Creates Vercel Sandbox (30 min timeout)
    │  3. Installs Claude Code CLI + Agent SDK in sandbox
    │  4. Downloads project files from Supabase Storage into sandbox
    │  5. Copies CrossBeam skills into sandbox (.claude/skills/)
    │  6. Runs agent via query() — agent streams messages to Supabase
    │  7. Agent finishes — uploads results to Supabase FROM INSIDE the sandbox
    │  8. Server updates project status
    │  9. Cleans up sandbox
    ▼
Vercel Sandbox (Agent SDK + Claude Opus 4.6 + Skills)
    │
    ├── Reads files from: /vercel/sandbox/project-files/
    ├── Reads skills from: /vercel/sandbox/.claude/skills/
    ├── Streams messages to: Supabase crossbeam.messages (fire-and-forget)
    ├── Uploads outputs to: Supabase Storage crossbeam-outputs bucket
    └── Creates output record in: Supabase crossbeam.outputs table
```

---

## Reference: Mako Server

**Location:** `~/openai-demo/CC-Agents-SDK-test-1225/mako/server/`

**CRITICAL: Before writing ANY code, read EVERY file in the Mako server `src/` directory.** The Mako server is a working, deployed demand letter generator for lawyers. It has the exact same architecture (Express on Cloud Run, Vercel Sandboxes, Supabase). We are forking it, not building from scratch.

**What Mako does vs CrossBeam:**

| Aspect | Mako (source) | CrossBeam (target) |
|---|---|---|
| Domain | Personal injury demand letters | ADU permit review |
| Flow types | Single flow (generate demand letter) | Three internal flows (city-review, corrections-analysis, corrections-response) |
| Skills | 1 skill (demand-letter) | 9 skills (california-adu, adu-plan-review, etc.) |
| Schema | `mako` | `crossbeam` |
| Billing | Credits system (use_credits RPC) | None (hackathon) |
| User assets | Letterhead templates, sample demands | None |
| Model | claude-opus-4-5 | claude-opus-4-6 |
| Output files | Demand letter + memo (.md + .docx) | Varies by flow (corrections letter, response letter, checklist, etc.) |
| Input files | Medical records, insurance docs | Plan binder PDF + corrections letter PNGs |

**Key patterns to KEEP from Mako:**
1. Respond immediately, process async
2. Sandbox uploads directly to Supabase (resilient to server crashes)
3. Message streaming (fire-and-forget DB inserts)
4. Skills bundled in Docker image, copied into sandbox at runtime
5. Zod request validation
6. Agent script written into sandbox as `.mjs` file, run with `node agent.mjs`

---

## Mako Server File Map

Read each of these before writing any CrossBeam code:

```
~/openai-demo/CC-Agents-SDK-test-1225/mako/server/
├── src/
│   ├── index.ts                 → Express setup, health check, route mounting
│   ├── routes/
│   │   └── generate.ts          → POST /generate endpoint (validate, respond, async process)
│   ├── services/
│   │   ├── sandbox.ts           → Full sandbox lifecycle (create, install, download, skills, run, extract)
│   │   └── supabase.ts          → DB queries (status updates, file fetching, output records, messages)
│   └── utils/
│       └── config.ts            → Constants (timeouts, model, prompts, paths)
├── skills/
│   └── demand-letter/           → Bundled skill directory (copied into sandbox)
├── Dockerfile                   → Node 22 slim, PORT 8080
├── package.json                 → express, @vercel/sandbox, zod, @supabase/supabase-js, ms
└── tsconfig.json                → ES2022, NodeNext module resolution
```

---

## Files to Create

All files go in `CC-Crossbeam/server/`. Here is every file, the Mako source, and exactly what to do.

### Directory Structure

```
CC-Crossbeam/server/
├── src/
│   ├── index.ts              ← COPY AS-IS from Mako
│   ├── routes/
│   │   └── generate.ts       ← ADAPT from Mako
│   ├── services/
│   │   ├── sandbox.ts        ← ADAPT from Mako
│   │   └── supabase.ts       ← ADAPT from Mako
│   └── utils/
│       └── config.ts         ← REWRITE (CrossBeam-specific)
├── skills/                   ← COPY from agents-crossbeam (resolve symlinks)
│   ├── california-adu/
│   ├── adu-plan-review/
│   ├── adu-corrections-flow/
│   ├── adu-corrections-complete/
│   ├── adu-targeted-page-viewer/
│   ├── adu-city-research/
│   ├── adu-corrections-pdf/
│   ├── buena-park-adu/
│   └── placentia-adu/
├── Dockerfile                ← COPY AS-IS from Mako (change log message only)
├── package.json              ← COPY from Mako, change name
└── tsconfig.json             ← COPY AS-IS from Mako
```

---

### 1. `src/index.ts` — COPY AS-IS

**Source:** `~/openai-demo/CC-Agents-SDK-test-1225/mako/server/src/index.ts`

Copy verbatim. Only change the console.log from "Mako server" to "CrossBeam server":

```typescript
// Line 26: Change
console.log(`Mako server listening on port ${PORT}`);
// To:
console.log(`CrossBeam server listening on port ${PORT}`);
```

Everything else (Express setup, JSON middleware, health check, error handler, route mounting) stays identical.

---

### 2. `src/utils/config.ts` — REWRITE

**Source:** `~/openai-demo/CC-Agents-SDK-test-1225/mako/server/src/utils/config.ts`
**Action:** Do NOT copy. Write this from scratch:

```typescript
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
): string {
  const addressLine = address ? `ADDRESS: ${address}` : '';

  if (flowType === 'city-review') {
    return `You are reviewing an ADU permit submission from the city's perspective.

PROJECT FILES: ${SANDBOX_FILES_PATH}/
CITY: ${city}
${addressLine}

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
```

---

### 3. `src/routes/generate.ts` — ADAPT

**Source:** `~/openai-demo/CC-Agents-SDK-test-1225/mako/server/src/routes/generate.ts`

**Changes from Mako:**

1. **Request schema** — Replace `case_notes` with `flow_type`. Add `'corrections-response'` as an accepted value:

```typescript
const generateRequestSchema = z.object({
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
  flow_type: z.enum(['city-review', 'corrections-analysis', 'corrections-response']),
});
```

2. **Remove ALL credits logic** — Delete `useCredits` import and the credit deduction block (lines 94-101 in Mako). No billing for hackathon.

3. **Remove `getActiveUserAssets`** — CrossBeam has no user assets concept. Delete the import and the user asset fetching block.

4. **Remove `case_notes`** — No case_notes field. Delete from destructure and from `processGeneration` args.

5. **For `corrections-response`** — Read contractor answers from DB before launching sandbox:

```typescript
import {
  updateProjectStatus,
  getProjectFiles,
  getContractorAnswers,
  getPhase1Outputs,
  getProject,
} from '../services/supabase.js';
import { runCrossBeamFlow } from '../services/sandbox.js';

// In processGeneration():
async function processGeneration(
  projectId: string,
  userId: string,
  flowType: InternalFlowType,
) {
  const startTime = Date.now();

  try {
    // Get project details (city, address)
    const project = await getProject(projectId);
    const city = project.city || 'Unknown';
    const address = project.project_address || undefined;

    // Set initial processing status
    if (flowType === 'corrections-analysis') {
      await updateProjectStatus(projectId, 'processing-phase1');
    } else if (flowType === 'corrections-response') {
      await updateProjectStatus(projectId, 'processing-phase2');
    } else {
      await updateProjectStatus(projectId, 'processing');
    }

    // Get files to download into sandbox
    const fileRecords = await getProjectFiles(projectId);
    if (fileRecords.length === 0) {
      throw new Error('No files found for project');
    }

    const files = fileRecords.map((r) => ({
      filename: r.filename,
      storage_path: r.storage_path,
      file_type: r.file_type,
    }));

    // For corrections-response: also need Phase 1 outputs + contractor answers
    let contractorAnswersJson: string | undefined;
    let phase1Artifacts: Record<string, unknown> | undefined;

    if (flowType === 'corrections-response') {
      const answers = await getContractorAnswers(projectId);
      contractorAnswersJson = JSON.stringify(answers, null, 2);
      const phase1 = await getPhase1Outputs(projectId);
      phase1Artifacts = phase1?.raw_artifacts as Record<string, unknown> | undefined;
    }

    // Required env vars
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
    if (!supabaseUrl || !supabaseKey) throw new Error('Supabase not configured');

    // Run the agent
    await runCrossBeamFlow({
      files,
      flowType,
      city,
      address,
      apiKey,
      supabaseUrl,
      supabaseKey,
      projectId,
      userId,
      contractorAnswersJson,
      phase1Artifacts,
    });

    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    console.log(`Generation completed for project ${projectId} in ${duration} minutes`);
  } catch (error) {
    console.error(`Generation failed for project ${projectId}:`, error);
    try {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      await updateProjectStatus(projectId, 'failed', msg);
    } catch (statusErr) {
      console.log('Could not update status (sandbox may have already set it)');
    }
  }
}
```

6. **Keep the same respond-immediately pattern** — `res.json({ status: 'processing', project_id })` before the async call.

---

### 4. `src/services/sandbox.ts` — ADAPT

**Source:** `~/openai-demo/CC-Agents-SDK-test-1225/mako/server/src/services/sandbox.ts`

This is the biggest file. Keep the overall structure (create sandbox, install deps, download files, copy skills, run agent, extract outputs, cleanup). Change the specifics.

**Changes:**

#### 4a. Imports and Types

Replace Mako-specific types:

```typescript
import {
  CONFIG,
  SKIP_FILES,
  SANDBOX_FILES_PATH,
  SANDBOX_OUTPUT_PATH,
  SANDBOX_SKILLS_BASE,
  FLOW_SKILLS,
  FLOW_BUDGET,
  buildPrompt,
  getSystemAppend,
  type InternalFlowType,
} from '../utils/config.js';
import { insertMessage } from './supabase.js';
```

Remove interfaces: `TimelineEvent`, `MedicalTimeline`, `GeneratedOutput`, `UserAsset`.

Keep interfaces: `FileToUpload`, `FileToDownload`.

Add:

```typescript
interface ProjectFile {
  filename: string;
  storage_path: string;
  file_type: string;  // 'plan-binder' | 'corrections-letter' | 'other'
}

interface RunFlowOptions {
  files: ProjectFile[];
  flowType: InternalFlowType;
  city: string;
  address?: string;
  apiKey: string;
  supabaseUrl: string;
  supabaseKey: string;
  projectId: string;
  userId: string;
  contractorAnswersJson?: string;
  phase1Artifacts?: Record<string, unknown>;
}
```

#### 4b. `readSkillFilesFromDisk()` — Make flow-aware

Instead of reading one skill (`demand-letter`), read multiple skills based on flow type:

```typescript
function readSkillFilesFromDisk(flowType: InternalFlowType): Map<string, FileToUpload[]> {
  const skillNames = FLOW_SKILLS[flowType];
  const result = new Map<string, FileToUpload[]>();

  for (const skillName of skillNames) {
    const skillDir = path.join(__dirname, '../../skills', skillName);
    const files: FileToUpload[] = [];

    if (!fs.existsSync(skillDir)) {
      console.warn(`Skill directory not found: ${skillDir}`);
      continue;
    }

    function walk(currentPath: string, basePath: string) {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      for (const entry of entries) {
        if (shouldSkipFile(entry.name)) continue;
        const fullPath = path.join(currentPath, entry.name);
        const relativePath = path.relative(basePath, fullPath);

        if (entry.isDirectory()) {
          walk(fullPath, basePath);
        } else {
          files.push({
            relativePath,
            content: fs.readFileSync(fullPath),
          });
        }
      }
    }

    walk(skillDir, skillDir);
    result.set(skillName, files);
  }

  return result;
}
```

#### 4c. `copySkillsToSandbox()` — Copy multiple skills

```typescript
async function copySkillsToSandbox(
  sandbox: Sandbox,
  flowType: InternalFlowType,
): Promise<void> {
  const skillsMap = readSkillFilesFromDisk(flowType);
  let totalFiles = 0;

  for (const [skillName, files] of skillsMap) {
    const skillPath = `${SANDBOX_SKILLS_BASE}/${skillName}`;
    console.log(`Copying skill ${skillName} (${files.length} files)...`);

    // Get unique directories
    const dirs = new Set<string>();
    for (const file of files) {
      const dir = path.dirname(file.relativePath);
      if (dir !== '.') {
        const parts = dir.split('/');
        for (let i = 1; i <= parts.length; i++) {
          dirs.add(parts.slice(0, i).join('/'));
        }
      }
    }

    // Create skill directory and subdirs
    await sandbox.runCommand({ cmd: 'mkdir', args: ['-p', skillPath] });
    for (const dir of Array.from(dirs).sort()) {
      await sandbox.runCommand({ cmd: 'mkdir', args: ['-p', `${skillPath}/${dir}`] });
    }

    // Upload skill files
    await sandbox.writeFiles(
      files.map((file) => ({
        path: `${skillPath}/${file.relativePath}`,
        content: file.content,
      }))
    );

    totalFiles += files.length;
  }

  console.log(`Copied ${skillsMap.size} skills (${totalFiles} total files) to sandbox`);
}
```

#### 4d. `buildDownloadManifest()` — CrossBeam file types

Replace Mako's client files + user assets with CrossBeam's plan binder + corrections letter:

```typescript
function buildDownloadManifest(files: ProjectFile[]): FileToDownload[] {
  return files.map((f) => {
    // Determine the bucket based on storage_path prefix
    // Demo files are in crossbeam-demo-assets, user uploads in crossbeam-uploads
    let bucket: string;
    if (f.storage_path.startsWith('crossbeam-demo-assets/')) {
      bucket = 'crossbeam-demo-assets';
    } else {
      bucket = 'crossbeam-uploads';
    }

    // Strip bucket prefix from storage path if present
    const storagePath = f.storage_path.replace(/^crossbeam-(demo-assets|uploads)\//, '');

    return {
      bucket,
      storagePath,
      targetFilename: f.filename,
    };
  });
}
```

**IMPORTANT: The corrections letter is TWO PNG files, not a single PDF.** The download manifest handles this automatically because both PNG files are separate rows in `crossbeam.files` with `file_type = 'corrections-letter'`. Each gets its own download entry (e.g., `1232-n-jefferson-corrections-P1.png` and `1232-n-jefferson-corrections-P2.png`).

#### 4e. `downloadFilesInSandbox()` — Adapt paths

Change `SANDBOX_CLIENT_PATH` to `SANDBOX_FILES_PATH`. Remove user assets parameter. The download script template stays almost the same — just update the constant reference.

For `corrections-response` flow, also need to download Phase 1 artifacts into the output directory. Add a section that writes Phase 1 JSON files into the sandbox:

```typescript
async function writePhase1Artifacts(
  sandbox: Sandbox,
  phase1Artifacts: Record<string, unknown>,
  contractorAnswersJson: string,
): Promise<void> {
  // Create output directory
  await sandbox.runCommand({ cmd: 'mkdir', args: ['-p', SANDBOX_OUTPUT_PATH] });

  // Write each artifact as a JSON file
  const filesToWrite: Array<{ path: string; content: Buffer }> = [];

  for (const [filename, content] of Object.entries(phase1Artifacts)) {
    const jsonContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    filesToWrite.push({
      path: `${SANDBOX_OUTPUT_PATH}/${filename}`,
      content: Buffer.from(jsonContent),
    });
  }

  // Also write contractor_answers.json
  filesToWrite.push({
    path: `${SANDBOX_OUTPUT_PATH}/contractor_answers.json`,
    content: Buffer.from(contractorAnswersJson),
  });

  await sandbox.writeFiles(filesToWrite);
  console.log(`Wrote ${filesToWrite.length} Phase 1 artifacts + contractor answers to sandbox`);
}
```

#### 4f. `installDependencies()` — Remove pizzip

Keep Claude Code CLI and Agent SDK. Remove the pizzip install (CrossBeam doesn't generate Word docs):

```typescript
async function installDependencies(sandbox: Sandbox): Promise<void> {
  console.log('Installing Claude Code CLI...');
  const cliResult = await sandbox.runCommand({
    cmd: 'npm',
    args: ['install', '-g', '@anthropic-ai/claude-code'],
    sudo: true,
  });
  if (cliResult.exitCode !== 0) {
    throw new Error('Failed to install Claude Code CLI');
  }

  console.log('Installing Claude Agent SDK and Supabase...');
  const sdkResult = await sandbox.runCommand({
    cmd: 'npm',
    args: ['install', '@anthropic-ai/claude-agent-sdk', '@supabase/supabase-js'],
  });
  if (sdkResult.exitCode !== 0) {
    throw new Error('Failed to install Agent SDK');
  }
}
```

#### 4g. `runAgent()` — Rewrite the agent script template

The agent script that runs INSIDE the sandbox needs major changes. Here is the full structure:

```typescript
async function runAgent(
  sandbox: Sandbox,
  options: {
    apiKey: string;
    projectId: string;
    userId: string;
    supabaseUrl: string;
    supabaseKey: string;
    flowType: InternalFlowType;
    city: string;
    address?: string;
    contractorAnswersJson?: string;
  },
): Promise<{ exitCode: number }> {
  const {
    apiKey, projectId, userId, supabaseUrl, supabaseKey,
    flowType, city, address, contractorAnswersJson,
  } = options;

  const prompt = buildPrompt(flowType, city, address, contractorAnswersJson);
  const budget = FLOW_BUDGET[flowType];
  const systemAppend = getSystemAppend(flowType);

  // Determine what status to set on completion
  const completedStatus = flowType === 'corrections-analysis' ? 'awaiting-answers' : 'completed';
  const flowPhase = flowType === 'city-review' ? 'review'
    : flowType === 'corrections-analysis' ? 'analysis'
    : 'response';

  const agentScript = `
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient('${supabaseUrl}', '${supabaseKey}');
const projectId = '${projectId}';
const userId = '${userId}';
const FILES_PATH = '${SANDBOX_FILES_PATH}';
const OUTPUT_PATH = '${SANDBOX_OUTPUT_PATH}';

// Fire-and-forget message logging
function logMessage(role, content) {
  supabase
    .schema('crossbeam')
    .from('messages')
    .insert({ project_id: projectId, role, content })
    .then(() => {})
    .catch(err => console.error('Failed to log message:', err.message));
}

// Upload file to Supabase Storage
async function uploadFile(filename, content) {
  const storagePath = userId + '/' + projectId + '/' + filename;
  const { error } = await supabase.storage
    .from('crossbeam-outputs')
    .upload(storagePath, content, { upsert: true });
  if (error) {
    console.error('Upload error for', filename, ':', error.message);
    throw error;
  }
  console.log('Uploaded:', storagePath);
  return storagePath;
}

// Read all output files from the output directory
function readOutputFiles() {
  if (!fs.existsSync(OUTPUT_PATH)) return {};
  const result = {};
  const files = fs.readdirSync(OUTPUT_PATH);
  for (const file of files) {
    const filePath = path.join(OUTPUT_PATH, file);
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Try to parse as JSON, otherwise store as string
        try {
          result[file] = JSON.parse(content);
        } catch {
          result[file] = content;
        }
      } catch {
        // Binary file — skip for raw_artifacts
        console.log('Skipping binary file:', file);
      }
    }
  }
  return result;
}

// Create output record
async function createOutputRecord(data) {
  const { error } = await supabase
    .schema('crossbeam')
    .from('outputs')
    .insert({
      project_id: projectId,
      flow_phase: '${flowPhase}',
      version: 1,
      ...data,
    });
  if (error) {
    console.error('Failed to create output record:', error.message);
    throw error;
  }
  console.log('Output record created');
}

// Insert contractor questions into contractor_answers table
async function insertContractorQuestions(questions) {
  if (!questions || !Array.isArray(questions)) {
    console.log('No contractor questions to insert');
    return;
  }
  const rows = questions.map(q => ({
    project_id: projectId,
    question_key: q.key || q.question_key || q.id || 'q_' + Math.random().toString(36).slice(2),
    question_text: q.question || q.question_text || q.text || '',
    question_type: q.type || 'text',
    options: q.options ? JSON.stringify(q.options) : null,
    context: q.context || q.why || null,
    correction_item_id: q.correction_item_id || q.item_id || null,
    is_answered: false,
  }));

  const { error } = await supabase
    .schema('crossbeam')
    .from('contractor_answers')
    .insert(rows);

  if (error) {
    console.error('Failed to insert questions:', error.message);
    throw error;
  }
  console.log('Inserted', rows.length, 'contractor questions');
}

// Update project status
async function updateProjectStatus(status, errorMessage = null) {
  const updateData = { status, updated_at: new Date().toISOString() };
  if (errorMessage) updateData.error_message = errorMessage;
  const { error } = await supabase
    .schema('crossbeam')
    .from('projects')
    .update(updateData)
    .eq('id', projectId);
  if (error) {
    console.error('Failed to update project status:', error.message);
    throw error;
  }
  console.log('Project status updated to:', status);
}

async function runAgent() {
  console.log('Agent starting...');
  logMessage('system', 'Agent starting...');

  const startTime = Date.now();

  try {
    const result = await query({
      prompt: ${JSON.stringify('')},  // Will be replaced below
      options: {
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
        maxTurns: ${budget.maxTurns},
        maxBudgetUsd: ${budget.maxBudgetUsd},
        tools: { type: 'preset', preset: 'claude_code' },
        systemPrompt: {
          type: 'preset',
          preset: 'claude_code',
          append: ${JSON.stringify(systemAppend)},
        },
        settingSources: ['project'],
        cwd: '/vercel/sandbox',
        model: '${CONFIG.MODEL}',
      },
    });

    let finalResult = null;
    for await (const message of result) {
      if (message.type === 'assistant') {
        const content = message.message?.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === 'text' && block.text) {
              const text = block.text.length > 200 ? block.text.substring(0, 200) + '...' : block.text;
              console.log('Assistant:', text);
              logMessage('assistant', text);
            } else if (block.type === 'tool_use') {
              console.log('Tool:', block.name);
              logMessage('tool', block.name);
            }
          }
        }
      } else if (message.type === 'result') {
        finalResult = message;
        console.log('Result:', message.subtype);
        console.log('Turns:', message.num_turns);
        console.log('Cost: $' + (message.total_cost_usd || 0).toFixed(4));
        logMessage('system', 'Completed in ' + message.num_turns + ' turns, cost: $' + (message.total_cost_usd || 0).toFixed(4));
      }
    }

    // === RESILIENT UPLOAD PHASE ===
    logMessage('system', 'Processing outputs...');

    // Read all output files
    const allFiles = readOutputFiles();
    console.log('Found output files:', Object.keys(allFiles));

    // Build output record based on flow phase
    const outputData = {
      raw_artifacts: allFiles,
      agent_cost_usd: finalResult?.total_cost_usd || 0,
      agent_turns: finalResult?.num_turns || 0,
      agent_duration_ms: Date.now() - startTime,
    };

    const flowPhase = '${flowPhase}';

    if (flowPhase === 'review') {
      // City review outputs
      outputData.corrections_letter_md = allFiles['draft_corrections.md'] || null;
      outputData.review_checklist_json = allFiles['draft_corrections.json'] || null;
      // Upload PDF if it exists
      if (fs.existsSync(path.join(OUTPUT_PATH, 'corrections_letter.pdf'))) {
        const pdfContent = fs.readFileSync(path.join(OUTPUT_PATH, 'corrections_letter.pdf'));
        outputData.corrections_letter_pdf_path = await uploadFile('corrections_letter.pdf', pdfContent);
      }
    } else if (flowPhase === 'analysis') {
      // Corrections Phase 1 outputs
      outputData.corrections_analysis_json = allFiles['corrections_categorized.json'] || null;
      outputData.contractor_questions_json = allFiles['contractor_questions.json'] || null;

      // Insert contractor questions into contractor_answers table
      const questions = allFiles['contractor_questions.json'];
      if (questions) {
        const questionsList = Array.isArray(questions) ? questions : questions.questions || [];
        await insertContractorQuestions(questionsList);
      }
    } else if (flowPhase === 'response') {
      // Corrections Phase 2 outputs
      outputData.response_letter_md = allFiles['response_letter.md'] || null;
      outputData.professional_scope_md = allFiles['professional_scope.md'] || null;
      outputData.corrections_report_md = allFiles['corrections_report.md'] || null;
      // Upload PDF if it exists
      if (fs.existsSync(path.join(OUTPUT_PATH, 'response_letter.pdf'))) {
        const pdfContent = fs.readFileSync(path.join(OUTPUT_PATH, 'response_letter.pdf'));
        outputData.response_letter_pdf_path = await uploadFile('response_letter.pdf', pdfContent);
      }
    }

    // Create output record
    await createOutputRecord(outputData);

    // Update project status
    await updateProjectStatus('${completedStatus}');
    logMessage('system', 'Processing complete');

    // Output result JSON for server-side parsing
    console.log('\\n__RESULT_JSON__');
    console.log(JSON.stringify({
      success: finalResult?.subtype === 'success',
      cost: finalResult?.total_cost_usd || 0,
      turns: finalResult?.num_turns || 0,
      duration: finalResult?.duration_ms || 0,
      uploadedInSandbox: true,
    }));

    await new Promise(resolve => setTimeout(resolve, 500));

  } catch (error) {
    console.error('Agent error:', error);
    logMessage('system', 'Agent error: ' + error.message);
    try {
      await updateProjectStatus('failed', error.message);
    } catch (statusErr) {
      console.error('Failed to update status:', statusErr.message);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    process.exit(1);
  }
}

runAgent();
`;

  // IMPORTANT: Replace the placeholder prompt in the template
  // The prompt variable is already defined, we embed it via JSON.stringify
  const finalScript = agentScript.replace(
    `prompt: ${JSON.stringify('')},  // Will be replaced below`,
    `prompt: ${JSON.stringify(prompt)},`,
  );

  await sandbox.writeFiles([
    { path: '/vercel/sandbox/agent.mjs', content: Buffer.from(finalScript) },
  ]);

  const result = await sandbox.runCommand({
    cmd: 'node',
    args: ['agent.mjs'],
    env: { ANTHROPIC_API_KEY: apiKey },
  });

  return { exitCode: result.exitCode };
}
```

**NOTE on the prompt injection in the agent script:** The Mako pattern embeds the prompt directly into the script template using `JSON.stringify`. This is safe because the prompt is server-generated (not user input). Follow the same pattern.

#### 4h. `extractOutputs()` — Can be simplified or removed

In Mako, `extractOutputs()` reads files back from the sandbox after the agent finishes. But in the CrossBeam pattern (copied from Mako's resilient upload design), **the agent script inside the sandbox handles its own uploads directly to Supabase.** This means the server does NOT need to extract outputs — they are already in the DB by the time the sandbox exits.

The `extractOutputs()` function in Mako is essentially dead code (it runs but its return value is unused because the agent script already uploaded). You can **remove it entirely** in CrossBeam.

#### 4i. Main export function

Rename from `generateDemandLetter()` to `runCrossBeamFlow()`:

```typescript
export async function runCrossBeamFlow(options: RunFlowOptions): Promise<void> {
  let sandbox: Sandbox | null = null;

  try {
    // Create sandbox
    await insertMessage(options.projectId, 'system', 'Creating secure sandbox environment...');
    sandbox = await createSandbox();

    // Install dependencies
    await insertMessage(options.projectId, 'system', 'Installing dependencies...');
    await installDependencies(sandbox);

    // Download project files
    await insertMessage(options.projectId, 'system', `Downloading ${options.files.length} project files...`);
    await downloadFilesInSandbox(
      sandbox,
      options.files,
      options.supabaseUrl,
      options.supabaseKey,
    );

    // For corrections-response: write Phase 1 artifacts + answers into sandbox
    if (options.flowType === 'corrections-response' && options.phase1Artifacts && options.contractorAnswersJson) {
      await insertMessage(options.projectId, 'system', 'Loading analysis artifacts...');
      await writePhase1Artifacts(sandbox, options.phase1Artifacts, options.contractorAnswersJson);
    }

    // Copy skills
    await insertMessage(options.projectId, 'system', 'Preparing AI agent...');
    await copySkillsToSandbox(sandbox, options.flowType);

    // Run agent
    const flowLabel = options.flowType === 'city-review' ? 'plan review'
      : options.flowType === 'corrections-analysis' ? 'corrections analysis'
      : 'response generation';
    await insertMessage(options.projectId, 'system', `Starting ${flowLabel}...`);

    const result = await runAgent(sandbox, {
      apiKey: options.apiKey,
      projectId: options.projectId,
      userId: options.userId,
      supabaseUrl: options.supabaseUrl,
      supabaseKey: options.supabaseKey,
      flowType: options.flowType,
      city: options.city,
      address: options.address,
      contractorAnswersJson: options.contractorAnswersJson,
    });

    console.log(`Agent completed with exit code: ${result.exitCode}`);

  } finally {
    if (sandbox) {
      console.log('Stopping sandbox...');
      await sandbox.stop();
    }
  }
}
```

---

### 5. `src/services/supabase.ts` — ADAPT

**Source:** `~/openai-demo/CC-Agents-SDK-test-1225/mako/server/src/services/supabase.ts`

**Changes:**

1. **All `.schema('mako')` becomes `.schema('crossbeam')`** — global find-and-replace.

2. **`client_files` table becomes `files` table.**

3. **Remove these Mako-specific functions:**
   - `getActiveUserAssets()` — no user assets
   - `getProjectNotes()` — no case_notes
   - `useCredits()` — no billing
   - `uploadOutput()` — uploads happen from inside the sandbox
   - `createOutputRecord()` — the agent script creates this from inside the sandbox

4. **Update `updateProjectStatus()`** — expand the status type to include CrossBeam states:

```typescript
export async function updateProjectStatus(
  projectId: string,
  status: 'ready' | 'uploading' | 'processing' | 'processing-phase1' |
          'awaiting-answers' | 'processing-phase2' | 'completed' | 'failed',
  errorMessage?: string,
) {
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (errorMessage !== undefined) {
    updateData.error_message = errorMessage;
  }

  const { error } = await supabase
    .schema('crossbeam')
    .from('projects')
    .update(updateData)
    .eq('id', projectId);

  if (error) {
    console.error('Failed to update project status:', error);
    throw error;
  }
}
```

5. **Rename `getClientFiles()` to `getProjectFiles()`:**

```typescript
export async function getProjectFiles(projectId: string) {
  const { data, error } = await supabase
    .schema('crossbeam')
    .from('files')
    .select('*')
    .eq('project_id', projectId);

  if (error) {
    console.error('Failed to get project files:', error);
    throw error;
  }
  return data || [];
}
```

6. **Add new functions:**

```typescript
export async function getProject(projectId: string) {
  const { data, error } = await supabase
    .schema('crossbeam')
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    console.error('Failed to get project:', error);
    throw error;
  }
  return data;
}

export async function getContractorAnswers(projectId: string) {
  const { data, error } = await supabase
    .schema('crossbeam')
    .from('contractor_answers')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to get contractor answers:', error);
    throw error;
  }
  return data || [];
}

export async function getPhase1Outputs(projectId: string) {
  const { data, error } = await supabase
    .schema('crossbeam')
    .from('outputs')
    .select('*')
    .eq('project_id', projectId)
    .eq('flow_phase', 'analysis')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Failed to get Phase 1 outputs:', error);
    throw error;
  }
  return data;
}
```

7. **Keep `insertMessage()` unchanged** except for the schema swap.

---

### 6. `Dockerfile` — COPY AS-IS

**Source:** `~/openai-demo/CC-Agents-SDK-test-1225/mako/server/Dockerfile`

Copy verbatim. No changes needed. The Dockerfile copies `dist/` and `skills/` into the image, which is exactly what CrossBeam needs.

```dockerfile
FROM node:22-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy compiled code and skills
COPY dist/ ./dist/
COPY skills/ ./skills/

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Start server
CMD ["node", "dist/index.js"]
```

---

### 7. `package.json` — COPY + RENAME

**Source:** `~/openai-demo/CC-Agents-SDK-test-1225/mako/server/package.json`

Copy and change:
- `"name"` from `"mako-server"` to `"crossbeam-server"`
- Remove the `"clone-user"` script (Mako-specific)

Keep everything else (same dependencies: `@vercel/sandbox`, `express`, `ms`, `zod`, `@supabase/supabase-js`).

```json
{
  "name": "crossbeam-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.49.0",
    "@vercel/sandbox": "^1.1.0",
    "express": "^5.0.1",
    "ms": "^2.1.3",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/ms": "^0.7.34",
    "@types/node": "^22.10.2",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

---

### 8. `tsconfig.json` — COPY AS-IS

**Source:** `~/openai-demo/CC-Agents-SDK-test-1225/mako/server/tsconfig.json`

Copy verbatim.

---

### 9. `skills/` Directory — COPY (resolve symlinks)

The skills in `agents-crossbeam/.claude/skills/` are **symlinks** pointing to `adu-skill-development/skill/`. When copying to `server/skills/`, you must **resolve the symlinks** and copy the actual directories.

**Command to copy all 9 skills:**

```bash
cd /Users/breez/openai-demo/CC-Crossbeam
mkdir -p server/skills
for skill in california-adu adu-plan-review adu-corrections-flow adu-corrections-complete adu-targeted-page-viewer adu-city-research adu-corrections-pdf buena-park-adu placentia-adu; do
  cp -rL agents-crossbeam/.claude/skills/$skill server/skills/$skill
done
```

The `-L` flag on `cp` follows symlinks and copies the actual content.

**All 9 skills and their flow assignments:**

| Skill | city-review | corrections-analysis | corrections-response |
|---|---|---|---|
| `california-adu` | YES | YES | YES |
| `adu-plan-review` | YES | - | - |
| `adu-corrections-flow` | - | YES | - |
| `adu-corrections-complete` | - | - | YES |
| `adu-targeted-page-viewer` | YES | YES | - |
| `adu-city-research` | YES | YES | - |
| `adu-corrections-pdf` | YES | YES | - |
| `buena-park-adu` | YES | YES | YES |
| `placentia-adu` | YES | YES | YES |

Each skill directory contains markdown instruction files and reference files. They are loaded into the sandbox's `.claude/skills/` directory and then Claude Code discovers them automatically via `settingSources: ['project']`.

---

## Supabase Schema Reference

The server reads and writes to these tables in the `crossbeam` schema. The schema is created separately (Stream 0). Here is what the server needs to know:

### `crossbeam.projects`

| Column | Type | Server Usage |
|---|---|---|
| `id` | UUID | Read (from request) |
| `user_id` | UUID | Read (from request) |
| `flow_type` | TEXT | Read (to determine which flow to run) |
| `project_name` | TEXT | Not used by server |
| `project_address` | TEXT | Read (passed to prompt) |
| `city` | TEXT | Read (passed to prompt, critical for code lookup) |
| `status` | TEXT | Write (status transitions throughout flow) |
| `error_message` | TEXT | Write (on failure) |
| `is_demo` | BOOLEAN | Not used by server |
| `updated_at` | TIMESTAMPTZ | Write (on every status update) |

**Status transitions the server manages:**

- City review: `ready` -> `processing` -> `completed` (or `failed`)
- Contractor Phase 1: `ready` -> `processing-phase1` -> `awaiting-answers` (or `failed`)
- Contractor Phase 2: `awaiting-answers` -> `processing-phase2` -> `completed` (or `failed`)

### `crossbeam.files`

| Column | Type | Server Usage |
|---|---|---|
| `id` | UUID | Not used |
| `project_id` | UUID | Read (to find files for a project) |
| `file_type` | TEXT | Read (plan-binder, corrections-letter) |
| `filename` | TEXT | Read (used as download target filename) |
| `storage_path` | TEXT | Read (Supabase Storage path for download) |

### `crossbeam.messages`

| Column | Type | Server Usage |
|---|---|---|
| `id` | BIGSERIAL | Not used by server (frontend polls with `WHERE id > last_seen`) |
| `project_id` | UUID | Write (insert) |
| `role` | TEXT | Write (system, assistant, tool) |
| `content` | TEXT | Write (message content) |

Server inserts messages. Frontend polls them. Fire-and-forget — do not await.

### `crossbeam.outputs`

| Column | Type | Server Usage |
|---|---|---|
| `project_id` | UUID | Write |
| `flow_phase` | TEXT | Write ('analysis', 'response', 'review') |
| `version` | INTEGER | Write (always 1) |
| `corrections_letter_md` | TEXT | Write (city review) |
| `corrections_letter_pdf_path` | TEXT | Write (city review, storage path) |
| `review_checklist_json` | JSONB | Write (city review) |
| `corrections_analysis_json` | JSONB | Write (Phase 1) |
| `contractor_questions_json` | JSONB | Write (Phase 1) |
| `response_letter_md` | TEXT | Write (Phase 2) |
| `response_letter_pdf_path` | TEXT | Write (Phase 2, storage path) |
| `professional_scope_md` | TEXT | Write (Phase 2) |
| `corrections_report_md` | TEXT | Write (Phase 2) |
| `raw_artifacts` | JSONB | Write (ALL intermediate files as keyed JSON) |
| `agent_cost_usd` | NUMERIC | Write |
| `agent_turns` | INTEGER | Write |
| `agent_duration_ms` | INTEGER | Write |

### `crossbeam.contractor_answers`

| Column | Type | Server Usage |
|---|---|---|
| `project_id` | UUID | Write (insert after Phase 1) / Read (before Phase 2) |
| `question_key` | TEXT | Write (from contractor_questions.json) |
| `question_text` | TEXT | Write |
| `question_type` | TEXT | Write (text, number, choice, measurement) |
| `options` | JSONB | Write (for choice-type questions) |
| `context` | TEXT | Write (why this question matters) |
| `correction_item_id` | TEXT | Write (links to correction item) |
| `answer_text` | TEXT | Read (user's response, may be NULL if not yet answered) |
| `is_answered` | BOOLEAN | Read |

---

## Demo Data Reference

For testing, these demo resources exist:

- **Judge user_id:** `1440ab46-738c-40b4-9e59-3b2c32971879`
- **City review project:** `a0000000-0000-0000-0000-000000000001` (flow_type: `city-review`, city: `Placentia`)
- **Contractor project:** `a0000000-0000-0000-0000-000000000002` (flow_type: `corrections-analysis`, city: `Placentia`)
- **Demo files in `crossbeam-demo-assets` bucket:**
  - `Binder-1232-N-Jefferson.pdf` (plan binder)
  - `1232-n-jefferson-corrections-P1.png` (corrections letter page 1)
  - `1232-n-jefferson-corrections-P2.png` (corrections letter page 2)
- **City:** Placentia
- **Address:** 1232 N Jefferson

The `crossbeam.files` table has rows linking these demo files to the demo projects.

---

## Environment Variables

Create `server/.env.local` with:

```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://bhjrpklzqyrelnhexhlj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=(from existing .env.local in repo root or agents-crossbeam/)
VERCEL_TEAM_ID=(from Vercel dashboard)
VERCEL_PROJECT_ID=(from Vercel dashboard)
VERCEL_TOKEN=(from Vercel settings)
PORT=8080
```

The `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` already exist in `agents-crossbeam/.env.local`. Copy them.

The `VERCEL_TEAM_ID`, `VERCEL_PROJECT_ID`, and `VERCEL_TOKEN` are for creating Vercel Sandboxes. If Mike has not set these up yet, the server will fail at sandbox creation. These can be added later.

---

## Testing Instructions

### Local Build & Run

```bash
cd /Users/breez/openai-demo/CC-Crossbeam/server
npm install
npm run build
node --env-file .env.local dist/index.js
```

### Health Check

```bash
curl http://localhost:8080/health
# Expected: {"status":"ok","timestamp":"2026-02-14T..."}
```

### Test City Review Flow

```bash
curl -X POST http://localhost:8080/generate \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "a0000000-0000-0000-0000-000000000001",
    "user_id": "1440ab46-738c-40b4-9e59-3b2c32971879",
    "flow_type": "city-review"
  }'
# Expected immediate response: {"status":"processing","project_id":"a0000000-..."}
# Then monitor: crossbeam.messages table for streaming messages
# Then monitor: crossbeam.projects table for status -> 'completed'
# Then check: crossbeam.outputs table for the output record
```

### Test Contractor Phase 1

```bash
curl -X POST http://localhost:8080/generate \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "a0000000-0000-0000-0000-000000000002",
    "user_id": "1440ab46-738c-40b4-9e59-3b2c32971879",
    "flow_type": "corrections-analysis"
  }'
# Expected: status -> 'processing-phase1' -> 'awaiting-answers'
# Check: crossbeam.contractor_answers table should have questions
```

### Test Contractor Phase 2

After Phase 1 completes and `contractor_answers` has rows, manually answer a few questions in the DB:

```sql
UPDATE crossbeam.contractor_answers
SET answer_text = 'Yes, confirmed', is_answered = true
WHERE project_id = 'a0000000-0000-0000-0000-000000000002';
```

Then:

```bash
curl -X POST http://localhost:8080/generate \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "a0000000-0000-0000-0000-000000000002",
    "user_id": "1440ab46-738c-40b4-9e59-3b2c32971879",
    "flow_type": "corrections-response"
  }'
# Expected: status -> 'processing-phase2' -> 'completed'
# Check: crossbeam.outputs table should have Phase 2 output record
```

### What to Monitor During Tests

- **Supabase Table Editor** — watch `crossbeam.messages` for real-time agent messages
- **Supabase Table Editor** — watch `crossbeam.projects` for status transitions
- **Terminal** — watch server console logs for sandbox lifecycle
- **Supabase Storage** — check `crossbeam-outputs` bucket for uploaded PDFs

---

## What NOT to Do

- **Don't add Stripe/billing.** No credits, no payments. This is a hackathon.
- **Don't add user assets concept.** No letterhead templates, no sample demands. CrossBeam doesn't have these.
- **Don't add `case_notes` field.** Mako has attorney notes. CrossBeam doesn't.
- **Don't overcomplicate.** Every extra abstraction is time you don't have. The deadline is Monday.
- **Don't create new files when editing Mako files works.** Fork the Mako code, change what needs changing, move on.
- **Don't add authentication to the `/generate` endpoint.** The frontend proxy handles auth. The Cloud Run server trusts incoming requests (it's not publicly advertised).
- **Don't worry about the `extractOutputs()` function.** The agent script uploads directly to Supabase from inside the sandbox. Server-side extraction is a backup that Mako had but never used. Omit it.
- **Don't install pizzip or any Word doc generation.** CrossBeam outputs are Markdown + JSON. No `.docx` files.
- **Don't add a `scripts/` directory.** Mako had a clone-user script. CrossBeam doesn't need it.

---

## Summary of All Changes from Mako

| File | Action | Key Changes |
|---|---|---|
| `index.ts` | Copy | Change "Mako" to "CrossBeam" in log message |
| `config.ts` | Rewrite | 3 flow types, 9 skills, flow-specific prompts, flow-specific budgets, claude-opus-4-6 |
| `generate.ts` | Adapt | Add `flow_type`, remove credits/billing, remove user assets, remove case_notes, add Phase 2 data loading |
| `sandbox.ts` | Adapt | Multi-skill loading, CrossBeam file types, corrections-response Phase 1 artifact injection, flow-aware output extraction, rename export function |
| `supabase.ts` | Adapt | Schema mako->crossbeam, client_files->files, remove billing functions, add getProject/getContractorAnswers/getPhase1Outputs |
| `Dockerfile` | Copy | No changes |
| `package.json` | Copy | Rename to crossbeam-server, remove clone-user script |
| `tsconfig.json` | Copy | No changes |
| `skills/` | New | Copy 9 skill directories (resolve symlinks) |

---

*Written: Feb 13, 2026 — Stream 1 brief for the CrossBeam server build.*
*Hackathon deadline: Monday Feb 16, 12:00 PM PST.*
