# Hierarchical Cascade Architecture for FluentGov

> **Purpose**: Spec for converting the cc-crossbeam ADU corrections pipeline into a mass-producible, jurisdiction-hierarchical agent system. This maps the proven Agent SDK patterns (two-skill pipeline, offline city skills, session-based I/O) onto a government organizational hierarchy that supports every state, every city variant, and every permit type — with pre-prepared code link maps as the primary lookup mechanism and live research as fallback only.

---

## 1. The Problem This Solves

The current cc-crossbeam architecture proves the pattern for **one permit type** (ADU) in **one state** (California) with **two city variants** (Placentia live, Buena Park offline). Scaling this to every jurisdiction and permit type by hand is impossible.

FluentGov's approach:
- AI mass-produces structured data templates (skill packs, code link maps, correction patterns)
- Humans minimally correct them against actual city code
- Hardened templates become repeatable pathways with replaceable, versionable parts
- Future agent runs consume these templates deterministically — no expensive LLM reasoning for known answers

**The economic shift**: First run against a new jurisdiction costs $5-15 (live research). Once hardened, the same run costs $0.50-2.00 (pre-prepared lookups). At scale, corrections analysis becomes a premium feature that's cheap to execute.

---

## 2. Government Organizational Hierarchy

### 2.1 The Cascade Model

```
┌─────────────────────────────────────────────────┐
│  FEDERAL                                         │
│  IRC · IBC · NEC · UPC · IECC · ADA             │
│  (Baseline model codes — adopted by reference)   │
├─────────────────────────────────────────────────┤
│  STATE                                           │
│  California: CRC · CBC · CPC · CMC · CEC · HCD  │
│  Texas: TRCC · local amendments to IRC/IBC       │
│  Florida: FBC (statewide, no local amendments)   │
│  (State adoptions, amendments, addendums)         │
├─────────────────────────────────────────────────┤
│  COUNTY (where applicable)                       │
│  LA County: Title 26 amendments                  │
│  (Some states route through county, most don't)  │
├─────────────────────────────────────────────────┤
│  CITY                                            │
│  La Mesa: Municipal Code Ch. 24 + local ADU ord  │
│  Buena Park: BPMC Title 19 + local setback rules │
│  (Thin overlays — the delta from state baseline)  │
└─────────────────────────────────────────────────┘
```

**Resolution order**: City → County → State → Federal. Most specific wins. If the city skill pack doesn't have an answer, walk up the hierarchy.

### 2.2 Why This Mirrors Government Structure

Building codes in the US work exactly this way:
- ICC publishes model codes (IRC, IBC, etc.)
- States adopt them with amendments (California → CRC with HCD addendums)
- Cities adopt state codes, sometimes with further local amendments
- When a code question arises, you check local first, then walk up

The skill hierarchy mirrors this. The agent doesn't need to know the hierarchy logic — it just checks the most specific data source first and escalates if nothing is found.

---

## 3. Data Layer: Code Link Maps

### 3.1 What a Code Link Map Is

A **code link map** is a pre-prepared, structured JSON file that maps correction types to specific code sections, requirements, and resolution patterns. It replaces the expensive "research" step (currently $3-5 and 14 minutes of web search) with a deterministic lookup.

