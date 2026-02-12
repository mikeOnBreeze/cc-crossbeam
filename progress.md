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
