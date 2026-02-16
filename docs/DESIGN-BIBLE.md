# CrossBeam Design Bible

> **Direction: Magic Dirt v2 (Refined)**
> Premium, photorealistic, architectural. Apple product page meets Dwell Magazine.
> The magic comes from floating depth and the sky-to-earth gradient — not from whimsy or fantasy.

**This is the single source of truth for all frontend work.** Any Claude instance building UI for CrossBeam must follow this document exactly.

---

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 15.x |
| UI Library | shadcn/ui | Latest (new-york style) |
| Styling | Tailwind CSS | v4 |
| Deployment | Vercel | — |
| Icons | Lucide React | — |
| Theme | next-themes | — |
| Animations | CSS + tailwindcss-animate | — |
| Fonts | next/font (Google Fonts) | — |

---

## Typography

| Role | Font | Google Fonts | Weight | Usage |
|------|------|-------------|--------|-------|
| **Display** | Playfair Display | `Playfair_Display` | 700, 900 | Hero headings, section titles, page headers |
| **Body** | Nunito | `Nunito` | 400, 600, 700 | Body text, labels, buttons, UI elements |

### next/font Setup

```tsx
// app/layout.tsx
import { Playfair_Display, Nunito } from "next/font/google"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["700", "900"],
  display: "swap",
})

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "600", "700"],
  display: "swap",
})

// In <html>:
<html className={`${playfair.variable} ${nunito.variable}`}>
```

### CSS Variables

```css
:root {
  --font-display: var(--font-display), Georgia, "Times New Roman", serif;
  --font-body: var(--font-body), "Segoe UI", Tahoma, sans-serif;
}

body {
  font-family: var(--font-body);
}
```

### Tailwind Config

```ts
// tailwind.config.ts extend:
fontFamily: {
  display: ["var(--font-display)", "Georgia", "serif"],
  body: ["var(--font-body)", "Segoe UI", "sans-serif"],
},
```

### Display Font Rules

- Playfair Display: **only** for headings 24px+ (text-2xl and above)
- Letter-spacing: `-0.02em` on display headings
- Weight 700 for section headings, 900 for hero headlines
- Never use Playfair for body text, labels, or UI elements

### Body Font Rules

- Nunito: all body text, labels, buttons, navigation, form elements
- Weight 400 for body, 600 for emphasis/labels, 700 for button text
- Base size: 16px (text-base)

---

## Color Palette — Light Mode

All values are HSL channels (no `hsl()` wrapper) for shadcn CSS variable format.

```css
:root {
  /* Core */
  --background: 212 100% 97%;        /* #F0F7FF - sky blue top (gradient overrides this) */
  --foreground: 24 10% 10%;          /* #1C1917 - deep earth */

  /* Cards & Popovers */
  --card: 150 50% 100%;              /* #FEFFFE - cloud white */
  --card-foreground: 24 10% 10%;     /* #1C1917 */
  --popover: 0 0% 100%;             /* white */
  --popover-foreground: 24 10% 10%;  /* #1C1917 */

  /* Primary: Moss Green */
  --primary: 153 40% 30%;            /* #2D6A4F */
  --primary-foreground: 136 100% 97%; /* #F0FFF4 */

  /* Secondary: Warm Soil Brown */
  --secondary: 43 75% 31%;           /* #8B6914 */
  --secondary-foreground: 55 92% 95%; /* #FEFCE8 */

  /* Accent: Sunset Coral */
  --accent: 13 84% 69%;              /* #F28B6E */
  --accent-foreground: 16 76% 16%;   /* #4A1B0A */

  /* Muted: Haze Blue */
  --muted: 221 100% 94%;             /* #E0EAFF */
  --muted-foreground: 215 16% 47%;   /* #64748B */

  /* Destructive: Autumn Red */
  --destructive: 0 72% 51%;          /* #DC2626 */
  --destructive-foreground: 0 0% 100%; /* white */

  /* Borders & Inputs */
  --border: 106 24% 80%;             /* #C6D9C0 - meadow edge */
  --input: 106 24% 80%;              /* #C6D9C0 */
  --ring: 153 40% 30%;               /* #2D6A4F - matches primary */

  /* Radius */
  --radius: 1rem;
}
```

