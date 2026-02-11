# Claude Agent SDK + Vercel Sandbox: Learnings

**Date**: December 10, 2025 (Updated: December 12, 2025)
**Status**: Working - Full demand letter pipeline validated with Word output

---

## Critical Discovery: The `query()` Options That Actually Matter

When using `@anthropic-ai/claude-agent-sdk` inside a Vercel Sandbox, the agent will **claim success but do nothing** unless you provide these options:

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

const result = await query({
  prompt: 'Create a file called hello.txt with some content',
  options: {
    // REQUIRED - Without these, the agent hallucinates tool usage
    tools: { type: 'preset', preset: 'claude_code' },
    systemPrompt: { type: 'preset', preset: 'claude_code' },
    cwd: '/vercel/sandbox',  // Working directory inside sandbox

    // Permissions
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,

    // Limits
    maxTurns: 15,
    maxBudgetUsd: 1.00,

    // Model - use the alias, not shorthand
    model: 'claude-haiku-4-5',  // NOT 'haiku'
  }
});
```

### Why This Matters

Without `tools` and `systemPrompt` presets, the agent:
- Says "I'll use the Write tool to create the file"
- Reports "Successfully created hello.txt"
- **Actually creates nothing**

The console logs look perfect. The file doesn't exist. Always verify independently.

---

## Sandbox CLI Commands That Work

### List files in sandbox
```bash
sandbox exec {SANDBOX_ID} -- ls -la /vercel/sandbox
```

### Download a file to local machine
```bash
sandbox exec {SANDBOX_ID} -- cat /vercel/sandbox/hello.txt > hello.txt
```

**Note**: `sandbox copy` command exists but often fails with "Path doesn't exist". Use the cat redirect instead.

### SSH into sandbox (interactive shell)
```bash
sandbox exec {SANDBOX_ID} --interactive bash
```

### List all running sandboxes
```bash
sandbox list
```

### Stop a sandbox
```bash
sandbox stop {SANDBOX_ID}
```

---

## Installation Inside Sandbox

Two packages need to be installed in this order:

```typescript
// 1. Install Claude Code CLI globally (required for agent tools)
await sandbox.runCommand({
  cmd: 'npm',
  args: ['install', '-g', '@anthropic-ai/claude-code'],
  sudo: true,  // Global install needs sudo
});

// 2. Install Agent SDK locally
await sandbox.runCommand({
  cmd: 'npm',
  args: ['install', '@anthropic-ai/claude-agent-sdk'],
});
```

---

## Verification: Don't Trust Console Logs

The agent will confidently report success even when tools aren't configured correctly. Always verify:

1. **Run `ls -la`** to confirm file exists
2. **Run `cat`** to confirm content is correct
3. **Download the file** to your local machine

```bash
# Verify file exists
sandbox exec sbx_xxx -- ls -la /vercel/sandbox

# Verify content
sandbox exec sbx_xxx -- cat /vercel/sandbox/hello.txt

