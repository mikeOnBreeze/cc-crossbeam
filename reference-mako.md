# reference-mako.md — Mako Architecture Patterns for CrossBeam

> **What this is:** Working code patterns from Mako (demand letter app) to replicate for CrossBeam.
> **Source repo:** `~/openai-demo/CC-Agents-SDK-test-1225/mako/`
> **How to use:** When building CrossBeam's `frontend/` and `server/`, read this file to understand the proven patterns, then adapt them. Don't copy blindly — CrossBeam has different flows, different outputs, no credits system.

---

## File Map (where to look in Mako)

### Server (Cloud Run orchestrator)
```
mako/server/
├── src/
│   ├── index.ts              # Express app entry point — copy as-is
│   ├── routes/generate.ts    # POST /generate — adapt (add flow_type, remove credits)
│   ├── services/sandbox.ts   # Core sandbox lifecycle — adapt heavily for CrossBeam skills
│   ├── services/supabase.ts  # DB helpers — change schema 'mako' → 'crossbeam'
│   └── utils/config.ts       # Config + prompts — REWRITE for CrossBeam
├── skills/                    # Skills bundled with the server (copied into sandbox at runtime)
├── Dockerfile                 # Docker container config — copy as-is
├── package.json               # Dependencies — copy, update name
└── tsconfig.json              # TypeScript config — copy as-is
```

### Frontend (Vercel Next.js app)
```
mako/frontend/
├── app/
│   ├── api/generate/route.ts              # Frontend → Cloud Run proxy
│   ├── auth/callback/route.ts             # Supabase OAuth callback
│   ├── auth/signout/route.ts              # Sign out
│   ├── (auth)/login/page.tsx              # Login page — REWRITE for judge button
│   ├── (dashboard)/dashboard/page.tsx     # Dashboard — REWRITE for persona cards
│   ├── (dashboard)/projects/[id]/page.tsx # Project detail — adapt for CrossBeam
│   ├── (dashboard)/projects/new/page.tsx  # New project — adapt
│   ├── layout.tsx                         # Root layout
│   └── globals.css                        # Tailwind styles
├── components/
│   ├── ui/                                # shadcn components — copy all
│   ├── project/processing-card.tsx        # "Agent working" view with animation
│   ├── project/agent-activity-log.tsx     # Real-time message stream — KEY COMPONENT
│   ├── project/output-viewer.tsx          # Results display — adapt for corrections
│   ├── project/status-badge.tsx           # Status indicator
│   ├── project/file-upload.tsx            # File upload component
│   └── project/project-actions.tsx        # Run generation button
├── lib/
│   ├── supabase/client.ts                 # Browser Supabase client — copy as-is
│   ├── supabase/server.ts                 # Server Supabase client — copy as-is
│   ├── supabase/middleware.ts             # Auth session refresh — copy as-is
│   └── utils.ts                           # cn() helper — copy as-is
├── types/database.ts                      # Type definitions — REWRITE for CrossBeam
├── middleware.ts                           # Route protection — copy as-is
├── package.json
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
└── postcss.config.mjs
```

---

## Pattern 1: Express Server Entry Point

**File:** `mako/server/src/index.ts`
**Action:** Copy as-is. Nothing to change.

```typescript
import express from 'express';
import { generateRouter } from './routes/generate.js';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/generate', generateRouter);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
```

---

## Pattern 2: Generate Route — "Respond Immediately, Process Async"

**File:** `mako/server/src/routes/generate.ts`
**Action:** Adapt — add `flow_type` field, remove credits logic.

**The critical pattern:** The route responds IMMEDIATELY with `{ status: 'processing' }`, then fires off `processGeneration()` as an async background task. The Vercel frontend doesn't wait — it polls Supabase for status updates.

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { updateProjectStatus, getClientFiles } from '../services/supabase.js';
import { generateDemandLetter } from '../services/sandbox.js';

export const generateRouter = Router();

const generateRequestSchema = z.object({
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
  // CrossBeam adds: flow_type: z.enum(['city-review', 'corrections-analysis']),
});

generateRouter.post('/', async (req, res) => {
  const parseResult = generateRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const { project_id, user_id } = parseResult.data;

  // ← KEY: Respond immediately. Frontend gets instant confirmation.
  res.json({ status: 'processing', project_id });

  // ← KEY: Process in background. This runs for 10-20 minutes.
  processGeneration(project_id, user_id).catch((error) => {
    console.error('Generation failed:', error);
  });
});

