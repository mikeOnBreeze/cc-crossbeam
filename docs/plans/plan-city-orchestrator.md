# Plan: Lightweight City Review Orchestrator

## Problem

The city-review orchestrator's context window overflows before completing all 4 phases.

**What happens now (CV4, 15-page plan):**
1. Phase 1: Orchestrator reads cover sheet (1 image) + 15 title block crops (15 images) → builds manifest
2. Phase 2: Spawns 5 discipline subagents → collects 125 findings via TaskOutput (massive text payloads land in orchestrator context)
3. **BOOM — "Prompt is too long"** — context full, orchestrator never reaches Phase 3 or 4

**Orchestrator context at failure:**
- 4 SKILL.md files (baseline)
- 16 images (cover + 15 title block crops)
- 125 findings from 5 subagents (25K+ tokens of text)
- Conversation history (tool calls, writes, etc.)

### Why Local Worked But Cloud Doesn't

Local Agent SDK runs completed the full pipeline at 100 turns / $6.75. Possible reasons cloud is different:

1. **Compaction behavior** — Claude Code's built-in compaction may work differently (or not at all) when running inside a Vercel Sandbox via the Agent SDK. Locally, compaction can summarize earlier text turns to free context. In the sandbox, the `claude_code` preset may not trigger compaction the same way, or compaction may not kick in fast enough before the context limit is hit.

2. **All-at-once vs phased** — In local testing, there may have been natural breakpoints (user interaction, tool delays) that gave compaction time to work. In the sandbox, the agent runs flat-out with no pauses, accumulating context faster than compaction can reclaim it.

3. **Images can't be compacted** — Even if compaction works, it only summarizes TEXT. The 16 images (cover + 15 title blocks) are permanent context residents. They can never be reclaimed.

**Bottom line:** We can't rely on compaction to save us. The orchestrator must be redesigned to never accumulate large payloads.

---

## Solution: File-Based Coordination

**Core principle:** The orchestrator NEVER ingests images or large text payloads. It coordinates via files on disk. Subagents read inputs from files and write outputs to files. The orchestrator just checks that files exist and spawns the next phase.

### Architecture: Before vs After

**BEFORE (current — breaks):**
```
Orchestrator context accumulates:
  ← 16 images (cover + title blocks)
  ← 125 findings text from TaskOutput
  ← state compliance text
  ← city compliance text
  ← 6 output file contents via Write
  = CONTEXT EXPLOSION at ~29 turns
```

**AFTER (proposed):**
```
Orchestrator context stays lightweight:
  ← 4 SKILL.md files (unavoidable baseline)
  ← manifest.json (small text, read from file)
  ← coordination messages ("Phase 2 done, launching Phase 3")
  ← file existence checks (ls, Glob)
  = Orchestrator stays under 30% context usage
```

---

## Implementation

### Change 1: Pre-Build Manifest in Cloud Run (Before Sandbox)

Move Phase 1 (manifest building) out of the sandbox entirely. Do it in Cloud Run using the Claude API directly — no Agent SDK needed.

**Where:** `server/src/services/sandbox.ts`, in the pre-sandbox setup phase (after archive unpacking, before agent launch).

**How:**
```
Cloud Run (pre-sandbox):
  1. Read page-01.png (cover sheet) — extract sheet index via Claude API vision call
  2. Read title-block-01.png through title-block-15.png — extract sheet IDs via Claude API
  3. Match sheet IDs to page numbers
  4. Write sheet-manifest.json
  5. Include manifest in sandbox project-files/output/
```

**Why this is better:**
- Single Claude API call with vision (not an Agent SDK session)
- Cost: ~$0.10-0.30 for one API call vs ~$1.50 for agent turns
- No images enter the orchestrator's context at all
- Manifest is pre-validated before the agent even starts

**Demo shortcut:** For the Placentia demo (b1 project), we already have a working manifest from previous runs. We could literally just include it as a static fixture file that gets uploaded alongside the PNGs. Zero API cost, instant. For the demo, this is fine — the plan set never changes.

**Decision for implementing agent:** Use the demo shortcut (static fixture) for now. Build the Claude API pre-processing as a fast-follow if we need it for non-demo projects.

### Change 2: Subagents Write to Files, Not TaskOutput

Instead of subagents returning findings as text (which lands in orchestrator context), subagents write their results to JSON files on the sandbox filesystem.

**Phase 2 subagents — current behavior:**
```
Orchestrator spawns subagent → subagent analyzes sheets →
  subagent RETURNS findings text via TaskOutput →
  findings land in orchestrator context (25K+ tokens)
```

**Phase 2 subagents — new behavior:**
```
Orchestrator spawns subagent with prompt:
  "Review these sheets. Write findings to /vercel/sandbox/project-files/output/findings-{discipline}.json"
  → subagent analyzes sheets → writes file to disk → returns "Done, wrote N findings"
  → orchestrator gets back a 10-word summary, NOT the full findings
```

**Same for Phase 3 subagents:**
```
Phase 3A subagent:
  "Read findings-*.json files. Look up each FAIL/UNCLEAR finding in california-adu refs.
   Write results to /vercel/sandbox/project-files/output/state_compliance.json"

Phase 3B subagent:
  "Read findings-*.json files. Check against placentia-adu refs.
   Write results to /vercel/sandbox/project-files/output/city_compliance.json"
```

**Phase 4 subagent (NEW — currently done by orchestrator):**
```
Phase 4 subagent:
  "Read ALL artifact files (findings-*.json, state_compliance.json, city_compliance.json, sheet-manifest.json).
   Apply the filter rules from adu-plan-review skill.
   Write: draft_corrections.json, draft_corrections.md, review_summary.json"
```

