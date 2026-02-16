# CrossBeam

AI-powered ADU permit assistant for California. Upload your architectural plans and corrections letter — get back a professional response package ready for resubmission.

**Built for the [Built with Opus 4.6: Claude Code Hackathon](https://docs.google.com/document/d/1NbivuiJxCfaVPSKaPoe-5LR7W7bBjEEFMjqVH2nZiYo/edit) (Feb 10-16, 2026)**

## The Problem

California's ADU permits have a **90%+ rejection rate** on first submission. Most rejections aren't engineering failures — they're bureaucratic: missing signatures, incorrect code citations, incomplete forms. The average 6-month permit delay costs homeowners **$30,000**.

Contractors aren't lawyers. Cities are understaffed. Nobody wins.

## What CrossBeam Does

CrossBeam uses Claude Opus 4.6 as an AI agent that reads your architectural plans, interprets city corrections letters, cross-references California state law, and generates a professional response package.

### Flow 1: Corrections Letter Interpreter

The primary flow. A contractor uploads:
1. Their submitted architectural plans (PDF)
2. The corrections letter from the city building department

The agent then:
- Extracts and reads every page of the plans using vision
- Parses each correction item from the city's letter
- Cross-references against California ADU law (Government Code sections 66310-66342)
- Researches city-specific municipal code via live web search
- Asks the contractor clarifying questions about their project
- Generates a corrections response package: analysis report, professional scope of work, and draft response letter

### Flow 2: Permit Checklist Generator

A contractor enters their project address and basic info (ADU type, size, lot type). The agent researches city-specific requirements via web search, combines them with state-level ADU rules, and produces a pre-submission checklist with city-specific gotchas.

### Flow 3: City Pre-Screening (Roadmap)

A city building department uploads a permit submission. The agent reviews it against their own requirements and state ADU law, flagging missing documents, unsigned pages, and incomplete forms before a human plan checker ever touches it. This flow is not built — it's the open-source vision for how this tool could work on the city side.

## Architecture

```
Browser (Next.js)
    ↓ API + Supabase Realtime
Cloud Run Server (Orchestrator)
    ↓ launches isolated sandboxes
Vercel Sandbox (Agent SDK + Claude Opus 4.6 + Skills)
    ↓ reads/writes
Supabase (Database, Realtime, Storage)
```

**Why this architecture:**
- Agent runs take 10-30 minutes. Vercel serverless functions timeout at 60-300s. Cloud Run provides a persistent orchestrator process.
- Vercel Sandbox gives each job an isolated, ephemeral execution environment with file system access — needed for the Agent SDK's `claude_code` preset tools.
- Supabase Realtime pushes status updates and agent messages to the frontend without polling.

### Skills-First Design

The agent's domain knowledge comes from **skills** — structured reference files that teach Claude about a specific domain:

- **California ADU Skill** — 28 reference files covering the HCD ADU Handbook (54 pages), Government Code sections 66310-66342, a decision tree router (lot type → construction type → modifiers → process), and a quick-reference thresholds table for common numbers (heights, sizes, setbacks, parking, fees).
- **ADU Corrections Interpreter Skill** — Guides the agent through the multi-step corrections analysis workflow.
- **ADU City Research Skill** — Three-mode city research (WebSearch discovery, WebFetch extraction, browser fallback for difficult city websites).
- **CrossBeam Ops Skill** — Teaches agents how to operate the deployed system via API.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16, React 19, shadcn/ui, Tailwind CSS 4 |
| Server | Express 5, Cloud Run, Vercel Sandbox |
| Agent | Claude Opus 4.6, Agent SDK, `claude_code` preset |
| Database | Supabase (Postgres, Realtime, Storage) |
| Skills | 28+ reference files, decision tree router |
| Dev Tools | Claude Code (the entire project was built with Claude Code) |

## Project Structure

```
├── frontend/              # Next.js app (Vercel)
├── server/                # Express orchestrator (Cloud Run)
├── adu-skill-development/ # Skills: California ADU, PDF extraction
├── agents-crossbeam/      # Agent SDK configurations
├── .claude/skills/        # Claude Code skills (ops, city research, corrections)
├── test-assets/           # Real permit data for testing
│   ├── corrections/       # Placentia corrections letter + plans
│   ├── approved/          # Long Beach approved plans
│   └── correction-01/     # Sample agent output
├── design-directions/     # UI design exploration
├── docs/                  # Plans, research, learnings, schedule
└── scripts/               # Utility scripts
```

## Running Locally

### Prerequisites

- Node.js 20+
- Supabase project (for database + storage)
- Anthropic API key (for Claude Opus 4.6)
- Vercel account (for sandbox)

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local  # Fill in Supabase + API keys
npm run dev
```

### Server

```bash
cd server
npm install
cp .env.example .env  # Fill in API keys
npm run dev
```

## Test Data Attribution

The `test-assets/` directory contains real permit documents used for development and testing:

- **California ADU Handbook** (`adu-handbook-update-2026.pdf`) — Published by the California Department of Housing and Community Development (HCD). Public government document.
- **Placentia Submittal Requirements** — Published by the City of Placentia Building Division. Public government document.
- **Corrections Letter** (`corrections/2nd-Review-Corrections-1232-Jefferson-St-Placentia.pdf`) — City of Placentia plan check corrections. Public government correspondence.
- **Architectural Plans — 1232 N Jefferson, Placentia** (`corrections/Binder-1232-N-Jefferson.pdf`) — Included with permission from the project designer for demonstration purposes.
- **Architectural Plans — 326 Flint Ave, Long Beach** (`approved/FLINT-AVE-326-BADD326126-APPROVED-PLANS.pdf`) — Included with permission from the project designer for demonstration purposes.

## License

MIT — see [LICENSE](LICENSE)
