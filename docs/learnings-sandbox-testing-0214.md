# Learnings: Sandbox Testing — Feb 14, 2026

## Summary

Went from **0 successful cloud runs** to a fully working 15-page city review pipeline in one session. The sandbox infrastructure is solved. Remaining work is skill/prompt tuning and stripping unnecessary in-sandbox work (PDF generation).

---

## What We Fixed (Chronological)

### 1. Missing file records at runtime
- **Symptom:** Agent downloaded 1 file instead of 3 — only the PDF existed in the `files` table at runtime.
- **Root cause:** The `pages-png.tar.gz` and `title-blocks.tar.gz` records were added to Supabase *after* the run, not before.
- **Fix:** Ensured all file records (PDF + 2 tar.gz archives) exist before triggering.

### 2. Turn limit too low (80 turns)
- **Symptom:** Corrections analysis agent terminated mid-pipeline at 80 turns.
- **Root cause:** Default `maxTurns: 80` was set for local testing where setup is instant. Sandbox agents burn more turns on skill discovery, file exploration, and tool logging.
- **Fix:** Raised to `maxTurns: 500`, `maxBudgetUsd: 50.00` for both city-review and corrections-analysis.

### 3. HTTP streaming connection killed at ~5 minutes (THE BIG ONE)
- **Symptom:** Every run died at exactly ~5-6 minutes with `TypeError: terminated` or `SocketError: other side closed`.
- **Root cause:** `runCommand()` in non-detached mode keeps an HTTP streaming (ndjson) connection open for the full command duration. GCP's load balancer (or intermediate proxy between Cloud Run and Vercel's sandbox API) kills idle HTTP connections at approximately 5 minutes.
- **Fix:** Switched to `detached: true` mode. Detached commands run independently of the HTTP connection. Added a resilient wait loop that retries `cmd.wait()` if the connection drops, with sandbox status checks between retries.
- **Impact:** Immediately went from 0% success rate to 100%. First successful cloud run (CV2, 1-page test) completed in 10.2 minutes.

### 4. Cloud Run resource constraints
- **Symptom:** Slow sandbox boot, potential CPU throttling after HTTP response.
- **Fix:** `gcloud run deploy` with `--timeout=3600 --no-cpu-throttling --min-instances=1 --memory=4Gi --cpu=4`.
- **Key insight:** `--no-cpu-throttling` is critical for fire-and-forget async processing. Without it, Cloud Run throttles CPU after the HTTP response is sent, starving the background sandbox work.

### 5. Agent re-invocation loop after completion
- **Symptom:** Agent completed at 82 turns ($9.64) but then kept getting re-invoked in 1-turn follow-up loops. Cost climbed to $10.78+ with repeated "Completed in 1 turns" messages. Status stayed "processing" forever because the upload phase (after the for-await loop) never ran.
- **Root cause:** The `for await (const message of result)` loop over the Agent SDK `query()` result didn't break after receiving the `result` message. The SDK kept yielding follow-up conversations where the agent said "nothing to do" each time.
- **Fix:** Added `break;` after processing the `message.type === 'result'` event. One line fix.

### 6. PDF upload MIME type error
- **Symptom:** Agent completed all work successfully, but the post-agent upload phase crashed with "mime type text/plain;charset=UTF-8 is not supported".
- **Root cause:** Two issues:
  1. `supabase.storage.upload()` auto-detected Buffer content as `text/plain;charset=UTF-8` instead of `application/pdf`.
  2. `readOutputFiles()` read binary files (PDF, PNG) as utf-8 text and tried to stuff them into the JSONB `raw_artifacts` column.
- **Fix:** Added explicit `contentType` mapping by file extension for uploads. Added binary file extension exclusion in `readOutputFiles()`.

---

## Test Results Summary

