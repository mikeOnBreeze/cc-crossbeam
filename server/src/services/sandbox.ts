import { Sandbox } from '@vercel/sandbox';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  CONFIG,
  SKIP_FILES,
  SANDBOX_FILES_PATH,
  SANDBOX_OUTPUT_PATH,
  SANDBOX_SKILLS_BASE,
  getFlowSkills,
  FLOW_BUDGET,
  buildPrompt,
  getSystemAppend,
  type InternalFlowType,
} from '../utils/config.js';
import { insertMessage } from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Types ---

interface FileToUpload {
  relativePath: string;
  content: Buffer;
}

interface ProjectFile {
  filename: string;
  storage_path: string;
  file_type: string;
}

interface FileToDownload {
  bucket: string;
  storagePath: string;
  targetFilename: string;
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

// --- Helpers ---

function shouldSkipFile(filename: string): boolean {
  return SKIP_FILES.includes(filename) || filename.startsWith('.');
}

function readSkillFilesFromDisk(skillNames: string[]): Map<string, FileToUpload[]> {
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

// --- Sandbox Lifecycle ---

async function createSandbox(): Promise<Sandbox> {
  console.log(`Creating Vercel Sandbox (timeout: ${CONFIG.SANDBOX_TIMEOUT}ms, vcpus: ${CONFIG.SANDBOX_VCPUS})...`);
  const sandbox = await Sandbox.create({
    teamId: process.env.VERCEL_TEAM_ID!,
    projectId: process.env.VERCEL_PROJECT_ID!,
    token: process.env.VERCEL_TOKEN!,
    resources: { vcpus: CONFIG.SANDBOX_VCPUS },
    timeout: CONFIG.SANDBOX_TIMEOUT,
    runtime: CONFIG.RUNTIME,
  });
  console.log(`Sandbox created: ${sandbox.sandboxId}, timeout: ${sandbox.timeout}ms`);
  // Extend timeout to ensure we have the full 30 minutes
  if (sandbox.timeout < CONFIG.SANDBOX_TIMEOUT) {
    console.log(`Extending sandbox timeout from ${sandbox.timeout}ms to ${CONFIG.SANDBOX_TIMEOUT}ms`);
    await sandbox.extendTimeout(CONFIG.SANDBOX_TIMEOUT - sandbox.timeout);
    console.log(`Sandbox timeout after extension: ${sandbox.timeout}ms`);
  }
  return sandbox;
}

async function installDependencies(sandbox: Sandbox, projectId?: string): Promise<void> {
  // No system packages needed — PDF extraction happens on Cloud Run before sandbox.
  // The sandbox is pure AI processing.

  console.log('Installing Claude Code CLI...');
  if (projectId) {
    insertMessage(projectId, 'system', 'Installing Claude Code CLI...').catch(() => {});
  }
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

// --- File Handling ---

function buildDownloadManifest(files: ProjectFile[]): FileToDownload[] {
  return files.map((f) => {
    // Determine the bucket based on storage_path prefix
    let bucket: string;
    let storagePath: string;

    if (f.storage_path.startsWith('crossbeam-demo-assets/')) {
      bucket = 'crossbeam-demo-assets';
      storagePath = f.storage_path.replace('crossbeam-demo-assets/', '');
    } else if (f.storage_path.startsWith('crossbeam-uploads/')) {
      bucket = 'crossbeam-uploads';
      storagePath = f.storage_path.replace('crossbeam-uploads/', '');
    } else {
      // Fallback: treat the whole path as the storage path, use uploads bucket
      bucket = 'crossbeam-uploads';
      storagePath = f.storage_path;
    }

    return {
      bucket,
      storagePath,
      targetFilename: f.filename,
    };
  });
}

async function downloadFilesInSandbox(
  sandbox: Sandbox,
  files: ProjectFile[],
  supabaseUrl: string,
  supabaseKey: string,
): Promise<void> {
  const filesToDownload = buildDownloadManifest(files);
  console.log(`Setting up download of ${filesToDownload.length} files...`);

  const downloadScript = `
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient('${supabaseUrl}', '${supabaseKey}');
const files = ${JSON.stringify(filesToDownload)};
const basePath = '${SANDBOX_FILES_PATH}';

async function downloadFiles() {
  console.log('Starting download of ' + files.length + ' files from Supabase...');

  let downloaded = 0;
  let failed = 0;

  for (const file of files) {
    const targetPath = path.join(basePath, file.targetFilename);
    const targetDir = path.dirname(targetPath);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    try {
      const { data, error } = await supabase.storage
        .from(file.bucket)
        .download(file.storagePath);

      if (error) {
        console.error('Error downloading ' + file.targetFilename + ':', error.message);
        failed++;
        continue;
      }

      const buffer = Buffer.from(await data.arrayBuffer());
      fs.writeFileSync(targetPath, buffer);
      downloaded++;
      console.log('Downloaded: ' + file.targetFilename + ' from ' + file.bucket);
    } catch (err) {
      console.error('Failed to download ' + file.targetFilename + ':', err.message);
      failed++;
    }
  }

  console.log('Download complete: ' + downloaded + ' succeeded, ' + failed + ' failed');

  if (failed > 0 && downloaded === 0) {
    process.exit(1);
  }
}

downloadFiles();
`;

  await sandbox.writeFiles([
    { path: '/vercel/sandbox/download-files.mjs', content: Buffer.from(downloadScript) },
  ]);

  console.log('Running file download script in sandbox...');
  const result = await sandbox.runCommand({
    cmd: 'node',
    args: ['download-files.mjs'],
  });

  const stdout = await result.stdout();
  console.log(stdout.toString());

  if (result.exitCode !== 0) {
    const stderr = await result.stderr();
    throw new Error(`Failed to download files: ${stderr.toString()}`);
  }

  console.log('Files downloaded successfully in sandbox');
}

// --- Archive Unpacking (demo projects) ---

async function unpackArchivesInSandbox(
  sandbox: Sandbox,
  projectId?: string,
): Promise<void> {
  // Find and unpack any .tar.gz files in project-files/
  const findResult = await sandbox.runCommand({
    cmd: 'bash',
    args: ['-c', `ls ${SANDBOX_FILES_PATH}/*.tar.gz 2>/dev/null || true`],
  });
  const stdout = await findResult.stdout();
  const archives = stdout.toString().trim().split('\n').filter(Boolean);

  if (archives.length === 0) {
    console.log('No archives to unpack');
    return;
  }

  console.log(`Unpacking ${archives.length} archives...`);
  if (projectId) {
    insertMessage(projectId, 'system', `Unpacking ${archives.length} pre-extracted archives...`).catch(() => {});
  }

  for (const archive of archives) {
    const result = await sandbox.runCommand({
      cmd: 'tar',
      args: ['xzf', archive, '-C', SANDBOX_FILES_PATH],
    });
    if (result.exitCode !== 0) {
      const stderr = await result.stderr();
      console.warn(`Failed to unpack ${archive}: ${stderr.toString()}`);
    } else {
      console.log(`Unpacked: ${archive}`);
      // Delete the archive after unpacking
      await sandbox.runCommand({ cmd: 'rm', args: [archive] });
    }
  }
}

// --- Skills ---

async function copySkillsToSandbox(
  sandbox: Sandbox,
  skillNames: string[],
): Promise<void> {
  const skillsMap = readSkillFilesFromDisk(skillNames);
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

// --- Phase 1 Artifacts (for corrections-response) ---

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

// --- Agent Execution ---

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
    preExtracted?: boolean;
  },
): Promise<{ exitCode: number }> {
  const {
    apiKey, projectId, userId, supabaseUrl, supabaseKey,
    flowType, city, address, contractorAnswersJson, preExtracted,
  } = options;

  const prompt = buildPrompt(flowType, city, address, contractorAnswersJson, preExtracted);
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
  const ext = filename.split('.').pop().toLowerCase();
  const mimeTypes = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', json: 'application/json' };
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  const { error } = await supabase.storage
    .from('crossbeam-outputs')
    .upload(storagePath, content, { upsert: true, contentType });
  if (error) {
    console.error('Upload error for', filename, ':', error.message);
    throw error;
  }
  console.log('Uploaded:', storagePath);
  return storagePath;
}

// Read all output files from the output directory (text only — skip binary)
function readOutputFiles() {
  if (!fs.existsSync(OUTPUT_PATH)) return {};
  const binaryExts = new Set(['pdf', 'png', 'jpg', 'jpeg', 'gif', 'zip', 'tar', 'gz']);
  const result = {};
  const files = fs.readdirSync(OUTPUT_PATH);
  for (const file of files) {
    const ext = file.split('.').pop().toLowerCase();
    if (binaryExts.has(ext)) {
      console.log('Skipping binary file:', file);
      continue;
    }
    const filePath = path.join(OUTPUT_PATH, file);
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        try {
          result[file] = JSON.parse(content);
        } catch {
          result[file] = content;
        }
      } catch {
        console.log('Skipping unreadable file:', file);
      }
    }
  }
  return result;
}

