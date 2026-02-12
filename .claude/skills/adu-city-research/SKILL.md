---
name: adu-city-research
description: Researches city-level ADU regulations, municipal codes, and standard details for any California city. This skill supports three research modes — Discovery (WebSearch to find key URLs), Targeted Extraction (WebFetch to pull content from discovered URLs), and Browser Fallback (Chrome MCP for cities with difficult websites). When used standalone, run all three modes sequentially. When invoked by an orchestrator (e.g., adu-corrections-flow), run in the specified mode only. Triggers on city-specific ADU questions, corrections letter items referencing municipal code, or when the California ADU state-level skill indicates a question requires local jurisdiction rules.
---

# ADU City Research

## Overview

Research city-level ADU regulations for any California city. California has 480+ cities, each with different websites, different municipal code platforms, and different formats. State ADU law (covered by the `california-adu` skill) addresses certain development standards, while cities have their own additional requirements — local building code amendments, grading ordinances, utility standards, and submittal expectations. This skill finds what a specific city requires at the local level.

**Key principle**: Every California city is required by law to publish their ADU regulations on their website. The information exists — this skill is the method for finding it.

**Required tools**: WebSearch and WebFetch at minimum. Chrome MCP (browser automation) only needed for Mode 3 (Browser Fallback).

## Research Modes

This skill operates in three modes. When used standalone, run all three sequentially. When invoked by an orchestrator, run only the specified mode.

| Mode | Tool | Speed | Purpose |
|------|------|-------|---------|
| **Discovery** | WebSearch | ~30 sec | Find key URLs for the city |
| **Targeted Extraction** | WebFetch | ~60-90 sec | Pull specific content from discovered URLs |
| **Browser Fallback** | Chrome MCP | ~2-3 min | Navigate difficult city websites that resist WebFetch |

### When to Use Each Mode

- **Standalone** (no orchestrator): Run Discovery → Extraction → Fallback (if needed). Single agent, sequential.
- **Orchestrated** (called by `adu-corrections-flow`): The orchestrator specifies which mode to run. Discovery runs in parallel with other research. Extraction runs after Discovery completes. Fallback runs only if Extraction has gaps.
- **Fan-out ready**: The Extraction mode takes a list of URLs + topics. An orchestrator can split this list across multiple agents for parallel extraction without changing the mode's logic.

---

## Mode 1: Discovery

**Tool:** WebSearch only
**Input:** City name + list of correction topics (optional — omit for comprehensive discovery)
**Output:** `city_discovery.json` — key URLs organized by category
**Time:** ~30 seconds

### Process

Run 3-5 targeted web searches to find the city's key ADU-related pages. Do NOT fetch or read the pages — just find the URLs.

**Search queries to run (in order of priority):**

1. `"City of [Name]" ADU accessory dwelling unit` — finds the city's ADU page
2. `"City of [Name]" municipal code` — finds the code platform (ecode360, Municode, QCode, etc.)
3. `"City of [Name]" standard detail construction` OR `"City of [Name]" standard plans engineering` — finds standard detail PDFs
4. `"City of [Name]" information bulletin building` — finds IBs
5. `"City of [Name]" building permit submittal requirements` — finds checklists

**If correction topics are provided, add targeted searches:**

| Correction Topic | Additional Search |
|-----------------|-------------------|
| Sewer / utility connections | `"City of [Name]" standard detail sewer connection ADU` |
| Grading / drainage | `"City of [Name]" grading ordinance drainage requirements` |
| Wind loads / structural | `"City of [Name]" information bulletin wind design parameters` |
| Fire separation | `"City of [Name]" fire separation property line setback` |

**Platform detection:** Identify the municipal code platform from search results. See `references/municipal-code-platforms.md` for the major platforms (ecode360, Municode, QCode, American Legal, Sterling Codifiers, city-hosted).

**Building vs. Planning split:** Larger cities often split ADU information across two departments. Flag both URLs if found.

### Discovery Output Format

```json
{
  "city": "City name",
  "discovery_timestamp": "ISO date",
  "urls": {
    "adu_page": "https://...",
    "adu_page_building": "https://... (if separate from planning)",
    "municipal_code": {
      "platform": "ecode360 | municode | qcode | amlegal | sterling | city-hosted",
      "base_url": "https://...",
      "building_code_title_url": "https://... (if found in search results)",
      "zoning_title_url": "https://... (if found in search results)"
    },
    "standard_details": [
      {"name": "Inferred name from search result", "url": "https://..."}
    ],
    "information_bulletins": [
      {"name": "Inferred name from search result", "url": "https://..."}
    ],
    "submittal_requirements": "https://...",
    "pre_approved_plans": "https://..."
  },
  "not_found": ["category names where no URLs were found"],
  "notes": "Any observations from search results (e.g., 'city appears to use Municode but ADU page links to a separate handout site')"
}
```

