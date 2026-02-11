# Plan: California ADU Handbook — Structured Skill Decomposition

---

## Overall Strategy: Building a Composite Regulatory Skill

### The Problem

ADU permitting in California requires navigating three layers of law simultaneously — federal, state, and city. A contractor building a 600 sq ft detached ADU in Placentia faces different rules than one building the same unit in Long Beach, even though both are in California. Today, this knowledge lives in the heads of experienced designers and plan checkers, or scattered across dozens of PDFs and municipal code websites.

### The Composite Skill Model

We're building a **composite skill** — a set of layered, independent skills that stack like legal jurisdiction:

```
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
```

**Key insight**: State law sets the *floor* — cities can be more permissive but cannot be more restrictive than what the state allows. When a city corrections letter cites a local standard that conflicts with state law, the agent needs to know the state preemption rules. That's why this state-level skill is the foundation everything else builds on.

### How This Mirrors Legal Analysis

Lawyers analyze regulations top-down: federal preempts state, state preempts local (with exceptions). Our composite skill works the same way:

1. **Federal layer** establishes baseline requirements (ADA, FHA, lending rules)
2. **State layer** (this skill) establishes California-specific ADU rights — what cities *must* allow, maximum restrictions cities can impose, statewide process requirements
3. **City layer** adds local specifics — lot coverage limits, design standards, specific fee schedules, processing quirks

When answering a question like "Can Placentia require a 10-ft rear setback for my detached ADU?", the agent would:
- Load `standards-setbacks.md` from this skill → finds state max is 4 ft for rear setbacks
- Load Placentia's local ordinance from the city-level skill → finds they require 5 ft
- **Resolve the conflict**: State preempts — city cannot require more than 4 ft

### Replicating This Approach for City-Level Skills

Future agents building city-level skills should follow this methodology:

1. **Source identification**: Find the city's ADU ordinance (usually municipal code + any ADU-specific handouts). Many cities post these on their planning department website.

2. **Extract to raw text**: Same approach we used here — rip the full ordinance to a single markdown file with page markers. For city ordinances, this is typically much shorter (5-20 pages vs 54).

3. **Decompose using the same prefix categories**: City-level reference files should mirror the state-level prefixes (`standards-`, `permit-`, `zoning-`, etc.) so an agent can load the state file and city file for the same topic side-by-side.

4. **Flag preemption points**: Every city-level reference file should explicitly note where the city rule differs from state law and whether the city rule is valid (more permissive = valid, more restrictive = likely preempted).

5. **Web search fallback**: For cities without a pre-built skill, the orchestrator can do a targeted web search for the city's ADU ordinance and apply the same analytical framework in real-time. The state-level skill gives it the questions to ask: "What are the city's setback requirements? Are they more restrictive than 4 ft?"

### Three Target Use Cases

This composite skill architecture enables three tools:

1. **Permit Prep Assistant**: Contractor describes project → agent asks qualifying questions using the decision tree → loads relevant state rules + city rules → generates a checklist of requirements, documents needed, and potential issues.

2. **Corrections Response Guide**: Takes a corrections letter + submitted plans → maps each correction item to the applicable state code and city code → identifies which corrections are valid, which may be preempted by state law, and suggests responses.

3. **Permit Builder** (future): Actually generates permit application documents, calculations, and cover sheets based on the rules loaded from all three layers.

### What We're Building Now

This plan covers **Layer 2 only** — the California state-level ADU skill derived from the HCD ADU Handbook (January 2025, 54 pages). This is the foundation layer because:
- State law defines what cities can and cannot require
- The handbook is the authoritative interpretation of the ADU statutes
- Every city-level analysis starts with "what does state law say?"

---

## Context

We have a verified raw text extraction (`adu-skill-development/HCD-ADU-Handbook-2025-raw.md`, 1,323 lines, 126KB) of the California HCD ADU Handbook (January 2025, 54 pages). The goal is to convert this into a Claude Code skill that acts as a **regulatory decision engine** — so future AI agents reviewing permit applications, responding to corrections letters, or helping contractors prep permits can load only the relevant state-level rules instead of all 54 pages every time.

**Reference patterns studied:**
- `supabase-postgres-best-practices`: 30 reference files (~1.3-1.8K each), prefix-based naming, YAML frontmatter with impact/tags, SKILL.md (87 lines) + AGENTS.md (91 lines) as navigation
- `skill-creator`: 3-level progressive disclosure, SKILL.md < 5,000 words, references loaded on-demand
- Key difference: supabase is "do this, don't do that" — ours is "if these conditions, then these rules apply" (regulatory routing)