// Create output record with auto-incrementing version
async function createOutputRecord(data) {
  // Get max version for this project+flow_phase
  const { data: existing } = await supabase
    .schema('crossbeam')
    .from('outputs')
    .select('version')
    .eq('project_id', projectId)
    .eq('flow_phase', '${flowPhase}')
    .order('version', { ascending: false })
    .limit(1);
  const nextVersion = (existing?.[0]?.version || 0) + 1;

  const { data: inserted, error } = await supabase
    .schema('crossbeam')
    .from('outputs')
    .insert({
      project_id: projectId,
      flow_phase: '${flowPhase}',
      version: nextVersion,
      ...data,
    })
    .select('id')
    .single();
  if (error) {
    console.error('Failed to create output record:', error.message);
    throw error;
  }
  console.log('Output record created (version ' + nextVersion + ', id: ' + inserted.id + ')');
  return inserted.id;
}

// Insert contractor questions into contractor_answers table
async function insertContractorQuestions(questions, outputId = null) {
  if (!questions || !Array.isArray(questions)) {
    console.log('No contractor questions to insert');
    return;
  }

  // Clear old unanswered questions before inserting new ones
  const { error: deleteError } = await supabase
    .schema('crossbeam')
    .from('contractor_answers')
    .delete()
    .eq('project_id', projectId)
    .eq('is_answered', false);
  if (deleteError) {
    console.error('Failed to delete old unanswered questions:', deleteError.message);
  }

  const rows = questions.map(q => ({
    project_id: projectId,
    question_key: q.question_id || q.key || q.question_key || q.id || 'q_' + Math.random().toString(36).slice(2),
    question_text: q.context || q.question || q.question_text || q.text || '',
    question_type: q.options ? 'select' : (q.type || 'text'),
    options: q.options ? (typeof q.options === 'string' ? q.options : JSON.stringify(q.options)) : null,
    context: q.context || q.why || null,
    correction_item_id: q.correction_item_id || q.item_id || null,
    is_answered: false,
    output_id: outputId,
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
      prompt: PROMPT_PLACEHOLDER,
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
      outputData.corrections_letter_md = allFiles['draft_corrections.md'] || null;
      outputData.review_checklist_json = allFiles['draft_corrections.json'] || null;
      if (fs.existsSync(path.join(OUTPUT_PATH, 'corrections_letter.pdf'))) {
        const pdfContent = fs.readFileSync(path.join(OUTPUT_PATH, 'corrections_letter.pdf'));
        outputData.corrections_letter_pdf_path = await uploadFile('corrections_letter.pdf', pdfContent);
      }
    } else if (flowPhase === 'analysis') {
      outputData.corrections_analysis_json = allFiles['corrections_categorized.json'] || null;
      outputData.contractor_questions_json = allFiles['contractor_questions.json'] || null;
    } else if (flowPhase === 'response') {
      outputData.response_letter_md = allFiles['response_letter.md'] || null;
      outputData.professional_scope_md = allFiles['professional_scope.md'] || null;
      outputData.corrections_report_md = allFiles['corrections_report.md'] || null;
      if (fs.existsSync(path.join(OUTPUT_PATH, 'response_letter.pdf'))) {
        const pdfContent = fs.readFileSync(path.join(OUTPUT_PATH, 'response_letter.pdf'));
        outputData.response_letter_pdf_path = await uploadFile('response_letter.pdf', pdfContent);
      }
    }

    // Create output record
    const outputRecordId = await createOutputRecord(outputData);

    // Insert contractor questions linked to this output version
    if (flowPhase === 'analysis' && allFiles['contractor_questions.json']) {
      const questions = allFiles['contractor_questions.json'];
      let questionsList = [];
      if (Array.isArray(questions)) {
        questionsList = questions;
      } else if (questions.question_groups && Array.isArray(questions.question_groups)) {
        for (const group of questions.question_groups) {
          if (group.questions && Array.isArray(group.questions)) {
            questionsList.push(...group.questions);
          }
        }
      } else if (questions.questions && Array.isArray(questions.questions)) {
        questionsList = questions.questions;
      }
      if (questionsList.length > 0) {
        await insertContractorQuestions(questionsList, outputRecordId);
      } else {
        console.log('No contractor questions found in any known format');
      }
    }

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

  // Replace the placeholder prompt with the actual prompt
  const finalScript = agentScript.replace(
    'prompt: PROMPT_PLACEHOLDER,',
    `prompt: ${JSON.stringify(prompt)},`,
  );

  await sandbox.writeFiles([
    { path: '/vercel/sandbox/agent.mjs', content: Buffer.from(finalScript) },
  ]);

  console.log('Running agent in detached mode...');
  const cmd = await sandbox.runCommand({
    cmd: 'node',
    args: ['agent.mjs'],
    env: { ANTHROPIC_API_KEY: apiKey },
    detached: true,
  });
  console.log(`Agent command started: ${cmd.cmdId}`);

  // Resilient wait loop — detached commands survive connection drops
  let attempts = 0;
  const MAX_WAIT_ATTEMPTS = 120; // 120 * 30s = 60 min max
  while (true) {
    try {
      console.log(`Waiting for agent completion (attempt ${attempts + 1})...`);
      const finished = await cmd.wait();
      console.log(`Agent finished with exit code: ${finished.exitCode}`);
      return { exitCode: finished.exitCode };
    } catch (err: unknown) {
      attempts++;
      const errMsg = err instanceof Error ? err.message : String(err);
      console.log(`Wait attempt ${attempts} failed: ${errMsg}`);

      if (attempts >= MAX_WAIT_ATTEMPTS) {
        throw new Error(`Agent wait failed after ${attempts} attempts: ${errMsg}`);
      }

      // Check if sandbox is still alive before retrying
      try {
        const sandboxStatus = sandbox.status;
        console.log(`Sandbox status: ${sandboxStatus}`);
        if (sandboxStatus !== 'running') {
          throw new Error(`Sandbox is no longer running (status: ${sandboxStatus})`);
        }
      } catch (statusErr: unknown) {
        const statusMsg = statusErr instanceof Error ? statusErr.message : String(statusErr);
        console.log(`Could not check sandbox status: ${statusMsg}`);
      }

      // Wait before retrying
      console.log('Retrying wait in 30 seconds...');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
}

// --- Main Export ---

export async function runCrossBeamFlow(options: RunFlowOptions): Promise<void> {
  let sandbox: Sandbox | null = null;

  try {
    // 1. Create sandbox
    sandbox = await createSandbox();
    await insertMessage(options.projectId, 'system', '[SANDBOX 1/7] Sandbox created');

    // 2. Install dependencies (no system packages — extraction happens on Cloud Run)
    await installDependencies(sandbox, options.projectId);
    await insertMessage(options.projectId, 'system', '[SANDBOX 2/7] Dependencies installed');

    // 3. Download project files (includes pre-extracted .tar.gz archives)
    await downloadFilesInSandbox(
      sandbox,
      options.files,
      options.supabaseUrl,
      options.supabaseKey,
    );
    await insertMessage(options.projectId, 'system', `[SANDBOX 3/7] Downloaded ${options.files.length} files`);

    // 4. Unpack any .tar.gz archives (PNGs from Cloud Run extraction or demo pre-builds)
    await unpackArchivesInSandbox(sandbox, options.projectId);
    await insertMessage(options.projectId, 'system', '[SANDBOX 4/7] Archives unpacked');

    // 5. Copy skills (dynamic based on flow type + city)
    const skillNames = getFlowSkills(options.flowType, options.city);
    await copySkillsToSandbox(sandbox, skillNames);
    await insertMessage(options.projectId, 'system', `[SANDBOX 5/7] Skills copied (${skillNames.length} skills: ${skillNames.join(', ')})`);

    // 5.5 Pre-inject sheet manifest for demo projects (same Placentia plan set)
    if (options.flowType === 'city-review' || options.flowType === 'corrections-analysis') {
      await sandbox.runCommand({ cmd: 'mkdir', args: ['-p', SANDBOX_OUTPUT_PATH] });
      const manifestPath = path.join(__dirname, '../../fixtures/b1-placentia-manifest.json');
      const manifestContent = fs.readFileSync(manifestPath);
      await sandbox.writeFiles([{
        path: `${SANDBOX_OUTPUT_PATH}/sheet-manifest.json`,
        content: manifestContent,
      }]);
      await insertMessage(options.projectId, 'system', '[SANDBOX 5.5/7] Sheet manifest pre-loaded');
    }

    // 6. For corrections-response: write Phase 1 artifacts + answers into sandbox
    if (options.flowType === 'corrections-response' && options.phase1Artifacts && options.contractorAnswersJson) {
      await writePhase1Artifacts(sandbox, options.phase1Artifacts, options.contractorAnswersJson);
      await insertMessage(options.projectId, 'system', '[SANDBOX 6/7] Phase 1 artifacts loaded');
    } else {
      await insertMessage(options.projectId, 'system', '[SANDBOX 6/7] Setup complete');
    }

    // 7. Run agent
    const flowLabel = options.flowType === 'city-review' ? 'plan review'
      : options.flowType === 'corrections-analysis' ? 'corrections analysis'
      : 'response generation';
    await insertMessage(options.projectId, 'system', `[SANDBOX 7/7] Launching ${flowLabel} agent...`);

    await insertMessage(options.projectId, 'system', 'Agent running in detached mode (connection-resilient)');
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
      preExtracted: true, // PNGs are always pre-extracted now (demo or not)
    });

    console.log(`Agent completed with exit code: ${result.exitCode}`);

  } finally {
    if (sandbox) {
      console.log('Stopping sandbox...');
      await sandbox.stop();
    }
  }
}