## Color Palette — Dark Mode (Twilight)

```css
.dark {
  --background: 224 48% 9%;          /* #0C1222 - night sky */
  --foreground: 212 100% 97%;        /* #F0F7FF */

  --card: 226 37% 13%;               /* #151B2E - dark indigo */
  --card-foreground: 212 100% 97%;   /* #F0F7FF */
  --popover: 226 37% 13%;
  --popover-foreground: 212 100% 97%;

  --primary: 153 35% 45%;            /* lighter moss for dark bg */
  --primary-foreground: 136 100% 97%;

  --secondary: 43 60% 45%;           /* lighter soil brown */
  --secondary-foreground: 55 92% 95%;

  --accent: 13 84% 69%;              /* coral stays vivid */
  --accent-foreground: 55 92% 95%;

  --muted: 226 30% 18%;
  --muted-foreground: 215 16% 65%;

  --destructive: 0 72% 45%;
  --destructive-foreground: 0 0% 100%;

  --border: 226 30% 22%;
  --input: 226 30% 22%;
  --ring: 153 35% 45%;
}
```

## Custom Status Colors

Beyond the standard shadcn palette, add these for agent progress and correction statuses:

```css
:root {
  --success: 153 40% 30%;            /* same as primary - moss green */
  --success-foreground: 136 100% 97%;
  --warning: 38 92% 50%;             /* amber */
  --warning-foreground: 38 100% 10%;
  --info: 212 80% 55%;               /* sky blue */
  --info-foreground: 0 0% 100%;
}

.dark {
  --success: 153 35% 45%;
  --success-foreground: 136 100% 97%;
  --warning: 38 85% 55%;
  --warning-foreground: 38 100% 10%;
  --info: 212 70% 60%;
  --info-foreground: 0 0% 100%;
}
```

### Tailwind v4 @theme inline Block (CRITICAL)

This MUST exist in `globals.css` after the `:root` and `.dark` blocks. Without it, `bg-primary` etc. won't work in Tailwind v4:

```css
@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --color-success: hsl(var(--success));
  --color-success-foreground: hsl(var(--success-foreground));
  --color-warning: hsl(var(--warning));
  --color-warning-foreground: hsl(var(--warning-foreground));
  --color-info: hsl(var(--info));
  --color-info-foreground: hsl(var(--info-foreground));
}
```

---

## Background Treatment

The page background is NOT flat. It's a sky-to-earth gradient that mirrors the ADU miniatures' composition.

### Light Mode Gradient

```css
.bg-crossbeam-gradient {
  background: linear-gradient(180deg,
    #F0F7FF 0%,      /* sky blue */
    #FAFCFF 15%,
    #FFFFFF 40%,      /* white middle */
    #FFFDF8 70%,
    #FAF3E8 90%,      /* warm earth */
    #E8DCC8 100%      /* deep soil */
  );
  min-height: 100vh;
}
```

### Dark Mode Gradient (Twilight)

```css
.dark .bg-crossbeam-gradient {
  background: linear-gradient(180deg,
    #0C1222 0%,       /* night sky */
    #111827 20%,
    #151B2E 50%,      /* dark indigo */
    #1A1714 80%,
    #1E1A14 100%      /* dark warm earth */
  );
}
```

### Topographic Contour Lines (Optional Enhancement)

Subtle SVG background pattern in warm sand color at 15-20% opacity. Use as a `background-image` layer on hero sections:

```css
.bg-topo-lines {
  background-image: url("data:image/svg+xml,..."); /* SVG topo pattern */
  background-size: 400px 400px;
  opacity: 0.15;
}
```

---

## Component Theming

### Border Radius

```
--radius: 1rem
```