```json
{
  "meta": {
    "jurisdiction": "buena-park",
    "state": "california",
    "permit_type": "adu",
    "code_cycle": "2022-cbc",
    "last_verified": "2026-02-15",
    "verified_by": "human-qc",
    "version": "1.2.0"
  },
  "corrections": {
    "structural-engineering-stamp": {
      "trigger_patterns": [
        "wet stamp",
        "licensed professional",
        "structural engineer",
        "B&P Code 5536"
      ],
      "code_references": [
        {
          "level": "state",
          "code": "B&P Code §5536.1",
          "title": "Licensed Professional Stamps Required",
          "requirement": "Plans for structures over 100k or with engineered components require wet stamp by licensed architect or engineer",
          "url": "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=5536.1.&lawCode=BPC"
        }
      ],
      "resolution_template": {
        "category": "NEEDS_PROFESSIONAL",
        "professional": "Structural Engineer",
        "typical_action": "Obtain wet stamp from SE on structural sheets",
        "affected_sheet_types": ["S1", "S2", "S3"],
        "cost_estimate_range": "$500-$1500"
      },
      "city_override": null
    },
    "setback-violation": {
      "trigger_patterns": [
        "setback",
        "property line",
        "side yard",
        "rear yard",
        "front yard"
      ],
      "code_references": [
        {
          "level": "state",
          "code": "Gov Code §66314(a)",
          "title": "State ADU Setback Rules",
          "requirement": "4-foot side and rear setbacks for detached ADU"
        },
        {
          "level": "city",
          "code": "BPMC §19.220.070",
          "title": "Buena Park ADU Setbacks",
          "requirement": "4-foot side/rear per state law; 10-foot front setback per local zoning",
          "is_more_restrictive": true,
          "delta_from_state": "Adds 10-foot front setback not in state law"
        }
      ],
      "resolution_template": {
        "category": "NEEDS_CONTRACTOR_INPUT",
        "questions": [
          "What is the current setback from the nearest property line?",
          "Is a site survey available showing property boundaries?"
        ]
      },
      "city_override": {
        "jurisdiction": "buena-park",
        "overrides": "state setback minimum",
        "note": "Front setback is local-only; state law does not regulate front setbacks for ADUs"
      }
    }
  }
}
```

### 3.2 The Cascade Lookup in Practice

When the agent encounters a correction about setbacks:

1. **Check city code link map** (`buena-park-adu/code-links/setback-violation.json`)
   - Found? → Use city-specific requirements (includes the 10-foot front setback)
   - Not found? → Step 2

2. **Check state code link map** (`california-adu/code-links/setback-violation.json`)
   - Found? → Use state baseline (4-foot side/rear only)
   - Not found? → Step 3

3. **Check federal code link map** (`federal-irc/code-links/setback-violation.json`)
   - Found? → Use IRC baseline
   - Not found? → Step 4

4. **Fall back to live research** (WebSearch — expensive, slow)
   - Only hits this path for genuinely novel corrections
   - Results get captured and fed back into the map for next time

### 3.3 How Code Link Maps Are Mass-Produced

**The AI production line**:

```
Step 1: AI reads city municipal code (WebSearch + WebFetch)
        → Generates draft code link map JSON
        → Cost: ~$2-5 per city

Step 2: Human QC reviews draft against actual code
        → Corrects errors, adds missing entries
        → Time: 30-60 minutes per city (deskilled labor)

Step 3: Hardened map ships to skill pack
        → Version tagged, tracked in registry

Step 4: Maintenance cycle
        → When code cycle updates (e.g., 2022 CBC → 2025 CBC),
          AI diffs the old map against new code
        → Human verifies the delta
        → New version ships
```

**Mass production economics**:
- 482 cities in California × $3 per AI draft = ~$1,500 for state coverage
- Human QC at $25/hr × 0.5 hr per city = ~$6,000 for full verification
- Total: ~$7,500 to cover every California city for ADU corrections
- Each city skill pack serves unlimited correction runs at ~$0.50-2.00 per run

---

## 4. Skill Pack Architecture

### 4.1 Current Structure (cc-crossbeam)

```
agents-crossbeam/.claude/skills/
├── california-adu/         ← State-level reference (28 files)
├── buena-park-adu/         ← City variant (offline reference)
├── adu-corrections-flow/   ← Pipeline skill (phases 1-4)
├── adu-corrections-complete/ ← Pipeline skill (phase 5)
├── adu-city-research/      ← Live research fallback
└── adu-targeted-page-viewer/ ← Plan sheet analysis
```

### 4.2 Proposed Hierarchical Structure