## Architecture

### Skill Location
```
adu-skill-development/skill/california-adu/
├── SKILL.md                          # Entry point: decision tree + routing logic (~200 lines)
├── AGENTS.md                         # Complete catalog of all reference files (~120 lines)
├── CLAUDE.md → AGENTS.md             # Symlink
└── references/                       # ~25 focused reference files
    ├── glossary.md                   # All defined terms with legal citations
    ├── unit-types-66323.md           # The four 66323 categories + combinations table
    ├── unit-types-adu-general.md     # ADU definition, attached/converted/detached types
    ├── unit-types-jadu.md            # JADU-specific rules (500 sqft, owner-occupancy, etc.)
    ├── unit-types-multifamily.md     # Multifamily ADU rules (converted + detached)
    ├── standards-height.md           # Height limits (16/18/20/25 ft by type/context)
    ├── standards-size.md             # Size requirements (850/1000/1200 sqft, FAR, lot coverage)
    ├── standards-setbacks.md         # Setback rules (4-ft side/rear, front setback limits)
    ├── standards-parking.md          # Parking requirements + 6 exemption categories
    ├── standards-fire.md             # Fire protection + sprinkler rules
    ├── standards-solar.md            # Solar/energy code requirements
    ├── standards-design.md           # Objective vs subjective standards, bedrooms
    ├── permit-process.md             # Ministerial review, 30/60 day timelines, deemed-approved
    ├── permit-fees.md                # Impact fees, proportionality, school fees, connections
    ├── permit-funding.md             # CalHFA, FHA, Freddie Mac, Fannie Mae
    ├── zoning-general.md             # Jurisdiction-wide rules, density, density bonus (SDBL)
    ├── zoning-hazards.md             # Fire hazard zones, coastal zone, environmental
    ├── zoning-nonconforming.md       # Nonconforming zoning + building code violations
    ├── ownership-use.md              # Owner-occupancy, rental terms (30-day), deed restrictions
    ├── ownership-sales.md            # Separate conveyance, condominiums, qualified nonprofits
    ├── ownership-hoa.md              # HOA restrictions, CC&R nullification, HOA review limits
    ├── special-manufactured.md       # Manufactured homes + mobilehome parks
    ├── special-sb9.md                # SB 9 interaction, four-unit cap, lot splits
    ├── compliance-unpermitted.md     # Pre-2020 amnesty, inspections, fee exemptions
    ├── compliance-ordinances.md      # Local ordinances, HCD enforcement, bonus programs
    ├── compliance-housing.md         # Housing elements, RHNA, Prohousing Designation
    ├── compliance-utilities.md       # Utility connections, CPUC complaints
    └── legislative-changes.md        # All bill summaries + renumbering table + statutory table
```

**27 reference files + 3 root files = 30 total files**

### SKILL.md Design (The Decision Engine)

Unlike supabase's "category + priority" approach, our SKILL.md needs a **decision tree** structure. When an agent encounters an ADU question, it follows this routing logic:

```
STEP 1: Classify the dwelling type
  → Single-family lot? → unit-types-66323.md, unit-types-adu-general.md
  → Multifamily lot?   → unit-types-multifamily.md, unit-types-66323.md
  → JADU?              → unit-types-jadu.md

STEP 2: Classify the ADU type
  → New detached construction? → standards-height, standards-size, standards-setbacks
  → Conversion from existing?  → standards-size (fewer apply), zoning-nonconforming
  → Attached addition?         → standards-height, standards-size, standards-setbacks

STEP 3: Check applicable standards
  → Near transit?      → standards-height (18ft bonus), standards-parking (exemptions)
  → In coastal zone?   → zoning-hazards
  → In fire zone?      → zoning-hazards, standards-fire
  → In historic area?  → zoning-general, standards-design
  → Has HOA?           → ownership-hoa

STEP 4: Check process/fees
  → Permit timeline?   → permit-process
  → Fee calculation?   → permit-fees
  → Unpermitted ADU?   → compliance-unpermitted
```

The SKILL.md will also include a **quick-reference thresholds table** with the numbers that come up in almost every query:

