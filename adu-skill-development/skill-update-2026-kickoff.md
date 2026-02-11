# Skill Update 2026 — Kickoff (Steps 3-4)

You are applying the January 2026 HCD ADU Handbook Addendum to an existing California ADU regulatory skill.

## What's Already Done

**Step 1 (Extract)** and **Step 2 (Change Manifest)** are complete. Read these files first:

- **Process doc**: `adu-skill-development/skill-update-prompt.md` — rules for how to apply updates (read Step 3 and Step 4 carefully)
- **Change manifest**: `adu-skill-development/skill-update-manifest-2026.md` — 17 changes across 5 bills, mapped to specific reference files
- **Raw extraction**: `adu-skill-development/HCD-ADU-Addendum-2026-raw.md` — source of truth for exact statutory language

## What You Need to Do

Execute **Step 3 (Apply Updates)** and **Step 4 (Verify)** from the skill-update-prompt.

### The Skill

Location: `adu-skill-development/skill/california-adu/`

- Entry point: `SKILL.md` (decision tree + thresholds table)
- File catalog: `AGENTS.md`
- Reference files: `references/` (28 files)

### Step 3 Order of Operations

Follow this order exactly:

1. **`legislative-changes.md`** — Add all 5 new bills (AB 1154, SB 9 2025, SB 543, AB 462, AB 130)
2. **Individual reference files** — Apply the 17 changes from the manifest. The manifest lists exactly which files and what to update. Read each file before editing it.
3. **`SKILL.md`** — Update the Quick-Reference Thresholds table (completeness check 30 days → 15 business days, measurement clarifications for "interior livable space") and update `law_as_of` in YAML frontmatter to "January 1, 2026"
4. **`AGENTS.md`** / **`CLAUDE.md`** — Update `permit-fees.md` key code sections to add § 66311.5. Update source line to reflect January 2026 addendum.

### Key Rules (from the process doc)

- Read the existing reference file FIRST before making any changes
- Preserve YAML frontmatter structure — update `key_code_sections` if new sections are added
- When a rule changes, update the old text and add a note: `(Changed by [Bill], effective [date])`
- When content is removed by a new law, delete it — do not leave stale rules
- Update cross-references (`See also:` links) if new connections exist

### Files Requiring Updates (from manifest)

| Reference File | # of Changes | Bills |
|---------------|-------------|-------|
| `unit-types-jadu.md` | 5 | AB 1154, SB 543 |
| `ownership-use.md` | 2 | AB 1154 |
| `compliance-ordinances.md` | 4 | SB 9, SB 543, AB 130 |
| `permit-fees.md` | 2 | SB 543 |
| `permit-process.md` | 4 | SB 543, AB 462 |
| `standards-size.md` | 1 | SB 543 |
| `unit-types-66323.md` | 1 | SB 543 |
| `standards-fire.md` | 1 | SB 543 |
| `zoning-hazards.md` | 1 | AB 462 |
| `ownership-hoa.md` | 1 | AB 130 |
| `unit-types-multifamily.md` | 1 | AB 130 |
| `glossary.md` | 1 | SB 543 |

Plus root files: `legislative-changes.md`, `SKILL.md`, `AGENTS.md`

### Step 4 Verification

After all updates, run the verification checks from the process doc:

1. Threshold check — every value in SKILL.md matches current law
2. Cross-reference check — all `See also:` links resolve
3. Citation check — code sections are correct
4. Staleness scan — no contradictions remain in any reference file
5. New tests — for each substantive change, create at least one test question with the expected answer reflecting the NEW rule

Report each result as:
```
VERIFY: [filename] — [PASS/FAIL] — [notes]
```
