Plan: California ADU Handbook — Structured Skill Decomposition

 ---
 Overall Strategy: Building a Composite Regulatory Skill

 The Problem

 ADU permitting in California requires navigating three layers of law simultaneously — federal, state, and city.
  A contractor building a 600 sq ft detached ADU in Placentia faces different rules than one building the same
 unit in Long Beach, even though both are in California. Today, this knowledge lives in the heads of experienced
  designers and plan checkers, or scattered across dozens of PDFs and municipal code websites.

 The Composite Skill Model

 We're building a composite skill — a set of layered, independent skills that stack like legal jurisdiction:

 ┌─────────────────────────────────────────────┐
 │  ADU Permit Builder (orchestrator)          │  ← Future: routes queries to correct layers
 ├─────────────────────────────────────────────┤
 │  Layer 3: City/County Rules                 │  ← Future: per-jurisdiction skills (web search + cache)
 │  e.g., Placentia ADU ordinance,             │
 │  Long Beach specific standards              │
 ├─────────────────────────────────────────────┤
 │  Layer 2: California State Law              │  ← THIS SKILL (HCD ADU Handbook 2025)
 │  Gov. Code §§ 65852.2, 65852.22, 66323     │
 │  Statewide minimums, preemptions, process   │
 ├─────────────────────────────────────────────┤
 │  Layer 1: Federal Requirements              │  ← Future: FHA, ADA, fair housing, financing
 │  Fair housing, accessibility, lending       │
 └─────────────────────────────────────────────┘

 Key insight: State law sets the floor — cities can be more permissive but cannot be more restrictive than what
 the state allows. When a city corrections letter cites a local standard that conflicts with state law, the
 agent needs to know the state preemption rules. That's why this state-level skill is the foundation everything
 else builds on.

 How This Mirrors Legal Analysis

 Lawyers analyze regulations top-down: federal preempts state, state preempts local (with exceptions). Our
 composite skill works the same way:

 1. Federal layer establishes baseline requirements (ADA, FHA, lending rules)
 2. State layer (this skill) establishes California-specific ADU rights — what cities must allow, maximum
 restrictions cities can impose, statewide process requirements
 3. City layer adds local specifics — lot coverage limits, design standards, specific fee schedules, processing
 quirks

 When answering a question like "Can Placentia require a 10-ft rear setback for my detached ADU?", the agent
 would:
 - Load standards-setbacks.md from this skill → finds state max is 4 ft for rear setbacks
 - Load Placentia's local ordinance from the city-level skill → finds they require 5 ft
 - Resolve the conflict: State preempts — city cannot require more than 4 ft

 Replicating This Approach for City-Level Skills

 Future agents building city-level skills should follow this methodology:

 1. Source identification: Find the city's ADU ordinance (usually municipal code + any ADU-specific handouts).
 Many cities post these on their planning department website.
 2. Extract to raw text: Same approach we used here — rip the full ordinance to a single markdown file with page
  markers. For city ordinances, this is typically much shorter (5-20 pages vs 54).
 3. Decompose using the same prefix categories: City-level reference files should mirror the state-level
 prefixes (standards-, permit-, zoning-, etc.) so an agent can load the state file and city file for the same
 topic side-by-side.
 4. Flag preemption points: Every city-level reference file should explicitly note where the city rule differs
 from state law and whether the city rule is valid (more permissive = valid, more restrictive = likely
 preempted).
 5. Web search fallback: For cities without a pre-built skill, the orchestrator can do a targeted web search for
  the city's ADU ordinance and apply the same analytical framework in real-time. The state-level skill gives it
 the questions to ask: "What are the city's setback requirements? Are they more restrictive than 4 ft?"

 Three Target Use Cases

 This composite skill architecture enables three tools:

 1. Permit Prep Assistant: Contractor describes project → agent asks qualifying questions using the decision
 tree → loads relevant state rules + city rules → generates a checklist of requirements, documents needed, and
 potential issues.
 2. Corrections Response Guide: Takes a corrections letter + submitted plans → maps each correction item to the
 applicable state code and city code → identifies which corrections are valid, which may be preempted by state
 law, and suggests responses.
 3. Permit Builder (future): Actually generates permit application documents, calculations, and cover sheets
 based on the rules loaded from all three layers.

 What We're Building Now

 This plan covers Layer 2 only — the California state-level ADU skill derived from the HCD ADU Handbook (January
  2025, 54 pages). This is the foundation layer because:
 - State law defines what cities can and cannot require
 - The handbook is the authoritative interpretation of the ADU statutes
 - Every city-level analysis starts with "what does state law say?"

 ---
 Context

 We have a verified raw text extraction (adu-skill-development/HCD-ADU-Handbook-2025-raw.md, 1,323 lines, 126KB)
  of the California HCD ADU Handbook (January 2025, 54 pages). The goal is to convert this into a Claude Code
 skill that acts as a regulatory decision engine — so future AI agents reviewing permit applications, responding
  to corrections letters, or helping contractors prep permits can load only the relevant state-level rules
 instead of all 54 pages every time.