```
skill-registry/
├── federal/
│   ├── irc-2021/
│   │   ├── SKILL.md
│   │   ├── code-links/           ← Pre-prepared code link maps
│   │   │   ├── structural.json
│   │   │   ├── fire-safety.json
│   │   │   ├── egress.json
│   │   │   └── ...
│   │   └── references/           ← Source documents, tables
│   │       ├── irc-r301-design-criteria.md
│   │       └── ...
│   ├── ibc-2021/
│   ├── nec-2023/
│   └── upc-2021/
│
├── states/
│   ├── california/
│   │   ├── SKILL.md              ← State baseline skill
│   │   ├── code-links/
│   │   │   ├── adu-setbacks.json
│   │   │   ├── adu-size-limits.json
│   │   │   ├── structural-stamps.json
│   │   │   ├── plumbing-dfu.json
│   │   │   └── ...
│   │   ├── references/
│   │   │   ├── crc-chapter3-building-planning.md
│   │   │   ├── hcd-addendum-adu-2024.md
│   │   │   └── ...
│   │   └── cities/
│   │       ├── buena-park/
│   │       │   ├── SKILL.md      ← City variant (thin overlay)
│   │       │   ├── code-links/
│   │       │   │   ├── setback-override.json
│   │       │   │   ├── parking-requirements.json
│   │       │   │   └── ...
│   │       │   ├── references/
│   │       │   │   └── bpmc-title-19-adu.md
│   │       │   └── meta.json     ← City metadata, URLs, contacts
│   │       ├── la-mesa/
│   │       │   ├── SKILL.md
│   │       │   ├── code-links/
│   │       │   └── meta.json
│   │       ├── placentia/
│   │       └── ... (482 cities)
│   │
│   ├── texas/
│   │   ├── SKILL.md
│   │   ├── code-links/
│   │   └── cities/
│   │       ├── austin/
│   │       ├── houston/
│   │       └── ...
│   │
│   └── florida/
│       ├── SKILL.md
│       ├── code-links/
│       └── cities/
│           └── ... (FBC is statewide, city overlays are minimal)
│
├── permit-types/
│   ├── adu/
│   │   ├── corrections-flow/     ← Reusable pipeline skill
│   │   │   ├── SKILL.md
│   │   │   └── prompts/
│   │   ├── corrections-complete/
│   │   ├── plan-review/
│   │   └── schemas/              ← Shared JSON schemas for this permit type
│   │       ├── corrections_parsed.schema.json
│   │       ├── contractor_questions.schema.json
│   │       └── ...
│   ├── residential-remodel/
│   │   ├── corrections-flow/
│   │   ├── corrections-complete/
│   │   └── schemas/
│   ├── commercial-ti/
│   ├── solar-pv/
│   └── roofing/
│
└── tools/                        ← Deterministic lookup tools (no LLM)
    ├── code-link-resolver/       ← JSON lookup, cascade logic
    ├── sheet-classifier/         ← Sheet type detection from filename/content
    └── correction-matcher/       ← Pattern match correction text → code link
```

### 4.3 How Skill Packs Compose at Runtime

For a specific job (e.g., ADU corrections in La Mesa, CA), the runtime assembles a focused skill set from the registry:

```
Runtime skill set for: ADU corrections, La Mesa, California
────────────────────────────────────────────────────────

Jurisdiction skills (loaded via cascade):
  1. federal/irc-2021              ← Baseline structural/fire/egress
  2. states/california             ← CRC/CBC/CPC + HCD ADU addendums
  3. states/california/cities/la-mesa  ← Municipal overlay (thin)

Pipeline skills (loaded by permit type):
  4. permit-types/adu/corrections-flow      ← Phases 1-4
  5. permit-types/adu/corrections-complete   ← Phase 5

Utility skills (always available):
  6. adu-targeted-page-viewer      ← Plan sheet analysis
  7. adu-city-research             ← Live fallback (only if code-links miss)

Deterministic tools (no LLM cost):
  8. tools/code-link-resolver      ← Cascade lookup into code-links/ JSONs
  9. tools/correction-matcher      ← Pattern match → code link entry
```

The Agent SDK `query()` call gets exactly these skills via symlinks into the runtime `.claude/skills/` directory. The `createQueryOptions()` config factory accepts a jurisdiction + permit type and assembles the right set.

---

## 5. Modifying the Existing Runtime

### 5.1 Config Changes (config.ts)

Current `createQueryOptions()` is hardcoded to ADU-California. Modify to accept jurisdiction and permit type:

```typescript
// Current
export function createQueryOptions(flow: FlowConfig = {}): QueryOptions

// Proposed
export interface JurisdictionConfig {
  federal: string[];        // e.g., ['irc-2021', 'upc-2021']
  state: string;            // e.g., 'california'
  county?: string;          // e.g., 'la-county' (optional)
  city: string;             // e.g., 'la-mesa'
}

export interface PipelineConfig {
  permitType: string;       // e.g., 'adu', 'solar-pv'
  flow: string;             // e.g., 'corrections-flow', 'plan-review'
}

export function createQueryOptions(
  jurisdiction: JurisdictionConfig,
  pipeline: PipelineConfig,
  overrides: Partial<FlowConfig> = {}
): QueryOptions
```

