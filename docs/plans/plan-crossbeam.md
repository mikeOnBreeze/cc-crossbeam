# CrossBeam — Overall Plan

> **Project:** CrossBeam — AI ADU Permit Assistant for California
> **Hackathon:** Built with Opus 4.6: Claude Code Hackathon (Feb 10-16, 2026)
> **Submission:** Monday Feb 16, 3:00 PM EST
> **Deliverables:** 3-min demo video, open-source GitHub repo, 100-200 word summary

---

## 1. What We're Building

Three AI-powered flows for California ADU permits:

### Flow 1: Permit Checklist Generator (Contractor-Facing)
- User provides: address + basic project info (ADU type, size, lot type)
- Agent uses WebSearch to pull city-specific requirements from their published guidelines
- Agent uses the California ADU skill for state-level rules
- Agent asks the user clarifying questions (AskUserQuestion tool)
- **Output:** Complete pre-submission checklist + city-specific gotchas

### Flow 2: Corrections Letter Interpreter (Contractor-Facing) — PRIMARY DEMO FLOW
- User uploads: submitted permit PDF + corrections letter PDF from city
- Agent reads both, cross-references against state law (ADU skill) + city rules (WebSearch)
- Agent categorizes each correction: what it can resolve, what needs contractor answers, what needs engineers
- Agent generates a list of questions for the contractor to answer
- Contractor answers → Agent generates: response letter draft + action item list with sheet references
- **Output:** Corrections response package ready for resubmission

### Flow 3: City Pre-Screening (City-Facing / Open Source Vision)
- City uploads a permit submission
- Agent reviews against published city requirements + state ADU law
- Flags missing documents, unsigned pages, incomplete forms, missing code citations
- **Output:** Pre-screening corrections letter draft (catches ~70-90% of common issues)

