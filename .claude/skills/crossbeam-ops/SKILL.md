---
name: crossbeam-ops
version: "1.0"
description: "Operations manual for the CrossBeam ADU Permit Assistant. Teaches AI agents how to operate the deployed system — trigger flows, check status, read results, navigate the UI, and query the database."
---

# CrossBeam Operations Manual

This skill teaches you how to operate the CrossBeam system programmatically and via browser.

## Decision Tree Router

| What you want to do | Load these references |
|---|---|
| Trigger a flow, check results, or reset via API | `references/api-endpoints.md` |
| Query the database directly (Supabase MCP or SQL) | `references/data-model.md` |
| Understand what each flow does and its phases | `references/flows.md` |
| Navigate the UI via Chrome browser | `references/ui-navigation.md` |
| Work with demo/test projects | `references/demo-projects.md` |

## Quick Reference

| Item | Value |
|------|-------|
| Vercel URL | https://cc-crossbeam.vercel.app |
| Cloud Run URL | https://crossbeam-server-v7eqq3533a-uc.a.run.app |
| Supabase Project ID | bhjrpklzqyrelnhexhlj |
| Supabase URL | https://bhjrpklzqyrelnhexhlj.supabase.co |
| Auth method | `Authorization: Bearer $CROSSBEAM_API_KEY` |
| Judge Contractor Project | `b0000000-0000-0000-0000-000000000002` |
| Judge City Project | `b0000000-0000-0000-0000-000000000001` |
| Schema | `crossbeam` (not `public`) |

## Fastest Path: Run a Full Test

```bash
# 1. Reset the demo project
curl -X POST https://cc-crossbeam.vercel.app/api/reset-project \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"b0000000-0000-0000-0000-000000000002"}'

# 2. Trigger corrections analysis
curl -X POST https://cc-crossbeam.vercel.app/api/generate \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"b0000000-0000-0000-0000-000000000002","flow_type":"corrections-analysis"}'

# 3. Poll until done (check project.status)
curl -s https://cc-crossbeam.vercel.app/api/projects/b0000000-0000-0000-0000-000000000002 \
  -H "Authorization: Bearer $CROSSBEAM_API_KEY" | jq '.project.status'
```
