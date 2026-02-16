# Plan: Automated Sheet Manifest Builder (Cloud Run Pre-Processing)

> **STATUS: POST-HACKATHON FEATURE.** This code will be present in `extract.ts` but gated behind a flag. For the hackathon demo, we use the static fixture (`server/fixtures/b1-placentia-manifest.json`) since we're running the same Placentia plan set every time. This feature activates when we build the drag-and-drop upload interface for real users submitting arbitrary plan binders.

## Problem

The sheet manifest (`sheet-manifest.json`) maps sheet IDs (A-1, SN.1, T-1, etc.) to page numbers. For the hackathon demo, a static fixture works because we're always reviewing the same Placentia plan set.

For real users uploading arbitrary plan binders, we need to build the manifest automatically. This must happen OUTSIDE the sandbox — the orchestrator agent cannot read images (see `plan-city-orchestrator.md` for why).

## Solution

Add a manifest-building step to the existing Cloud Run extraction pipeline (`extract.ts`). After extracting page PNGs and cropping title blocks (which already happens), make a single Claude API vision call to create the manifest. No Agent SDK, no sandbox, no context issues.

### How Plan Binders Work

Every construction plan binder follows the same conventions:

1. **Page 1 (cover sheet)** — Usually contains a sheet index/table of contents. Layout varies by firm, but most include a list like:
   ```
   CS    Cover Sheet
   A1    Site Plan
   A1.1  Floor Plan
   S1    Structural Plan
   ...
   ```

2. **Every page (bottom-right corner)** — Has a title block containing the sheet ID (A-1, SN.1, etc.), sheet title, project info, and revision info. This is industry-standard — every architecture/engineering firm does this.

The title block crops already exist — `extract.ts` crops the bottom-right 25% width × 35% height of every page. We just need to connect them to page numbers.

### The API Call

Send to Claude API (single `messages.create` call, NOT Agent SDK):

**Input:**
- Page 1 PNG (cover sheet with index) — 1 image
- All title block crops (title-block-01.png through title-block-N.png) — N small images
- A structured prompt asking Claude to match index entries to title block crops

**Prompt:**
```
You are analyzing a construction plan binder to build a sheet manifest.
Respond with ONLY valid JSON — no explanation, no preamble, no markdown fences.

Image 1 is the cover sheet (page 1). Look for a sheet index/table of contents.
If no index is found, that's OK — build the manifest from title blocks alone.

Images 2-N are title block crops from the bottom-right corner of each page
(in order: page 1, page 2, ..., page N). Title blocks contain the sheet ID,
sheet title, and sometimes project info. The text may be small or in
architectural fonts — read carefully.

For each title block crop, identify:
- The sheet ID exactly as printed (e.g., "A1", "SN.1", "T-1", "CS")
- The sheet title (e.g., "Floor Plan", "Structural Notes")
- The discipline: one of Cover, Architectural, Structural, Energy, MEP, Site/Civil

Cross-reference with the cover sheet index (if one exists) to resolve ambiguities.
If the index lists sheets not found in the title blocks, note them in "notes".

Return this exact JSON structure:
{
  "total_pages": N,
  "project": {
    "address": "...",
    "owner": "...",
    "designer": "...",
    "description": "...",
    "job_number": "..." // if visible
  },
  "sheets": [
    { "page": 1, "sheet_id": "CS", "discipline": "Cover", "sheet_title": "Cover Sheet" },
    { "page": 2, "sheet_id": "A1", "discipline": "Architectural", "sheet_title": "Site Plan" },
    ...
  ],
  "discipline_groups": {
    "cover": ["CS"],
    "architectural": ["A1", "A1.1"],
    "structural": ["S1", "S2"],
    "energy": ["T-1", "T-2"],
    ...
  },
  "notes": { ... }
}

Rules:
- Every page MUST have exactly one entry in "sheets" — no gaps, no duplicates.
- "total_pages" MUST equal the number of title block images provided.
- Every sheet_id in "sheets" MUST appear in exactly one "discipline_groups" array.
- If you can't read a title block, use sheet_id "UNKNOWN-{page}" and note it.
```

**Why this works:**
- Title block crops are small images (~500x700px each) — cheap to send
- Cover sheet is one full-size image — has the authoritative index
- Claude matches the sheet IDs from the title blocks to the index entries
- Single API call, ~$0.20-0.50 with Opus, takes ~15-20 seconds
- No Agent SDK overhead, no sandbox, no context management issues

