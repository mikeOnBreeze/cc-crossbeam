# Direction 4: Hybrid — Golden Ground + Magic Dirt

## Core Concept
Start with Golden Ground's warm California earth tones as the fast, solid foundation. Then layer in Magic Dirt's highest-impact elements: the sky-to-earth gradient, floating card treatment, and the progressive house-building loading screen. Best of both worlds — polished baseline that becomes magical.

## Why It Works
- Golden Ground's palette and typography ship fast with shadcn — minimal custom work
- Magic Dirt's gradient background and floating cards are pure CSS — easy to layer on
- The house-building loading screen is the demo showstopper, regardless of base palette
- Reduces risk: if time runs out, Golden Ground alone is still beautiful

## Color Palette (Golden Ground base + Magic Dirt accents)

| Role | Color | Hex |
|------|-------|-----|
| Primary | Burnt Sienna | `#C2703E` |
| Primary Foreground | Warm Cream | `#FFF8F0` |
| Secondary | Sage Green | `#7A9E7E` |
| Secondary Foreground | Deep Forest | `#1B2E1D` |
| Background | Sky-to-Earth gradient | `#F5F0EB` → `#FAF6F1` → `#F2EBE0` |
| Foreground | Charcoal Earth | `#2C2418` |
| Accent | California Gold | `#E8A838` |
| Accent Foreground | Dark Amber | `#3D2800` |
| Muted | Sandstone | `#E8E0D4` |
| Muted Foreground | Warm Gray | `#8A7D6B` |
| Destructive | Clay Red | `#B8463A` |
| Border | Warm Sand | `#D9CEBD` |
| Card | Parchment | `#FFFDF9` |

**Background treatment (from Magic Dirt):**
```css
background: linear-gradient(180deg,
  #F5F0EB 0%,     /* warm sky - softer than Magic Dirt's blue */
  #FAF6F1 30%,    /* Golden Ground's off-white */
  #FAF6F1 60%,    /* main content zone */
  #F2EBE0 85%,    /* transition to earth */
  #E8DCC8 100%    /* deep soil */
);
```
Warmer than Magic Dirt's blue sky, staying in Golden Ground's earth-tone family.

**Dark mode:** Golden Ground's warm loam approach: `#1A1510` top → `#1E1A14` bottom.

## Typography (Golden Ground)
- **Display:** Fraunces (variable serif, WONK axis = 1, weight 700-900)
- **Body:** Outfit (geometric sans, weight 400-500)

## Visual Texture
**From Golden Ground:**
- Subtle linen/paper noise on background (3-5% opacity)
- Faint topographic contour lines behind hero (SVG, 30% opacity)
- Cards with warm shadow and kraft-paper feel

**From Magic Dirt:**
- Full-page gradient background (warm version above)
- Cards FLOAT with enhanced shadow: `box-shadow: 0 6px 24px rgba(44, 36, 24, 0.08)`
- Faint cloud wisps in upper page (optional, cream-toned instead of white)
- Tiny floating particles during loading (golden leaves, not green — matches palette)
- `border-radius: 0.75rem` (Golden Ground's, not Magic Dirt's 1rem)

## Motion (Golden Ground base + Magic Dirt flourishes)
- Golden Ground's settling easing for most interactions
- Magic Dirt's parallax layers for ADU miniatures
- Magic Dirt's breathing animation for idle states
- Content floats up with Golden Ground's 80ms stagger timing

## ADU Asset Integration
**Golden Ground's grounded placement + Magic Dirt's immersive treatment:**
- **Landing hero:** ADU miniature on topographic background, but with Magic Dirt's generous sizing (50% viewport) and the sky-to-earth gradient framing
- **Flow selection:** Two miniatures in cards (Golden Ground style) but with Magic Dirt's gentle drift-apart entrance animation
- **Agent working:** Magic Dirt's house-building-itself sequence, themed in Golden Ground's warm palette

## Agent Working Screen — "Building the House" (from Magic Dirt)
Same concept as Magic Dirt Direction 3, but with Golden Ground's warm palette:

1. **Foundation** (extraction): Terracotta-tinted foundation outlines
2. **Framing** (analysis): Warm wireframe walls in `#C2703E`
3. **Sheathing** (research): Natural wood and earth materials
4. **Finishing** (categorization): Landscaping with sage green and gold accents
5. **Complete**: California Gold confetti + golden light turning on

Below: Scrolling activity feed (Golden Ground's timestamped style) + garden-path progress trail (Magic Dirt style, terracotta colored)

"Usually takes 12-18 minutes. Grab a coffee — we'll let you know when it's done."

## shadcn Theming (Golden Ground)
```
--radius: 0.75rem
```
- All Golden Ground component theming
- Enhanced shadows (from Magic Dirt) on cards
- Pill-shaped primary CTA button (from Magic Dirt) for landing page only

## Build Priority
1. Golden Ground palette + typography + shadcn theme (Day 1)
2. Gradient background (15 min CSS)
3. Floating card shadows (5 min CSS)
4. Landing page with ADU hero (Day 1)
5. Core flow screens (Day 1-2)
6. House-building loading screen (Day 2 — the payoff)
7. Particles + clouds + topographic lines (polish, if time)

## Mood
Warm. Grounded. Magical. Californian. Surprising.

## Analogy
Dwell Magazine meets a Studio Ghibli construction site — editorial warmth with a touch of impossible magic.