# Download and inspect locally
sandbox exec sbx_xxx -- cat /vercel/sandbox/hello.txt > hello.txt
cat hello.txt
```

---

## Multi-Sandbox Isolation: Confirmed Working

As of December 2025, you can run multiple independent sandboxes simultaneously:

- Each `npm run test` in a separate terminal creates a new sandbox
- Sandboxes have separate file systems
- Sandboxes have separate sandbox IDs
- No cross-contamination observed

This solves the July 2025 scaling issues experienced with Daytona sandboxes.

---

## Project Setup Reference

### package.json
```json
{
  "type": "module",
  "scripts": {
    "test": "node --env-file .env.local --experimental-strip-types ./src/test-agent.ts"
  },
  "dependencies": {
    "@vercel/sandbox": "^1.0.2",
    "ms": "^2.1.3"
  }
}
```

### .env.local
```
ANTHROPIC_API_KEY=sk-ant-...
```

### Sandbox Configuration
```typescript
const sandbox = await Sandbox.create({
  resources: { vcpus: 4 },
  timeout: ms('30m'),  // 30 minutes for interactive testing
  runtime: 'node22',
});
```

---

## Gotchas

1. **runCommand stdout/stderr are methods, not properties**:
   ```typescript
   const result = await sandbox.runCommand({ cmd: 'cat', args: ['/path/file'] });

   // WRONG - returns function definition string
   const output = result.stdout?.toString();

   // CORRECT - call the method
   const output = await result.stdout();
   ```

2. **Model name**: Use `claude-haiku-4-5`, not `haiku` or `claude-4.5-haiku`

3. **Shell commands in sandbox exec**: Use `--` separator before the command
   - Wrong: `sandbox exec sbx_xxx cat /path/file`
   - Right: `sandbox exec sbx_xxx -- cat /path/file`

4. **Redirects in download**: The redirect (`>`) happens on YOUR machine, not in sandbox
   - `sandbox exec sbx_xxx -- cat /file > local.txt` writes to YOUR local.txt

5. **Interactive mode**: If running test script in background, readline will crash with `ERR_USE_AFTER_CLOSE`. Run in foreground terminal.

6. **Sandbox timeout**: Default is short. Set explicitly for interactive sessions:
   ```typescript
   timeout: ms('30m')
   ```

---

## Working Test Script Pattern

See `src/test-agent.ts` for the full implementation. Key pattern:

1. Create sandbox
2. Install dependencies (claude-code CLI + agent-sdk)
3. Write test script to sandbox filesystem
4. Run test script with ANTHROPIC_API_KEY env var
5. Stream results and show verification commands
6. Multi-turn loop: prompt for additional tasks
7. Cleanup only when user says "done"

---

## File Upload/Download: Confirmed Working (Dec 11, 2025)

Binary file transfers to/from sandbox work correctly:

### Validated File Types
- **JPEG** - 678KB image
- **PNG** - 1.7MB screenshot
- **DOCX** - 242KB Word document
- **PDF** - 303KB document

### Directory Uploads
- 31 files uploaded with 7 subdirectories
- 13.7MB total
- Directory structure preserved
- Files with spaces in names work

### Pattern for Binary File Download

```typescript
// Upload (straightforward)
await sandbox.writeFiles([
  { path: '/vercel/sandbox/file.pdf', content: fs.readFileSync('local.pdf') }
]);

// Download (use base64 for binary safety)
const result = await sandbox.runCommand({
  cmd: 'sh',
  args: ['-c', `base64 "/vercel/sandbox/file.pdf"`],
});

