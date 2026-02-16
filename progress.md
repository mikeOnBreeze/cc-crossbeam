# CrossBeam — Progress Log

---

## Tuesday, February 10 — 6:20 PM PST

**Day 1 wrap-up. Research + Planning + Skill Foundation.**

What got done today:
- Deep research on Claude Agent SDK, Vercel Sandbox hosting, skill architecture
- Reviewed all existing discovery calls, market research, hackathon rules
- Wrote project plan (`plan-crossbeam.md`)
- Converted the full 2025 HCD ADU Handbook (PDF, ~54 pages) into a structured Claude Code skill — 27 reference files organized by topic, decision-tree router in `SKILL.md`, and an `AGENTS.md` for Claude Code integration
- Wrote the composite skill plan (`plan-skill-aduComposite.md`)
- Attended hackathon kickoff and office hours
- Set up `.gitignore`, initialized repo, pushed to GitHub: https://github.com/mikeOnBreeze/cc-crossbeam

Where things stand:
- State-level ADU skill is solid. Tested it — routes correctly, references load.
- Plan is good. Know the architecture, know the priorities.
- Repo is clean and on GitHub.

What's next (Wednesday):
1. **ADU composite skill** — meld the state-level skill with Claude Code tooling
2. **City-level web search tool** — 480+ CA cities each have different ADU regs published online; need a skill that can navigate any city site, find the rules, and document them
3. **Agent harness** — Claude Agents SDK backend to orchestrate everything

---

## Tuesday, February 10 — 7:00 PM PST

**Final update for the day. Applied 2026 addendum. Calling it.**

- Applied the 2026 HCD ADU Handbook Addendum to the California ADU skill. Updated 15 reference files across the skill (compliance, glossary, legislative changes, ownership, permits, standards, unit types, zoning). The skill now reflects both the 2025 handbook and the 2026 addendum.
- Raw addendum text extracted and saved (`HCD-ADU-Addendum-2026-raw.md`)
- Skill update manifest, prompt, and kickoff docs created for traceability

Good first day. Blank page to a fully structured state-level ADU skill with 27 reference files, current through 2026. Research done, plan written, repo on GitHub. Heading to the gym.

**Picking up tomorrow:** composite skill, city-level web search, agent harness.

---

## Wednesday, February 11 — 12:00 PM PST

**Day 2 midday. PDF extraction skill deep dive. AMA with Cat Wu.**

**9:30–10:15 AM — AMA with Cat Wu (Claude Code product lead)**
- Really useful session. Biggest discovery: there's an **internal Claude Guide agent** (`cc-guide`) that has access to all the latest Anthropic docs. Would have saved a ton of time instead of manually browsing the Anthropic site and copy-pasting docs into project repos. It's kind of a hidden subagent though — hard to get Claude Code to invoke it naturally. Created a skill called `CC-guide` so I can just `/command` invoke it directly. Rad tool.

**10:15 AM–12:00 PM — PDF Extraction Skill (`adu-pdf-extraction`)**