### 5.2 Skill Assembly (new: skill-assembler.ts)

New utility that symlinks the right skill packs into a temporary runtime directory:

```typescript
export function assembleSkillSet(
  jurisdiction: JurisdictionConfig,
  pipeline: PipelineConfig
): string {
  // 1. Create temp runtime directory with .claude/skills/
  // 2. Symlink federal skills from registry
  // 3. Symlink state skill from registry
  // 4. Symlink city skill from registry (if exists)
  // 5. Symlink pipeline skills for permit type
  // 6. Symlink utility skills (page viewer, live research fallback)
  // 7. Return path to runtime directory (used as cwd for query())
  //
  // Returns: /tmp/fluentgov-runtime-{session-id}/
  //   └── .claude/skills/
  //       ├── irc-2021 → skill-registry/federal/irc-2021
  //       ├── california → skill-registry/states/california
  //       ├── la-mesa → skill-registry/states/california/cities/la-mesa
  //       ├── corrections-flow → skill-registry/permit-types/adu/corrections-flow
  //       └── ...
}
```

### 5.3 Code Link Resolver (new deterministic tool)

This is the key cost reduction. Instead of the agent reading 28 reference files and reasoning about them ($2-5 in tokens), a deterministic tool does a JSON lookup:

```typescript
// tools/code-link-resolver.ts

export interface CodeLinkQuery {
  correctionText: string;      // Raw text from corrections letter
  permitType: string;          // 'adu'
  jurisdiction: JurisdictionConfig;
}

export interface CodeLinkResult {
  matched: boolean;
  source_level: 'city' | 'county' | 'state' | 'federal' | 'none';
  code_references: CodeReference[];
  resolution_template: ResolutionTemplate | null;
  city_override: CityOverride | null;
  confidence: 'exact' | 'pattern' | 'partial' | 'none';
}

export function resolveCodeLink(query: CodeLinkQuery): CodeLinkResult {
  // 1. Load city code-links/ JSONs
  // 2. Pattern-match correctionText against trigger_patterns
  // 3. If found → return city-level result
  // 4. If not → load state code-links/, repeat
  // 5. If not → load federal code-links/, repeat
  // 6. If not → return { matched: false, source_level: 'none' }
  //    (agent falls back to live research skill)
}
```

**How the agent uses it**: The corrections-flow skill prompt instructs the agent:

> Before using WebSearch for any correction item, first call the code-link-resolver tool.
> If it returns `matched: true`, use the provided code references and resolution template.
> Only fall back to live research if `matched: false` or `confidence: 'partial'`.

This means:
- Hardened cities: 90%+ of corrections resolve via lookup ($0 LLM cost per item)
- Partially hardened: 50-70% resolve via lookup, rest falls back to search
- New cities: 0% lookup, full live research (but results seed the next code link map)

### 5.4 Session Changes (session.ts)

Add jurisdiction metadata to session directories:

```typescript
export function createSession(
  prefix: string,
  jurisdiction: JurisdictionConfig,
  permitType: string
): string {
  const sessionDir = /* existing timestamp logic */;

  // Write jurisdiction context file
  fs.writeFileSync(
    path.join(sessionDir, 'jurisdiction.json'),
    JSON.stringify({
      ...jurisdiction,
      permitType,
      assembledAt: new Date().toISOString(),
      skillPackVersions: getSkillPackVersions(jurisdiction),
    }, null, 2)
  );

  return sessionDir;
}
```

### 5.5 Flow Changes (corrections-analysis.ts)

The prompt to the agent changes to reference the cascade:

```typescript
const prompt = `
Use the corrections-flow skill to analyze these corrections.

CORRECTIONS LETTER: ${opts.correctionsFile}
PLAN BINDER: ${opts.planBinderFile}
SESSION DIRECTORY: ${opts.sessionDir}

JURISDICTION: ${opts.city}, ${opts.state}
AVAILABLE CODE LINK MAPS: ${listCodeLinkFiles(opts.jurisdiction)}

CRITICAL: For each correction item, check the code-link-resolver FIRST.
- If it returns a match, use those code references directly.
- Only use WebSearch/WebFetch for items with no code-link match.
- Write a "lookup_source" field on each item indicating whether
  it was resolved via "code_link" or "live_research".