const stdoutBuffer = await result.stdout();  // Note: stdout() is a method!
const content = Buffer.from(stdoutBuffer.toString().replace(/\s/g, ''), 'base64');
fs.writeFileSync('downloaded.pdf', content);
```

### Test Script
See `src/upload-test.ts` for full implementation.

---

## Agent + Skill + File Upload: Full Demand Letter Test (Dec 11, 2025)

The complete demand letter workflow is validated and working!

### Test: `src/upload-agent-demand.ts`

**What it does:**
1. Uploads 31-file ClientFile directory (13.7MB) to sandbox
2. Copies demand-letter skill (with subdirectories) to sandbox
3. Runs Claude Sonnet 4.5 with the skill
4. Agent generates professional demand letter + valuation memo
5. Downloads generated files before sandbox cleanup

### Results
- **Duration:** 10.3 minutes
- **Model:** claude-sonnet-4-5
- **Max Turns:** 50 (skill uses multiple subagents)
- **Budget:** $5.00 (sufficient)
- **Exit Code:** 0 (success)

### Generated Files
- `ClientFile/Demand_Letter.md` - 196 lines, professional demand letter
- `ClientFile/Demand_Memo.md` - 455 lines, valuation analysis + negotiation strategy

### Key Observations

1. **Skill invocation worked** - Agent correctly invoked the demand-letter skill
2. **Parallel subagents** - Agent launched 4 subagents for research (fact extraction, format analysis, medical bills, valuation)
3. **Quality output** - Demand letter included all required sections, correct calculations, compelling narrative
4. **settingSources critical** - Without `settingSources: ['project']`, agent won't discover skills

### Optimal Config for Demand Letters

```typescript
const CONFIG = {
  SANDBOX_TIMEOUT: ms('30m'),
  SANDBOX_VCPUS: 4,
  RUNTIME: 'node22',
  AGENT_MAX_TURNS: 50,     // High - skills spawn subagents
  AGENT_MAX_BUDGET_USD: 5.00,
  MODEL: 'claude-sonnet-4-5',
};
```

### Test Scripts

| Script | Purpose |
|--------|---------|
| `src/upload-agent.ts` | Image upload + agent analysis |
| `src/upload-agent-demand.ts` | Demand letter with PDF output (preserved as backup) |
| **`src/upload-agent-demand-word.ts`** | **Demand letter with Word output (RECOMMENDED)** |

---

## Word Document Generation: Template Approach (Dec 12, 2025)

After extensive PDF troubleshooting, we switched to Word document generation with a template-based approach.

### Why Not PDF?

PDF generation had cascading issues:
1. Footer positioning overran page boundaries
2. Raw markdown visible (asterisks showing instead of bold)
3. Content truncation (Claude interpreted page limits too literally)
4. Visual QA didn't catch formatting issues
5. Required 3 npm packages: `jszip`, `jimp`, `pdf-lib`

### The Template Solution

Use a pre-made Word template with a `{{BODY}}` placeholder:

```
HS_Firm_Letter_Template.docx
├── Firm letterhead (already styled)
├── {{BODY}} placeholder  ← content goes here
├── Signature block
└── Firm footer
```

**Advantages:**
- Firm controls exact branding (letterhead, footer, fonts)
- Lawyers can edit final document
- Single npm package: `pizzip`
- No header/footer extraction or positioning code

### generate-docx.js Script

Located at `.claude/SKILLS/demand-letter/scripts/generate-docx.js`

```bash
# Usage
node generate-docx.js --template template.docx --content content.md --output output.docx
```

**What it does:**
1. Opens template .docx (which is a ZIP file)
2. Converts markdown to Word XML:
   - `**Bold Header**` → bold + underlined section header
   - Markdown tables → Word tables with borders
   - Regular paragraphs → properly spaced paragraphs
3. Replaces `{{BODY}}` placeholder with generated XML
4. Writes final .docx

### Test Script: `upload-agent-demand-word.ts`

```bash
npm run test:upload-agent-demand-word
```

Key differences from PDF version:
- Installs `pizzip` instead of `jszip + jimp + pdf-lib`
- PROMPT references Word template and `generate-docx.js`
- Downloads `.docx` files instead of `.pdf`

### Skill File Structure

The demand-letter skill includes helper scripts:

```
.claude/SKILLS/demand-letter/
├── SKILL.md                    # Main skill instructions
├── references/
│   ├── ca_pi_valuation.md      # California PI case valuation guide
│   └── demand_letter_structure.md  # Letter structure reference
└── scripts/
    └── generate-docx.js        # Markdown → Word converter
```

All files must be copied to sandbox at `/vercel/sandbox/.claude/skills/demand-letter/`.

---

## PDF Generation Lessons (Preserved for Reference)

If you ever need to revisit PDF generation, here's what we learned:

### Text Rendering Rules
- Strip markdown before PDF generation (`**bold**` → `bold`)
- Use consistent fonts (don't mix Arial and Times)
- Left-align the RE: block (not centered)

### Page Length Gotcha
Claude interpreted "match the sample's 3-page length" too literally:
- **Wrong:** Truncate content to exactly 3 pages
- **Right:** "Write approximately 3 pages. NEVER truncate content. If content runs longer, that's acceptable."

### Visual QA Limitations
Claude's self-review was superficial:
- Asked "does it look corrupted?" → Claude said "no"
- Better: "Describe what you see on each page" → forces actual inspection

---

## What's Next

- [x] ~~File upload flow (user uploads -> sandbox receives)~~ DONE
- [x] ~~Output generation (sandbox creates -> user downloads)~~ DONE
- [x] ~~Word document generation with templates~~ DONE
- [ ] Frontend integration (user session -> sandbox mapping)
- [ ] Session lifecycle management (create, persist, cleanup)
- [ ] Refinement flow (feedback -> updated output)