### Cost Estimate

Using Opus (`claude-opus-4-6`):

For a 15-page plan binder:
- 1 cover sheet image (~200 DPI, ~7200x4800) ≈ 1,500 tokens
- 15 title block crops (~500x700 each) ≈ 200 tokens each = 3,000 tokens
- Prompt + response ≈ 1,500 tokens
- **Total: ~6,000 tokens ≈ $0.20-0.30**

For a 30-page plan binder: ~$0.40-0.50. Negligible.

## Implementation

### Where It Goes

In `server/src/services/extract.ts`, as a new step after title block cropping and before archive creation. Gated behind an enable flag — off for demo, on for production.

### Current Flow (extract.ts)

```
1. Download PDF from Supabase Storage
2. pdftoppm → page PNGs (page-01.png, page-02.png, ...)
3. ImageMagick crop → title block PNGs (title-block-01.png, ...)
4. tar czf → pages-png.tar.gz, title-blocks.tar.gz
5. Upload archives to Supabase Storage
6. Insert file records in DB
```

### New Flow

```
1. Download PDF from Supabase Storage
2. pdftoppm → page PNGs (page-01.png, page-02.png, ...)
3. ImageMagick crop → title block PNGs (title-block-01.png, ...)
4. *** NEW (if enabled): Claude API call → sheet-manifest.json ***
5. tar czf → pages-png.tar.gz, title-blocks.tar.gz
6. Upload archives + manifest to Supabase Storage
7. Insert file records in DB (including manifest)
```

### New Function: `buildSheetManifest()`

```typescript
const MANIFEST_ENABLED = process.env.MANIFEST_BUILDER_ENABLED === 'true'; // off by default

async function buildSheetManifest(
  pagesDir: string,       // directory with page-XX.png files
  titleBlocksDir: string, // directory with title-block-XX.png files
  outputPath: string,     // where to write sheet-manifest.json
): Promise<void> {
  if (!MANIFEST_ENABLED) {
    console.log('Manifest builder disabled — skipping (demo mode uses static fixture)');
    return;
  }

  const anthropic = new Anthropic(); // uses ANTHROPIC_API_KEY env var

  // 1. Read cover sheet (page-01.png) as base64
  const coverSheet = fs.readFileSync(path.join(pagesDir, 'page-01.png'));

  // 2. Read all title block crops as base64, sorted by page number
  const titleBlockFiles = fs.readdirSync(titleBlocksDir)
    .filter(f => f.startsWith('title-block-') && f.endsWith('.png'))
    .sort();
  const titleBlocks = titleBlockFiles.map(f =>
    fs.readFileSync(path.join(titleBlocksDir, f))
  );

  // 3. Build messages array with images
  const content: any[] = [
    {
      type: 'image',
      source: { type: 'base64', media_type: 'image/png', data: coverSheet.toString('base64') },
    },
    {
      type: 'text',
      text: `Above: Cover sheet (page 1). Below: ${titleBlocks.length} title block crops from the bottom-right corner of each page, in page order.`,
    },
    ...titleBlocks.map((tb) => ({
      type: 'image',
      source: { type: 'base64', media_type: 'image/png', data: tb.toString('base64') },
    })),
    { type: 'text', text: MANIFEST_PROMPT },
  ];

  // 4. Call Opus — title blocks have small, tricky architectural fonts
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content }],
  });

  // 5. Parse JSON from response
  const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
  let manifest: any;
  try {
    manifest = JSON.parse(responseText);
  } catch {
    // Retry: Claude may have included preamble text. Try extracting JSON block.
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to extract manifest JSON from Claude response');
    manifest = JSON.parse(jsonMatch[0]);
  }

  // 6. Validate manifest structure
  const errors = validateManifest(manifest, titleBlocks.length);
  if (errors.length > 0) {
    console.warn('Manifest validation errors, retrying:', errors);

    // Retry with validation feedback
    const retryResponse = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      messages: [
        { role: 'user', content },
        { role: 'assistant', content: responseText },
        {
          role: 'user',
          content: `The manifest has validation errors. Fix them and return ONLY the corrected JSON:\n${errors.join('\n')}`,
        },
      ],
    });

    const retryText = retryResponse.content[0].type === 'text' ? retryResponse.content[0].text : '';
    try {
      manifest = JSON.parse(retryText);
    } catch {
      const jsonMatch = retryText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Manifest retry also failed — falling back to fixture');
      manifest = JSON.parse(jsonMatch[0]);
    }

    // Validate again — if still bad, throw and let caller fall back
    const retryErrors = validateManifest(manifest, titleBlocks.length);
    if (retryErrors.length > 0) {
      throw new Error(`Manifest still invalid after retry: ${retryErrors.join('; ')}`);
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
  console.log(`Sheet manifest built: ${manifest.total_pages} pages, ${manifest.sheets.length} sheets`);
}

function validateManifest(manifest: any, expectedPageCount: number): string[] {
  const errors: string[] = [];

  if (!manifest.sheets || !Array.isArray(manifest.sheets)) {
    errors.push('Missing or invalid "sheets" array');
    return errors; // can't validate further
  }

  // Every page must have exactly one entry
  if (manifest.sheets.length !== expectedPageCount) {
    errors.push(`Expected ${expectedPageCount} sheet entries, got ${manifest.sheets.length}`);
  }

  // total_pages must match
  if (manifest.total_pages !== expectedPageCount) {
    errors.push(`total_pages is ${manifest.total_pages}, expected ${expectedPageCount}`);
  }

  // Check for duplicate pages
  const pages = manifest.sheets.map((s: any) => s.page);
  const dupes = pages.filter((p: number, i: number) => pages.indexOf(p) !== i);
  if (dupes.length > 0) {
    errors.push(`Duplicate page numbers: ${[...new Set(dupes)].join(', ')}`);
  }

  // Check for gaps (pages 1..N should all be present)
  for (let i = 1; i <= expectedPageCount; i++) {
    if (!pages.includes(i)) {
      errors.push(`Missing entry for page ${i}`);
    }
  }

  // Every sheet_id must appear in exactly one discipline_group
  if (manifest.discipline_groups) {
    const allGrouped = Object.values(manifest.discipline_groups).flat() as string[];
    for (const sheet of manifest.sheets) {
      if (!allGrouped.includes(sheet.sheet_id)) {
        errors.push(`Sheet "${sheet.sheet_id}" not in any discipline_group`);
      }
    }
  } else {
    errors.push('Missing "discipline_groups"');
  }

  return errors;
}
```