`;
```

---

## 6. The Dual-Purpose Skill Cluster Pattern

### 6.1 The Insight

Currently, `california-adu` is a skill — a markdown file with 28 reference documents that an LLM reads and reasons about. That works but costs tokens.

The same underlying data can serve two purposes:

| Mode | How It Works | When Used | Cost |
|------|-------------|-----------|------|
| **Skill mode** | LLM reads SKILL.md + references, reasons about them | Edge cases, ambiguous corrections, novel situations | $1-3 (token-heavy) |
| **Tool mode** | Deterministic JSON lookup via code-link-resolver | Known correction patterns, pre-mapped codes | $0 (no LLM) |

### 6.2 The Hybrid Execution Model

```
Correction item arrives
       │
       ▼
┌──────────────┐
│ code-link    │ ──── match found ────→ Use deterministic result ($0)
│ resolver     │                        (tool mode)
│ (JSON lookup)│
└──────┬───────┘
       │ no match
       ▼
┌──────────────┐
│ california-  │ ──── answer in refs ──→ Use skill reasoning ($0.10-0.50)
│ adu skill    │                         (skill mode, reference files)
│ (LLM reads)  │
└──────┬───────┘
       │ not in refs
       ▼
┌──────────────┐
│ adu-city-    │ ──── found online ────→ Use live result ($0.50-2.00)
│ research     │                         (expensive fallback)
│ (WebSearch)  │
└──────┬───────┘
       │ result
       ▼
┌──────────────┐
│ Capture into │ ──── next run is free
│ code-link map│
└──────────────┘
```

**Each run makes the next run cheaper.** Live research results get captured into code link maps during the QC cycle, so the expensive path is only hit once per correction type per city.

### 6.3 Maintenance Mode

When a code cycle updates (e.g., 2022 CBC → 2025 CBC):

1. Mark affected code link maps as `"status": "maintenance"`
2. Agent sees maintenance flag → skips tool lookup, goes straight to skill mode (reads reference files)
3. Skill mode is more expensive but handles the ambiguity of changed codes
4. Human QC reviews the skill's findings against updated codes
5. Code link maps get updated with new version
6. Agent switches back to tool mode for that jurisdiction

This means maintenance doesn't break the system — it gracefully degrades to the more expensive path while updates are being verified.

---

## 7. Registry and Versioning

### 7.1 Skill Pack Registry (registry.json)

Central manifest tracking every skill pack, its version, and status:

```json
{
  "registry_version": "1.0.0",
  "last_updated": "2026-03-03",
  "jurisdictions": {
    "california": {
      "state_skill_version": "2.1.0",
      "code_cycle": "2022-cbc",
      "cities": {
        "buena-park": {
          "version": "1.2.0",
          "status": "hardened",
          "last_verified": "2026-02-15",
          "code_link_coverage": 0.92,
          "correction_types_mapped": 47,
          "permit_types": ["adu"]
        },
        "la-mesa": {
          "version": "0.3.0",
          "status": "draft",
          "last_verified": null,
          "code_link_coverage": 0.45,
          "correction_types_mapped": 21,
          "permit_types": ["adu"]
        },
        "placentia": {
          "version": "1.0.0",
          "status": "hardened",
          "last_verified": "2026-02-11",
          "code_link_coverage": 0.85,
          "correction_types_mapped": 38,
          "permit_types": ["adu"]
        }
      }
    }
  }
}
```

### 7.2 Version Semantics

- **Major** (2.0.0): Code cycle change (2022 CBC → 2025 CBC)
- **Minor** (1.1.0): New correction types added to code link maps
- **Patch** (1.0.1): Fix to existing code link entry (wrong section number, etc.)

### 7.3 Mass Update Pattern

When California adopts a new code cycle:

```
1. AI diffs old state skill against new code documents
   → Generates change manifest: which sections moved, renumbered, amended
   → Cost: ~$5-10 for state-level diff

2. AI applies change manifest to every city code link map
   → Updates section references, flags entries that need human review
   → Cost: ~$0.50 per city × 482 cities = ~$240

3. Human QC reviews flagged entries
   → Marks as verified or corrects
   → Time: 10-15 min per city for minor cycle updates

4. Registry updated with new versions
   → All agent runs automatically pick up new skill packs
```