async function processGeneration(projectId: string, userId: string) {
  try {
    await updateProjectStatus(projectId, 'processing');
    const clientFiles = await getClientFiles(projectId);

    // Get env vars
    const apiKey = process.env.ANTHROPIC_API_KEY!;
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Run agent in sandbox (this takes 10-20 minutes)
    await generateDemandLetter(clientFiles, /* ... */);

    // ← NOTE: In Mako, credit deduction happens here. CrossBeam skips this.

  } catch (error) {
    await updateProjectStatus(projectId, 'failed', error.message);
  }
}
```

---

## Pattern 3: Sandbox Lifecycle (The Big One)

**File:** `mako/server/src/services/sandbox.ts`
**Action:** Adapt — different skills, different prompt, different output extraction.

**The lifecycle has 6 steps.** This is the heart of the Mako architecture:

### Step 1: Create Sandbox
```typescript
import { Sandbox } from '@vercel/sandbox';

async function createSandbox(): Promise<Sandbox> {
  const sandbox = await Sandbox.create({
    teamId: process.env.VERCEL_TEAM_ID!,
    projectId: process.env.VERCEL_PROJECT_ID!,
    token: process.env.VERCEL_TOKEN!,
    resources: { vcpus: 4 },
    timeout: 1800000, // 30 minutes in ms
    runtime: 'node22',
  });
  return sandbox;
}
```

### Step 2: Install Dependencies
```typescript
async function installDependencies(sandbox: Sandbox): Promise<void> {
  // Claude Code CLI
  await sandbox.runCommand({ cmd: 'npm', args: ['install', '-g', '@anthropic-ai/claude-code'], sudo: true });
  // Agent SDK + Supabase client
  await sandbox.runCommand({ cmd: 'npm', args: ['install', '@anthropic-ai/claude-agent-sdk', '@supabase/supabase-js'] });
  // Any other deps (Mako installs pizzip for Word docs; CrossBeam might not need this)
}
```

### Step 3: Download Files from Supabase → Sandbox
```typescript
// Mako creates a download script, writes it INTO the sandbox, then runs it there.
// This way the sandbox itself pulls files directly from Supabase Storage.
// The script uses @supabase/supabase-js inside the sandbox.

async function downloadFilesInSandbox(sandbox, files, supabaseUrl, supabaseKey) {
  const downloadScript = `
    import { createClient } from '@supabase/supabase-js';
    import fs from 'fs';
    import path from 'path';

    const supabase = createClient('${supabaseUrl}', '${supabaseKey}');
    const files = ${JSON.stringify(files)};
    const basePath = '/vercel/sandbox/project-files';

    async function downloadFiles() {
      for (const file of files) {
        const { data, error } = await supabase.storage
          .from(file.bucket)
          .download(file.storagePath);
        if (!error) {
          const buffer = Buffer.from(await data.arrayBuffer());
          fs.mkdirSync(path.dirname(path.join(basePath, file.targetFilename)), { recursive: true });
          fs.writeFileSync(path.join(basePath, file.targetFilename), buffer);
        }
      }
    }
    downloadFiles();
  `;

  await sandbox.writeFiles([{ path: '/vercel/sandbox/download-files.mjs', content: Buffer.from(downloadScript) }]);
  await sandbox.runCommand({ cmd: 'node', args: ['download-files.mjs'] });
}
```

### Step 4: Copy Skills to Sandbox
```typescript
// Read skills from disk (bundled with the server Docker image)
// Write them into the sandbox's .claude/skills/ directory

async function copySkillToSandbox(sandbox: Sandbox): Promise<void> {
  const skillDir = path.join(__dirname, '../../skills/demand-letter');
  // Walk the skill directory, read all files
  const skillFiles = readSkillFilesFromDisk();

  // Create .claude/skills/ in sandbox
  await sandbox.runCommand({ cmd: 'mkdir', args: ['-p', '/vercel/sandbox/.claude/skills/demand-letter'] });

  // Upload all skill files
  await sandbox.writeFiles(
    skillFiles.map((file) => ({
      path: `/vercel/sandbox/.claude/skills/demand-letter/${file.relativePath}`,
      content: file.content,
    }))
  );
}

// ← CrossBeam: You'll copy MULTIPLE skills (california-adu, adu-plan-review, etc.)
// ← based on which flow_type is being run. See FLOW_SKILLS in plan-deploy.md.
```

### Step 5: Run Agent via query() INSIDE the Sandbox
```typescript
// Mako writes an agent.mjs script that uses the Claude Agent SDK's query() function
// and runs it inside the sandbox. This script also handles:
// - Streaming messages to Supabase (fire-and-forget inserts)
// - Uploading output files to Supabase Storage when done
// - Updating project status to 'completed' or 'failed'