This turned into its own full skill/workflow, and for good reason. Construction permit binders are *gnarly*:
- Mix of CAD software output and regular PDFs with text/forms
- Super dense, small details matter (that's literally what the corrections are about)
- Watermarks, signatures, stamps overlaid on everything (required by regulation)
- Way too big and varied to just feed a raw PDF into Claude Code

**What I tested:**
- Standard document-skills PDF text extractors — Tesseract, pdf-to-text, etc. None worked well, especially with the watermarks obscuring text.
- **Screenshot + vision approach** — took PNGs of each page, fed them to Claude Code's vision. This worked *great*. Claude nails the details through screenshots that OCR chokes on.

**The approach we're building:**
1. **PDF → PNG** — convert each page to an individual PNG
2. **PNG → Vision extraction** — feed each page to a subagent that uses vision to read and extract text. Running in **batches of 3 subagents** for speed.
3. **Manifest/index generation** — this is the key insight. The pages in a permit binder aren't numbered page 1, 2, 3 — they're labeled A3, S1, E2, etc. (architectural, structural, electrical sheets). When a corrections letter says "see sheet A3," that's not page 3 of the PDF. So we need a `manifest.json` that maps: here's what each page actually is, here's how it's labeled, here's what's on it.

**Current thinking on architecture:**
- Watched the skill run independently — PDF→PNG worked great, PNG→vision text extraction worked great. But it restarted the workflow for the manifest step, which feels wrong.
- Starting to think the vision extraction subagents should write notes to the manifest *as they go*, then the orchestrator does a final cleanup pass using the ADU handbook skill to figure out what's important and where important things are within the permit. That way the handbook knowledge informs the index, not just raw extraction.

**Rest of today's plan:**
1. **Next hour** — finish the PDF extraction skill, nail the manifest generation
2. **Afternoon** — city-level web search tool. This is the most interesting and hardest piece. CA has 480+ cities, each publishes their own ADU regulations (required by law), but every city's website is different. Need a dynamic search skill using web search + browser tools that can find and document city-specific ADU quirks. State-level is baked into our skill; city-level has to be discovered on the fly.
3. If time, start wiring the composite skill together

---

## Wednesday, February 11 — 4:15 PM PST

**Pivot on PDF extraction. Accuracy vs. speed tradeoff hit hard.**

Spent the afternoon iterating on the PDF extraction skill, trying to push accuracy from ~85% to ~95%. Got there — but at a brutal cost:

- **85% accuracy:** 10–15 minutes for a 26-page binder. Workable.
- **95% accuracy:** 35 minutes for the same binder. Not workable.

These construction plan PDFs are dense as hell — CAD drawings, stamps, watermarks, tiny text — and getting near-perfect vision extraction means the subagents are grinding on every page. 35 minutes just to extract text before the agent even starts *doing* anything with it? That's a dead end for a real product.

**The pivot:**

Instead of perfecting text extraction upfront, flip the flow. Keep the extraction simple and fast (programmatic: PDF→PNG + basic text extraction via Tesseract/pdfplumber — yes it's shitty on these docs, but it's *fast*). Then let the **search agent be smart** about what matters:

1. Read the corrections letter (that's clean text, easy to parse — the 2nd review corrections letter has 14 specific items)
2. Use the California ADU handbook skill to understand the state-level code sections
3. Web search the city (e.g., Placentia) to find city-specific codes and requirements
4. Cross-reference corrections against state + city codes
5. Only *then* go into the construction plans to find the specific pages/sheets that need changes — using the PNGs + rough text + original PDF as reference, guided by knowing what it's looking for

This is smarter anyway. Don't extract everything perfectly and then figure out what matters. Figure out what matters first, then go look for it.

**Also running in parallel:** the web search skill is working — it reads the corrections letter, looks up relevant state code sections, searches for city-level requirements, and produces a summary of what the contractor needs to fix. That flow is looking promising.

**About to do:** Major simplification of the extraction skill. Stripping out the multi-pass vision extraction. Going back to simple programmatic PNG + text extraction. Checkpoint push first.

---

## Wednesday, February 11 — 10:30 PM PST

**Day 2 EOD wrap-up. Big brain dump. A lot happened.**

### PDF Extraction — Lessons Learned

The first half of the day was all about the PDF extraction skill. These ADU blueprint plans are unlike anything I've dealt with before — and I've processed 700+ docs in a zip in other projects. The issue is the plans are designed to be printed on table-sized paper. At 200 DPI as a PNG, you lose a ton of context. Every page is a different beast — CAD software output, stamps, watermarks, signatures, tiny annotations.

- Built the extraction all the way out to **95%+ accuracy** using Claude's vision model. It's genuinely impressive — Opus 4.6 crushed nearly every challenge I've thrown at it, and this was the first time I hit a wall. Not because it *couldn't* do it, but because doing it well took **35 minutes** per 26-page binder.
- **Lesson for the future:** The hackathon speakers said "don't develop for models as-is, develop for future models." This is a perfect example. The `adu-pdf-extraction` skill is accurate with vision *today* — in 6 months, better models will make it fast AND accurate. Leaving it as-is; it'll age well.
- **Hackathon reality check:** Spent too long chasing perfection on extraction. The time pressure actually forced a better architectural decision — targeted viewing instead of exhaustive extraction.

### The Pivot — Targeted Page Viewer

Built a new skill off the extraction foundation: **`adu-targeted-page-viewer`**. Instead of extracting everything from every page, it:
- Reads the corrections letter (14 specific items to fix)
- Targets only the pages/sheets that matter
- Builds an index and guides the AI agent to find specific details
- Way faster because you're not grinding through 26 pages of CAD output when you only need 6 of them

### City-Level Web Search

Originally planned to use the Chrome MCP browser tool for everything. Problem: too slow. Even with multiple subagents running concurrently, navigating city websites with the browser tool was taking forever — clicking around, getting lost, loading pages.

**What actually works:** Web search + web fetch combo.
- Use web search to find the city's building & planning division pages
- Web fetch the important pages directly
- Fire off explore subagents at those specific URLs
- Use the corrections letter to target-search the relevant local ordinances

Still using the Chrome browser tool for **one thing**: a site called e360 (or similar) — a law database that has a ton of California local ordinances indexed. Their site requires actual browser navigation to search effectively, so that's the one place the Chrome MCP tool shines.

**Test run: Buena Park** (buddy's city, he's the mayor). Full orchestrator + 3 explore subagents mapped out the city-specific ADU rules in about 15 minutes. Not bad for a one-time city research task, but needs to be faster for real-time corrections flow. Still iterating.

### Claude Code Guide Agent

This thing is a beast. Discovered it at the Cat Wu AMA this morning, been using it all day. Speeds everything up — instant access to latest Anthropic docs without manually browsing their site. Had it help build out the Agents SDK plan for the corrections flow.

### Corrections Flow — Agents SDK Plan

Used the CC Guide agent + my own accumulated Agents SDK docs to build out `plan-contractors-agents-sdk.md` — the full plan for tomorrow's backend build. The corrections flow with the Claude Agents SDK: reading corrections, researching state + city law, getting contractor feedback, generating response packages. Probably won't deploy to Vercel Sandbox (time constraints), but hackathon doesn't require deployment — local demo is fine.

### Surprise: City Corrections Flow (the flip side)

While planning the contractor corrections flow, realized the flip side is just as valuable: **cities generating corrections letters**. Same skills, same knowledge base, opposite direction. If a contractor submits plans, a city planner could use this to *generate* the corrections letter. Built out that flow quickly because all the skill infrastructure was already there. Haven't got it producing PDFs yet but that's straightforward — done it in plenty of other projects.

### Tomorrow (Thursday) — Build Day

1. **Claude Agents SDK backend** — wire up both flows (contractor corrections + city corrections) programmatically, running locally
2. **UI beginnings** — at least start the frontend, even if minimal
3. **Video story structure** — need to outline the 3-minute demo narrative. Don't need to film yet, but need the story arc and start capturing "shots" (learned from the Replit video experience: story first, build a shot library as you go)

Good day. Frustrating in the morning with the extraction rabbit hole, but the time pressure forced smarter decisions. Two flows now, both grounded in solid skills. Tomorrow is all about making them run as real agents. 10:30 PM, calling it. See you Thursday.

---

## Thursday, February 12 — Morning PST

**Day 3. Agents SDK build kicking off.**

- Got planning files finalized and polished (`plan-contractors-agents-sdk.md` now at 1077 lines — comprehensive).
- Set up `.env.local` with Anthropic API key for the Agents SDK.
- Built a **fal-ai skill** for generating visual assets (images/video for the demo).
- Experimented with demo visuals — generated a bunch of ADU concept images and orbit videos using fal-ai + Kling. Tilt-shift miniatures, isometric views, elevation-to-photorealistic transforms. Built a `visuals/` folder with ~214MB of assets (gitignored — too heavy for the repo, kept locally).
- **Kicked off Phase 1 of the Agents SDK build** using a long-running agent. Phase 1 complete — haven't personally tested yet but the build looks good.

**Next:** Test Phase 1 output, then continue into Phase 2 of the Agents SDK implementation.

---

## Thursday, February 12 — 7:45 PM PST

**Day 3 EOD. Agents SDK backend taking shape. Both flows working.**

### Contractor Corrections Flow — Working via CLI

The contractor flow is running end-to-end through the Agents SDK. Takes about **15 minutes** per run — reads corrections letter, researches state + city law, cross-references the plans, generates contractor guidance. That's longer than ideal but it's doing real work: web search, code lookup, plan analysis, response generation. Successfully tested today.

### City Plan Review Flow — Built and Testing

Built out the city flow today — the flip side where a city planner reviews submitted plans and generates corrections. This one runs **7.5–10 minutes** through the CLI. The city skill itself came together really well. Currently have another agent critiquing the plan for incorporating the city flow into the Agents SDK backend (`plan-city-agents-sdk.md`).

New skills built today:
- `adu-plan-review` — city-side plan review skill
- `adu-corrections-pdf` — corrections document generation
- `placentia-adu` — Placentia-specific ADU research (city-level skill)

### City Market Economics — Compelling Discovery

Built out `marketing-city.md` — the city-side market economics are wild. Cities are legally required to provide feedback on permit applications within 30 days (state law). To hit those deadlines they're paying contractors, third-party consultants, overtime staff. The cost per review is significant. An AI agent that can do the initial plan review and draft corrections letters in 10 minutes vs. days of human reviewer time — that's a real market with real budget dollars already being spent.

### Placentia Research

Deep-dived Placentia specifically (our test city): broader research, city site analysis, ecode360 municipal code lookup. Four research docs produced. Also pulled Placentia's ADU/JADU submittal requirements PDF.

### Visual Design Direction

Been exploring isometric ADU building icons using fal-ai on the side. Love the look — tilt-shift miniature style, clean isometric buildings. The idea: while the agent runs its 10–15 minute flow, the loading screen shows tool calls streaming AND an animated ADU building itself getting "built." Need to balance design time vs. agent quality — can't sacrifice the core product for pretty UI — but this could make the demo video pop.

### Tomorrow (Friday) — Frontend + Video

1. **Wire the city flow into the Agents SDK backend** (plan is being refined tonight)
2. **Frontend** — build the UI, tie it to the backend, get both flows running through a web interface
3. **Demo video story** — start outlining the narrative, capture shots as we build
4. Don't over-design. Agent output quality > pretty UI. But make it look good.

Solid day. Both flows functional, city economics validated, Agents SDK backend coming together. Heading to the gym. See you Friday.

---

## Friday, February 13 — 5:00 PM PST

**Day 4. Planning & design done. Entering execution phase.**

### Big Realization from Office Hours

Asked the question: "What's better — deploy or polish?" Assumed they'd say polish. **They want deployment.** Glad I asked because my whole plan was local demo + good video + GitHub. Now deployment on Vercel is a must. Funny thing is, this is how I actually learned everything — by deploying, not just building local examples. GitHub repos that say "figure out deployment yourself" have always been useless to me.

This is the **third (maybe fourth) time** building with the Agents SDK. First attempts when it was still called "Claude Code SDK" were a nightmare — no sandbox infrastructure, everything failed. Got burned. But the SDK has gotten a lot better since then, and we got Mako working great, so there's proven patterns now. Built-up trauma but also built-up knowledge.

### What Got Done Today

**Strategy & Architecture:**
- `plan-strategy-0213.md` — full strategy doc (541 lines). Lays out the entire approach: Agents-CrossBeam goes into the Vercel Sandbox, harness wraps around it.
- `plan-deploy.md` — deployment plan (756 lines). The full Vercel deployment story.
- `plan-supabase-0213.md` — Supabase integration plan (395 lines). Database, storage, real-time.
- `plan-supabase-feedback-0213.md` — feedback loop architecture (173 lines).
- `learnings-agents-sdk.md` — consolidated learnings from all previous Agents SDK attempts.
- `reference-mako.md` — reference from Mako (the demand letter app that actually works) to pattern-match against.

**City Flow — Agents SDK:**
- City plan review flow built into agents-crossbeam (`plan-review.ts`)
- City-specific skills wired in (Placentia ADU, plan review, corrections PDF)
- Test suite for city flow: smoke tests, skill reads, admin review, PDF generation, full review
- Mock session data for testing

**Design Bible:**
- `DESIGN-BIBLE.md` created — the full visual design system.
- Explored 4 design directions with generated mockups:
  1. Golden Ground — warm, premium
  2. Blueprint Precision — technical, clean
  3. Magic Dirt — playful, the "dirt to house" metaphor
  4. Hybrid Golden Magic — the winner, blending premium feel with the playful ADU building concept
- 13 design mockups generated (landing, flow selection, upload, agent working, questions, results)
- Super excited about this direction. The isometric ADU building animations during the agent's working phase are going to make the demo pop.

### Tonight's Plan — The Big Push

Working late tonight (targeting ~11 PM). This is THE night to push hard:

1. **Build the full Next.js frontend** — using the Design Bible, wire everything together
2. **Deploy to Vercel** — get the whole thing running: frontend + Agents SDK backend in Vercel Sandbox
3. **Both flows working deployed** — contractor corrections + city plan review

**If I hit 11 PM with deployment working on Vercel:**
- Saturday = clean up, test thoroughly, capture demo video shots
- Sunday = video editing, tie narrative together
- Monday morning = last-minute polish, submit

Feeling good. The planning is done. The skills are done. The Agents SDK flows work locally. Now it's execution. Let's go.

---

## Friday, February 13 — Saturday, February 14 ~1 AM PST

**The all-nighter. Frontend from zero to deployed. Server from zero to deployed.**

This was the night. Went from "plans are written" to "both flows running in the cloud."

### Frontend — Built in One Session

Kicked off a long-running agent with the full frontend brief and the Design Bible. Phases 1 through 6 all landed:

1. **Foundation** — image pipeline, infra, Design Bible styling baked in from the start
2. **AduMiniature component + landing page + login** — the isometric ADU buildings are the visual identity of the whole thing
3. **Dashboard** — nav bar, persona cards (city reviewer vs contractor), flow selection
4. **Project detail** — status-driven rendering. The page morphs based on where the agent is: processing, awaiting answers, completed, failed
5. **Completion screens + API route** — results viewer, output rendering
6. **Integration polish** — design compliance pass, verified the build passes clean

Also built:
- **Three-tier mode system** — Dev Test (scripted data, step through states), Judge Demo (pre-seeded projects, runs against real sandbox), Real (coming soon). This turned out to be critical for the demo because you need different behaviors for different audiences.
- **DevTools panel** — a scrubber that lets you walk through agent states with scripted data. Inject messages at each phase, see the UI update in real time. Built this for development but it ended up being a great way to show judges the full state machine without waiting 15 minutes.

### Server — Express on Cloud Run

Built the CrossBeam server: Express 5, three flows (corrections-analysis, corrections-response, city-review), nine skills loaded into each sandbox, full sandbox lifecycle management. Dockerized, deployed to Cloud Run via GitHub Actions CI/CD.

### Bug Parade (Friday Night)

The classic "it works locally but..." session:
- React hooks ordering in DevTools — moved the guard below all hooks
- DevTools ↔ page state sync — replaced polling with instant event-based updates
- Polling after clicking Start — had to detect the `ready → processing` transition, not just check if status was `processing`
- 403 on judge demo — permissions issue on the pre-seeded project
- Project reset for reusability — judges need to be able to run the demo more than once
- `sips` (macOS screenshot tool) in the sandbox — replaced with cross-platform ImageMagick. Sandbox runs Linux.
- TypeScript type mismatch between Supabase SSR client and JS client types
- API key auth — added dual auth: Bearer tokens for the agent API, Supabase sessions for browser users

Built the **crossbeam-ops skill** — teaches Claude Code agents how to operate the deployed site (trigger flows, check status, read results, navigate the UI, query the database). Meta but useful.

### Where Things Stand at 1 AM

Frontend deployed on Vercel. Server deployed on Cloud Run. Both flows running through the Agents SDK in Vercel Sandbox. Supabase wired up. Three-tier mode system working. The app looks good — the Design Bible paid off. Going to bed.

---

## Saturday, February 14 — All Day PST

**Infrastructure hardening. Making the cloud runs actually reliable.**

### The Big Architectural Moves

**PDF extraction moved to Cloud Run.** The Vercel Sandbox is 4GB — not enough for `pdftoppm` + ImageMagick on 26-page construction plan PDFs (7,400px wide pages). Moved the heavy extraction to Cloud Run and made the sandbox purely AI: it receives pre-extracted PNGs and just does the smart stuff. For the demo, PDFs are pre-extracted and the PNGs are bundled as fixtures. For real users, the Cloud Run server runs extraction scripts before launching the sandbox.

**Switched from polling to Supabase Realtime.** Huge quality-of-life improvement. The frontend subscribes to status changes and agent messages via Supabase Realtime — instant updates, no polling interval. When the agent writes a status update or streams a message, the UI updates within a second.

**Redesigned city-review orchestrator for file-based coordination.** The subagents were stepping on each other. Moved to a pattern where each subagent writes to its own output files and the lead agent reads them to coordinate. Way more reliable than trying to pass state between subagents in memory.

### Agent Reliability

- **Mandatory subagent rules** to prevent context window blowout. The agents were trying to be too thorough — reading every page, researching every code section. Added hard rules: each subagent gets a specific scope, stays in its lane, writes structured output, done.
- **Removed web search for onboarded cities.** Placentia has pre-baked research (from Wednesday's deep dive). No point burning 5 minutes on web search when we already have the city's ADU rules documented. For non-onboarded cities, the web search skill still fires.
- **Bumped Cloud Run timeout to 60 minutes.** Agent runs can hit 15-17 minutes. Default timeout was killing them.
- **Removed PDF generation from sandbox.** Agent ends at markdown. PDF generation was unreliable in the sandbox environment and not worth the debugging time. The markdown output is what matters — it renders beautifully in the results viewer.

### Frontend Polish

Two rounds of critique-driven polish:
- Copy cleanup across the whole app
- Topo lines background pattern (subtle topographic map lines — fits the land/building theme)
- 16 keyed ADU images (each persona card gets a random isometric ADU building)
- Randomizer fix (was showing the same image every time — React's `useId()` hook fixed it)
- Results viewer polish — full-width rendering, better typography for the markdown output
- Dual dashboard with contractor/city toggle
- Richer city persona cards
- Navbar layout fixes

### Manifest Pre-Loading

Pre-loaded the `binder-manifest.json` for both flows. The manifest maps construction plan page numbers to sheet labels (A1, S1, E2, etc.) — critical because corrections letters reference sheets by label, not page number. Pre-loading means the agent can start cross-referencing immediately instead of building the manifest first.

### End of Saturday

Both flows passing in the cloud. City review: 16 minutes, $8.69. Contractor analysis: 11 minutes, $4.46. Contractor response: 6 minutes, $1.46. Full contractor E2E: 17 minutes, $5.92. Not cheap, but the output quality is legit.

---

## Sunday, February 15 — All Day Into Monday 5 AM PST

**Video production day. Bug fixes. Landing page rewrite. The final push.**

### The Video

This ate the whole day and then some. Separate repo (`cc-crossbeam-video`) because the assets are massive.

**Interviews:**
- Recorded Connor Trout — Mayor of Buena Park, population 80,000, 4-5 building staff trying to hit state housing targets. Real human talking about the real problem. This is the "impact" angle for the judges (25% of the score).
- Already had Cameron's interview from Thursday (the contractor who got the corrections letter that inspired the whole project)

**Screen Recordings:**
- Cameron walking through the corrections letter and the app output
- Scrolling through the live deployed app — all the screens, both flows
- Law code scrolling (California Government Code sections for the "skills architecture" angle)
- Blueprint spreads — the actual construction plans at full resolution
- Mike (me) doing the voiceover/presentation walkthrough

**Remotion Pipeline:**
Built animated shot compositions in Remotion (React-based video framework):
- Hero landing animation
- Architecture diagram shot
- Contractor flow walkthrough
- Processing/agent working animation
- Corrections analysis visualization
- Blueprint spread pan
- Accuracy + logo bumper

**Music:**
Sourced 7 tracks from CassetteAI and Beatoven — beach reggae, tropical dub, island bounce vibes. SoCal energy. Picked a couple that fit the pace.

**Premiere Pro:**
Cut the whole thing in Premiere. Multiple exports. First rough cut at 4:41 PM, Connor tag clip, then kept iterating. Final export at 2:51 AM Monday — 286MB, uploaded to YouTube.

### Bug Fix — Contractor Questions

The one commit in the main repo on Sunday. The agent writes `contractor_questions.json` with a nested `question_groups[].questions[]` structure, but the insert code was looking for a flat `questions[]` array. Result: questions never made it into the database, never showed up in the UI. Fixed the parsing to handle the nested structure. Also added answer versioning — `contractor_answers` now links to a specific output version via `output_id`, so re-runs don't mix old answers with new questions.

### Landing Page Rewrite (Monday ~3-4 AM)

Realized the landing page was wrong for the audience. It was a product marketing page — "AI-Powered ADU Permit Review for California." Judges don't care about that. They want to see the architecture. Rewrote the entire thing as a **technical deep-dive**:
- Anatomy of a corrections flow (4-step pipeline diagram)
- "28 Files, Not One Prompt" — the skills architecture with the decision tree
- "One Page Per Subagent" — the PDF processing constraint and solution
- "480 Cities, 3 Research Modes" — city code research architecture
- "Why Three Layers" — infrastructure diagram (Next.js → Cloud Run → Vercel Sandbox → Supabase)
- Embedded the YouTube demo video
- Stats strip (429K ADU permits, 90%+ correction rate, $250M+ VC in permit tech, $30K cost of delays)
- Status board (working / in progress / roadmap)

### Repo Cleanup

Deleted a ton of test extraction data (6 rounds of PDF extraction tests — hundreds of files from the Wednesday rabbit hole). Organized docs into subdirectories. Wrote a real README with architecture, tech stack, project structure, how to run locally, and test data attribution.

### Went to Bed at 5 AM

Seven days. Blank page to a deployed, working AI agent platform. Skills architecture, multi-agent orchestration, cloud deployment, video produced, submitted. Done.

---

## Monday, February 16 — 11:15 AM to 11:40 AM PST

**Woke up. Found the problem. Fixed it. Submitted.**

Woke up at 11:15 after 6 hours of sleep. 45 minutes until submission. Pulled up the deployed app, clicked through it like a judge would. And there it is: the Judge Demo persona cards link straight to `/projects/{id}` — but those projects are already in `completed` state with all the results loaded. The judge sees the finished output with "Reset" at the bottom. That's it.

We built the entire Agents SDK pipeline — Cloud Run orchestrator, Vercel Sandbox, Supabase Realtime, the whole thing — and the demo skips all of it. It looks like I faked the output. The agent never runs. The judge never sees status updates streaming in, never sees the subagents launching, never sees the messages coming through Realtime. All the engineering work is invisible.

Panicked. Had Claude Code and Cursor both going. 8 commits in 12 minutes:

1. **Showcase + Run Live dual-button mode** — judge demo now shows two paths: "Showcase" (see the pre-loaded results instantly) and "Run Live" (kick off a real agent run and watch it work). Both buttons on the persona cards.
2. **"How It Works" nav link** — added a link from inside the app back to the technical overview on the landing page, so judges can read the architecture while the agent runs.
3. **Run Live resets project before navigating** — hitting Run Live resets the project to `ready` state so the agent starts fresh. Judge gets the full experience: status updates streaming, messages coming in via Realtime, subagents launching.
4. **Fix Try It Live buttons** — the landing page CTAs weren't working for authenticated users. Fixed the routing.
5. **Back link points to dashboard** — so judges return to the persona cards and can try the other flow.

Pushed. Deployed. Everything green. 11:40 AM.

---

## Final Thoughts

Seven days. Solo builder. Huntington Beach, California.

Started with a blank repo on Monday night. Ended with a deployed AI agent platform that reads construction plans via vision, interprets city corrections letters, cross-references California state law and city municipal code, asks the contractor smart questions, and generates a professional response package. Two flows working end-to-end in the cloud. 28 reference files of California ADU law structured as skills. Multi-agent orchestration with rolling subagent windows. Cloud Run + Vercel Sandbox + Supabase Realtime architecture. A 3-minute video with interviews from a real contractor and the Mayor of Buena Park.

The video's sick. Cameron and Connor both came through. A lot of people gave support along the way — friends hopping in, testing things, giving feedback, keeping energy up at 3 AM. Grateful for all of it.

Regardless of what happens with the judging — genuinely proud of what got built. The skills architecture is real. The agent output is real. The problem is real. 429,000 ADU permits in California since 2018, 90%+ get corrections on first submission, and nobody's building tools for this specific workflow.

Built with Claude Code the entire way. Every line of code, every skill, every plan, every debug session. Opus 4.6 was the backbone. The hackathon speakers said "build for future models" — the extraction pipeline and skills architecture will only get better as models get faster and cheaper. The bones are solid.

Thanks, Opus. Good hackathon. Let's see what happens.