This gives us:
- `rounded-lg` = 1rem (cards, large containers)
- `rounded-md` = calc(1rem - 2px) (buttons, inputs)
- `rounded-sm` = calc(1rem - 4px) (badges, small elements)

### Cards

```tsx
// Standard floating card
<Card className="shadow-[0_8px_32px_rgba(28,25,23,0.08)] border-border/50">
```

- Background: `bg-card` (cloud white / dark indigo)
- Border: `border-border/50` (subtle meadow edge)
- Shadow: deep, diffuse — `0 8px 32px rgba(28, 25, 23, 0.08)`
- Padding: generous — `p-6` minimum
- Hover: lift 2-3px, deepen shadow

### Buttons

**Primary CTA (landing page, main actions):**
```tsx
<Button className="rounded-full px-8 py-3 text-base font-bold font-body">
  Start Analysis
</Button>
```
- Pill-shaped: `rounded-full`
- Moss green background
- White text (Nunito Bold)
- Hover: slight shadow glow `hover:shadow-[0_0_20px_rgba(45,106,79,0.15)]`

**Standard buttons:** Use default shadcn radius (`rounded-md` = ~14px)

**Secondary/outline:** `variant="outline"` with meadow edge border

### Badges (Status Indicators)

| Status | Color | Variable |
|--------|-------|----------|
| Completed / Resolved | Moss green | `bg-success text-success-foreground` |
| In Progress | Amber | `bg-warning text-warning-foreground` |
| Needs Attention | Sunset coral | `bg-accent text-accent-foreground` |
| Error / Needs Engineer | Autumn red | `bg-destructive text-destructive-foreground` |
| Info / Neutral | Haze blue | `bg-info text-info-foreground` |

All badges: pill-shaped (`rounded-full`)

### Inputs

- Border: `border-input` (meadow edge)
- Focus ring: `ring-ring` (moss green)
- Background: `bg-card` with slight transparency in some contexts
- Rounded: default `rounded-md`

### Tabs

- Active tab: moss green underline (`border-b-2 border-primary`)
- Inactive: muted foreground
- Nunito 600 weight for tab labels

---

## Shadows

| Usage | Shadow |
|-------|--------|
| Cards (resting) | `0 8px 32px rgba(28, 25, 23, 0.08)` |
| Cards (hover) | `0 12px 40px rgba(28, 25, 23, 0.12)` |
| Buttons (hover glow) | `0 0 20px rgba(45, 106, 79, 0.15)` |
| Floating elements | `0 4px 16px rgba(28, 25, 23, 0.06)` |
| Popovers/dropdowns | `0 10px 24px rgba(28, 25, 23, 0.1)` |

---

## Motion & Animation

### Philosophy: Restraint over spectacle

The UI is premium and clean. Animations are smooth, subtle, and purposeful. No bouncing, no particles, no spring physics.

### Easing

```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);   /* smooth standard */
--ease-entrance: cubic-bezier(0, 0.55, 0.45, 1); /* float upward */
```

### Page Load

- Content blocks fade up from 20px below, opacity 0 → 1
- Stagger: 80ms between elements
- Duration: 400ms
- ADU miniatures enter from 30px below, slightly slower (500ms)

### Hover States

- Cards: `translateY(-2px)` + shadow deepens
- Buttons: slight shadow glow appears
- Links: color shift to primary
- Duration: 200ms

### Page Transitions

- 300ms crossfade
- New content slides up 10px

### Agent Working Screen

- Progress dots: gentle pulse on active dot (CSS `@keyframes pulse`)
- Activity log: new entries slide in from left, 200ms
- ADU miniature: optional slow rotation if using video loop asset
- Phase transitions: smooth 500ms crossfade between construction stage images

### What NOT to Do

- No bounce/spring easing
- No particle systems
- No floating leaves or cloud wisps
- No breathing scale animations
- No parallax (unless trivially simple)
- No animations longer than 500ms (except background rotations)

---

## Visual Assets

### Source Locations

