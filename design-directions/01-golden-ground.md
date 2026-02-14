# Direction 1: Golden Ground

## Core Concept
California earth, sun, and soil as the foundational metaphor. The interface feels like a warm Saturday morning in Southern California — golden light streaming through a construction site, the smell of fresh lumber, the optimism of building something real. The soil cross-sections of the ADU miniatures become the literal design language.

## Why It Works
- Contractors see warmth and familiarity — not scary government software
- City officials see professional credibility and groundedness
- The ADU miniatures look like they grew out of the interface (shared earth tones)
- Fastest to implement with shadcn/ui — warm palette + texture overlay = done

## Color Palette

| Role | Color | Hex |
|------|-------|-----|
| Primary | Burnt Sienna | `#C2703E` |
| Primary Foreground | Warm Cream | `#FFF8F0` |
| Secondary | Sage Green | `#7A9E7E` |
| Secondary Foreground | Deep Forest | `#1B2E1D` |
| Background | Warm Off-White | `#FAF6F1` |
| Foreground | Charcoal Earth | `#2C2418` |
| Accent | California Gold | `#E8A838` |
| Accent Foreground | Dark Amber | `#3D2800` |
| Muted | Sandstone | `#E8E0D4` |
| Muted Foreground | Warm Gray | `#8A7D6B` |
| Destructive | Clay Red | `#B8463A` |
| Border | Warm Sand | `#D9CEBD` |
| Card | Parchment | `#FFFDF9` |

**Dark mode:** Warm soil tones. Background `#1A1510` (deep loam), cards `#252017`, borders `#3D3529`. Rich dark earth — NOT cold-blue tech darkness.

## Typography
- **Display:** Fraunces (Google Fonts, variable serif, WONK axis = 1 for display sizes, weight 700-900)
- **Body:** Outfit (Google Fonts, geometric sans, weight 400-500 body, 600 emphasis)

## Visual Texture & Background
- Warm off-white base with subtle linen/paper noise texture (3-5% opacity CSS/SVG overlay)
- Faint topographic contour lines behind hero sections (SVG, `#E8E0D4` at 30% opacity)
- Bottom-of-page soil gradient stripe (40-80px): sandy beige → clay orange → rich brown → deep soil
- Cards: 1px `#D9CEBD` border, `border-radius: 0.75rem`, warm shadow `box-shadow: 0 2px 12px rgba(44, 36, 24, 0.06)`

## Motion Philosophy
- **Easing:** `cubic-bezier(0.34, 1.56, 0.64, 1)` for entrances (slight overshoot, settling)
- Content blocks float up from 20px with 80ms stagger
- ADU miniatures enter last with gentle bounce settle
- Cards lift 2px on hover with shadow deepening
- Spinning ADU video loops get subtle parallax (5-10px mouse tracking)
- Page transitions: 300ms crossfade, new content slides up 10px

## ADU Asset Integration
- **Landing hero:** ADU miniature centered/right-aligned, 40-50% viewport width, on topographic background
- **Flow selection:** Two miniatures side-by-side in cards — backyard ADU (contractor) vs institutional (city)
- **Upload screen:** Smaller ADU at 20% opacity in background
- **Results:** ADU as "completed project" celebration element with Bob the Builder animation

## Agent Working Screen
ADU miniature center-stage on soil platform. Construction scene builds around it:
- Tiny scaffolding CSS-animates during extraction
- Magnifying glass with city name speech bubble during web search
- Pulsing book icon during skill invocations
- Bob the Builder hammers during active phases
- Scrolling timestamped activity feed below
- Phase-based progress bar (terracotta → gold gradient): Extracting → Analyzing → Researching → Categorizing → Preparing
- "Usually takes 12-18 minutes. You can close this tab — we'll notify you."

## shadcn Theming
```
--radius: 0.75rem
```
- Buttons: Rounded, terracotta primary, hover warms lighter
- Cards: Parchment background, sand border, warm shadow
- Inputs: Sand borders, warm cream background, terracotta focus ring
- Badges: Sage green (resolved), gold (in progress), clay red (needs attention)

## Mood
Warm. Grounded. Californian. Craft. Optimistic.

## Analogy
Dwell Magazine meets a sunny construction site.
