# City-Side Plan Review — AI Corrections Generator

## The Problem

City building departments are drowning. A single ADU plan review takes a plan checker **3-4 hours** — and 50-60% of that time is spent on repeatable, pattern-based checks: Are the governing codes listed? Are stamps and signatures present? Is the fire separation correct for the setback distance? Are utility connections shown? Do the elevations match the roof plan?

Meanwhile, the backlog grows. Contractors wait weeks for corrections letters. Cities lose permit revenue because throughput is capped by human reviewer hours.

## The Goal

Build an AI plan review assistant for cities that handles the repeatable 60% — administrative checks, code compliance verification, plan consistency — and produces a **draft corrections letter** with blanks where the human reviewer needs to apply engineering judgment.

**If we cut the review time in half**, a city that processes 4 permits/day can process 8. That's double the permit fees, double the construction starts, double the economic activity. The AI doesn't replace the plan checker — it eliminates the drudgery so they focus on the substantive 40% that actually requires expertise.

## The Insight: Same Knowledge Base, Opposite Direction

CrossBeam already has the domain knowledge built out for the contractor side:

| Asset | What It Knows | Status |
|-------|--------------|--------|
| `california-adu` skill | State-level ADU law — CRC, CBC, CPC, Gov Code, Title 24, CalGreen. 28 reference files. | **Done** |
| `adu-city-research` skill | How to find any California city's municipal code, standard details, and information bulletins via web search. | **Done** |
| `adu-targeted-page-viewer` skill | How to extract a plan binder PDF into pages, build a sheet manifest, and read specific sheets on demand. | **Done** |
| `adu-corrections-interpreter` skill | Understands the format, structure, and content of city corrections letters. Knows what plan checkers look for. | **Done** |
| `adu-corrections-flow` skill | The full pipeline — reads corrections, researches codes, views plans, categorizes items, generates questions. | **Done** |

The contractor flow uses all of this to **interpret** corrections. The city flow uses the same knowledge to **generate** them. The skills are domain knowledge — they don't care which direction the workflow runs.

## The Two-Sided Platform

```
                        ┌─────────────────────┐
                        │     CROSSBEAM        │
                        │  ADU Permit Platform  │
                        └──────────┬──────────┘
                                   │
               ┌───────────────────┼───────────────────┐
               │                                       │
    ┌──────────▼──────────┐             ┌──────────────▼──────────┐
    │   CITY SIDE          │             │   CONTRACTOR SIDE        │
    │                      │             │                          │
    │  Upload plan binder  │             │  Upload corrections      │
    │  AI reviews plans    │             │  letter + plan binder    │
    │  Generates draft     │             │  AI interprets + builds  │
    │  corrections letter  │             │  response package        │
    │  Plan checker edits  │◄───────────►│  Contractor submits      │
    │  & sends to          │  feedback   │  corrected plans         │
    │  contractor          │    loop     │                          │
    └─────────────────────┘             └──────────────────────────┘
```

Both sides use the same underlying knowledge. The loop closes: city generates corrections faster, contractor responds to corrections faster. The whole cycle accelerates.

## City Flow Architecture

### Input
- Plan binder PDF (the full construction plan set submitted by the contractor)
- City name (determines which rules apply)

### Output
- **Draft corrections letter** — formatted like a real city corrections letter (we know the format from the interpreter skill)
- **Confidence flags** — each item marked as HIGH/MEDIUM/LOW confidence, so the plan checker knows where to focus
- **Reviewer blanks** — structural, complex engineering, and judgment-call items flagged as `[REVIEWER: ...]` for human completion

### Pipeline (reuses existing skills)

```
Phase 1: Extract & Map
  └─ adu-targeted-page-viewer → sheet manifest + page PNGs

Phase 2: Systematic Sheet Review (the new part)
  └─ Read each sheet against a plan review checklist
  └─ Cover sheet: stamps? signatures? governing codes? sheet index match?
  └─ Site plan: setbacks shown? utilities shown? drainage? grading?
  └─ Floor plan: dimensions? accessibility? egress?
  └─ Elevations: match roof plan? heights consistent? materials labeled?
  └─ Structural: calcs present? connection details? load path?
  └─ Title 24 / CalGreen: compliance docs present? climate zone?

Phase 3: Code Compliance Check (concurrent subagents)
  └─ 3A: State law check (california-adu skill — offline, fast)
  └─ 3B: City rules check (city knowledge — see tiered model below)

Phase 4: Generate Draft Corrections Letter
  └─ Cross-reference findings against code requirements
  └─ Format as a city corrections letter (we know the format)
  └─ Mark confidence levels and reviewer blanks
  └─ Group by section (Building, Fire, Site/Grading, etc.)
```

### What AI Can Confidently Flag

| Check Category | Confidence | Examples from Placentia Letter |
|---|---|---|
| **Administrative / Formatting** | HIGH (90%) | Items 1, 2, 9, 10 — stamps, governing codes, sheet labels |
| **Fire / Life Safety (rule-based)** | HIGH (80%) | Item 14 — setback < 5' → CRC R302.1 fire rating required |
| **Plan Consistency** | MEDIUM (60%) | Items 12, 13 — elevations vs roof plan mismatch |
| **Site / Grading / Drainage** | MEDIUM (50%) | Item 11 — drainage slopes shown? direction marked? |
| **Utility Connections** | MEDIUM (50%) | Item 4 — utilities on site plan, sizing justification |
| **Structural / Engineering** | LOW (flag only) | Items 3, 5 — flag for reviewer, don't attempt to assess |

