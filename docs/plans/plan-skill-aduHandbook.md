The plan is complete. Here's the summary:                                                                      
                                                                                                                 
  What we're building: A Claude Code skill at adu-skill-development/skill/california-adu/ that acts as a         
  regulatory decision engine for California ADU law.                                                             
                                                                                                                 
  Architecture: 3 root files (SKILL.md decision tree, AGENTS.md catalog, CLAUDE.md symlink) + 28 reference files 
  organized by prefix (unit-types-, standards-, permit-, zoning-, ownership-, special-, compliance-,
  legislative-).                                                                                                 

  Key design choice: SKILL.md contains a decision tree router (not just a category table) — "classify dwelling
  type → classify ADU type → check applicable standards → check process/fees" — plus a quick-reference thresholds
   table with all the critical numbers.

  Execution: 7 sessions, each creating a batch of files from the raw markdown source. Each session reads the
  plan, reads the relevant raw source sections, creates files with consistent YAML frontmatter format, and
  verifies. Final session does a cross-reference and completeness review.

─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 Ready to code?
                                                                                                                 
 Here is Claude's plan:
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 Plan: California ADU Handbook — Structured Skill Decomposition                                                

 Context

 We have a verified raw text extraction (adu-skill-development/HCD-ADU-Handbook-2025-raw.md, 1,323 lines, 126KB)
  of the California HCD ADU Handbook (January 2025, 54 pages). The goal is to convert this into a Claude Code
 skill that acts as a regulatory decision engine — so future AI agents reviewing permit applications, responding
  to corrections letters, or helping contractors prep permits can load only the relevant state-level rules
 instead of all 54 pages every time.

 Reference patterns studied:
 - supabase-postgres-best-practices: 30 reference files (~1.3-1.8K each), prefix-based naming, YAML frontmatter
 with impact/tags, SKILL.md (87 lines) + AGENTS.md (91 lines) as navigation
 - skill-creator: 3-level progressive disclosure, SKILL.md < 5,000 words, references loaded on-demand
 - Key difference: supabase is "do this, don't do that" — ours is "if these conditions, then these rules apply"
 (regulatory routing)

 Architecture

 Skill Location

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

 27 reference files + 3 root files = 30 total files

 SKILL.md Design (The Decision Engine)

 Unlike supabase's "category + priority" approach, our SKILL.md needs a decision tree structure. When an agent
 encounters an ADU question, it follows this routing logic:

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

 The SKILL.md will also include a quick-reference thresholds table with the numbers that come up in almost every
  query:
 ┌──────────────────────────────┬────────────────────┬────────────────────────┐
 │          Threshold           │       Value        │       Reference        │
 ├──────────────────────────────┼────────────────────┼────────────────────────┤
 │ JADU max size                │ 500 sq ft          │ unit-types-jadu        │
 ├──────────────────────────────┼────────────────────┼────────────────────────┤
 │ 66323 detached max           │ 800 sq ft          │ unit-types-66323       │
 ├──────────────────────────────┼────────────────────┼────────────────────────┤
 │ Min ADU size (1 BR)          │ 850 sq ft          │ standards-size         │
 ├──────────────────────────────┼────────────────────┼────────────────────────┤
 │ Min ADU size (2+ BR)         │ 1,000 sq ft        │ standards-size         │
 ├──────────────────────────────┼────────────────────┼────────────────────────┤
 │ Max detached (no ordinance)  │ 1,200 sq ft        │ standards-size         │
 ├──────────────────────────────┼────────────────────┼────────────────────────┤
 │ Fee exemption threshold      │ < 750 sq ft        │ permit-fees            │
 ├──────────────────────────────┼────────────────────┼────────────────────────┤
 │ Side/rear setback            │ 4 ft max           │ standards-setbacks     │
 ├──────────────────────────────┼────────────────────┼────────────────────────┤
 │ Detached height (base)       │ 16 ft              │ standards-height       │
 ├──────────────────────────────┼────────────────────┼────────────────────────┤
 │ Detached height (transit)    │ 18 ft (+2 roof)    │ standards-height       │
 ├──────────────────────────────┼────────────────────┼────────────────────────┤
 │ Detached height (multistory) │ 18 ft              │ standards-height       │
 ├──────────────────────────────┼────────────────────┼────────────────────────┤
 │ Attached height              │ 25 ft max          │ standards-height       │
 ├──────────────────────────────┼────────────────────┼────────────────────────┤
 │ Completeness check           │ 30 days            │ permit-process         │
 ├──────────────────────────────┼────────────────────┼────────────────────────┤
 │ Approval/denial deadline     │ 60 days            │ permit-process         │
 ├──────────────────────────────┼────────────────────┼────────────────────────┤
 │ Min rental term              │ 30 days            │ ownership-use          │
 ├──────────────────────────────┼────────────────────┼────────────────────────┤
 │ Unpermitted amnesty cutoff   │ Before Jan 1, 2020 │ compliance-unpermitted │
 ├──────────────────────────────┼────────────────────┼────────────────────────┤
 │ Efficiency unit min          │ 150 sq ft          │ standards-size         │
 ├──────────────────────────────┼────────────────────┼────────────────────────┤
 │ Multifamily detached max     │ 8 units            │ unit-types-multifamily │
 └──────────────────────────────┴────────────────────┴────────────────────────┘
 Reference File Format

 Each reference file follows this consistent structure:

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

 Execution Plan (Multi-Session)

 This work cannot fit in a single context window. Here's the session breakdown:

 Session 1: Skeleton + Root Files

 Create: SKILL.md, AGENTS.md, CLAUDE.md symlink
 Source needed: Raw markdown (for overview content), this plan
 Output: The routing engine and catalog — the architecture that everything else plugs into

 Session 2: Unit Types (4 files)

 Create: unit-types-66323.md, unit-types-adu-general.md, unit-types-jadu.md, unit-types-multifamily.md
 Source sections: Pages 18-20 (66323), 21 (ADUs), 28-29 (JADUs), 32-33 (Multifamily), 41-42 (Types)
 These are foundational — most other rules reference back to ADU type classification

 Session 3: Development Standards (6 files)

 Create: standards-height.md, standards-size.md, standards-setbacks.md, standards-parking.md, standards-fire.md,
  standards-solar.md, standards-design.md
 Source sections: Pages 25-26, 39-40, 38, 34-35, 23, 40, 21 (bedrooms)
 These are the most frequently referenced rules in permit review

 Session 4: Permitting + Fees (3 files)

 Create: permit-process.md, permit-fees.md, permit-funding.md
 Source sections: Pages 35-37, 22-23, 24-25

 Session 5: Zoning + Ownership (6 files)

 Create: zoning-general.md, zoning-hazards.md, zoning-nonconforming.md, ownership-use.md, ownership-sales.md,
 ownership-hoa.md
 Source sections: Pages 43-45, 21-22 (coastal), 44 (fire), 33, 34, 37, 22, 37, 26-27

 Session 6: Special + Compliance + Glossary + Legislative (8 files)

 Create: special-manufactured.md, special-sb9.md, compliance-unpermitted.md, compliance-ordinances.md,
 compliance-housing.md, compliance-utilities.md, glossary.md, legislative-changes.md
 Source sections: Pages 31-32, 37-38, 42-43, 30-31, 27-28, 43, 8-12, 13-17 + 46-54

 Session 7: Review + Cross-Reference Pass

 Read all files, verify:
 - Every cross-reference points to a real file
 - No content from raw markdown was missed
 - Legal citations are accurate
 - AGENTS.md catalog matches actual files
 - Decision tree in SKILL.md routes correctly

 Per-Session Workflow

 Each session follows this pattern:
 1. Read this plan file for context
 2. Read the raw markdown source sections needed
 3. Create the reference files with proper frontmatter and formatting
 4. Verify files were created correctly

 Verification

 After all sessions complete:
 1. Completeness check: Diff the raw markdown against all reference files to ensure no content was dropped
 2. Cross-reference check: Every See also: link resolves to a real file
 3. Citation check: Spot-check Gov. Code section numbers against raw source
 4. Routing check: Walk through 3-4 example scenarios through the SKILL.md decision tree and verify the right
 references get loaded
 5. Size check: No individual reference file exceeds ~3K (keep them loadable)

 Decisions

 - Skill location: adu-skill-development/skill/california-adu/ — keeps it in the repo under version control.
 Move to install location when ready.
 - Small topics: Keep every topic as its own file, even tiny ones. Easier to find by name, consistent structure.
  Final count: ~30 reference files.

 Files Being Created

 Root (3 files):
 - adu-skill-development/skill/california-adu/SKILL.md
 - adu-skill-development/skill/california-adu/AGENTS.md
 - adu-skill-development/skill/california-adu/CLAUDE.md (symlink → AGENTS.md)

 References (28 files):
 - references/glossary.md
 - references/unit-types-66323.md
 - references/unit-types-adu-general.md
 - references/unit-types-jadu.md
 - references/unit-types-multifamily.md
 - references/standards-height.md
 - references/standards-size.md
 - references/standards-setbacks.md
 - references/standards-parking.md
 - references/standards-fire.md
 - references/standards-solar.md
 - references/standards-design.md
 - references/permit-process.md
 - references/permit-fees.md
 - references/permit-funding.md
 - references/zoning-general.md
 - references/zoning-hazards.md
 - references/zoning-nonconforming.md
 - references/ownership-use.md
 - references/ownership-sales.md
 - references/ownership-hoa.md
 - references/special-manufactured.md
 - references/special-mobilehome.md
 - references/special-tiny-homes.md
 - references/special-sb9.md
 - references/compliance-unpermitted.md
 - references/compliance-ordinances.md
 - references/compliance-housing.md
 - references/compliance-utilities.md
 - references/legislative-changes.md

 Total: 31 files (3 root + 28 references)

 Source file: adu-skill-development/HCD-ADU-Handbook-2025-raw.md (verified extraction)