### How the Manifest Gets to the Sandbox

**Option B (recommended):** Upload as a standalone file record.

- Upload `sheet-manifest.json` directly to Supabase Storage (not archived)
- Insert a file record in the `files` table with `file_type: 'manifest'`
- The existing `downloadFilesInSandbox()` pulls it into `project-files/`
- Step 5.5 in `sandbox.ts` checks: pre-built manifest in project-files → copy to output. If missing → fall back to static fixture.

**Important:** Verify the storage bucket and path match what `downloadFilesInSandbox()` expects. The manifest should go to the same `crossbeam-outputs` bucket, at `{userId}/{projectId}/sheet-manifest.json`, with a corresponding `files` table record.

### Update sandbox.ts Step 5.5

This is already implemented (see current code). The priority chain is:

```
1. Pre-built manifest from Cloud Run (downloaded into project-files/) ← NEW, when enabled
2. Static fixture (server/fixtures/b1-placentia-manifest.json) ← CURRENT, for demo
```

Current code already handles the fixture fallback. When the manifest builder is enabled, the pre-built manifest arrives as a downloaded file, and step 5.5 just needs to check if it exists in `project-files/` before falling back to the fixture:

```typescript
// 5.5 For city-review: ensure sheet manifest is in output/
if (options.flowType === 'city-review') {
  await sandbox.runCommand({ cmd: 'mkdir', args: ['-p', SANDBOX_OUTPUT_PATH] });

  // Check if manifest was pre-built by Cloud Run extraction
  const checkResult = await sandbox.runCommand({
    cmd: 'test', args: ['-f', `${SANDBOX_FILES_PATH}/sheet-manifest.json`],
  });

  if (checkResult.exitCode === 0) {
    // Pre-built manifest exists — copy to output/
    await sandbox.runCommand({
      cmd: 'cp',
      args: [`${SANDBOX_FILES_PATH}/sheet-manifest.json`, `${SANDBOX_OUTPUT_PATH}/sheet-manifest.json`],
    });
    await insertMessage(projectId, 'system', '[SANDBOX 5.5/7] Sheet manifest loaded (pre-built)');
  } else {
    // Fallback: use static fixture (demo only)
    const manifestPath = path.join(__dirname, '../../../fixtures/b1-placentia-manifest.json');
    const manifestContent = fs.readFileSync(manifestPath);
    await sandbox.writeFiles([{
      path: `${SANDBOX_OUTPUT_PATH}/sheet-manifest.json`,
      content: manifestContent,
    }]);
    await insertMessage(projectId, 'system', '[SANDBOX 5.5/7] Sheet manifest loaded (fixture fallback)');
  }
}
```