// The agent script is self-contained — if Cloud Run crashes mid-run,
// the sandbox still completes and saves its results to Supabase.

const agentScript = `
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient('${supabaseUrl}', '${supabaseKey}');

function logMessage(role, content) {
  supabase.schema('mako').from('messages')      // ← CrossBeam: change to 'crossbeam'
    .insert({ project_id: '${projectId}', role, content })
    .then(() => {}).catch(err => console.error(err));
}

async function runAgent() {
  logMessage('system', 'Agent starting...');
  const result = await query({
    prompt: '${prompt}',                         // ← CrossBeam: use buildPrompt(flowType, city)
    options: {
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
      maxTurns: 80,                              // ← CrossBeam uses 80 (from agents-crossbeam config)
      maxBudgetUsd: 15.00,
      tools: { type: 'preset', preset: 'claude_code' },
      systemPrompt: { type: 'preset', preset: 'claude_code' },
      settingSources: ['project'],               // ← CRITICAL: loads .claude/skills/
      cwd: '/vercel/sandbox',
      model: 'claude-opus-4-6',
    }
  });

  for await (const message of result) {
    if (message.type === 'assistant') {
      // Stream text + tool calls to Supabase
      const content = message.message?.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === 'text') logMessage('assistant', block.text);
          if (block.type === 'tool_use') logMessage('tool', block.name);
        }
      }
    } else if (message.type === 'result') {
      logMessage('system', 'Completed in ' + message.num_turns + ' turns, cost: $' + message.total_cost_usd.toFixed(4));
    }
  }

  // Upload outputs to Supabase Storage
  // Update project status to 'completed'
  // (see full implementation in Mako's sandbox.ts)
}

runAgent();
`;

await sandbox.writeFiles([{ path: '/vercel/sandbox/agent.mjs', content: Buffer.from(agentScript) }]);
const result = await sandbox.runCommand({
  cmd: 'node',
  args: ['agent.mjs'],
  env: { ANTHROPIC_API_KEY: apiKey },
});
```

### Step 6: Cleanup
```typescript
// Outputs were already uploaded to Supabase from inside the sandbox (Step 5).
// Cloud Run's extractOutputs() is a backup if in-sandbox upload failed.
// Then stop the sandbox.