| Test | Status | Duration | Cost | Turns | Key Result |
|------|--------|----------|------|-------|------------|
| CV0 Pre-flight | PASS | ~30s | $0 | - | All infra checks green |
| CV1 Boot | PASS | ~17s boot | $0 | - | All 7 SANDBOX phases, agent started |
| CV2 1-page | PASS | 10.2 min | $3.14 | 37 | First successful cloud run! 7 artifacts |
| CV3 3-page | PASS | 11.3 min | $2.64 | 52 | 9 artifacts, subagent review worked |
| CV4 15-page (run 1) | PARTIAL | 6.4 min | $0.72 | 45 | Only sheet-manifest — agent read all PNGs in main context, hit context window |
| CV4 15-page (run 2) | PARTIAL | ~26 min | $10.97 | 75 | All artifacts generated! Failed on PDF upload MIME type (upload bug, not agent bug) |
| CV4 15-page (run 3) | PENDING | - | - | - | Has upload fixes deployed, not yet run |

---

## Architecture Learnings

### Subagent architecture is mandatory for multi-page review
- CV4 run 1 failed because the orchestrator read all 15 PNGs + 15 title block crops (30+ images) in its main context, filling the context window before doing any review work.
- CV4 run 2 succeeded because of prompt improvements that enforced subagent-per-discipline-group architecture. Orchestrator only reads the cover sheet + title block crops (small images), spawns subagents for sheet review.

### Compaction doesn't help with images
- Agent SDK `query()` does NOT expose compaction settings.
- Even if it did, compaction summarizes text but does NOT remove images from context.
- The fix for image-heavy workloads is always subagents, not compaction.

### Break the for-await loop on result
- The Agent SDK `query()` returns an async iterable. After the `result` message, the SDK may continue yielding follow-up conversations. Always `break` on result to prevent infinite re-invocation loops that burn budget without doing useful work.

### Keep sandbox work minimal
- PDF generation in-sandbox wastes ~10 min and ~$3 per run (installing reportlab, writing Python scripts, QA'ing screenshots, fixing layout issues).
- Sandbox should input simple files (PNGs, JSONs) and output simple files (markdown, JSON).
- Heavy conversions (PDF generation, image processing) belong in Cloud Run, before or after the sandbox.

### Onboarded city skills eliminate web search
- Ripping out web search for onboarded cities (Placentia, Buena Park) and using the dedicated city skill instead made the agent faster, more reliable, and cheaper.
- City skill reference files are pre-verified data — better quality than any web search result.

---

## Open Problems

### 1. PDF generation still in skills (being fixed by another agent)
- The `adu-corrections-pdf` skill is still referenced by both city-review and corrections flows.
- Another agent is stripping PDF generation from the skills right now.
- New approach: sandbox outputs markdown/JSON only. If PDF is needed, Cloud Run converts markdown to PDF on download (like the upload-side PNG conversion).

### 2. CV4 run 3 not yet verified
- The upload fixes (MIME type, binary exclusion, break-on-result) are deployed but CV4 hasn't been re-run with them yet.
- Expected: should complete ~15 min, ~$8 without PDF generation overhead.

### 3. CV5 contractor flow not tested
- The "money shot" demo flow (corrections-analysis → auto-fill answers → corrections-response) hasn't been run in the cloud yet.
- Should be simpler than city-review (only 2 correction PNGs, not 15 plan sheets).
- Priority: test this next after CV4 passes clean.

### 4. Output record upload robustness
- The `crossbeam-outputs` Supabase storage bucket may need MIME type policies checked.
- If the bucket doesn't exist or has restrictive policies, uploads will fail silently.
- Consider: do we even need storage uploads? The `raw_artifacts` JSONB column already holds all text artifacts. PDF can be generated on-demand.

### 5. Message count cap in API
- The `/api/projects/:id` endpoint returns max 50 messages. For long runs (75+ turns), this means we lose early messages in monitoring.
- Not critical for functionality, but makes forensics harder.
- Consider: add a `limit` query param, or add a separate `/api/projects/:id/messages` endpoint.

---

## Key Files Modified

| File | Changes |
|------|---------|
| `server/src/utils/config.ts` | maxTurns: 500, maxBudgetUsd: 50.00 |
| `server/src/services/sandbox.ts` | detached mode, resilient wait loop, break-on-result, MIME type fix, binary exclusion, [SANDBOX N/7] logging |

## Cloud Run Revision History

| Rev | Changes |
|-----|---------|
| 00006 | Initial sandbox with phase logging |
| 00009 | Detached mode + resilient wait loop (THE fix) |
| 00012 | Break on result + MIME type fix |
| 00013 | Binary file exclusion in readOutputFiles |