---

## 8. Extending Beyond ADU

### 8.1 Permit Type as a Dimension

The corrections-flow pipeline is permit-type-agnostic in structure:

| Phase | ADU | Solar PV | Residential Remodel |
|-------|-----|----------|-------------------|
| Parse corrections | Same | Same | Same |
| Build sheet manifest | Same | Same | Same |
| Research codes | ADU-specific codes | NEC Art. 690, fire setbacks | IRC Ch. 3-10, structural |
| Categorize | ADU categories | Solar categories | Remodel categories |
| Generate questions | ADU questions | Solar questions | Remodel questions |
| Generate response | ADU deliverables | Solar deliverables | Remodel deliverables |

**What changes per permit type**:
- Code link maps (different correction types, different code sections)
- Reference files (different chapters of CRC/CBC/NEC)
- Categorization logic (different professional disciplines involved)
- Question templates (different contractor decisions needed)

**What stays the same**:
- Pipeline structure (phases 1-5)
- Session management
- File verification
- Agent SDK config pattern
- Progress tracking
- Two-skill separation (analysis → human pause → response)

### 8.2 Adding a New Permit Type

```
1. Create permit-types/{new-type}/ directory
   - corrections-flow/SKILL.md (adapt from ADU)
   - corrections-complete/SKILL.md (adapt from ADU)
   - schemas/ (define JSON schemas for this permit type)

2. Create state-level code link maps for the new type
   - states/california/code-links/{new-type}-*.json
   - AI generates drafts from relevant code chapters

3. Create city-level overlays where needed
   - states/california/cities/{city}/code-links/{new-type}-*.json
   - Most cities don't override state code for simple permit types

4. Register in registry.json
   - Add permit_type to each city's supported list

5. Test at L0-L3 using the test ladder
   - Same test structure, different fixtures
```

---

## 9. Cost Model at Scale

### 9.1 Per-Run Costs (Hardened City)

| Component | Current (Live) | Proposed (Hardened) | Savings |
|-----------|---------------|--------------------:|--------:|
| Corrections parsing (Phase 1) | $0.50 | $0.50 | — |
| Sheet manifest (Phase 2) | $1.00 | $1.00 | — |
| State law research (Phase 3A) | $1.50 | $0.10 (code-link lookup) | 93% |
| City research (Phase 3B) | $2.00 + 14 min | $0.05 (code-link lookup) | 97% |
| Sheet observations (Phase 3C) | $0.80 | $0.80 | — |
| Categorization (Phase 4) | $0.50 | $0.30 (templates pre-mapped) | 40% |
| Response generation (Phase 5) | $1.00 | $0.80 | 20% |
| **Total** | **$7.30** | **$3.55** | **51%** |

### 9.2 Onboarding Costs (Per City)

| Step | Cost | Time | Who |
|------|------|------|-----|
| AI generates draft code link map | $2-5 | 10 min | AI |
| Human QC verifies map | $12-25 | 30-60 min | Human |
| L0-L1 test run | $0.50 | 2 min | AI |
| L3 validation run | $3-5 | 10 min | AI |
| **Total per city** | **$18-35** | **~1.5 hr** | Mixed |

### 9.3 Break-Even

At $3.55 per hardened run vs $7.30 live:
- Savings per run: $3.75
- Onboarding cost per city: ~$25 average
- **Break-even: 7 runs per city**

After 7 corrections analyses for a given city, the onboarding investment is recovered. Every subsequent run is pure margin improvement.

---

## 10. Modifications to cc-crossbeam Codebase

### 10.1 Files to Create

| File | Purpose |
|------|---------|
| `agents-crossbeam/src/utils/skill-assembler.ts` | Runtime skill set assembly from registry |
| `agents-crossbeam/src/utils/code-link-resolver.ts` | Deterministic cascade lookup tool |
| `agents-crossbeam/src/utils/registry.ts` | Read/query the skill pack registry |
| `skill-registry/` | Top-level directory for hierarchical skill packs |
| `skill-registry/registry.json` | Central manifest |
| `skill-registry/schemas/` | Shared JSON schemas for code link maps |
| `skill-registry/tools/code-link-resolver/SKILL.md` | Skill wrapper for the deterministic tool |

### 10.2 Files to Modify