**The plan checker's workflow becomes:** Skim the AI's HIGH confidence items (quick confirm/edit) → Focus their expertise on the MEDIUM items → Add anything the AI flagged as LOW or missed → Send.

## Tiered City Knowledge Model

Not every city gets the same depth. Three tiers:

### Tier 1: State Law Only (any California city, free)
- Uses `california-adu` skill (28 reference files, always available)
- Checks plans against state-level CRC, CBC, CPC, Gov Code, Title 24, CalGreen
- No city-specific checks beyond state minimums
- Still catches a huge amount — state law governs 70%+ of ADU requirements

### Tier 2: Web-Researched City (any California city, on-demand)
- Everything in Tier 1 PLUS
- Uses `adu-city-research` skill to look up city-specific rules on the fly
- Finds municipal code, standard details, information bulletins via web search
- Slower (3-5 min for city research) but works for any city
- Good for one-off reviews or cities that haven't onboarded

### Tier 3: Onboarded City (signed-up cities, e.g. Buena Park)
- Everything in Tier 1 PLUS
- **Dedicated city skill** with pre-researched reference files — same architecture as `california-adu` but for one city
- Deep research done ONCE at onboarding: municipal code sections, local amendments, standard details, IBs, fee schedules, specific reviewer preferences
- Fast (no web search needed — all offline), accurate, and tailored
- The city pays for this level — it's the SaaS model
- Example: `buena-park-adu` skill with 10-15 reference files covering Buena Park municipal code Title 9 (Planning & Zoning), standard construction details, ADU-specific ordinances

**The onboarding process for Tier 3:**
1. Research the city's full ADU regulatory landscape (web search + city website)
2. Download/document all standard details, IBs, and local amendments
3. Create a city-specific skill with reference files (like we did for state law)
4. Test against real permits (or the Placentia plans as proxy)
5. Iterate with city feedback

This is the same pattern we already proved at the state level — just applied per-city. The `california-adu` skill took a day to build. A city-specific skill would take 2-4 hours since most cities adopt state code with minor amendments.

## Where This Fits in the Hackathon

### Priority Order (unchanged)
1. **Flow 2: Corrections Interpreter** (contractor side) — the money shot, finish first
2. **Flow 1: Permit Checklist Generator** — strong bonus
3. **Flow 4: City Plan Review** (this document) — the killer feature for the demo narrative

### The Demo Narrative
The city side doesn't need to be fully built to be the most impressive part of the demo:

1. Show the contractor side working (Flow 2) — "Here's a real corrections letter from Placentia. CrossBeam interprets every item, researches the codes, and builds the response package."

2. Then flip it: "But what if the city had CrossBeam BEFORE they sent that letter?" Show the same plan binder going through the city-side flow. AI generates a draft corrections letter. Compare it side-by-side with the real one from CSG Consultants.

3. The punchline: "CrossBeam caught 10 of 14 items before a human reviewer touched it. That's 2 hours of plan review done in 7 minutes."

4. Show the tiered model: "Any California city gets state-level review for free. Cities that onboard get a dedicated knowledge base — like this one we built for Buena Park."

### Build Estimate for Hackathon Demo
- **Plan review checklist** (what to check on each sheet type): ~2-3 hours
- **Sheet-by-sheet analyzer** (targeted-page-viewer on all sheets): ~2-3 hours
- **Corrections letter generator** (format output as city letter): ~1-2 hours
- **Testing against Placentia plans**: ~1-2 hours
- **Total: ~6-10 hours** for a working prototype

For a **demo-only** version (generates letter from known patterns, limited checks): **~3-4 hours**.

## Open Questions

1. **Checklist scope** — Do we try to check everything, or focus on the high-confidence categories (administrative, fire/life safety, plan consistency) for the demo?
   - Recommendation: High-confidence only for hackathon. That's still 60% of corrections.

2. **Buena Park skill** — Worth building a Tier 3 skill for the demo, or just show the concept with Tier 1 + Tier 2?
   - Recommendation: Build it if time allows (2-4 hours). Having your buddy the mayor as a real reference point is worth a lot.

3. **Letter formatting** — Match the exact city letter format (like the CSG Consultants layout), or use our own CrossBeam format?
   - Recommendation: Our own format is fine. The point is the content, not mimicking the city's letterhead.

4. **UI split** — "Are you a contractor?" vs "Are you a city?" landing page split. Worth building for the demo?
   - Recommendation: Yes, even if the city side is simpler. The two-sided story is the platform narrative.

## The Business Case (napkin math)

- Average plan checker salary: ~$80-100K/year
- Average review time per ADU permit: 3-4 hours
- If AI cuts review time by 50%: each plan checker effectively doubles capacity
- City with 2 plan checkers processing 4 permits/day → 8 permits/day
- At $5K-10K average permit fees: that's $20K-60K more revenue/day potential throughput
- Cost of CrossBeam for a city: fraction of a plan checker salary
- ROI: obvious

The real sell isn't even the money — it's the **speed**. Contractors hate waiting 4-6 weeks for plan check. If the city can turn reviews around in days instead of weeks, that's a competitive advantage for the city itself. Contractors choose to build in cities that are fast.