### Change 3: Orchestrator Becomes Pure Coordinator

The orchestrator's ONLY job is:
1. Read the manifest (small JSON)
2. Spawn Phase 2 subagents with file-write instructions
3. Wait for Phase 2 completion (check file existence, NOT ingest content)
4. Spawn Phase 3 subagents (concurrent)
5. Wait for Phase 3 completion
6. Spawn Phase 4 subagent
7. Wait for Phase 4 completion
8. Verify all expected output files exist
9. Done

**The orchestrator NEVER reads:**
- Any PNG image
- Any findings JSON content
- Any compliance JSON content
- Any draft corrections content

It just checks files exist and spawns the next phase.

---

## Files to Modify

| File | Change | Notes |
|------|--------|-------|
| `server/src/utils/config.ts` | Rewrite `buildPrompt('city-review', ...)` | New prompt instructs file-based coordination |
| `server/src/utils/config.ts` | Update `CITY_REVIEW_SYSTEM_APPEND` | Lighter system prompt focused on coordination |
| `server/src/services/sandbox.ts` | Add pre-built manifest to sandbox files | Copy static fixture or run Claude API pre-processing |
| `server/skills/adu-plan-review/SKILL.md` | Update Phase 2-4 to describe file-based pattern | Subagents write to files, not return to orchestrator |

### Static Manifest Fixture (Demo Shortcut)

Create a static `sheet-manifest.json` for the Placentia demo project. Source: version 1 output from the outputs table (the 59-turn successful run that produced all artifacts).

**Location:** `server/fixtures/b1-placentia-manifest.json`

**In sandbox.ts:** If the project is the b1 demo, copy the fixture manifest into `output/sheet-manifest.json` before launching the agent. Add a flag to the prompt: `MANIFEST PRE-BUILT: sheet-manifest.json already exists in output/. Skip Phase 1 entirely.`

---

## Revised Prompt Structure

The new `buildPrompt('city-review', ...)` should say:

```
You are the ORCHESTRATOR for an ADU plan review. You coordinate subagents — you do NOT read images or large files yourself.

PROJECT FILES: /vercel/sandbox/project-files/
OUTPUT DIRECTORY: /vercel/sandbox/project-files/output/
CITY: {city}
ADDRESS: {address}

MANIFEST: sheet-manifest.json already exists in output/. Read it to understand the sheet layout.

YOUR JOB: Coordinate 4 phases using subagents. You NEVER read PNG images. You NEVER ingest large JSON payloads.

PHASE 2 — Sheet Review:
Spawn 5 discipline subagents. Each subagent gets:
- A list of sheet PNGs to read (from the manifest)
- The relevant checklist reference file path
- Instructions to WRITE findings to output/findings-{discipline}.json

After spawning, wait for completion. Verify files exist with Glob. Do NOT read the findings files.

Subagent grouping:
- arch-a: Cover sheet + floor plans → output/findings-arch-a.json
- arch-b: Elevations + roof + sections → output/findings-arch-b.json
- site-civil: Site plan + grading + utility → output/findings-site-civil.json
- structural: Foundation + framing + details → output/findings-structural.json
- mep-energy: Plumbing + mechanical + electrical + T24 → output/findings-mep-energy.json

PHASE 3 — Code Compliance (concurrent):
Spawn 2 subagents:
- 3A (State): Read findings-*.json + california-adu refs → write output/state_compliance.json
- 3B (City): Read findings-*.json + {city-skill} refs → write output/city_compliance.json

PHASE 4 — Merge & Draft:
Spawn 1 subagent:
- Read ALL artifact files (manifest, findings, compliance)
- Apply filter rules (no false positives, code citations required, objective standards only)
- Write: draft_corrections.json, draft_corrections.md, review_summary.json

COMPLETION: Verify these files exist in output/:
- sheet-manifest.json, findings-*.json (5 files), state_compliance.json,
  city_compliance.json, draft_corrections.json, draft_corrections.md, review_summary.json
```

---

## Estimated Impact

| Metric | Before (broke) | After (projected) |
|--------|----------------|-------------------|
| Orchestrator images | 16 | 0 |
| Orchestrator text payload | ~50K tokens (findings) | ~2K tokens (file paths + status) |
| Orchestrator context usage | >95% (overflow) | ~30% |
| Phase 2 subagent behavior | Return findings to orchestrator | Write to disk |
| Phase 4 | Orchestrator merges inline | Dedicated subagent |
| Total cost | ~$8 | ~$8-10 (slightly more subagent overhead) |
| Reliability | Fails on 15+ page plans | Should handle 30+ pages |

---

## Execution Order

1. Extract the working manifest from outputs table (version 1, the 59-turn run) → save as fixture
2. Update `sandbox.ts` to copy fixture manifest into sandbox for b1 project
3. Rewrite `buildPrompt('city-review', ...)` in `config.ts` with file-based coordination instructions
4. Update `CITY_REVIEW_SYSTEM_APPEND` to match
5. Update `adu-plan-review/SKILL.md` Phase 2-4 descriptions
6. Deploy to Cloud Run
7. Run CV4 to validate

---

## Risk: Subagent File Access

Subagents spawned via the Task tool in Claude Code share the same filesystem. They CAN read and write files. This has been verified in previous runs — subagents already read PNG files from disk. The file-based pattern works.

## Risk: Subagent Skill Access

Subagents spawned via Task inherit the parent's skill configuration. Phase 3A subagent needs `california-adu` refs — it will have access because the parent loaded those skills via `settingSources`. Verified in previous runs.