## Dependencies

- `@anthropic-ai/sdk` — already in server dependencies (used by Agent SDK)
- `ANTHROPIC_API_KEY` — already in Cloud Run env vars
- `MANIFEST_BUILDER_ENABLED` — new env var, set to `'true'` to enable (default: off)
- `poppler-utils`, `imagemagick` — already in Dockerfile
- No new system packages needed

## Edge Cases

1. **Plans without a cover sheet index**: Some small plan sets (1-3 pages, common for ADU conversions) skip the index entirely. The prompt handles this: "If no index is found, build the manifest from title blocks alone." Title blocks are sufficient — the index is just a cross-reference bonus. Opus handles this well since architectural fonts are hard to read.

2. **Image count limits**: Claude API allows up to 20 images at 8000x8000px each, or 100+ at smaller sizes. Title block crops are small (~500x700), so even a 50-page plan is fine. Cover sheet at 200 DPI (~7200x4800) is within limits.

3. **Non-standard title block locations**: Some firms put title blocks on the right edge (tall, narrow) instead of bottom-right. The current 25%×35% crop should catch most. Edge cases might need a wider crop — but this is a future concern for the drag-and-drop upload interface.

4. **Failed manifest build**: Wrapped in try/catch. If it fails (even after validation retry), extraction still succeeds — the sandbox falls back to having the agent build the manifest in Phase 1, or the fixture if available. Non-fatal.

5. **Unreadable title blocks**: Some pages (like T24 energy forms) have machine-generated title blocks that look different from hand-drafted ones. The prompt says: "If you can't read a title block, use sheet_id UNKNOWN-{page}." The orchestrator's Phase 2 subagent grouping handles unknowns gracefully.

## Files to Modify

| File | Change |
|------|--------|
| `server/src/services/extract.ts` | Add `buildSheetManifest()` + `validateManifest()` + call after title block cropping (gated by env var) |
| `server/src/services/sandbox.ts` | Update step 5.5 to check for pre-built manifest before fixture fallback |
| `server/package.json` | Verify `@anthropic-ai/sdk` is a direct dependency (likely already there) |

## Not Changed

- The static fixture (`server/fixtures/b1-placentia-manifest.json`) stays as primary for demo
- The sandbox agent prompt doesn't change — it already says "manifest exists in output/"
- The corrections flow doesn't use this (it has its own manifest building)
- No changes needed when `MANIFEST_BUILDER_ENABLED` is unset or `'false'` — everything works as today

## Cost & Performance

| Metric | Value |
|--------|-------|
| API cost per plan | ~$0.20-0.50 (Opus) |
| Latency | ~15-20 seconds |
| Model | **Opus** (`claude-opus-4-6`) — architectural fonts are small and tricky, Opus reads them reliably |
| Images sent | 1 cover + N title blocks |
| Token usage | ~6,000-8,000 per plan |
| Validation | Structural checks + one retry if invalid |

Compare to Phase 1 in sandbox: ~$1.50, ~90 seconds, eats orchestrator context. This is 3-7x cheaper and 4-6x faster, with zero sandbox context impact.

## Execution Order (Post-Hackathon)

1. Add `MANIFEST_BUILDER_ENABLED` env var to Cloud Run (set to `'false'` initially)
2. Add `buildSheetManifest()` + `validateManifest()` to `extract.ts`
3. Call it after title block cropping, gated by env flag
4. Upload manifest as standalone file to Supabase Storage + insert DB record
5. Update `sandbox.ts` step 5.5 to prefer pre-built manifest over fixture
6. Set `MANIFEST_BUILDER_ENABLED=true` in Cloud Run
7. Test with the Placentia PDF upload (compare output to static fixture)
8. Test with a different plan binder (the Long Beach 326 Flint Ave set in `test-assets/05-extract-test/`)