| Asset Type | Location | Format |
|-----------|----------|--------|
| Keyed exteriors | `/cc-crossbeam-video/assets/keyed/cameron-*-keyed.png` | Transparent PNG |
| Keyed exteriors | `/cc-crossbeam-video/assets/keyed/adu-*-keyed.png` | Transparent PNG |
| Keyed interiors | `/cc-crossbeam-video/assets/keyed/interior-*-transparent.png` | Transparent PNG |
| Raw tilt-shift | `/CC-Crossbeam/visuals/adu-tiltshift-*.jpg` | JPEG (white/magenta bg) |
| Spinning videos | `/CC-Crossbeam/visuals/v3-*.mp4` | MP4 (orbit loops) |

### Asset Inventory (Keyed Exteriors)

| File | Description | Use Case |
|------|-------------|----------|
| `cameron-01-longbeach-keyed.png` | Modern concrete box, desert landscaping | Landing hero, general |
| `cameron-04-whittier-2story-keyed.png` | 2-story modern, stairs, palm tree | Flow selection (contractor) |
| `cameron-05-lakewood-porch-keyed.png` | Cottage with porch | Warm/residential context |
| `cameron-09-signalhill-cottage-keyed.png` | White farmhouse cottage, picket fence | Friendly/approachable |
| `cameron-07-sandimas-raised-keyed.png` | Raised modern ADU | Technical/elevated context |
| `adu-05-modern-box-keyed.png` | Minimalist box with hot tub | Premium/luxury context |
| `adu-01-2story-garage-keyed.png` | 2-story over garage | Flow selection (city) |

### Asset Inventory (Keyed Interiors)

| File | Description |
|------|-------------|
| `interior-750sf-sandimas-transparent.png` | 2-story cutaway, stairs, 2BR |
| `interior-786sf-lakewood-transparent.png` | Open plan, kitchen island |
| `interior-628sf-lakewood-transparent.png` | Compact studio layout |
| `interior-1400sf-whittier-2story-transparent.png` | Large 2-story interior |

### Integration Rules

1. **The miniatures are the visual stars.** The UI is their stage — clean and uncluttered.
2. Always display on the gradient background — they should "float" with their soil platform shadow.
3. Use `object-contain` to preserve aspect ratios.
4. Hero placement: 40-60% of viewport width, centered.
5. Background/decorative usage: reduce opacity to 20-30%.
6. Images will need compression for web (originals are large PNGs). Use Next.js `<Image>` with `quality={85}` and appropriate `sizes` attribute.
7. For spinning video loops: use `<video autoPlay loop muted playsInline>` with `poster` frame.

---

## Screen Layouts

### 1. Landing Page

```
┌─────────────────────────────────────────────┐
│ Nav: CrossBeam logo | links | Get Started   │
├─────────────────────────────────────────────┤
│                                             │
│   "Your ADU Permit, Simplified"             │
│   (Playfair Display, 900, centered)         │
│                                             │
│   Subtitle in Nunito 400                    │
│   [Start Your Assessment] pill button       │
│                                             │
│         ┌─────────────────┐                 │
│         │  ADU miniature   │                │
│         │  (40-60% width)  │                │
│         │  floating on     │                │
│         │  gradient bg     │                │
│         └─────────────────┘                 │
│                                             │
│  ┌──────┐  ┌──────┐  ┌──────┐              │
│  │Card 1│  │Card 2│  │Card 3│              │
│  │Feature│  │Feature│  │Feature│            │
│  └──────┘  └──────┘  └──────┘              │
│                                             │
│ Footer                                      │
└─────────────────────────────────────────────┘
```

### 2. Flow Selection