| Threshold | Value | Reference |
|-----------|-------|-----------|
| JADU max size | 500 sq ft | unit-types-jadu |
| 66323 detached max | 800 sq ft | unit-types-66323 |
| Min ADU size (1 BR) | 850 sq ft | standards-size |
| Min ADU size (2+ BR) | 1,000 sq ft | standards-size |
| Max detached (no ordinance) | 1,200 sq ft | standards-size |
| Fee exemption threshold | < 750 sq ft | permit-fees |
| Side/rear setback | 4 ft max | standards-setbacks |
| Detached height (base) | 16 ft | standards-height |
| Detached height (transit) | 18 ft (+2 roof) | standards-height |
| Detached height (multistory) | 18 ft | standards-height |
| Attached height | 25 ft max | standards-height |
| Completeness check | 30 days | permit-process |
| Approval/denial deadline | 60 days | permit-process |
| Min rental term | 30 days | ownership-use |
| Unpermitted amnesty cutoff | Before Jan 1, 2020 | compliance-unpermitted |
| Efficiency unit min | 150 sq ft | standards-size |
| Multifamily detached max | 8 units | unit-types-multifamily |

### Reference File Format

Each reference file follows this consistent structure:

```yaml
---
title: [Clear topic title]
category: [unit-types|standards|permit|zoning|ownership|special|compliance|legislative]
relevance: [When to read this file — 1-2 sentences]
key_code_sections: [Gov. Code §§ XXXXX]
---

## [Topic Title]

[Core rules and Q&A content extracted from handbook]

### Cross-References
- See also: [links to related reference files]

### Key Code Sections
- [List of all Gov. Code / HSC / Civil Code sections cited]
```

## Execution Framework (Long-Running Agent)

This work spans multiple context windows. We use the **long-running-agent** pattern: a `claude-task.json` tracks progress across sessions, and `claude-prompt.md` gives the agent its standing instructions. The agent works through all tasks in a phase, stops at phase boundaries for user verification and context compaction, then resumes from where it left off.

