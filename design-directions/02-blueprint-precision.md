# Direction 2: Blueprint Precision

## Core Concept
The interface IS a blueprint — a technical drawing that has come to life. Grid lines, dimension callouts, drafting annotations, and measurement ticks become UI elements. The warm ADU miniatures create powerful visual tension against the cold precision framework.

## Why It Works
- Contractors read plan sets daily — they instantly trust this visual language
- City plan reviewers see "this tool understands what we do"
- The contrast between warm handmade miniatures and cold precision is memorable
- The dark mode blueprint aesthetic is stunning and unique

## Color Palette

| Role | Color | Hex |
|------|-------|-----|
| Primary | Blueprint Blue | `#1E4D8C` |
| Primary Foreground | Blueprint White | `#F0F4FA` |
| Secondary | Graphite | `#4A5568` |
| Secondary Foreground | Light Wash | `#EDF2F7` |
| Background | Graph Paper White | `#F7F9FC` |
| Foreground | Technical Black | `#1A202C` |
| Accent | Safety Orange | `#E86A33` |
| Accent Foreground | Dark Orange | `#3D1A0A` |
| Muted | Light Blueprint Wash | `#E2E8F0` |
| Muted Foreground | Medium Graphite | `#718096` |
| Destructive | Red Markup | `#C53030` |
| Border | Grid Line | `#CBD5E0` |
| Card | Vellum White | `#FFFFFF` |

**Dark mode (RECOMMENDED DEFAULT):** Deep navy `#0A1628`. Grid lines `#1E3A5F` at 40% opacity. Primary shifts to `#4A90D9`. Cards `#0F2035` with `#1E3A5F` border. Accent orange stays vivid. This IS the blueprint.

## Typography
- **Display:** DM Mono (Google Fonts, monospaced, weight 500 — drafting lettering)
- **Body:** IBM Plex Sans (Google Fonts, weight 400 body, 600 emphasis — technical, precise)
- **Alt body:** Barlow (Google Fonts, condensed geometric, California highway signage heritage)

## Visual Texture & Background
- Engineering grid overlay on EVERY screen:
  ```css
  background-image:
    linear-gradient(rgba(203, 213, 224, 0.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(203, 213, 224, 0.3) 1px, transparent 1px);
  background-size: 24px 24px;
  ```
  Dark mode: `rgba(30, 58, 95, 0.4)` grid lines
- Dimension lines with ticks as section dividers (SVG/pseudo-elements)
- Callout bubbles with leader lines for key data (like architectural annotations)
- Title block in bottom-right corner (project name, version, date — plan-set flourish)
- Cards: crisp 1px borders, `border-radius: 0.25rem`, zero shadow

## Motion Philosophy
- **Easing:** `cubic-bezier(0.22, 1, 0.36, 1)` — fast start, mechanical deceleration (pen plotter)
- SVG line-drawing animations (`stroke-dasharray`/`stroke-dashoffset`) for borders and dividers
- Monospaced headings type themselves character-by-character (40ms/char, blinking cursor)
- Numbers count up from 0 to final value when entering viewport (600ms)
- NO bounce, NO spring — everything is linear or ease-out. Precision is the aesthetic.

## ADU Asset Integration
- **Landing hero:** Miniature on a "drafting table" surface. Blueprint grid bends beneath it. Leader lines extend to annotated callouts: "800 SF DETACHED ADU", "4' SETBACK", "16' HEIGHT LIMIT"
- **Flow selection:** Split-screen with vertical dimension line between them. Technical annotations on each miniature.
- **Results:** Corrections render with blueprint aesthetics — callout numbers, cross-reference annotations, red-line markup style

## Agent Working Screen — "The Drafting Table"
Large vellum canvas with engineering grid. Content PLOTS itself in real-time:
1. **Extraction:** PDF page thumbnails slot into a grid (pen-plotter line-draw animation). Green checkmarks on completion.
2. **Analysis:** Leader lines extend from thumbnails to correction items. Items type out in DM Mono with sequential callout numbers.
3. **Research:** "Web search" zone in upper-right. Queries type out; results stack like reference documents.
4. **Categorization:** Items reorganize with smooth position transitions into color-coded groups. Dimension lines show counts.
5. **Output:** New "sheet" slides out from under canvas. Response letter types itself.

Horizontal architectural scale ruler along bottom marks time. ADU miniature sits in upper-left corner, gently rotating.

Technical readout sidebar: monospaced stats (pages processed, corrections found, web searches, code sections referenced).

## shadcn Theming
```
--radius: 0.25rem
```
- Buttons: Sharp corners, 1px borders. Blueprint blue primary. Ghost = border only. Hover = 1px underline.
- Cards: White or dark navy, 1px border, no shadow. Individual sheets of paper.
- Inputs: 1px bottom-border only, monospaced placeholder, blue focus indicator
- Badges: Small, tight, uppercase monospaced. Orange warnings, blue info, green success, red errors.
- Tables: Visible grid lines, heavy header border, monospaced numbers.

## Mood
Precise. Technical. Authoritative. Composed. Measured.

## Analogy
An architectural plan set meets Bloomberg Terminal.
