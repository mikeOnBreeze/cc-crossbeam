# Direction 3: Magic Dirt — REFINED (v2)

## Core Concept
The Magic Dirt direction but with PHOTOREALISTIC sophistication. The UI is clean, modern, and premium — think Apple product page or Stripe meets architectural portfolio. The tilt-shift miniatures are photorealistic architectural models (concrete, glass, natural wood, real soil), NOT cartoon illustrations. The magic comes from the floating placement, the sky-to-earth gradient, and the soft depth — not from whimsy or fantasy elements.

The gap between "boring permit software" and "this looks like a premium architecture firm's website" IS the demo moment.

## Key Refinement from v1
- **LOSE:** Cartoon houses, mushrooms, vines, fairy-tale elements, Ghibli fantasy, swirling leaves, grass blade SVGs
- **KEEP:** Sky-to-earth gradient, floating cards with deep shadows, Playfair Display + Nunito, moss green palette, the gradient being the foundational canvas
- **ADD:** More whitespace, restraint, Apple-like sophistication, topographic contour lines (from Hybrid direction), subtle parallax
- **SHIFT:** From "whimsical fairy tale" to "premium architectural showcase"

## Visual Assets (LOCKED IN)
The user has a library of ~30 keyed assets at `/cc-crossbeam-video/assets/keyed/`:
- **Exteriors:** Photorealistic isometric tilt-shift miniature ADUs on soil platforms — concrete/wood/glass modern architecture, Spanish style, farmhouse cottage, prefab modular, A-frame, garage conversion, etc.
- **Interiors:** Photorealistic isometric cutaway floor plans showing furniture, wood floors, kitchens, bedrooms — Scandinavian-minimal aesthetic
- **All transparent PNGs** — magenta chroma keyed and removed
- **Some will be spinning video loops** for loading screens
- The soil cross-sections are realistic earth/rock/roots — not cartoon dirt

## Color Palette (unchanged from v1)

| Role | Color | Hex |
|------|-------|-----|
| Primary | Moss Green | `#2D6A4F` |
| Primary Foreground | Mint Cream | `#F0FFF4` |
| Secondary | Warm Soil Brown | `#8B6914` |
| Secondary Foreground | Soft Gold | `#FEFCE8` |
| Background | Sky Gradient Top | `#F0F7FF` |
| Background Bottom | Warm Earth | `#FAF3E8` |
| Foreground | Deep Earth | `#1C1917` |
| Accent | Sunset Coral | `#F28B6E` |
| Accent Foreground | Dark Coral | `#4A1B0A` |
| Muted | Haze Blue | `#E0EAFF` |
| Muted Foreground | Slate | `#64748B` |
| Destructive | Autumn Red | `#DC2626` |
| Border | Meadow Edge | `#C6D9C0` |
| Card | Cloud White | `#FEFFFE` |

**Background gradient (subtle, elegant — not dramatic):**
```css
background: linear-gradient(180deg,
  #F0F7FF 0%,
  #FAFCFF 15%,
  #FFFFFF 40%,
  #FFFDF8 70%,
  #FAF3E8 90%,
  #E8DCC8 100%
);
```

**Dark mode:** Twilight. Top: `#0C1222`. Middle: `#151B2E`. Bottom: `#1E1A14`.

## Typography
- **Display:** Playfair Display (high-contrast serif, weight 700-900, letter-spacing -0.02em)
- **Body:** Nunito (rounded geometric sans, weight 400 body, 700 emphasis)

## Visual Texture & Background (REFINED)
- Sky-to-earth gradient as the canvas (subtle, not dramatic)
- Cards float with deep diffuse shadows: `box-shadow: 0 8px 32px rgba(28, 25, 23, 0.08)`
- **Topographic contour lines** (from Hybrid direction) as a subtle background texture — SVG pattern at 15-20% opacity in warm sand color. Adds sophistication without whimsy.
- GENEROUS whitespace — let the miniatures breathe
- `border-radius: 1rem` — soft but not excessive
- NO: cartoon grass, floating leaves, cloud wisps, particle systems, fantasy decorations
- YES: subtle parallax on miniatures, soft ambient shadows, clean geometric UI elements

## Motion Philosophy (REFINED — restraint over spectacle)
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` — smooth, standard
- Content enters with subtle 20px upward fade, 80ms stagger
- Miniatures get slightly more dramatic entrance (30px, settling)
- Cards lift 2-3px on hover with shadow deepening (subtle, not dramatic)
- Spinning ADU video loops for loading states — elegant, not flashy
- NO: breathing animations, particle systems, bouncing, spring physics
- YES: smooth fades, gentle parallax, clean state transitions

## ADU Asset Integration (REFINED)
The miniatures are the STARS. The UI is their stage — clean, uncluttered, premium.
- **Landing hero:** One large photorealistic miniature, centered, floating with soft shadow. Generous whitespace around it. The gradient creates natural depth without decoration.
- **Flow selection:** Two miniatures in clean white cards, side by side. Different ADU styles. Simple, clear, professional.
- **Upload screen:** Small miniature at reduced opacity in background corner. Clean upload form dominates.
- **Agent working:** Miniature center-stage. Clean progress indicator below. Activity log in a floating card.
- **Results:** Small completed miniature at top as celebration. Clean tabbed content below.

## Agent Working Screen (REFINED)
Clean, modern, informative. NOT a fairy-tale construction scene.

**Layout:**
- Photorealistic ADU miniature floating center-stage (or partially-constructed version if available)
- Optional: spinning video loop of the miniature
- Clean text: "Building your response..." in Playfair Display
- Subtext: "Usually takes 12-18 minutes" in Nunito
- Horizontal progress indicator: 5 labeled stages connected by a thin line. Completed = green dot. Current = amber animated dot. Pending = gray dot.
- Floating card below with activity log (timestamped entries, clean monospace times)
- Optional: the miniature crossfades between construction stages at phase transitions

**Key principle:** The progress UI is CLEAN and INFORMATIVE. The miniature provides the visual delight. Don't try to merge them into a cartoon scene.

## shadcn Component Theming
```
--radius: 1rem
```
- Buttons: Pill-shaped primary CTA, moss green. Clean hover with slight shadow. Standard radius for secondary.
- Cards: White, generous padding (24px), deep soft shadow, rounded corners
- Inputs: Rounded, meadow edge border, green focus ring, subtle background
- Badges: Pill-shaped. Moss green (success), soil brown (in-progress), coral (attention), red (error)
- Progress: Clean horizontal dots + line (not a garden path or growing plant)

## Mood (REFINED)
Premium. Clean. Architectural. Floating. Sophisticated.

## Analogy (REFINED)
Apple product page meets Dwell Magazine — clean modern UI with photorealistic architectural miniatures as the visual centerpiece. The magic is in the quality and the floating depth, not in fantasy decoration.