**Reference**: [Anthropic's effective patterns for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

### How It Works

1. We generate `claude-task.json` (phases + tasks) and `claude-prompt.md` (agent instructions)
2. User starts the agent: `@claude-prompt.md`
3. Agent reads `claude-task.json`, finds the current phase, completes all tasks in it
4. At phase boundary: agent marks phase complete, outputs verification steps, **stops**
5. User verifies, context compacts naturally, user resumes: `@claude-prompt.md`
6. Agent re-reads `claude-task.json`, picks up at next phase
7. Repeat until all phases complete

### Output Files

```
adu-skill-development/
├── claude-prompt.md          # Agent instructions (how to build the skill)
├── claude-task.json          # Phase/task tracker (persistent progress)
├── plan-skill-aduHandbook.md # This plan (reference for context)
├── HCD-ADU-Handbook-2025-raw.md  # Source material
└── skill/california-adu/    # Output directory (built by agent)
    ├── SKILL.md
    ├── AGENTS.md
    ├── CLAUDE.md → AGENTS.md
    └── references/
```

### Phases

#### Phase 1: Skeleton + Root Files (3 tasks)
- **skeleton-001**: Create directory structure + CLAUDE.md symlink
- **skeleton-002**: Create SKILL.md with decision tree, routing logic, and thresholds table
- **skeleton-003**: Create AGENTS.md with full catalog of all planned reference files
- **Verification**: All 3 root files exist, SKILL.md has decision tree, AGENTS.md lists all 27 reference files

#### Phase 2: Unit Types (4 tasks)
- **unit-001**: Create `unit-types-66323.md` — the four 66323 categories + combinations table (source: pages 18-20)
- **unit-002**: Create `unit-types-adu-general.md` — ADU definition, attached/converted/detached (source: pages 21, 41-42)
- **unit-003**: Create `unit-types-jadu.md` — JADU rules, 500 sqft, owner-occupancy (source: pages 28-29)
- **unit-004**: Create `unit-types-multifamily.md` — converted + detached multifamily ADUs (source: pages 32-33)
- **Verification**: All 4 files exist with proper YAML frontmatter, cross-references resolve, key code sections match source

#### Phase 3: Development Standards (7 tasks)
- **standards-001**: Create `standards-height.md` — 16/18/20/25 ft limits by type/context (source: pages 25-26)
- **standards-002**: Create `standards-size.md` — 850/1000/1200 sqft, FAR, efficiency units (source: pages 39-40)
- **standards-003**: Create `standards-setbacks.md` — 4-ft side/rear, front setback limits (source: page 38)
- **standards-004**: Create `standards-parking.md` — requirements + 6 exemption categories (source: pages 34-35)
- **standards-005**: Create `standards-fire.md` — fire protection + sprinkler rules (source: page 23)
- **standards-006**: Create `standards-solar.md` — solar/energy code requirements (source: page 40)
- **standards-007**: Create `standards-design.md` — objective vs subjective standards, bedrooms (source: page 21)
- **Verification**: All 7 files exist, thresholds in SKILL.md match values in reference files, cross-references resolve

#### Phase 4: Permitting + Fees (3 tasks)
- **permit-001**: Create `permit-process.md` — ministerial review, 30/60 day timelines, deemed-approved (source: pages 35-37)
- **permit-002**: Create `permit-fees.md` — impact fees, proportionality, school fees, connections (source: pages 22-23)
- **permit-003**: Create `permit-funding.md` — CalHFA, FHA, Freddie Mac, Fannie Mae (source: pages 24-25)
- **Verification**: All 3 files exist, timeline numbers match source, fee thresholds accurate

#### Phase 5: Zoning + Ownership (6 tasks)
- **zoning-001**: Create `zoning-general.md` — jurisdiction-wide rules, density, SDBL (source: pages 43-45)
- **zoning-002**: Create `zoning-hazards.md` — fire hazard zones, coastal zone, environmental (source: pages 21-22, 44)
- **zoning-003**: Create `zoning-nonconforming.md` — nonconforming zoning + building code violations (source: page 33)
- **ownership-001**: Create `ownership-use.md` — owner-occupancy, rental terms, deed restrictions (source: pages 34, 37)
- **ownership-002**: Create `ownership-sales.md` — separate conveyance, condominiums, nonprofits (source: pages 22, 37)
- **ownership-003**: Create `ownership-hoa.md` — HOA restrictions, CC&R nullification (source: pages 26-27)
- **Verification**: All 6 files exist, preemption rules clearly stated, cross-references resolve

#### Phase 6: Special + Compliance + Glossary + Legislative (8 tasks)
- **special-001**: Create `special-manufactured.md` — manufactured homes + mobilehome parks (source: pages 31-32)
- **special-002**: Create `special-sb9.md` — SB 9 interaction, four-unit cap, lot splits (source: pages 37-38)
- **compliance-001**: Create `compliance-unpermitted.md` — pre-2020 amnesty, inspections, fee exemptions (source: pages 42-43)
- **compliance-002**: Create `compliance-ordinances.md` — local ordinances, HCD enforcement, bonus programs (source: pages 30-31)
- **compliance-003**: Create `compliance-housing.md` — housing elements, RHNA, Prohousing (source: pages 27-28)
- **compliance-004**: Create `compliance-utilities.md` — utility connections, CPUC complaints (source: page 43)
- **glossary-001**: Create `glossary.md` — all defined terms with legal citations (source: pages 8-12)
- **legislative-001**: Create `legislative-changes.md` — bill summaries + renumbering + statutory table (source: pages 13-17, 46-54)
- **Verification**: All 8 files exist, glossary covers all defined terms from source, legislative table is complete

#### Phase 7: Review + Cross-Reference Pass (5 tasks)
- **review-001**: Completeness check — diff raw markdown against all reference files, flag any dropped content
- **review-002**: Cross-reference check — every `See also:` link resolves to a real file
- **review-003**: Citation check — spot-check Gov. Code section numbers against raw source
- **review-004**: Routing check — walk 3-4 example scenarios through SKILL.md decision tree, verify correct references load
- **review-005**: Size check — no individual reference file exceeds ~3K; update AGENTS.md if any files were added/renamed
- **Verification**: All checks pass, AGENTS.md matches actual file listing, skill is ready for use

## Decisions

- **Skill location**: `adu-skill-development/skill/california-adu/` — keeps it in the repo under version control. Move to install location when ready.
- **Small topics**: Keep every topic as its own file, even tiny ones. Easier to find by name, consistent structure. Final count: ~30 reference files.
- **Execution model**: Long-running-agent framework — `claude-task.json` tracks progress, `claude-prompt.md` gives standing instructions, agent stops at phase boundaries for verification + compaction. No manual session management needed.

## How to Start

```
@adu-skill-development/claude-prompt.md
```

The agent will read `claude-task.json`, find Phase 1, and start building.