```
┌─────────────────────────────────────────────┐
│ Nav                                          │
├─────────────────────────────────────────────┤
│                                             │
│   "How can we help?"                        │
│   (Playfair Display, 700, centered)         │
│                                             │
│  ┌──────────────┐  ┌──────────────┐         │
│  │  ADU image    │  │  ADU image    │       │
│  │               │  │               │       │
│  │ For           │  │ For           │       │
│  │ Contractors   │  │ Cities        │       │
│  │ "Understand   │  │ "Pre-screen   │       │
│  │  corrections" │  │  applications"│       │
│  │ [Upload]      │  │ [Review]      │       │
│  └──────────────┘  └──────────────┘         │
│                                             │
└─────────────────────────────────────────────┘
```

### 3. File Upload

```
┌─────────────────────────────────────────────┐
│ Nav                                          │
├─────────────────────────────────────────────┤
│                                             │
│   "Upload Your Documents"                   │
│                                             │
│  ┌────────────────────────────────┐         │
│  │  ┌ - - - - - - - - - - - ┐    │         │
│  │  │ Drop corrections letter │    │         │
│  │  │ PDF, PNG               │    │         │
│  │  └ - - - - - - - - - - - ┘    │         │
│  │                                │         │
│  │  ┌ - - - - - - - - - - - ┐    │         │
│  │  │ Drop plan binder PDF   │    │         │
│  │  └ - - - - - - - - - - - ┘    │         │
│  │                                │         │
│  │  [Project Address input]       │         │
│  │                                │         │
│  │  [Start Analysis] pill button  │         │
│  └────────────────────────────────┘         │
│                                             │
│         (small ADU at 20% opacity)          │
└─────────────────────────────────────────────┘
```

### 4. Agent Working (THE DEMO SCREEN)

```
┌─────────────────────────────────────────────┐
│ Nav                                          │
├─────────────────────────────────────────────┤
│                                             │
│   "Building your response..."               │
│   "Usually takes 12-18 minutes"             │
│                                             │
│         ┌─────────────────┐                 │
│         │  ADU miniature   │                │
│         │  (or spinning    │                │
│         │   video loop)    │                │
│         └─────────────────┘                 │
│                                             │
│  ●────●────◉────○────○                      │
│  Extract Analyze Research Categorize Prepare │
│                                             │
│  ┌────────────────────────────────┐         │
│  │ Activity Log                    │         │
│  │ 2:04 PM - Reading page 3 of 4  │         │
│  │ 2:06 PM - Found 12 items       │         │
│  │ ● 2:11 PM - Searching codes... │         │
│  └────────────────────────────────┘         │
│                                             │
└─────────────────────────────────────────────┘
```

Progress indicator: `● = completed (green)` `◉ = active (amber pulse)` `○ = pending (gray)`

### 5. Contractor Questions

```
┌─────────────────────────────────────────────┐
│ Nav                          (small ADU) →  │
├─────────────────────────────────────────────┤
│                                             │
│   "A few questions for you"                 │
│   "Our AI needs input on 3 items"           │
│                                             │
│  ┌────────────────────────────────┐         │
│  │ ① Question text               │         │
│  │   [select / input field]       │         │
│  ├────────────────────────────────┤         │
│  │ ② Question text               │         │
│  │   ○ Option A  ○ Option B       │         │
│  ├────────────────────────────────┤         │
│  │ ③ Question text               │         │
│  │   ○ Yes  ○ No                  │         │
│  └────────────────────────────────┘         │
│                                             │
│        [Submit Answers] pill button         │
│                                             │
└─────────────────────────────────────────────┘
```

### 6. Results

```
┌─────────────────────────────────────────────┐
│ Nav                                          │
├─────────────────────────────────────────────┤
│         (small completed ADU)               │
│   "Your response package is ready"          │
│                                             │
│  [Response Letter] [Scope of Work] [Checklist]
│                                             │
│  ┌─────────────────────┐ ┌──────────┐      │
│  │ Active tab content   │ │ Summary  │      │
│  │                      │ │ Stats    │      │
│  │ Structural Calcs...  │ │          │      │
│  │ (Reference: CRC...) │ │ ●12 done │      │
│  │                      │ │ ●3 engr  │      │
│  │ Architectural Plan...│ │ ●2 flag  │      │
│  │                      │ │          │      │
│  └─────────────────────┘ └──────────┘      │
│                                             │
│  [Download All Documents] [Start New Review] │
└─────────────────────────────────────────────┘
```

