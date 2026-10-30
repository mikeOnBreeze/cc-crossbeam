# CrossBeam Permits

CrossBeam Permits builds AI plan check for cities, counties and government agencies, around each agency's own team, rules and workflow. It covers both sides of the counter. Applicant-facing tools check plans before they are submitted. Internal tools handle intake screening, building and planning plan review, corrections letters on the agency's letterhead, backchecks and staff questions.

CrossBeam Permits works with cities, counties and agencies anywhere in the country. CrossBeam Permits is available to every California city and county, and most California jurisdictions already have their local rules loaded. Beyond California, CrossBeam Permits already runs reviews on local code in the Greater Seattle, Las Vegas, Denver and Kansas City areas.

Agencies using it today:

- **City of Laguna Beach**: the City Council approved a 12-month agreement unanimously on Aug 4, 2026 ([meeting minutes](https://lagunabeachcity.primegov.com/Public/CompiledDocument/1956)).
- **City of Buena Park**: funds a free, voluntary applicant pre-check, "Buena Park Plan PreCheck by CrossBeam", launched Oct 5, 2026 ([City page](https://www.buenapark.com/city_departments/community_development/building_division/building_permits/plan_pre-check.php)).

**For builders.** Builders, architects and contractors use the same engine as PreCheck to review their plan set against state and local code before submittal, priced per review. Available in California, Greater Seattle, the Las Vegas area, the Denver area and Kansas City.

- Website: [crossbeam-permits.com](https://www.crossbeam-permits.com)
- For cities and counties: [crossbeam-permits.com/cities](https://www.crossbeam-permits.com/cities)

CrossBeam Permits is not affiliated with Crossbeam, the partner-ecosystem company at crossbeam.com.

---

## History: Claude Code hackathon, Feb 2026

**This repository is the hackathon snapshot, not the current product.** CrossBeam started here as a winning entry in Anthropic's global Claude Code hackathon (Feb 10-16, 2026) ([official announcement](https://x.com/claudeai/status/2024986294820958647?s=20)). The product has moved on a long way since: it now serves cities, counties and agencies as well as builders, covers far more than ADUs, and reviews on local code outside California. None of that later work is in this repo. The code below is kept as it was built during the hackathon week.

At the time, CrossBeam was an AI permit assistant for California ADUs. A contractor uploaded their architectural plans and the city's corrections letter, and got back a response package ready for resubmission.

### For other builders

If you're curious about the build process, check out `progress.md`. I kept voice logs of my thinking throughout the hackathon while Claude was building. It's a raw, unfiltered look at the decision-making and problem-solving that went into this project.

### Contact

- X/Twitter: [@breezwoods](https://x.com/breezwoods)
- LinkedIn: [Michael Brown](https://www.linkedin.com/in/michael-t-brown-034aaa22/)

### The problem it took on

ADU permits in California are often sent back on first submission, and many corrections are procedural rather than engineering: missing signatures, incorrect code citations, incomplete forms. Each round adds weeks. Contractors aren't lawyers, and city building departments are understaffed.

### What the hackathon version does

An AI agent reads the architectural plans, interprets the city's corrections letter, cross-references California state law, and generates a professional response package.

#### Flow 1: Corrections Letter Interpreter

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

#### Flow 2: Permit Checklist Generator

A contractor enters their project address and basic info (ADU type, size, lot type). The agent researches city-specific requirements via web search, combines them with state-level ADU rules, and produces a pre-submission checklist with city-specific gotchas.

#### Flow 3: City Pre-Screening (hackathon roadmap)

In this repo, the city-side flow (an agency uploads a submission and the agent flags missing documents, unsigned pages and incomplete forms before a plan checker sees it) was only a roadmap item. It has since been built in the product, well beyond pre-screening; see [crossbeam-permits.com/cities](https://www.crossbeam-permits.com/cities).

### Architecture

```
Browser (Next.js)
    ↓ API + Supabase Realtime
Cloud Run Server (Orchestrator)
    ↓ launches isolated sandboxes
Vercel Sandbox (Agent SDK + Skills)
    ↓ reads/writes
Supabase (Database, Realtime, Storage)
```

**Why this architecture:**
- Agent runs take 10-30 minutes. Vercel serverless functions time out at 60-300s. Cloud Run provides a persistent orchestrator process.
- Vercel Sandbox gives each job an isolated, ephemeral execution environment with file system access, needed for the Agent SDK's `claude_code` preset tools.
- Supabase Realtime pushes status updates and agent messages to the frontend without polling.

### Skills-first design

The agent's domain knowledge comes from **skills**, structured reference files that teach the agent about a specific domain:

- **California ADU Skill**: 28 reference files covering the HCD ADU Handbook (54 pages), Government Code sections 66310-66342, a decision tree router (lot type → construction type → modifiers → process), and a quick-reference thresholds table for common numbers (heights, sizes, setbacks, parking, fees).
- **ADU Corrections Interpreter Skill**: guides the agent through the multi-step corrections analysis workflow.
- **ADU City Research Skill**: three-mode city research (WebSearch discovery, WebFetch extraction, browser fallback for difficult city websites).
- **CrossBeam Ops Skill**: teaches agents how to operate the deployed system via API.

### Tech stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16, React 19, shadcn/ui, Tailwind CSS 4 |
| Server | Express 5, Cloud Run, Vercel Sandbox |
| Agent | Agent SDK, `claude_code` preset |
| Database | Supabase (Postgres, Realtime, Storage) |
| Skills | 28+ reference files, decision tree router |
| Dev Tools | Claude Code (the entire project was built with Claude Code) |

### Project structure

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

### Running locally

#### Prerequisites

- Node.js 20+
- Supabase project (for database + storage)
- Anthropic API key
- Vercel account (for sandbox)

#### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local  # Fill in Supabase + API keys
npm run dev
```

#### Server

```bash
cd server
npm install
cp .env.example .env  # Fill in API keys
npm run dev
```

### Test data attribution

The `test-assets/` directory contains real permit documents used for development and testing:

- **California ADU Handbook** (`adu-handbook-update-2026.pdf`): published by the California Department of Housing and Community Development (HCD). Public government document.
- **Placentia Submittal Requirements**: published by the City of Placentia Building Division. Public government document.
- **Corrections Letter** (`corrections/2nd-Review-Corrections-1232-Jefferson-St-Placentia.pdf`): City of Placentia plan check corrections. Public government correspondence.
- **Architectural Plans, 1232 N Jefferson, Placentia** (`corrections/Binder-1232-N-Jefferson.pdf`): included with permission from the project designer for demonstration purposes.
- **Architectural Plans, 326 Flint Ave, Long Beach** (`approved/FLINT-AVE-326-BADD326126-APPROVED-PLANS.pdf`): included with permission from the project designer for demonstration purposes.

## License

MIT, see [LICENSE](LICENSE)