**For the hackathon demo: Focus on Flows 1 and 2.** Flow 3 is the vision/roadmap piece.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER (Browser)                          │
│                                                             │
│  Next.js Frontend (Vercel)                                  │
│  - Upload PDFs                                              │
│  - Answer agent questions                                   │
│  - View/download results                                    │
│  - Real-time status updates                                 │
└──────────────────┬──────────────────────────────────────────┘
                   │ API calls
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              ORCHESTRATOR (Google Cloud Run)                 │
│                                                             │
│  - Receives job requests from frontend                      │
│  - Creates Vercel Sandbox                                   │
│  - Uploads files + skills to sandbox                        │
│  - Launches Claude Agent SDK inside sandbox                 │
│  - Streams status updates to Supabase                       │
│  - Downloads results when agent completes                   │
│  - Stores results in Supabase Storage                       │
│  - Cleans up sandbox                                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────────┐
│  Vercel  │ │ Supabase │ │   Supabase   │
│ Sandbox  │ │ Database │ │   Storage    │
│          │ │          │ │              │
│ Agent SDK│ │ - Jobs   │ │ - Uploaded   │
│ + Skills │ │ - Status │ │   PDFs       │
│ + Tools  │ │ - Users  │ │ - Generated  │
│          │ │ - Results│ │   outputs    │
└──────────┘ └──────────┘ └──────────────┘
```

### Why Google Cloud Run?
- Vercel serverless functions timeout at 60s (free) / 300s (pro)
- Agent SDK runs take 10-30 minutes (corrections flow especially)
- Cloud Run keeps a persistent process that manages the sandbox lifecycle
- Cloud Run is simple: just a container that receives HTTP requests, manages sandboxes, and writes status to Supabase
- Cloud Run can run for hours if needed

### Why Vercel Sandbox?
- Proven: already validated Agent SDK + skills + file upload/download in sandbox (Dec 2025 learnings)
- Isolated: each job gets its own sandbox, no cross-contamination
- Has the tools: Node.js, file system, network access for WebSearch
- Ephemeral: auto-cleanup, no state management headaches

### Why Supabase?
- Real-time subscriptions for status updates (job progress → frontend)
- Storage for file uploads and generated outputs
- Auth (if we get there)
- Familiar / already set up

---

## 3. The Agent SDK Configuration That Works

From Dec 2025 learnings — this is the proven config:

```typescript
const result = await query({
  prompt: constructedPrompt,
  options: {
    // CRITICAL — without these, agent hallucinates tool usage
    tools: { type: 'preset', preset: 'claude_code' },
    systemPrompt: { type: 'preset', preset: 'claude_code', append: CROSSBEAM_SYSTEM_PROMPT },

    // Skills discovery
    cwd: '/vercel/sandbox',
    settingSources: ['project'],  // Loads .claude/skills/

    // Permissions
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,

    // Tools
    allowedTools: [
      'Skill', 'Read', 'Write', 'Edit', 'Bash',
      'Glob', 'Grep', 'WebSearch', 'WebFetch',
      'Task',  // For subagents
    ],

    // Limits
    maxTurns: 50,
    maxBudgetUsd: 5.00,
    model: 'claude-opus-4-6',  // Hackathon is "Built with Opus 4.6"
  }
});
```

### Key gotchas:
- Model name must be full alias: `claude-opus-4-6`, not `opus`
- `settingSources: ['project']` required or skills won't load
- `stdout()` is a METHOD not a property on sandbox command results
- Always verify files exist after agent claims to create them
- Use `sandbox exec sbx_xxx -- cat /path` for verification

---

## 4. Skills Strategy

### California ADU Skill (Primary — Being Built Now)
- 27 reference files covering all state-level ADU rules
- Decision tree router in SKILL.md (4-step: lot type → construction type → modifiers → process)
- Quick-reference thresholds table for common numbers
- Goes into `.claude/skills/california-adu/` in the sandbox

### Corrections Interpreter Skill (New — Build This Week)
- Specialized skill for the corrections flow
- Instructions for: reading correction letters, categorizing items, generating response letters
- References: correction letter formats, common correction types, response letter templates
- Knows about delta clouds, sheet numbering conventions, revision markup patterns

### Permit Checklist Skill (New — Build This Week)
- Specialized skill for the checklist flow
- Instructions for: web searching city requirements, cross-referencing state law
- References: common ADU requirements by category, city website patterns
- Output format: structured checklist with code citations

---

## 5. Local Development Strategy

Build and test locally FIRST, deploy later. This is key for iteration speed.

### Local Testing (No Sandbox Needed)
```bash
# Run agent SDK directly on local machine
node --env-file .env.local --experimental-strip-types ./src/test-corrections.ts
```

- Skills in `.claude/skills/` load from local filesystem
- PDFs read from local filesystem
- No sandbox overhead = fast iteration
- Test each flow independently with real permit data

### When to Move to Sandbox
- After flows work locally with correct output quality
- Test file upload/download pipeline
- Test the full orchestrator → sandbox → results pipeline
- This is deployment prep, not feature dev

---

## 6. Frontend (Demo-Critical — 30% of Judging)

### Technology
- Next.js 14+ (App Router)
- shadcn/ui components
- Tailwind CSS
- Supabase client for real-time updates

### Key Screens
1. **Landing page** — Problem statement, three flows, "Get Started"
2. **New Job** — Choose flow (checklist vs corrections), upload files, enter address
3. **Agent Working** — Real-time status updates, streaming agent thoughts/actions
4. **Questions** — Agent asks contractor questions, clean form UI
5. **Results** — View corrections response, download generated documents

### Demo UX Priorities
- Show the agent thinking and working (not just final output)
- Show WebSearch in action pulling city-specific data
- Show the skill being invoked
- Show the question/answer loop with contractor
- Show the final polished output

---

## 7. Hackathon Judging Alignment

| Criterion | Weight | Our Strategy |
|-----------|--------|-------------|
| **Impact** | 25% | Real problem, real users, real data. $7B market. Discovery calls with actual contractors/designers. Open source for cities. |
| **Opus 4.6 Use** | 25% | Complex multi-turn agent reasoning. Skill-based expertise. WebSearch for dynamic city rules. PDF analysis. Subagent parallelism. AskUserQuestion for human-in-the-loop. |
| **Depth & Execution** | 20% | Not a wrapper — real domain knowledge (ADU skill with 27 reference files from state law). Tested with real permit data from real projects. Iterated corrections flow with actual designer feedback. |
| **Demo** | 30% | Run a live corrections flow with a real permit + real corrections letter. Show the full loop: upload → agent works → questions → answers → corrected output. |

---

## 8. Broad Schedule

### Day 0 — Monday Feb 10 (TODAY): Research + Planning + Skill Work
- [x] Deep research on Claude Agent SDK
- [x] Review all existing docs, discovery calls, market research
- [x] Write this plan (plan-crossbeam.md)
- [ ] Finalize ADU handbook skill (other agents working on this)
- [ ] Start composite ADU skill planning

### Day 1 — Tuesday Feb 11: Scaffolding + Local Agent Testing
- Set up project structure (Next.js, Supabase tables, Cloud Run skeleton)
- Get Agent SDK running locally with ADU skill
- Test corrections flow locally with Cameron's Placentia permit data
- Test checklist flow locally with a sample address
- Attend kickoff (12pm EST) and office hours (5pm EST)

### Day 2 — Wednesday Feb 12: Core Flows Working Locally
- Refine corrections interpreter skill based on test results
- Refine checklist skill based on test results
- Build the question/answer loop (agent asks, contractor answers, agent continues)
- Get both flows producing quality output locally
- Office hours (5pm EST)

### Day 3 — Thursday Feb 13: Frontend + Integration
- Build frontend screens (Next.js + shadcn)
- Connect frontend → Cloud Run → Supabase pipeline
- Real-time status updates working
- File upload/download working
- Office hours (5pm EST)

### Day 4 — Friday Feb 14: Deployment + Polish
- Deploy to Vercel (frontend)
- Deploy Cloud Run orchestrator
- Vercel Sandbox integration (move from local to sandbox)
- End-to-end testing with real data
- Office hours (5pm EST)

### Day 5 — Saturday Feb 15: Demo Prep + Bug Fixes
- Record demo attempts
- Fix any bugs found during demo runs
- Polish UI
- Support window (5pm EST)

### Day 6 — Sunday Feb 16: Submit
- Final demo recording
- Write summary (100-200 words)
- Push to GitHub (open source)
- Submit by 3:00 PM EST

---

## 9. Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| **Agent output quality not good enough** | Start testing early (Day 1), iterate skills aggressively. Use real permit data from discovery calls. |
| **Vercel Sandbox issues** | We already proved it works (Dec 2025). Have local testing as fallback for demo. |
| **Cloud Run complexity** | Keep it dead simple — just a container that manages sandbox lifecycle. Could even skip it for demo and run orchestrator locally. |
| **Vercel free plan timeout** | Upgrade to Pro if needed ($20/mo). Or demo locally and show the Vercel deployment as "production ready." |
| **ADU skill not ready** | Other agents are building it now. It's 80%+ done (core reference files exist). Can finish manually if needed. |
| **Time crunch** | Corrections flow is the money shot. If we can only nail ONE thing, nail that. Checklist is bonus. City pre-screening is vision/roadmap only. |

---

## 10. What Makes This Win

1. **Real problem, real validation** — Not hypothetical. We talked to contractors and designers. We have real permit data.
2. **Opus 4.6 doing something hard** — This isn't "summarize a document." This is: read a 30-page permit PDF, read a corrections letter, look up city-specific regulations on the fly, cross-reference state law, categorize corrections, ask targeted questions, generate a response package. That's agent work.
3. **The skill is the moat** — 27 reference files extracted from the HCD ADU Handbook. Decision tree router. This is deep domain knowledge that makes the agent actually useful vs. a generic chatbot.
4. **Open source with real impact** — 429,503 ADU permits since 2018 in California. 90%+ rejection rate in some cities. $30K cost per 6-month delay. This could actually help people.
5. **Demo will be compelling** — Feed in a real permit + real corrections letter, watch the agent work, answer its questions, get a corrections response package. That's a "holy shit" moment for judges.