---

## Reference Mockups

Generated mockups are saved in `design-directions/` for visual reference:

| File | Screen |
|------|--------|
| `10-magic-dirt-v2-landing.jpg` | Landing page |
| `11-magic-dirt-v2-working.jpg` | Agent working |
| `12-magic-dirt-v2-flow-selection.jpg` | Flow selection |
| `13-magic-dirt-v2-results.jpg` | Results |
| `06-magic-upload.jpg` | File upload (v1 — still directionally accurate) |
| `08-magic-questions.jpg` | Contractor questions (v1 — still directionally accurate) |

---

## Implementation Checklist

When building the frontend, follow this order:

1. **Scaffold**: `npx create-next-app@latest` with App Router, TypeScript, Tailwind, ESLint
2. **shadcn init**: `npx shadcn@latest init` — select new-york style, CSS variables
3. **Theme**: Replace `globals.css` variables with the palette above. Add `@theme inline` block.
4. **Fonts**: Configure Playfair Display + Nunito via `next/font`
5. **Gradient**: Add `.bg-crossbeam-gradient` to `globals.css` and apply to root layout
6. **Landing page**: Hero with ADU miniature, feature cards, CTA
7. **Flow selection**: Two-card layout with miniatures
8. **Upload screen**: Drag-and-drop form
9. **Agent working**: Progress indicator + activity log + miniature
10. **Questions form**: Dynamic from `contractor_questions.json`
11. **Results**: Tabbed content + summary stats + download

### shadcn Components to Install

```bash
npx shadcn@latest add button card badge tabs input label
npx shadcn@latest add dropdown-menu dialog progress separator
npx shadcn@latest add form select radio-group textarea
npx shadcn@latest add tooltip skeleton avatar
```

---

## Rules for Claude Instances

### ALWAYS

- Use CSS variables: `bg-primary text-primary-foreground`
- Use `cn()` utility for conditional classes
- Use Playfair Display ONLY for headings (24px+)
- Use Nunito for everything else
- Maintain background/foreground pairs
- Test both light and dark mode
- Use semantic names (primary, destructive) not color names (green, red)
- Use `next/image` with `quality={85}` for ADU assets
- Keep cards floating (deep soft shadows, generous padding)
- Maintain generous whitespace

### NEVER

- Hardcode colors: `bg-blue-600` or `text-[#2D6A4F]`
- Use `!important`
- Add cartoon/whimsical/fantasy decorative elements
- Add particle systems, floating leaves, or cloud animations
- Use bounce or spring animations
- Make the miniature compete with other visual elements
- Use Inter, Roboto, Arial, or system fonts
- Forget the `hsl()` wrapper in `@theme inline`
- Create new files when you can edit existing ones

---

## Hex Quick Reference

For non-CSS contexts (Figma, image generation, etc.):

| Name | Hex | Usage |
|------|-----|-------|
| Moss Green | `#2D6A4F` | Primary actions, CTAs |
| Mint Cream | `#F0FFF4` | Text on primary |
| Warm Soil Brown | `#8B6914` | Secondary actions |
| Soft Gold | `#FEFCE8` | Text on secondary |
| Sky Blue | `#F0F7FF` | Gradient top |
| Warm Earth | `#FAF3E8` | Gradient bottom |
| Deep Soil | `#E8DCC8` | Gradient very bottom |
| Deep Earth | `#1C1917` | Body text |
| Sunset Coral | `#F28B6E` | Accent, attention badges |
| Autumn Red | `#DC2626` | Errors, destructive |
| Meadow Edge | `#C6D9C0` | Borders |
| Haze Blue | `#E0EAFF` | Muted backgrounds |
| Slate | `#64748B` | Muted text |
| Night Sky | `#0C1222` | Dark mode background |
| Dark Indigo | `#151B2E` | Dark mode cards |
