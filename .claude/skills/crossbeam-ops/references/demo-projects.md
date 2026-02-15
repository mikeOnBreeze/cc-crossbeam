---
title: "Demo Projects Reference"
category: operations
relevance: "When working with test/demo projects for development or testing"
---

# Demo Projects

## Judge Projects (judge-demo mode)

Pre-seeded projects for hackathon judging. Always available.

### Contractor Project
- **ID:** `b0000000-0000-0000-0000-000000000002`
- **Flow:** corrections-analysis → corrections-response
- **City:** Placentia
- **Files:**
  - Plan binder PDF (32 pages, Placentia ADU)
  - Corrections letter PNGs (2 pages, from city plan check)
  - `pages-png.tar.gz` — Pre-extracted page PNGs (full DPI, 7200×4800)
  - `title-blocks.tar.gz` — Pre-cropped title blocks
- **Storage:** `crossbeam-demo-assets/placentia/`

### City Review Project
- **ID:** `b0000000-0000-0000-0000-000000000001`
- **Flow:** city-review
- **City:** Placentia
- **Files:**
  - Plan binder PDF (same as contractor project)
  - `pages-png.tar.gz` — Pre-extracted page PNGs (full DPI)
  - `title-blocks.tar.gz` — Pre-cropped title blocks
- **Storage:** `crossbeam-demo-assets/placentia/`

## Dev-Test Projects (dev-test mode only)

- **Demo City:** `a0000000-0000-0000-0000-000000000001`
- **Demo Contractor:** `a0000000-0000-0000-0000-000000000002`

## Reset Procedure

Demo projects can be reset to `ready` state at any time:

```bash
curl -X POST https://cc-crossbeam.vercel.app/api/reset-project \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"b0000000-0000-0000-0000-000000000002"}'
```

This clears: messages, contractor_answers. Resets status to `ready`.
**Outputs are preserved** — each run gets an auto-incrementing version number so you can compare runs.

## Running a Full Test

```bash
# 1. Reset (clears messages + contractor answers, preserves run history)
curl -X POST https://cc-crossbeam.vercel.app/api/reset-project \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"b0000000-0000-0000-0000-000000000002"}'

# 2. Trigger Phase 1
curl -X POST https://cc-crossbeam.vercel.app/api/generate \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"b0000000-0000-0000-0000-000000000002","flow_type":"corrections-analysis"}'

# 3. Wait for completion (poll every 30 seconds)
# Status should go: processing-phase1 → awaiting-answers
# This typically takes 10-20 minutes

# 4. Check results
curl -s https://cc-crossbeam.vercel.app/api/projects/b0000000-0000-0000-0000-000000000002 \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" | jq '.project.status, .latest_output.agent_cost_usd'
```

## Comparing Runs

After running multiple tests, use the `/runs` endpoint to compare:

```bash
# List all runs with version, cost, and timestamp
curl -s https://cc-crossbeam.vercel.app/api/projects/b0000000-0000-0000-0000-000000000002/runs \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  | jq '.runs[] | {version, flow_phase, agent_cost_usd, agent_turns, agent_duration_ms, created_at}'

# Filter to just analysis runs
curl -s "https://cc-crossbeam.vercel.app/api/projects/b0000000-0000-0000-0000-000000000002/runs?flow_phase=analysis" \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY"

# Compare raw_artifacts between two runs (e.g. v1 vs v3)
curl -s https://cc-crossbeam.vercel.app/api/projects/b0000000-0000-0000-0000-000000000002/runs \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  | jq '[.runs[] | select(.flow_phase=="analysis")] | sort_by(.version) | .[0], .[-1] | {version, agent_cost_usd, keys: (.raw_artifacts | keys)}'
```

Each run is versioned per flow_phase (analysis v1, analysis v2, etc.). The version auto-increments — reset does not affect it.

## Supabase Storage Paths

| Bucket | Path | Contents |
|--------|------|----------|
| crossbeam-demo-assets | `placentia/plan-binder.pdf` | 32-page plan binder |
| crossbeam-demo-assets | `placentia/corrections-letter-p1.png` | Corrections page 1 |
| crossbeam-demo-assets | `placentia/corrections-letter-p2.png` | Corrections page 2 |
| crossbeam-demo-assets | `placentia/pages-png.tar.gz` | Pre-extracted page PNGs (~30MB) |
| crossbeam-demo-assets | `placentia/title-blocks.tar.gz` | Pre-cropped title blocks (~1MB) |
| crossbeam-outputs | `{project_id}/...` | Agent-generated outputs |

## What a Successful Run Looks Like

**Phase 1 (corrections-analysis):**
- Status: `awaiting-answers`
- Messages: 30-60 entries showing agent reasoning
- Output: `raw_artifacts` contains parsed corrections, categorized items, sheet manifest
- Contractor questions: 3-8 questions populated in contractor_answers table
- Cost: typically $2-5
- Duration: 10-20 minutes

**Phase 2 (corrections-response):**
- Status: `completed`
- Output: response_letter_md, professional_scope_md, corrections_report_md populated
- Cost: typically $1-3
- Duration: 5-10 minutes