**Important:** Discovery only finds URLs — it does NOT read page content. Speed comes from not fetching anything. The Extraction mode does the reading.

---

## Mode 2: Targeted Extraction

**Tool:** WebFetch primarily
**Input:** Discovery results (`city_discovery.json` or equivalent URL list) + specific topics to extract
**Output:** `city_research_findings.json` — extracted content organized by category
**Time:** ~60-90 seconds (depends on number of URLs)

### Process

For each URL from Discovery, fetch the page content and extract information relevant to the correction topics. Prioritize by impact.

**Extraction priority (highest first):**

1. **Standard detail PDFs** — If the corrections reference city standard details, fetching these PDFs is the single most valuable action. They show exactly what the city wants drawn.
2. **Municipal code sections** — Fetch the specific title/chapter relevant to corrections (building code amendments, ADU ordinance, grading chapter). Do NOT fetch the entire municipal code.
3. **Information Bulletins** — Fetch IBs relevant to correction topics (wind parameters, submittal guides).
4. **ADU page content** — Fetch the city's ADU page for any additional requirements or handouts.
5. **Submittal requirements** — Fetch if corrections reference missing sheets, notes, or plan check items.

**What to extract from each page:**

| Source | Extract |
|--------|---------|
| Municipal code — building title | Local amendments to CBC/CRC/CPC/CEC/CMC. Chapter structure. Code edition (2022 vs 2025). |
| Municipal code — ADU ordinance | Setbacks, height, size, design standards beyond state law. |
| Municipal code — grading chapter | Drainage slope requirements, grading permit thresholds, excavation rules. |
| Standard details | PDF title, detail number, what it shows, whether it matches corrections reference. |
| Information Bulletins | IB number, title, key requirements, applicable code sections. |
| ADU page | Any requirements not in the municipal code (fees, process, special conditions). |

**WebFetch tips:**
- Most municipal code platforms (ecode360, Municode, QCode) serve clean HTML that WebFetch handles well.
- Standard detail PDFs may not be readable via WebFetch — note the URL and title for the professional to download.
- If WebFetch returns empty or error for a URL, add it to `extraction_gaps` for Browser Fallback.

### Extraction Output Format

```json
{
  "city": "City name",
  "extraction_timestamp": "ISO date",
  "municipal_code": {
    "platform": "ecode360 | municode | qcode | etc.",
    "url": "https://...",
    "code_edition": "2022 | 2025 California Building Standards Code",
    "current_through": "Ordinance # or date if available",
    "building_code_title": "Title XX",
    "relevant_chapters": [
      {
        "chapter": "XX.XX",
        "title": "Chapter title",
        "url": "direct URL",
        "key_content": "Summary of relevant provisions"
      }
    ],
    "local_amendments": [
      {
        "section": "XX.XX.XXX",
        "amends": "CBC/CRC/CPC section reference",
        "description": "What it changes from state code",
        "applies_to_items": ["correction item numbers"]
      }
    ]
  },
  "standard_details": [
    {
      "name": "Detail name",
      "url": "PDF URL",
      "description": "What the detail shows",
      "applies_to_items": ["correction item numbers"]
    }
  ],
  "information_bulletins": [
    {
      "number": "IB-XXX",
      "title": "Title",
      "url": "URL",
      "key_requirements": "Summary of requirements",
      "applies_to_items": ["correction item numbers"]
    }
  ],
  "specific_findings": [
    {
      "topic": "What was researched",
      "finding": "What was found",
      "source": "URL or code section",
      "applies_to_items": ["correction item numbers"]
    }
  ],
  "extraction_gaps": [
    {
      "category": "What we tried to find",
      "url_attempted": "URL that failed or returned empty",
      "reason": "Why extraction failed (timeout, empty response, PDF not readable, etc.)",
      "fallback_suggestion": "What to try in Browser Fallback mode"
    }
  ]
}
```

**Fan-out design:** The extraction input is a list of URLs + topics. To parallelize, split this list:
- Agent 1: Municipal code URLs + code-related topics
- Agent 2: Standard detail and IB URLs
- Agent 3: ADU page + submittal requirements

Each agent produces a partial `city_research_findings.json`. The orchestrator merges them.

---

## Mode 3: Browser Fallback

