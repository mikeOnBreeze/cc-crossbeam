# Regulatory Skill Update Prompt

You are updating an existing regulatory skill with new legal changes. Follow the 4-step process below exactly.

## Context

- **Skill location**: `skill/california-adu/`
- **Skill entry point**: `skill/california-adu/SKILL.md` (decision tree + thresholds table)
- **Reference file catalog**: `skill/california-adu/AGENTS.md` (lists all reference files)
- **Reference files**: `skill/california-adu/references/` (28 files as of January 2025)
- **Original source**: HCD ADU Handbook, January 2025 (54 pages)

The user will provide you with one or more of:
- A new addendum PDF or legal update document
- A list of bill numbers and their changes
- A raw text extraction of the update

---

## Step 1: Extract

Extract the update source material into clean, structured markdown.

**If given a PDF**: Read it and produce a raw markdown extraction at `HCD-ADU-Addendum-[YEAR]-raw.md` in the `adu-skill-development/` directory. Preserve all statutory citations, subdivision references, effective dates, and bill numbers exactly as written.

**Output format**:
```markdown
# HCD ADU Handbook Addendum — [Month Year]

## [Bill Name] ([Bill Number])
- **Chapter**: [Chapter X, Statutes of YEAR]
- **Code sections amended**: [list]
- **Effective date**: [date]
- **Changes**:
  - [bullet points of each change with exact code citations]
```

---

## Step 2: Change Manifest

Create a change manifest at `skill-update-manifest-[YEAR].md` that maps every change to the specific reference file(s) and content that needs updating.

**For each change, document**:

| Field | Description |
|-------|-------------|
| **Bill** | The bill number (e.g., SB 543) |
| **Change** | One-sentence summary of what changed |
| **Code section** | The Gov. Code / Civil Code section affected |
| **Reference file(s)** | Which file(s) in `references/` need updating |
| **What to update** | Specific text, thresholds, or rules that change |
| **SKILL.md impact** | Does the Quick-Reference Thresholds table need updating? |
| **AGENTS.md impact** | Do any file descriptions or code section citations change? |

Also flag:
- **New reference files needed**: If a change creates an entirely new topic not covered by existing files
- **Deleted content**: If a change removes a provision that's currently in the skill
- **Threshold changes**: Any numbers in the SKILL.md Quick-Reference table that change (these are high-priority because they affect every query)

---

## Step 3: Apply Updates

For each item in the change manifest, update the affected reference files.

**Rules**:
- Read the existing reference file FIRST before making any changes
- Preserve the existing YAML frontmatter structure — update `key_code_sections` if new sections are added
- Add the new content in the appropriate section of the file
- When a rule changes (e.g., 30 days → 15 business days), update the old text and add a note: `(Changed by [Bill], effective [date])`
- When content is removed by a new law, delete it from the reference file — do not leave stale rules
- Update cross-references (`See also:` links) if new connections exist
- Update `SKILL.md` Quick-Reference Thresholds table if any key numbers changed
- Update `AGENTS.md` if code section citations change
- Update the YAML frontmatter `law_as_of` date in `SKILL.md`
- Add new bills to `legislative-changes.md` (both the bill summaries section and the statutory changes table)

**Order of operations**:
1. Update `legislative-changes.md` first (adds the new bills to the record)
2. Update individual reference files (apply the substantive changes)
3. Update `SKILL.md` thresholds table (if any numbers changed)
4. Update `AGENTS.md` / `CLAUDE.md` (if file descriptions or code sections changed)

---

## Step 4: Verify

After all updates are applied, run these checks:

1. **Threshold check**: Read `SKILL.md` Quick-Reference Thresholds table. Does every value match the current law (including the update)?

2. **Cross-reference check**: Scan all `See also:` links in updated files. Do they all resolve to real files?

3. **Citation check**: For each changed code section, verify the reference file cites the correct subdivision.

4. **Regression tests**: Re-run the Level 1 sanity checks from the test ladder (`test-skill-aduHandbook-0210.md`) to make sure existing answers still work. If any expected answers changed due to the update, note the new expected answer.

5. **New tests**: For each substantive change, create at least one test question:
   - Question that would trigger loading the updated file
   - Expected answer reflecting the NEW rule
   - Verify the decision tree routes to the correct file

6. **Staleness scan**: Search all reference files for any dates, thresholds, or rules that contradict the update. Flag anything that looks outdated.

Report results as:
```
VERIFY: [filename] — [PASS/FAIL] — [notes]
```

---

## Output Summary

When complete, you should have produced:
- `HCD-ADU-Addendum-[YEAR]-raw.md` — Raw extraction of the update
- `skill-update-manifest-[YEAR].md` — Change manifest mapping updates to files
- Updated reference files in `skill/california-adu/references/`
- Updated `SKILL.md`, `AGENTS.md` if needed
- Updated `legislative-changes.md` with new bills
- Verification results showing all checks pass

---

## Notes

- This process works for any regulatory skill update, not just ADU handbooks. The structure (extract → manifest → update → verify) applies to any legal addendum, new ordinance, or statutory change.
- If the update is large enough to require a new reference file, follow the naming convention: `[category]-[topic].md` with standard YAML frontmatter.
- If the update is small (1-2 changes), you can skip the raw extraction step and go straight to the manifest.
- Always preserve the decision tree routing logic in SKILL.md — only modify it if the update creates a new routing category.
