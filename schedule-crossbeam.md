# CrossBeam — Hackathon Schedule

> **Hackathon:** Built with Opus 4.6: Claude Code Hackathon
> **Submission:** Monday Feb 16, 3:00 PM EST / 12:00 PM PST
> **You:** Solo builder, California (PST)
> **Rule:** New work only — all code must be built during the hackathon

---

## Guiding Principles

1. **Agent output quality wins.** Demo is 30% of judging. A polished agent flow with mediocre UI beats a beautiful UI with mediocre agent output.
2. **Corrections flow is the money shot.** If we can only nail ONE thing, nail Flow 2 (corrections interpreter). Flow 1 (checklist) is strong bonus. Flow 3 (city pre-screening) is vision/roadmap only.
3. **Test early, iterate skills.** The skills ARE the product. Every day should include testing with real permit data and refining based on results.
4. **Don't over-engineer infra.** Cloud Run + Vercel Sandbox is production architecture. For the hackathon demo, running the agent locally or from a simpler backend is fine. Judges care about what the agent DOES, not how it's hosted.
5. **Video by Saturday.** Sunday is buffer. Monday morning is emergency-only.

---

## Daily Schedule

### Tuesday Feb 10 — Research + Planning + Skill Foundation

**Status:** DONE. Strong day — heavy lifting on research and skill foundation.

- [x] Deep research on Claude Agent SDK
- [x] Review all existing docs, discovery calls, market research
- [x] Write plan (plan-crossbeam.md)
- [x] Build California ADU Handbook skill (27 reference files, SKILL.md, decision tree router)
- [x] Write composite skill plan (plan-skill-aduComposite.md)
- [x] Push initial repo to GitHub (open source requirement)
- [x] Attend kickoff (12:00 PM EST / 9:00 AM PST)
- [x] Attend office hours (5:00-6:00 PM EST / 2:00-3:00 PM PST)

**End of Day Goal:** ~~Repo is on GitHub. ADU skill is complete. Plan is solid. Ready to code tomorrow.~~ **ACHIEVED.**

**EOD Notes — Tue Feb 10:**
- Converted the full 2025 HCD ADU Handbook (PDF) into a structured Claude Code skill with 27 reference files and a decision-tree router. Big lift, but the state-level skill is solid.
- Plan is in good shape. Composite skill plan written. Research deep-dives done on Claude Agent SDK, Vercel Sandbox hosting, and skill architecture.
- Attended hackathon kickoff and office hours.
- Repo pushed to GitHub: https://github.com/mikeOnBreeze/cc-crossbeam
- Blank page → working foundation. Good momentum going into Wednesday.

---

### Wednesday Feb 11 — ADU Composite Skill + City-Level Web Search + Agent Harness

This is the most important day. Get the agent RUNNING and PRODUCING OUTPUT.

**Status:** DONE (skills & pipeline). Agent SDK harness deferred to Thursday. See EOD notes.

**Priority 1: ADU Composite Skill (state + city integration)**
- [x] Figure out how to meld the state-level ADU skill with Claude Code's tool ecosystem
- [x] Design the composite skill architecture — state-level knowledge + city-level dynamic lookup
- [x] Build the composite skill SKILL.md and orchestrator

**Priority 2: City-Level Web Search Tool**
- [x] Build city-level web search skill using Chrome browser tools + web search
  - CA has 480+ cities, each with its own ADU regulations published online (required by law)
  - Every city's site is different — Claude Code needs a skill to navigate, find, extract, and document city-specific ADU rules
  - Pattern: search "[City Name] ADU requirements" or "[City Name] accessory dwelling unit ordinance"
  - Extract relevant standards, compare against state law
  - Flag preemption issues
- [x] Test with 2-3 cities to validate the approach