**Tool:** Chrome MCP (browser automation)
**Input:** City name + `extraction_gaps` from Mode 2
**Output:** Gap-filling additions to `city_research_findings.json`
**Time:** ~2-3 minutes
**When to use:** Only when Mode 2 has extraction gaps that matter for the corrections

### Process

For each gap in `extraction_gaps`:

1. Navigate to the city's website (start from the ADU page or main site)
2. Use browser automation to click through to the needed page
3. Read the content visually or via page text extraction
4. Extract the missing information

**Common reasons for gaps and browser strategies:**

| Gap Reason | Browser Strategy |
|-----------|-----------------|
| PDF not readable via WebFetch | Navigate to the document center, find the PDF listing, read the page description if the PDF itself can't be parsed |
| Municipal code behind JavaScript framework | Navigate to the code platform, use the TOC to drill into the right title/chapter |
| City site requires clicking through menus | Start at the department page, click through Building → Resources → Information Bulletins |
| Standard details on a map/GIS-based system | Navigate to the engineering page, find the standard plans section |

**Do NOT use Browser Fallback for:**
- URLs that WebFetch handled successfully
- Topics where no gap exists
- General browsing "just to be thorough" — this mode is for filling specific gaps

### Browser Fallback Output

Return the same structure as Mode 2's `specific_findings` array, to be merged into the existing research findings.

```json
{
  "browser_findings": [
    {
      "topic": "What was searched",
      "finding": "What was found",
      "source": "URL visited",
      "applies_to_items": ["correction item numbers"],
      "filled_gap": "Which extraction_gap this addresses"
    }
  ],
  "remaining_gaps": [
    {
      "category": "What we still couldn't find",
      "attempted": "What browser actions were tried",
      "recommendation": "What the contractor should do (e.g., call the building department)"
    }
  ]
}
```

---

## What to Search For

Seven categories of city-level information relevant to ADU projects:

| Category | What It Is | Why It Matters |
|----------|-----------|----------------|
| **ADU Ordinance** | City's local ADU rules (setbacks, height, size, design, parking) | May add requirements beyond state law |
| **Municipal Code** | City's adoption of state building codes + local amendments | Local amendments add city-specific requirements |
| **Standard Details** | City-published construction detail drawings (PDFs) | The city's approved way of building sewer connections, utilities, etc. |
| **Information Bulletins (IBs)** | City-published guidance documents on specific topics (numbered, e.g., IB-021) | Many cities use IBs as their primary contractor guidance — wind parameters, submittal guides, specific construction requirements. Some cities have 80+ of these. |
| **Pre-Approved ADU Plans** | Pre-designed ADU plans the city has already approved (per AB 1332) | Same-day permits possible. Huge shortcut for contractors if the design fits. |
| **Grading / Drainage** | Local grading ordinance, drainage slope requirements | City-specific drainage rules for site plan |
| **Submittal Requirements** | Plan check checklists, required sheets, required notes | What the city expects to see on the plans |

## Targeted Lookup Patterns

When researching items from a corrections letter, use targeted searches:

| Correction Topic | Search Strategy |
|-----------------|----------------|
| Municipal code on cover sheet | Find which code platform the city uses, identify the title/chapter structure |
| Utility connections | Search for city standard details (sewer, water, electrical) |
| Grading / drainage slopes | Search city grading ordinance chapter |
| Fire separation / property line | Look up CRC R302.1 (state code), then check if city has stricter local amendment |
| Structural / wind loads | Usually state/national code (ASCE 7-16), but **check for city IB on wind design parameters** — many cities publish local wind speeds and exposure categories |
| "For Reference Only" on grading | Standard practice — verify city grading permit thresholds in their grading chapter |
| Code edition | Check which edition the city is on — the 2025 Edition of California Building Standards Code took effect Jan 1, 2026. Corrections letters reference specific editions. |

## Important Notes

- **This tool helps contractors comply, not litigate.** If the city says to fix something, the contractor needs to know how to fix it. Focus on finding what the city requires and how to satisfy it.
- **City websites change.** URLs break. If a direct link fails, fall back to searching the city's main website.
- **Check the date.** Verify the municipal code version is current — look for "current through" or "last updated" on the code platform. Some cities lag behind on updating their ADU ordinances after state law changes.
- **Standard details are gold.** When a corrections letter says "See [City] Standard Detail" — finding that PDF on the city website is the single most useful thing to return. It tells the contractor exactly what the city wants to see drawn.
- **Building vs. Planning split.** Larger cities often split ADU information across two departments. The **Planning** department handles zoning and development standards. The **Building** department handles construction, permits, plan check, and inspections. Check both.

## References

See `references/municipal-code-platforms.md` for a quick-reference of the major municipal code hosting platforms and search patterns.