finally {
  if (sandbox) {
    await sandbox.stop();
  }
}
```

---

## Pattern 4: Frontend → Cloud Run Proxy

**File:** `mako/frontend/app/api/generate/route.ts`
**Action:** Adapt — add `flow_type`, remove credits check.

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { project_id } = await request.json()
  // ← CrossBeam: also extract flow_type from request body

  // Verify user owns this project
  const { data: project } = await supabase
    .schema('mako')                    // ← CrossBeam: 'crossbeam'
    .from('projects')
    .select('id, user_id')
    .eq('id', project_id)
    .single()

  if (!project || project.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // ← Mako checks credits here. CrossBeam skips this.

  const cloudRunUrl = process.env.CLOUD_RUN_URL
  const response = await fetch(`${cloudRunUrl}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id, user_id: user.id /* , flow_type */ }),
  })

  const data = await response.json()
  return NextResponse.json({ success: true, message: data.message || 'Generation started' })
}
```

---

## Pattern 5: Real-Time Agent Activity Stream

**File:** `mako/frontend/components/project/agent-activity-log.tsx`
**Action:** Adapt — change schema reference, update copy.

This is the most important UX component. It subscribes to Supabase Realtime and shows live agent messages as they stream in.

```typescript
'use client'
import { useEffect, useState, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

export function AgentActivityLog({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState([])
  const scrollRef = useRef(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    // 1. Fetch existing messages
    supabase
      .schema('mako')                    // ← CrossBeam: 'crossbeam'
      .from('messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setMessages(data) })

    // 2. Subscribe to new messages via Supabase Realtime
    const channel = supabase
      .channel(`messages-${projectId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'mako',                 // ← CrossBeam: 'crossbeam'
        table: 'messages',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [projectId, supabase])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  // Render messages with role-based icons (tool=wrench, assistant=brain, system=gear)
  // See full component for animation + styling with framer-motion
}
```

---

## Pattern 6: Processing Card (Agent Working View)

**File:** `mako/frontend/components/project/processing-card.tsx`
**Action:** Adapt — change copy, keep animation + structure.

This component wraps the AgentActivityLog with a header animation. It also listens for project status changes to auto-refresh when the agent completes.

**Key pattern — completion detection:**
```typescript
// Subscribe to project status changes
const channel = supabase
  .channel(`project-status-${projectId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'mako',                      // ← CrossBeam: 'crossbeam'
    table: 'projects',
    filter: `id=eq.${projectId}`,
  }, (payload) => {
    if (payload.new.status === 'completed' || payload.new.status === 'failed') {
      router.refresh()                   // ← Triggers Next.js page refresh to show results
    }
  })
  .subscribe()
```

---

## Pattern 7: Supabase Client Setup

**Files:** `mako/frontend/lib/supabase/client.ts`, `server.ts`, `middleware.ts`
**Action:** Copy all three as-is. Only change is the Database type import.

```typescript
// client.ts — Browser client
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// server.ts — Server client (for Server Components + Route Handlers)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
          catch {} // Ignore in Server Components
        },
      },
    }
  )
}
```

---

## Pattern 8: Middleware (Route Protection)

**File:** `mako/frontend/middleware.ts`
**Action:** Copy as-is.

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  const protectedPaths = ['/dashboard', '/projects']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  const authPaths = ['/login', '/signup']
  const isAuthPath = authPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isAuthPath && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

---

## Pattern 9: Dashboard Page

**File:** `mako/frontend/app/(dashboard)/dashboard/page.tsx`
**Action:** REWRITE for CrossBeam persona cards. But study this for the data-fetching pattern.

```typescript
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: projects } = await supabase
    .schema('mako')                      // ← CrossBeam: 'crossbeam'
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  // ← CrossBeam: Instead of listing all projects, show two persona cards
  // ← linking to pre-seeded demo projects, plus a "New Project" option.
}
```

---

## Pattern 10: Supabase Service (Server-Side DB Helpers)

**File:** `mako/server/src/services/supabase.ts`
**Action:** Adapt — change schema, rename functions for CrossBeam domain.

**Key functions to replicate:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Update project status (processing, completed, failed)
export async function updateProjectStatus(projectId, status, errorMessage?) {
  await supabase.schema('crossbeam').from('projects')
    .update({ status, error_message: errorMessage, updated_at: new Date().toISOString() })
    .eq('id', projectId);
}

// Get uploaded files for a project
export async function getProjectFiles(projectId) {
  const { data } = await supabase.schema('crossbeam').from('files')
    .select('*').eq('project_id', projectId);
  return data || [];
}

// Insert agent message (fire-and-forget for streaming)
export async function insertMessage(projectId, role, content) {
  await supabase.schema('crossbeam').from('messages')
    .insert({ project_id: projectId, role, content });
}

// ← CrossBeam DROPS: useCredits(), getActiveUserAssets()
// ← CrossBeam ADDS: getProjectFlowType() if needed
```

---

## Key Dependencies (package.json)

### Server
```json
{
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "latest",
    "@supabase/supabase-js": "^2",
    "@vercel/sandbox": "latest",
    "express": "^4",
    "ms": "^2",
    "zod": "^3"
  }
}
```

### Frontend
```json
{
  "dependencies": {
    "@supabase/ssr": "^0.5",
    "@supabase/supabase-js": "^2",
    "framer-motion": "^11",
    "lucide-react": "latest",
    "next": "^15",
    "react": "^19",
    "tailwindcss": "^3",
    "class-variance-authority": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest"
  }
}
```

---

## Gotchas & Lessons from Mako

1. **`settingSources: ['project']`** — Without this in the query() options, the agent has tools but NO skills. Skills live in `.claude/skills/` under `cwd`. This is the #1 mistake.

2. **`stdout()` is a METHOD, not a property** — on sandbox command results. Call `result.stdout()` not `result.stdout`.

3. **Schema references are everywhere** — Every Supabase call uses `.schema('mako')`. Search-and-replace to `.schema('crossbeam')` globally.

4. **Sandbox file paths start with `/vercel/sandbox/`** — That's the working directory inside the sandbox.

5. **The agent script runs INSIDE the sandbox** — It has its own Supabase client, its own Anthropic key (passed via env). It's self-contained. If Cloud Run dies, the sandbox finishes on its own.

6. **Realtime requires schema in the subscription** — `schema: 'crossbeam'` in the Realtime `.on()` calls. Miss this and you get zero events.

7. **Always verify files exist** after the agent claims to create them. Don't trust the agent's "done" message.

---

*This file is a reference for Claude Code building CrossBeam's frontend/ and server/ directories.*
*See plan-deploy.md for the full deployment plan and implementation order.*