**Priority 3: Agent Harness (Claude Agents SDK backend)**
- [ ] Set up the harness using Claude Agents SDK — the backend that orchestrates skills → **DEFERRED to Thu morning**
- [ ] Agent SDK test script that runs locally → **DEFERRED**
- [ ] `.env.local` with Anthropic API key
- [ ] Run a first end-to-end test → **DEFERRED** (but full E2E works via CLI — see notes)

**Also if time allows:**
- [x] Test ADU handbook skill — run a few queries through Claude Code locally, verify the decision tree routes correctly and reference files load
- [x] Build corrections interpreter skill
  - Instructions for reading correction letters, categorizing items
  - Response letter templates and format
  - Common correction types and how to address them
- [ ] Build checklist generator skill *(cut — corrections flow is the priority per guiding principles)*
  - Instructions for web searching city requirements
  - Cross-referencing state law against city rules
  - Output format: structured checklist with code citations

**Evening (focus: iterate)**
- [x] Refine skills based on test results — this is where the magic happens
- [ ] Fix any Agent SDK configuration issues → **N/A — SDK not set up yet**

**Events:**
- [x] AMA with Cat Wu (12:30-1:15 PM EST / 9:30-10:15 AM PST) — worth attending, Claude Code product lead
- Office hours (5:00-6:00 PM EST / 2:00-3:00 PM PST)

**End of Day Goal:** ~~Agent runs both flows locally. Output is rough but the pipeline works. You know exactly what needs to improve.~~ **PARTIALLY ACHIEVED — see notes.**

**EOD Notes — Wed Feb 11 (10:30 PM PST):**

