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