| File | Change |
|------|--------|
| `agents-crossbeam/src/utils/config.ts` | Accept `JurisdictionConfig` + `PipelineConfig`, set `cwd` to assembled runtime dir |
| `agents-crossbeam/src/utils/session.ts` | Write `jurisdiction.json` to session, track skill pack versions used |
| `agents-crossbeam/src/flows/corrections-analysis.ts` | Prompt references code-link-resolver, lists available maps, adds `lookup_source` tracking |
| `agents-crossbeam/src/flows/corrections-response.ts` | Minor — read jurisdiction context from session |
| `agents-crossbeam/src/utils/verify.ts` | Add verification for `jurisdiction.json` and `lookup_source` fields |
| `agents-crossbeam/src/utils/progress.ts` | Track code-link hits vs misses in progress output |

### 10.3 Files to Leave Alone

| File | Why |
|------|-----|
| `agents-crossbeam/src/tests/test-l0-smoke.ts` | Still valid — tests SDK init |
| `agents-crossbeam/src/tests/test-l4-full-pipeline.ts` | Still valid — tests end-to-end |
| `agents-crossbeam/src/utils/progress.ts` (SubagentTracker) | Still valid — subagent tracking works the same |
| `adu-skill-development/` | Source of truth for ADU skills — becomes one entry in the registry |

### 10.4 Test Ladder Extensions

| Level | New Test | What It Validates |
|-------|----------|-------------------|
| L0.5 | `test-l0-registry.ts` | Registry loads, skill packs resolve, symlinks valid |
| L1.5 | `test-l1-code-link-lookup.ts` | Code-link-resolver returns correct results for known patterns |
| L3-cascade | `test-l3-cascade.ts` | Agent uses code-link-resolver first, falls back to skill for misses |
| L3-new-city | `test-l3-new-city.ts` | Agent handles city with no code link maps (full live research) |

---

## 11. Migration Path

### Phase 1: Extract and Restructure (Week 1)
- Create `skill-registry/` directory structure
- Move `california-adu` into `skill-registry/states/california/`
- Move `buena-park-adu` into `skill-registry/states/california/cities/buena-park/`
- Extract code link map JSONs from existing reference files
- Build `registry.json` with current two cities
- Build `skill-assembler.ts` — symlinks from registry into runtime

### Phase 2: Code Link Resolver (Week 2)
- Build `code-link-resolver.ts` with cascade logic
- Wrap as a skill (SKILL.md) so agent can invoke it
- Modify corrections-flow prompt to check resolver first
- Test at L1.5 (deterministic lookup correctness)
- Test at L3-cascade (agent actually uses it)

### Phase 3: Onboarding Pipeline (Week 3)
- Build the AI city-onboarding flow (generates draft code link maps)
- Build the human QC interface (review/approve/correct map entries)
- Onboard 5 pilot cities using the pipeline
- Measure cost delta (live vs hardened)

### Phase 4: Permit Type Generalization (Week 4+)
- Abstract corrections-flow SKILL.md to be permit-type-parameterized
- Create first non-ADU permit type (solar PV or residential remodel)
- Build code link maps for the new type
- Validate with L3-L4 tests

---

## 12. Open Questions for Review

1. **County layer**: How many states actually route permits through county? California has some (LA County unincorporated areas). Is this worth modeling as a separate layer or can it be treated as a city variant?

2. **Code link map granularity**: One JSON per correction type (fine-grained, easy to version) or one JSON per city (coarse, fewer files)? The spec above uses per-correction-type.

3. **Skill pack storage**: Git repo (current approach, good for versioning) vs database (better for querying, harder to version) vs hybrid (git for source of truth, DB for runtime queries)?

4. **Live research capture**: When the agent falls back to WebSearch and finds an answer, should it automatically generate a draft code link entry? Or should that only happen during explicit onboarding runs?

5. **Multi-state priority**: Which states after California? Texas (large market, TRCC is different from IRC), Florida (FBC is statewide, simpler), or follow demand?

6. **Deterministic tool implementation**: Should code-link-resolver be a Claude Code custom tool (MCP server), a Bash script the agent calls, or a skill that wraps a script? MCP server is cleanest but adds deployment complexity.

7. **Cost tracking granularity**: Track code-link hits vs misses per run to measure hardening coverage? This feeds back into the production line — cities with low hit rates need more QC.