The day went deeper on skills and pipeline quality than planned, and the Agent SDK wiring got traded for that depth. The trade was correct — skills ARE the product (Guiding Principle #1).

**What got built (exceeded plan):**
- **8 ADU skills**, all with SKILL.md files, reference docs, and tested:
  - `adu-corrections-flow` (Skill 1 — analysis + questions, 137 lines, subagent prompts + output schemas)
  - `adu-corrections-complete` (Skill 2 — response generation, 164 lines)
  - `adu-targeted-page-viewer` (born from the extraction pivot — targeted sheet viewing, 116 lines + scripts)
  - `adu-city-research` (3 modes: Discovery/Extraction/Browser, 243 lines)
  - `buena-park-adu` (Tier 3 onboarded city skill, 76 lines, 12 reference files)
  - `adu-pdf-extraction` (full extraction skill, 341 lines — kept for future, too slow for hackathon)
  - `adu-corrections-interpreter` (standalone interpreter, 68 lines)
  - `california-adu` (updated with 2026 addendum, 28 reference files)
- **Full corrections pipeline tested E2E through CLI** — all outputs generated:
  - Phase 1–4 intermediates: `corrections_parsed.json`, `sheet-manifest.json`, `state_law_findings.json`, `sheet_observations.json`, `corrections_categorized.json`, `contractor_questions.json`
  - Phase 5 deliverables (two runs!): `response_letter.md`, `professional_scope.md`, `corrections_report.md`, `sheet_annotations.json`
  - Contractor answers simulated, second output run in `output-02/`
- **6 PDF extraction iterations** (test runs 01–06) before pivoting to targeted viewing
- **City research tested** — Buena Park deep dive, discovered 3-mode architecture (WebSearch → WebFetch → Browser fallback)
- **City-side flow conceptualized** — `plan-city-corrections.md` (190 lines) — same skills, opposite direction
- **Agent SDK plan written** — `plan-contractors-agents-sdk.md` (839 lines!) with proven config, architecture, implementation steps
- **cc-guide skill** built from Cat Wu AMA — instant access to Anthropic docs

**What did NOT get done:**
- No `backend/` directory created (no Agent SDK code)
- No `frontend/` directory created
- No `package.json` anywhere
- Checklist generator skill (Flow 1) not built — correctly deprioritized per Guiding Principle #2

**Key architectural insight of the day:** Don't extract everything from construction plans and then figure out what matters. Figure out what matters first (from the corrections letter + code research), then go look for it in the plans. This pivot from `adu-pdf-extraction` (35 min, exhaustive) to `adu-targeted-page-viewer` (fast, surgical) was the single best decision of the day.

**Assessment:** The pipeline works and the output quality is already good — not rough. The skill architecture is more mature than the original schedule anticipated. The Agent SDK harness is thoroughly planned (839-line plan with proven config from Dec 2025 Mako project). Wiring it up Thursday morning should be a 2-3 hour task, not a full day. This puts Thursday in a strong position: wire SDK in the morning, test + iterate in the afternoon, polish output formatting in the evening.

---

### Thursday Feb 12 — Agent SDK Harness + Output Quality + Q&A Loop

> **Schedule shift:** Agent SDK harness moved from Wed → Thu morning. Skills and CLI pipeline are ahead of schedule (output already good, not rough). Thursday absorbs the SDK work and still has time for quality iteration.

**Morning (focus: Agent SDK backend — CARRY-OVER from Wed P3)**
- [ ] Create `backend/` directory + symlink ADU skills (6 skills only — isolate from CLI env)
- [ ] `npm init` + install `@anthropic-ai/claude-agent-sdk`
- [ ] Write `run-skill-1.ts` (Skill 1 query wrapper) + `run-skill-2.ts` (Skill 2 query wrapper)
- [ ] Session directory management (`utils/session.ts`)
- [ ] `test-full-flow.ts` — end-to-end test with Placentia test data
- [ ] First Agent SDK run — verify skills load, subagents spawn, outputs written
- [ ] **Target: Agent SDK running by lunch** (~2-3 hours per plan estimate)

**Afternoon (focus: corrections flow quality via Agent SDK)**
- [ ] Run full corrections pipeline through Agent SDK (not just CLI)
- [ ] Compare Agent SDK output to CLI output — should be equivalent
- [ ] Iterate on categorization: auto-fixable vs. needs contractor vs. needs professional
- [ ] Test the Q&A loop: Skill 1 → contractor_questions.json → mock answers → Skill 2 → deliverables
- [ ] Debug any skill loading or subagent issues in SDK context

**Evening (focus: output formatting + polish)**
- [ ] Polish the corrections response letter format — this is what judges SEE
- [ ] Polish professional scope format (per-sheet action tables)
- [ ] Polish corrections report format (status dashboard)
- [ ] All outputs should cite specific code sections, reference exact sheet IDs from manifest

**If time (bonus):**
- [ ] Progress event handler (console logging from SDK message stream)
- [ ] Start outlining the 3-minute demo video narrative / shot list
- [ ] Test city-side corrections flow (plan-city-corrections.md) if contractor side is solid

**Events:**
- Office hours (5:00-6:00 PM EST / 2:00-3:00 PM PST)

**End of Day Goal:** Agent SDK runs the corrections pipeline programmatically. Output quality is demo-ready. Response letter looks like something a real contractor would use.

---

### Friday Feb 13 — Frontend + Integration

Agent flows should be solid by now. Time to make it look good.

**Morning (focus: frontend build)**
- [ ] Set up Next.js app with shadcn/ui + Tailwind
- [ ] Build landing page — problem statement, two flows, "Get Started"
- [ ] Build job creation screen — choose flow, upload PDFs, enter address
- [ ] Build agent working screen — show status updates, agent thoughts/actions
- [ ] Build question screen — agent's questions for contractor, clean form
- [ ] Build results screen — view response letter, download documents

**Afternoon (focus: connect everything)**
- [ ] Set up Supabase tables (jobs, status updates)
- [ ] Set up Supabase Storage (uploaded PDFs, generated outputs)
- [ ] Connect frontend to backend (API routes or direct agent SDK call)
- [ ] Real-time status updates working (Supabase subscriptions or polling)
- [ ] File upload → agent → results pipeline working end-to-end

**Evening (focus: first full demo run)**
- [ ] Run the corrections flow through the full UI
- [ ] Run the checklist flow through the full UI
- [ ] Note bugs, rough edges, things that need polish

**Events:**
- Live coding with Thariq (12:00-1:00 PM EST / 9:00-10:00 AM PST) — could be useful
- Office hours (5:00-6:00 PM EST / 2:00-3:00 PM PST)

**End of Day Goal:** Working web app. Both flows run through the UI. It's rough but functional.

---

### Saturday Feb 14 — Polish + Demo Recording Attempts

**Morning (focus: bug fixes and polish)**
- [ ] Fix all bugs found during Friday's demo runs
- [ ] Polish UI — loading states, error handling, responsive design
- [ ] Make the "agent working" screen visually impressive (show tool calls, web searches, skill invocations)
- [ ] Deploy to Vercel (frontend) — even if backend runs locally for demo

**Afternoon (focus: demo prep)**
- [ ] Write demo script — exactly what you'll show in 3 minutes
  - 0:00-0:30 — Problem statement (real stats, real pain)
  - 0:30-1:30 — Corrections flow demo (the money shot)
  - 1:30-2:20 — Checklist flow demo
  - 2:20-2:50 — Architecture / skills / how it works
  - 2:50-3:00 — Vision (Flow 3, open source for cities)
- [ ] Do 2-3 practice demo recordings
- [ ] Review recordings, identify what needs improvement

**Evening (focus: iterate on demo)**
- [ ] Fix anything that looked bad in practice recordings
- [ ] Re-record if needed
- [ ] Start on written summary draft (100-200 words)

**Events:**
- Anthropic support window (5:00-6:00 PM EST / 2:00-3:00 PM PST)

**End of Day Goal:** You have at least one decent demo recording. You know what the final version should look like. Summary is drafted.

---

### Sunday Feb 15 — Final Demo + Submission Prep

**Morning (focus: final recording)**
- [ ] Any last bug fixes or polish based on Saturday's recordings
- [ ] Record final demo video (aim for 2-3 takes, pick the best)
- [ ] Upload to YouTube or Loom
- [ ] Finalize written summary (100-200 words)

**Afternoon (focus: repo and submission)**
- [ ] Clean up GitHub repo
  - README with project description, setup instructions, architecture
  - Make sure all code is committed and pushed
  - Verify open source license is in place
  - Remove any secrets / .env files from repo
- [ ] Prepare submission on CV platform
  - Demo video link
  - GitHub repo link
  - Written summary
- [ ] Do a dry run of the submission flow — make sure everything works

**Evening (focus: buffer)**
- [ ] This is buffer time. If everything is done, relax.
- [ ] If not, this is your catch-up window.

**Events:**
- Tips and tricks with Lydia Hallie (12:00-1:00 PM EST / 9:00-10:00 AM PST)
- Office hours (5:00-6:00 PM EST / 2:00-3:00 PM PST)

**End of Day Goal:** Everything is ready to submit. Video is recorded and uploaded. Repo is clean. Summary is written. You could submit RIGHT NOW if you wanted to.

---

### Monday Feb 16 — Submit (DEADLINE: 12:00 PM PST / 3:00 PM EST)

**Morning (final check + submit)**
- [ ] Watch your demo video one more time — is it good?
- [ ] Read your summary one more time — is it clear?
- [ ] Check GitHub repo one more time — is it clean?
- [ ] **SUBMIT by 11:00 AM PST** (give yourself 1 hour buffer before 12:00 PM deadline)
- [ ] Breathe.

---

## Architecture Decision: Keep It Simple for Hackathon

The plan-crossbeam.md describes a Cloud Run + Vercel Sandbox architecture. That's the right production architecture, but for the hackathon demo, consider this simpler path:

### Option A: Full Stack (Production-Like)
```
Frontend (Vercel) → Cloud Run → Vercel Sandbox → Agent SDK → Results → Supabase
```
- Pros: Impressive architecture, shows production thinking
- Cons: 2+ days of infra work, more things to break during demo

### Option B: Simplified Hackathon Stack (Recommended)
```
Frontend (Vercel/local) → Next.js API route → Agent SDK (runs in-process) → Supabase for storage
```
- Pros: 1 day of integration work, fewer failure points, more time for agent quality
- Cons: Won't handle long-running agents well (timeout risk)
- Mitigation: For demo, pre-run the agent and show the results, OR use streaming to show progress within timeout

### Option C: Local Demo
```
Frontend (local) → Direct Agent SDK call → Local filesystem
```
- Pros: Dead simple, maximum time for agent quality + frontend polish
- Cons: Not "deployed" — but judges care about the demo video, not your URL
- Note: Many hackathon winners demo locally

**Recommendation:** Start with Option C (local) for Wednesday-Thursday testing. Move to Option B on Friday for the deployable version. Only attempt Option A if you finish early and have spare time.

---

## Critical Path (What MUST Happen)

These are the non-negotiable milestones. If any of these slip, everything downstream is at risk.

| When | Milestone | Status | Why It Matters |
|------|-----------|--------|----------------|
| **Wed EOD** | ~~Agent SDK runs corrections flow locally with real data~~ Skills built + CLI pipeline E2E tested | **PARTIAL** — SDK deferred, but pipeline proven via CLI | If the agent can't run, nothing else matters |
| **Thu EOD** | Agent SDK runs corrections flow + output is good quality | **PENDING** — Thu morning priority | Output quality is the demo. Bad output = bad demo. |
| **Fri EOD** | Working web UI with both flows | **PENDING** | Need a UI to demo. Even if rough. |
| **Sat EOD** | At least one demo recording exists | **PENDING** | Can't submit without a video. |
| **Sun EOD** | Everything ready to submit | **PENDING** | Monday is emergency-only. |

### Mid-Hackathon Status Check — Wed Feb 11, 10:30 PM PST

**Overall position: STRONG, with one key item carried over.**

| Area | Status | Confidence |
|------|--------|------------|
| **Skills (the product)** | 8 skills built, tested, iterated | HIGH — ahead of schedule |
| **Corrections pipeline** | Full E2E working via CLI, output quality already good | HIGH |
| **Agent SDK backend** | Thoroughly planned (839-line doc), not yet coded | MEDIUM — 2-3 hr estimate, proven config from Mako |
| **Frontend** | Not started | ON TRACK — scheduled for Friday |
| **City research** | Working, tested with Buena Park | HIGH |
| **City-side flow** | Conceptualized + planned (190-line doc) | BONUS — not in original schedule |
| **Demo video** | Not started | ON TRACK — scheduled for Saturday |

**Risk assessment:** The only real risk is the Agent SDK wiring. The plan is thorough and the config is proven from the Dec 2025 Mako project, but "it should take 2-3 hours" is an estimate. If SDK issues eat Thursday morning, it compresses the afternoon. Mitigation: worst case, demo the corrections flow through CLI (still impressive) and show the Agent SDK architecture in the video.

**Key decisions made today:**
1. Targeted viewing over exhaustive extraction — 10x faster, architecturally smarter
2. City research: WebSearch → WebFetch → Browser fallback (3-mode design)
3. Skills-first, SDK-second — the right call for a hackathon where skills ARE the product
4. Checklist generator (Flow 1) deprioritized — corrections flow is the money shot

---

## What to Cut If Behind Schedule

In order of what to drop first:

1. **Flow 3 (City Pre-Screening)** — Already planned as vision only. Just mention it in the video.
2. **Cloud Run / Vercel Sandbox infra** — Demo locally. Nobody will know.
3. **Flow 1 (Checklist Generator)** — If corrections flow is amazing, one flow is enough. Mention checklist as "also built" in video.
4. **Supabase real-time updates** — Use polling or just show agent logs in terminal.
5. **Deployment to Vercel** — Local demo is fine for video recording.
6. **Polished frontend** — A clean but simple UI with shadcn defaults still looks good.

**NEVER cut:** Agent output quality on the corrections flow. That IS the project.
