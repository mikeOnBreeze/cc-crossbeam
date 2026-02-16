# Stream 2: Frontend Build Brief

> **Project:** CrossBeam -- AI ADU Permit Assistant for California
> **Framework:** Next.js 15 (App Router) deployed on Vercel
> **Hackathon Deadline:** Monday Feb 16, 12:00 PM PST
> **Estimated Build Time:** 3-4 hours

---

## CRITICAL: Read Before Writing ANY Code

**Before you write a single line of code, you MUST read these two files in their entirety:**

1. **Design Bible:** `DESIGN-BIBLE.md` (repo root) -- This is the law. Every color, font, shadow, animation, and layout decision comes from this file. Do not deviate.
2. **Mako Reference Frontend:** `~/openai-demo/CC-Agents-SDK-test-1225/mako/frontend/` -- Read the entire frontend. This is your structural template. You are forking this codebase and adapting it for CrossBeam.

The Design Bible overrides any styling you see in Mako. The Mako code provides the structural patterns (Supabase auth, middleware, polling, API routes). Combine them: Mako structure + Design Bible styling.

---

## Reference Locations

| Reference | Path |
|---|---|
| Mako frontend | `~/openai-demo/CC-Agents-SDK-test-1225/mako/frontend/` |
| Design Bible | `~/openai-demo/CC-Crossbeam/DESIGN-BIBLE.md` |
| Supabase schema | `~/openai-demo/CC-Crossbeam/plan-supabase-0213.md` |
| Strategy doc | `~/openai-demo/CC-Crossbeam/plan-strategy-0213.md` |
| Deploy plan | `~/openai-demo/CC-Crossbeam/plan-deploy.md` |
| Design mockups | `~/openai-demo/CC-Crossbeam/design-directions/` |
| ADU miniature assets (source) | `~/openai-demo/cc-crossbeam-video/assets/keyed/` (skip `no-go/` subfolder) |
| ADU miniature assets (frontend) | `CC-Crossbeam/frontend/public/images/adu/` (copied + compressed) |

---

## Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 15.x |
| UI Library | shadcn/ui | Latest (new-york style) |
| Styling | Tailwind CSS | v4 |
| Fonts | Playfair Display + Nunito | via next/font/google |
| Icons | Lucide React | latest |
| Animations | CSS + tw-animate-css | (no framer-motion) |
| Auth | Supabase SSR | @supabase/ssr ^0.8.0 |
| Supabase Client | @supabase/supabase-js | ^2.87.1 |
| Markdown | react-markdown + remark-gfm | latest |
| Deployment | Vercel | -- |

**Dependencies NOT needed (remove from Mako's package.json):**
- `stripe` (no billing)
- `@react-pdf/renderer` (no PDF generation on frontend)
- `docx-preview` (no DOCX preview)
- `jszip` (no zip handling)
- `framer-motion` (use CSS animations per Design Bible -- restraint over spectacle)
- `@base-ui/react` (not needed)
- `next-themes` (no dark mode -- light-only for hackathon)

---

## File Tree

```
CC-Crossbeam/frontend/
├── public/
│   └── images/
│       └── adu/                              # ADU miniature PNGs (copied from keyed assets -- see Image Pipeline)
├── app/
│   ├── page.tsx                              # REWRITE: Landing page with ADU hero miniature + CTA
│   ├── layout.tsx                            # REWRITE: Playfair + Nunito fonts, gradient bg, CrossBeam branding
│   ├── globals.css                           # REWRITE: Design Bible palette, @theme inline, gradient (LIGHT ONLY)
│   ├── auth/
│   │   ├── callback/route.ts                 # COPY from Mako as-is
│   │   └── signout/route.ts                  # COPY from Mako as-is
│   ├── (auth)/
│   │   └── login/page.tsx                    # REWRITE: Judge button + Google OAuth
│   ├── (dashboard)/
│   │   ├── layout.tsx                        # ADAPT from Mako: simpler (no sidebar), protected
│   │   ├── dashboard/page.tsx                # NEW: Two persona cards
│   │   └── projects/
│   │       └── [id]/page.tsx                 # ADAPT: THE MOST IMPORTANT PAGE -- status-driven rendering
│   └── api/
│       └── generate/route.ts                 # ADAPT from Mako: add flow_type, remove credits
├── components/
│   ├── ui/                                   # COPY from Mako (all shadcn components)
│   ├── adu-miniature.tsx                     # NEW: Reusable ADU miniature image component (rotating/random)
│   ├── persona-card.tsx                      # NEW: Dashboard persona card (uses AduMiniature, NOT Lucide icons)
│   ├── agent-stream.tsx                      # ADAPT from Mako's agent-activity-log.tsx
│   ├── progress-phases.tsx                   # NEW: Progress dots (● ◉ ○)
│   ├── contractor-questions-form.tsx         # NEW: Questions form for awaiting-answers state
│   ├── results-viewer.tsx                    # NEW: Tabbed results display
│   └── nav-bar.tsx                           # NEW: Simple top nav bar
├── lib/
│   ├── supabase/
│   │   ├── client.ts                         # COPY from Mako as-is
│   │   ├── server.ts                         # COPY from Mako as-is
│   │   └── middleware.ts                     # COPY from Mako as-is
│   └── utils.ts                              # COPY from Mako as-is (cn() utility)
├── types/
│   └── database.ts                           # REWRITE: CrossBeam schema types
├── hooks/
│   └── use-random-adu.ts                     # NEW: Hook for random ADU miniature selection
├── middleware.ts                              # COPY from Mako as-is
├── package.json                              # COPY from Mako, update name, trim deps
├── next.config.ts                            # COPY from Mako as-is
├── tsconfig.json                             # COPY from Mako as-is
├── postcss.config.mjs                        # COPY from Mako as-is
├── components.json                           # ADAPT: change style to new-york
├── .env.local                                # Create with Supabase + Cloud Run URLs
└── .gitignore                                # COPY from Mako as-is
```

---

## Image Pipeline (DO THIS FIRST)

Before writing any code, copy ADU miniature assets into the frontend. These are the photorealistic tilt-shift miniatures that define CrossBeam's visual identity.

**Source:** `~/openai-demo/cc-crossbeam-video/assets/keyed/`
**Destination:** `CC-Crossbeam/frontend/public/images/adu/`
**SKIP:** the `no-go/` subfolder — everything else is good

### Selected Exteriors (copy these)

| Source File | Rename To | Description |
|---|---|---|
| `cameron-01-longbeach-keyed.png` | `exterior-longbeach-modern.png` | Modern concrete box, desert landscaping |
| `cameron-04-whittier-2story-keyed.png` | `exterior-whittier-2story.png` | 2-story modern, stairs, palm tree |
| `cameron-05-lakewood-porch-keyed.png` | `exterior-lakewood-porch.png` | Cottage with covered porch |
| `cameron-07-sandimas-raised-keyed.png` | `exterior-sandimas-raised.png` | Raised modern ADU |
| `cameron-09-signalhill-cottage-keyed.png` | `exterior-signalhill-cottage.png` | White farmhouse, picket fence |
| `adu-01-2story-garage-keyed.png` | `exterior-garage-2story.png` | 2-story over garage |
| `adu-05-modern-box-keyed.png` | `exterior-modern-box.png` | Minimalist box with hot tub |

### Selected Interiors (copy these)

| Source File | Rename To |
|---|---|
| `interior-750sf-sandimas-transparent.png` | `interior-sandimas-750sf.png` |
| `interior-786sf-lakewood-transparent.png` | `interior-lakewood-786sf.png` |

### Compression

The original PNGs are large (5-15MB each). After copying, compress them:

```bash
# Install if needed: brew install pngquant
cd frontend/public/images/adu/
for f in *.png; do pngquant --quality=65-85 --force --output "$f" "$f"; done
```

Target: under 500KB per image. Next.js `<Image>` will further optimize at runtime.

### Video Swap Architecture

The current assets are still PNGs. Spinning video loops (MP4) will be ready later. The `<AduMiniature>` component (see below) is designed for easy swap: it renders `<Image>` now, but has a `videoSrc` prop that switches to `<video autoPlay loop muted playsInline>` when provided. No other component changes needed.

---

## File-by-File Instructions

### Infrastructure (COPY from Mako -- minimal or zero changes)

These files are identical between Mako and CrossBeam. Copy them verbatim.

**`middleware.ts`** -- Copy from `~/openai-demo/CC-Agents-SDK-test-1225/mako/frontend/middleware.ts`. No changes needed. It handles auth route protection (redirect unauthenticated users to /login, redirect authenticated users away from /login).

**`app/auth/callback/route.ts`** -- Copy as-is. Handles OAuth callback, exchanges code for session, redirects to /dashboard.

**`app/auth/signout/route.ts`** -- Copy as-is. Signs out user, redirects to /login.

**`lib/supabase/client.ts`** -- Copy as-is. Creates browser-side Supabase client. Note: it imports `Database` from `@/types/database` -- this will work once we write our own types file.

**`lib/supabase/server.ts`** -- Copy as-is. Creates server-side Supabase client with cookie handling.

**`lib/supabase/middleware.ts`** -- Copy as-is. Session refresh middleware.

**`lib/utils.ts`** -- Copy as-is. The `cn()` utility (clsx + tailwind-merge).

**`components/ui/*`** -- Copy ALL of Mako's shadcn components from `~/openai-demo/CC-Agents-SDK-test-1225/mako/frontend/components/ui/`. These are: `alert-dialog.tsx`, `badge.tsx`, `button.tsx`, `card.tsx`, `collapsible.tsx`, `combobox.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `field.tsx`, `input-group.tsx`, `input.tsx`, `label.tsx`, `select.tsx`, `separator.tsx`, `sheet.tsx`, `textarea.tsx`.

**`tsconfig.json`** -- Copy as-is.

**NOTE:** Do NOT copy `theme-provider.tsx` from Mako. CrossBeam is light-mode only — no ThemeProvider, no `next-themes`.

**`postcss.config.mjs`** -- Copy as-is.

**`next.config.ts`** -- Copy as-is.

**`.gitignore`** -- Copy from Mako as-is.

---

### package.json (ADAPT)

Copy from Mako, then make these changes:

```json
{
  "name": "crossbeam-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@supabase/ssr": "^0.8.0",
    "@supabase/supabase-js": "^2.87.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.561.0",
    "next": "16.0.10",
    "radix-ui": "^1.4.3",
    "react": "19.2.1",
    "react-dom": "19.2.1",
    "react-markdown": "^10.1.0",
    "remark-gfm": "^4.0.1",
    "shadcn": "^3.6.0",
    "tailwind-merge": "^3.4.0",
    "tw-animate-css": "^1.4.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.0.10",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

**Removed:** `stripe`, `@react-pdf/renderer`, `docx-preview`, `jszip`, `framer-motion`, `@base-ui/react`, `next-themes`.

---

### components.json (ADAPT)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "gray",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

---

### globals.css (REWRITE -- CRITICAL)

This is the most important styling file. Replace ALL of Mako's CSS variables with the Design Bible palette. **LIGHT MODE ONLY — no `.dark` block.**

The file structure is:

1. Tailwind imports
2. `@theme inline` block (REQUIRED for Tailwind v4 -- without this, `bg-primary` etc. will not work)
3. `:root` light mode variables (Design Bible palette)
4. Custom status colors (success, warning, info)
5. Base layer
6. `.bg-crossbeam-gradient` class (sky-to-earth gradient with `background-attachment: fixed`)
7. `.bg-topo-lines` class (topographic contour lines — subtle sophistication)
8. Custom animations (fade-up, pulse, slide-in -- NO bounce, NO spring)
9. Typography utilities (heading-display uses Playfair, body uses Nunito)
10. Scrollbar styles
11. Prose styles for markdown rendering

Here is the complete globals.css content to write:

```css
@import "tailwindcss";
@import "tw-animate-css";

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
  --font-display: var(--font-display), Georgia, "Times New Roman", serif;
  --font-body: var(--font-body), "Segoe UI", Tahoma, sans-serif;
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
}

/* ==========================================
   LIGHT MODE (DEFAULT) — Design Bible Palette
   ========================================== */
:root {
  /* Core */
  --background: 212 100% 97%;        /* #F0F7FF - sky blue top */
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

  /* Status Colors */
  --success: 153 40% 30%;            /* same as primary - moss green */
  --success-foreground: 136 100% 97%;
  --warning: 38 92% 50%;             /* amber */
  --warning-foreground: 38 100% 10%;
  --info: 212 80% 55%;               /* sky blue */
  --info-foreground: 0 0% 100%;
}

/* NO DARK MODE — light-only for hackathon. See DESIGN-BIBLE.md for twilight palette if needed later. */

/* ==========================================
   BASE LAYER
   ========================================== */
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
    font-family: var(--font-body);
  }
}

/* ==========================================
   SKY-TO-EARTH GRADIENT (Design Bible)
   ========================================== */
.bg-crossbeam-gradient {
  background: linear-gradient(180deg,
    #F0F7FF 0%,      /* sky blue */
    #FAFCFF 15%,
    #FFFFFF 40%,      /* white middle */
    #FFFDF8 70%,
    #FAF3E8 90%,      /* warm earth */
    #E8DCC8 100%      /* deep soil */
  );
  background-attachment: fixed;  /* CRITICAL: gradient stays fixed as page scrolls */
  min-height: 100vh;
}

/* ==========================================
   TOPOGRAPHIC CONTOUR LINES (subtle sophistication)
   ========================================== */
.bg-topo-lines {
  position: relative;
}
.bg-topo-lines::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cpath d='M0 200 Q100 180 200 200 T400 200' fill='none' stroke='%23D9CEBD' stroke-width='0.5'/%3E%3Cpath d='M0 160 Q100 140 200 160 T400 160' fill='none' stroke='%23D9CEBD' stroke-width='0.5'/%3E%3Cpath d='M0 240 Q100 260 200 240 T400 240' fill='none' stroke='%23D9CEBD' stroke-width='0.5'/%3E%3Cpath d='M0 120 Q100 100 200 120 T400 120' fill='none' stroke='%23D9CEBD' stroke-width='0.5'/%3E%3Cpath d='M0 280 Q100 300 200 280 T400 280' fill='none' stroke='%23D9CEBD' stroke-width='0.5'/%3E%3Cpath d='M0 80 Q150 60 250 80 T400 80' fill='none' stroke='%23D9CEBD' stroke-width='0.5'/%3E%3Cpath d='M0 320 Q150 340 250 320 T400 320' fill='none' stroke='%23D9CEBD' stroke-width='0.5'/%3E%3C/svg%3E");
  background-size: 400px 400px;
  opacity: 0.15;
  pointer-events: none;
  z-index: 0;
}

/* ==========================================
   ANIMATIONS (Restraint over spectacle)
   ========================================== */
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-in-left {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes gentle-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-fade-up {
  animation: fade-up 400ms cubic-bezier(0, 0.55, 0.45, 1) forwards;
}

.animate-fade-in {
  animation: fade-in 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.animate-slide-in-left {
  animation: slide-in-left 200ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.animate-gentle-pulse {
  animation: gentle-pulse 2s ease-in-out infinite;
}

/* Stagger delays for list animations */
.stagger-1 { animation-delay: 80ms; }
.stagger-2 { animation-delay: 160ms; }
.stagger-3 { animation-delay: 240ms; }
.stagger-4 { animation-delay: 320ms; }
.stagger-5 { animation-delay: 400ms; }

/* ==========================================
   TYPOGRAPHY UTILITIES
   ========================================== */
.heading-display {
  font-family: var(--font-display);
  font-size: 2.5rem;
  line-height: 1.1;
  letter-spacing: -0.02em;
  font-weight: 900;
}

.heading-section {
  font-family: var(--font-display);
  font-size: 1.5rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
  font-weight: 700;
}

.heading-card {
  font-family: var(--font-display);
  font-size: 1.25rem;
  line-height: 1.3;
  font-weight: 700;
}

/* ==========================================
   HOVER EFFECTS (Design Bible)
   ========================================== */
.hover-lift {
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(28, 25, 23, 0.12);
}

/* ==========================================
   SCROLLBAR
   ========================================== */
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--border)) transparent;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 3px;
}

/* ==========================================
   PROSE STYLES (for rendering markdown output)
   ========================================== */
.prose-crossbeam h1,
.prose-crossbeam h2,
.prose-crossbeam h3 {
  font-family: var(--font-display);
  letter-spacing: -0.02em;
  color: hsl(var(--foreground));
}

.prose-crossbeam h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid hsl(var(--border));
}

.prose-crossbeam h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-top: 2rem;
  margin-bottom: 0.875rem;
}

.prose-crossbeam h3 {
  font-size: 1.125rem;
  font-weight: 700;
  margin-top: 1.5rem;
  margin-bottom: 0.625rem;
}

.prose-crossbeam p {
  margin-bottom: 1rem;
  line-height: 1.75;
  color: hsl(var(--foreground));
}

.prose-crossbeam ul,
.prose-crossbeam ol {
  margin-left: 1.25rem;
  margin-bottom: 1rem;
  padding-left: 0.5rem;
}

.prose-crossbeam li {
  margin-bottom: 0.5rem;
  line-height: 1.65;
}

.prose-crossbeam li::marker {
  color: hsl(var(--primary));
}

.prose-crossbeam strong {
  font-weight: 600;
  color: hsl(var(--foreground));
}

.prose-crossbeam blockquote {
  border-left: 3px solid hsl(var(--primary) / 50%);
  padding-left: 1.25rem;
  margin: 1.5rem 0;
  font-style: italic;
  color: hsl(var(--muted-foreground));
}

.prose-crossbeam table {
  width: 100%;
  margin: 1.5rem 0;
  border-collapse: collapse;
}

.prose-crossbeam th,
.prose-crossbeam td {
  padding: 0.5rem 0.75rem;
  border: 1px solid hsl(var(--border));
  text-align: left;
}

.prose-crossbeam th {
  background: hsl(var(--muted));
  font-weight: 600;
}
```

**CRITICAL NOTES for globals.css:**
- Every `--color-*` in `@theme inline` MUST use the `hsl()` wrapper. Without it, Tailwind v4 utilities like `bg-primary` will not resolve.
- The `:root` variables are HSL channels only (no `hsl()` wrapper) -- this is the shadcn convention.
- The `@theme inline` block bridges these two formats.
- Do NOT include any sidebar-related variables (CrossBeam has no sidebar).
- Do NOT include `.dark` CSS block or `@custom-variant dark` -- this is light-mode only.
- The gradient uses `background-attachment: fixed` so it stays anchored as the user scrolls.
- The `.bg-topo-lines` class adds subtle topographic contour lines as a background texture. Use it on hero sections and landing page for sophistication.

---

### app/layout.tsx (REWRITE)

Replace Mako's Inter + Geist Mono fonts with Playfair Display + Nunito. Apply the gradient background. Change branding to CrossBeam. **No ThemeProvider -- light-mode only.**

```tsx
import type { Metadata } from "next"
import { Playfair_Display, Nunito } from "next/font/google"
import "./globals.css"

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

export const metadata: Metadata = {
  title: "CrossBeam | AI-Powered ADU Permit Review",
  description: "AI permit review assistant for California ADUs. Built with Claude Opus 4.6.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${nunito.variable}`}>
      <body className="antialiased bg-crossbeam-gradient">
        {children}
      </body>
    </html>
  )
}
```

**Key differences from Mako:**
- Fonts: Playfair Display + Nunito (not Inter + Geist Mono)
- NO ThemeProvider, NO `next-themes` -- light mode only
- Body class: `bg-crossbeam-gradient` (the sky-to-earth gradient, fixed on scroll)
- Metadata: CrossBeam branding
- No `suppressHydrationWarning` (not needed without theme switching)

---

### app/page.tsx (REWRITE -- Landing Page with ADU Hero)

This is the FIRST thing judges see. It must demonstrate the premium visual quality immediately. The ADU miniature is the hero — floating on the sky-to-earth gradient. Clean, sophisticated, Apple product page energy.

```tsx
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AduMiniature } from '@/components/adu-miniature'
import { FileTextIcon, SearchIcon, ShieldCheckIcon } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="bg-topo-lines">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <span className="heading-card text-primary">CrossBeam</span>
        <Link href="/login">
          <Button variant="outline" size="sm" className="font-body">
            Sign In
          </Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 pt-12 pb-8 text-center space-y-6 animate-fade-up">
        <h1 className="heading-display text-foreground">
          Your ADU Permit, Simplified
        </h1>
        <p className="text-xl text-muted-foreground font-body max-w-2xl mx-auto">
          AI-powered permit review for California ADUs. Get corrections interpreted,
          code citations verified, and response letters drafted — in minutes, not weeks.
        </p>
        <Link href="/login">
          <Button className="rounded-full px-10 py-6 text-lg font-bold font-body
                             hover:shadow-[0_0_20px_rgba(45,106,79,0.15)]"
                  size="lg">
            Get Started
          </Button>
        </Link>
      </section>

      {/* ADU Hero Miniature — THE VISUAL CENTERPIECE */}
      <section className="max-w-3xl mx-auto px-4 py-8 animate-fade-up stagger-1">
        <AduMiniature variant="hero" />
      </section>

      {/* Feature Cards */}
      <section className="max-w-5xl mx-auto px-4 pb-20 grid gap-6 md:grid-cols-3 animate-fade-up stagger-2">
        <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.08)] border-border/50">
          <CardContent className="p-6 space-y-3">
            <FileTextIcon className="w-8 h-8 text-primary" />
            <h3 className="heading-card text-foreground">Corrections Interpreter</h3>
            <p className="text-muted-foreground font-body text-sm">
              Upload your corrections letter. Get every item categorized, code-referenced, and explained in plain English.
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.08)] border-border/50">
          <CardContent className="p-6 space-y-3">
            <SearchIcon className="w-8 h-8 text-primary" />
            <h3 className="heading-card text-foreground">Code Verification</h3>
            <p className="text-muted-foreground font-body text-sm">
              Every correction cross-checked against California state law and your city's municipal code.
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.08)] border-border/50">
          <CardContent className="p-6 space-y-3">
            <ShieldCheckIcon className="w-8 h-8 text-primary" />
            <h3 className="heading-card text-foreground">Response Letter</h3>
            <p className="text-muted-foreground font-body text-sm">
              Professional response letter drafted automatically, ready for your engineer or architect.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-6 text-center">
        <p className="text-sm text-muted-foreground font-body">
          Built with Claude Opus 4.6 · CrossBeam © 2026
        </p>
      </footer>
    </div>
  )
}
```

**Key design decisions:**
- `bg-topo-lines` adds the subtle contour line texture to the entire page
- `<AduMiniature variant="hero" />` renders a randomly-selected photorealistic miniature at 60% viewport width
- Feature cards use Lucide icons (NOT miniatures — reserve those for flow cards)
- `animate-fade-up` + stagger classes create the premium entrance sequence
- No ADU miniatures in feature cards — those are for the persona/flow selection cards

---

### app/(auth)/login/page.tsx (REWRITE)

This is the hackathon entry point. One-click judge login. No email/password form needed for the demo. Includes a small ADU miniature for visual continuity.

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AduMiniature } from '@/components/adu-miniature'
import { KeyIcon, Loader2Icon } from 'lucide-react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleJudgeLogin = async () => {
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'judge@crossbeam.app',
        password: 'crossbeam-hackathon-2026',
      })
      if (error) throw error
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    setGoogleLoading(true)
    const callbackUrl = `${window.location.origin}/auth/callback?next=/dashboard`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-[0_8px_32px_rgba(28,25,23,0.08)] border-border/50">
        <CardContent className="pt-10 pb-8 px-8 text-center space-y-8">
          {/* ADU Miniature — small, accent size */}
          <div className="flex justify-center">
            <AduMiniature variant="accent" />
          </div>

          {/* Branding */}
          <div className="space-y-2">
            <h1 className="heading-display text-foreground">CrossBeam</h1>
            <p className="text-muted-foreground font-body">
              AI-Powered Permit Review for California ADUs
            </p>
          </div>

          {/* Judge Button -- Primary CTA */}
          <Button
            onClick={handleJudgeLogin}
            disabled={loading}
            className="w-full rounded-full px-8 py-6 text-base font-bold font-body
                       hover:shadow-[0_0_20px_rgba(45,106,79,0.15)]"
            size="lg"
          >
            {loading ? (
              <Loader2Icon className="w-4 h-4 animate-spin" />
            ) : (
              <KeyIcon className="w-4 h-4" />
            )}
            {loading ? 'Signing in...' : 'Sign in as a Judge'}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground font-body">or</span>
            </div>
          </div>

          {/* Google OAuth -- Secondary */}
          <Button
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full py-5 font-body"
          >
            {googleLoading ? (
              <Loader2Icon className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <GoogleIcon className="w-4 h-4 mr-2" />
            )}
            {googleLoading ? 'Redirecting...' : 'Sign in with Google'}
          </Button>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive font-body">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}
```

---

### app/(dashboard)/layout.tsx (ADAPT -- simpler than Mako)

CrossBeam does NOT have a sidebar. Just a simple top nav bar + protected layout.

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/nav-bar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen">
      <NavBar userEmail={user.email || ''} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
```

---

### components/nav-bar.tsx (NEW)

Simple top navigation. No sidebar, no hamburger menu. CrossBeam branding + sign out.

```tsx
'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LogOutIcon } from 'lucide-react'

interface NavBarProps {
  userEmail: string
}

export function NavBar({ userEmail }: NavBarProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    await fetch('/auth/signout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="heading-card text-primary">CrossBeam</span>
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground font-body hidden sm:inline">
            {userEmail}
          </span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOutIcon className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Sign out</span>
          </Button>
        </div>
      </div>
    </nav>
  )
}
```

---

### app/(dashboard)/dashboard/page.tsx (NEW -- Persona Cards with ADU Miniatures)

Two floating cards side by side. Each links to its demo project. **Each card features a different ADU miniature — NOT a Lucide icon.** The miniatures are the visual star. Different ADU styles per card reinforce that these are different perspectives on a real building project.

```tsx
import { PersonaCard } from '@/components/persona-card'

export const dynamic = 'force-dynamic'

const DEMO_CITY_PROJECT_ID = 'a0000000-0000-0000-0000-000000000001'
const DEMO_CONTRACTOR_PROJECT_ID = 'a0000000-0000-0000-0000-000000000002'

export default function DashboardPage() {
  return (
    <div className="space-y-10 animate-fade-up">
      {/* Heading */}
      <div className="text-center space-y-2 pt-8">
        <h1 className="heading-display text-foreground">Choose your perspective</h1>
        <p className="text-muted-foreground text-lg font-body">
          Select a demo scenario to see CrossBeam in action
        </p>
      </div>

      {/* Persona Cards — each with a different ADU miniature */}
      <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
        <PersonaCard
          aduImage="/images/adu/exterior-garage-2story.png"
          title="City Reviewer"
          description="I'm reviewing a permit submission. Help me pre-screen it against state + city code."
          projectName="742 Flint Ave ADU"
          projectCity="Buena Park, CA"
          projectId={DEMO_CITY_PROJECT_ID}
          ctaText="Run AI Review"
        />
        <PersonaCard
          aduImage="/images/adu/exterior-whittier-2story.png"
          title="Contractor"
          description="I got a corrections letter back. Help me understand what to fix and build a response."
          projectName="742 Flint Ave ADU"
          projectCity="Buena Park, CA"
          projectId={DEMO_CONTRACTOR_PROJECT_ID}
          ctaText="Analyze Corrections"
        />
      </div>
    </div>
  )
}
```

---

### components/persona-card.tsx (NEW -- with ADU Miniature, NOT Lucide icon)

Floating card per Design Bible: deep soft shadows, generous padding, pill-shaped CTA. The ADU miniature at the top of each card replaces the old Lucide icon approach. The miniature IS the visual identity.

```tsx
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRightIcon } from 'lucide-react'

interface PersonaCardProps {
  aduImage: string         // Path to ADU miniature PNG (e.g., "/images/adu/exterior-garage-2story.png")
  title: string
  description: string
  projectName: string
  projectCity: string
  projectId: string
  ctaText: string
}

export function PersonaCard({
  aduImage,
  title,
  description,
  projectName,
  projectCity,
  projectId,
  ctaText,
}: PersonaCardProps) {
  return (
    <Link href={`/projects/${projectId}`}>
      <Card className="hover-lift shadow-[0_8px_32px_rgba(28,25,23,0.08)] border-border/50 cursor-pointer h-full">
        <CardContent className="p-8 space-y-6">
          {/* ADU Miniature — the hero of the card */}
          <div className="relative w-full h-48 flex items-center justify-center">
            <Image
              src={aduImage}
              alt={title}
              width={280}
              height={200}
              className="object-contain drop-shadow-lg"
              quality={85}
            />
          </div>

          {/* Title */}
          <h2 className="heading-card text-foreground">{title}</h2>

          {/* Description */}
          <p className="text-muted-foreground font-body leading-relaxed">
            {description}
          </p>

          {/* Demo project info */}
          <div className="text-sm text-muted-foreground font-body border-t border-border/50 pt-4">
            <p className="font-semibold text-foreground">{projectName}</p>
            <p>{projectCity}</p>
          </div>

          {/* CTA */}
          <Button className="w-full rounded-full font-bold font-body hover:shadow-[0_0_20px_rgba(45,106,79,0.15)]">
            {ctaText}
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </Link>
  )
}
```

**Key change from original:** The Lucide icon (`BuildingIcon`, `HammerIcon`) is gone. Each card now features a photorealistic ADU miniature image at the top. The miniatures are different per card (city gets a 2-story garage ADU, contractor gets the Whittier modern) to reinforce different perspectives on the same project.

---

### components/adu-miniature.tsx (NEW -- Reusable ADU Visual Component)

This is the design system's signature component. It renders a photorealistic ADU miniature with size variants. The component selects randomly from a curated pool so each page load feels fresh. Designed for easy video-swap later.

```tsx
'use client'

import Image from 'next/image'
import { useRandomAdu } from '@/hooks/use-random-adu'

// All available ADU exterior images (from public/images/adu/)
const ADU_EXTERIORS = [
  '/images/adu/exterior-longbeach-modern.png',
  '/images/adu/exterior-whittier-2story.png',
  '/images/adu/exterior-lakewood-porch.png',
  '/images/adu/exterior-sandimas-raised.png',
  '/images/adu/exterior-signalhill-cottage.png',
  '/images/adu/exterior-garage-2story.png',
  '/images/adu/exterior-modern-box.png',
]

const VARIANT_CONFIG = {
  hero: { width: 600, height: 420, className: 'max-w-[60vw]' },
  card: { width: 280, height: 200, className: 'max-w-[280px]' },
  accent: { width: 140, height: 100, className: 'max-w-[140px]' },
  background: { width: 800, height: 560, className: 'max-w-full opacity-20' },
} as const

interface AduMiniatureProps {
  variant: keyof typeof VARIANT_CONFIG
  src?: string             // Override random selection with specific image
  videoSrc?: string        // When ready: provide MP4 path to switch to <video> loop
  alt?: string
  className?: string
}

export function AduMiniature({
  variant,
  src,
  videoSrc,
  alt = 'ADU architectural miniature',
  className = '',
}: AduMiniatureProps) {
  const randomSrc = useRandomAdu(ADU_EXTERIORS)
  const imageSrc = src || randomSrc
  const config = VARIANT_CONFIG[variant]

  // Video swap: when videoSrc is provided, render <video> instead of <Image>
  if (videoSrc) {
    return (
      <div className={`flex items-center justify-center ${config.className} ${className}`}>
        <video
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          className="object-contain drop-shadow-lg w-full h-auto"
          style={{ maxWidth: config.width, maxHeight: config.height }}
        />
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center ${config.className} ${className}`}>
      <Image
        src={imageSrc}
        alt={alt}
        width={config.width}
        height={config.height}
        className="object-contain drop-shadow-lg"
        quality={85}
        priority={variant === 'hero'}
      />
    </div>
  )
}
```

**Variant sizes:**
| Variant | Width | Use Case |
|---------|-------|----------|
| `hero` | 60% viewport | Landing page hero, agent working screen |
| `card` | 280px | Persona/flow selection cards |
| `accent` | 140px | Login page, results header, corner decoration |
| `background` | Full width, 20% opacity | Upload screen background |

**Video swap architecture:** When video loops are ready, just pass `videoSrc="/videos/adu-spinning-01.mp4"` and the component switches from `<Image>` to `<video autoPlay loop muted playsInline>`. No other changes needed anywhere else.

---

### hooks/use-random-adu.ts (NEW -- Random Selection Hook)

Returns a stable random selection per component mount. Uses `useState` with initializer to select once and stay consistent across re-renders.

```ts
'use client'

import { useState } from 'react'

export function useRandomAdu(pool: string[]): string {
  const [selected] = useState(() => {
    const index = Math.floor(Math.random() * pool.length)
    return pool[index]
  })
  return selected
}
```

This ensures the miniature doesn't change during re-renders or status polling updates, but WILL change on page navigation (each mount = new random pick). Different pages will naturally show different ADUs.

---

### app/(dashboard)/projects/[id]/page.tsx (ADAPT -- THE MOST IMPORTANT PAGE)

This page renders differently based on `project.status`. It polls the project status every 3 seconds to detect transitions.

**Status-driven rendering:**

| Status | What to Render |
|---|---|
| `ready` | Project info, file list, big CTA button ("Start Analysis" or "Run AI Review") |
| `processing` | Agent working screen (city review): progress phases, activity log |
| `processing-phase1` | Agent working screen (contractor Phase 1): "Analyzing corrections..." |
| `awaiting-answers` | Contractor questions form from `contractor_answers` table |
| `processing-phase2` | Agent working screen (contractor Phase 2): "Building your response..." |
| `completed` | Results viewer: tabbed content, summary stats |
| `failed` | Error message + retry option |

**Implementation approach:**

This is a server component that fetches initial data, then renders a client component that handles polling and state transitions.

```tsx
// app/(dashboard)/projects/[id]/page.tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProjectDetailClient } from './project-detail-client'

export const dynamic = 'force-dynamic'

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Fetch project
  const { data: project, error } = await supabase
    .schema('crossbeam')
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !project) notFound()

  // Fetch files
  const { data: files } = await supabase
    .schema('crossbeam')
    .from('files')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: true })

  return (
    <ProjectDetailClient
      initialProject={project}
      initialFiles={files || []}
      userId={user.id}
    />
  )
}
```

**The client component (`project-detail-client.tsx`) should:**

1. **Poll project status** every 3 seconds using `setInterval`:
   ```ts
   const { data } = await supabase
     .schema('crossbeam')
     .from('projects')
     .select('status, error_message')
     .eq('id', project.id)
     .single()
   ```
   When status changes, update local state. Stop polling when status is `completed` or `failed`.

2. **Render based on status — every state features the ADU miniature:**
   - `ready`: **THE READY STATE MUST SHINE.** This is the "before" moment. Large ADU miniature hero, project info in a clean card, file list, prominent pill-shaped CTA button ("Start Analysis" / "Run AI Review"). The CTA should be impossible to miss. See layout below.
   - `processing` / `processing-phase1` / `processing-phase2`: ADU miniature center-stage (or video loop when ready) + `<ProgressPhases>` + `<AgentStream>`. Show appropriate heading in Playfair Display.
   - `awaiting-answers`: Small ADU miniature as accent in top-right + `<ContractorQuestionsForm>`.
   - `completed`: Small "completed" ADU miniature at top as celebration header + `<ResultsViewer>`. This is the "after" — the response package is ready.
   - `failed`: Error card + "Retry" button (no miniature needed — keep it clean).

**READY STATE LAYOUT (critical for demo):**

```
┌─────────────────────────────────────────────┐
│         ┌─────────────────┐                 │
│         │  ADU miniature   │                │
│         │  (hero size)     │                │
│         │  floating on     │                │
│         │  gradient bg     │                │
│         └─────────────────┘                 │
│                                             │
│   "742 Flint Ave ADU"  (Playfair Display)   │
│   Buena Park, CA · Corrections Analysis     │
│                                             │
│   ┌────────────────────────────────┐        │
│   │ Files:                          │        │
│   │ 📄 corrections-letter.pdf      │        │
│   │ 📄 plan-binder.pdf             │        │
│   └────────────────────────────────┘        │
│                                             │
│        [🚀 Analyze Corrections]             │
│        (big pill button, moss green)        │
└─────────────────────────────────────────────┘
```

The ADU miniature uses `<AduMiniature variant="hero" />` — randomly selected, floating on the gradient. The CTA button is `rounded-full px-10 py-6 text-lg font-bold`.

3. **"Start Analysis" button handler:**
   ```ts
   const handleStartAnalysis = async () => {
     setStarting(true)
     const flowType = project.flow_type === 'city-review'
       ? 'city-review'
       : 'corrections-analysis'
     const res = await fetch('/api/generate', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         project_id: project.id,
         user_id: userId,
         flow_type: flowType,
       }),
     })
     // Status polling will detect the transition
   }
   ```

---

### components/progress-phases.tsx (NEW)

The progress dots indicator from the Design Bible: `● completed (green)` `◉ active (amber pulse)` `○ pending (gray)`

Props:
```ts
interface ProgressPhasesProps {
  phases: string[]           // e.g., ["Extract", "Research", "Review", "Generate"]
  currentPhaseIndex: number  // 0-based index of the active phase
}
```

Phases differ by flow:
- **City review:** Extract, Research, Review, Generate
- **Contractor Phase 1:** Extract, Analyze, Research, Categorize, Prepare
- **Contractor Phase 2:** Read Answers, Research, Draft, Generate

Determine `currentPhaseIndex` from the messages content (look for keywords) or default to 0.

**Rendering:**
```tsx
{phases.map((phase, i) => (
  <div key={phase} className="flex items-center gap-2">
    {i < currentPhaseIndex && (
      <span className="w-3 h-3 rounded-full bg-success" /> // ● completed
    )}
    {i === currentPhaseIndex && (
      <span className="w-3 h-3 rounded-full bg-warning animate-gentle-pulse" /> // ◉ active
    )}
    {i > currentPhaseIndex && (
      <span className="w-3 h-3 rounded-full bg-muted-foreground/30" /> // ○ pending
    )}
    <span className={cn(
      "text-sm font-body",
      i <= currentPhaseIndex ? "text-foreground" : "text-muted-foreground"
    )}>
      {phase}
    </span>
  </div>
))}
```

Lay them out horizontally with a thin line connecting dots.

---

### components/agent-stream.tsx (ADAPT from Mako's agent-activity-log.tsx)

**Design note:** The agent working screen is THE DEMO SCREEN. The ADU miniature sits above the progress phases and activity log, providing visual anchoring while the agent works. The miniature + progress dots + scrolling activity log = the "wow" moment for judges. See Design Bible screen layout #4.

Fork Mako's `components/project/agent-activity-log.tsx` with these changes:

1. **Schema:** Change `.schema('mako')` to `.schema('crossbeam')`
2. **Polling instead of realtime subscriptions:** Use `setInterval` polling every 2 seconds with `WHERE id > lastSeenId` for efficiency. Mako uses Supabase Realtime (postgres_changes) which requires additional Supabase configuration. Polling is simpler and guaranteed to work.
   ```ts
   const poll = async () => {
     const { data } = await supabase
       .schema('crossbeam')
       .from('messages')
       .select('*')
       .eq('project_id', projectId)
       .gt('id', lastSeenIdRef.current)
       .order('id', { ascending: true })
     if (data && data.length > 0) {
       setMessages(prev => [...prev, ...data])
       lastSeenIdRef.current = data[data.length - 1].id
     }
   }
   ```
3. **Remove framer-motion:** Use CSS animations instead (`animate-slide-in-left` for new messages).
4. **Styling:** Use Design Bible card styling (deep soft shadows, border-border/50) instead of Mako's dark slate styling.
5. **Role icons:** Keep the same role-based icon system (tool = WrenchIcon, assistant = BrainIcon, system = SettingsIcon) but use Design Bible color variables instead of hardcoded oklch colors.
6. **Completion detection:** When a message contains "Completed in " from role `system`, trigger a page refresh after 5 seconds (same pattern as Mako).

---

### components/contractor-questions-form.tsx (NEW)

Renders when `project.status === 'awaiting-answers'`.

1. **Fetch questions:**
   ```ts
   const { data: questions } = await supabase
     .schema('crossbeam')
     .from('contractor_answers')
     .select('*')
     .eq('project_id', projectId)
     .order('created_at', { ascending: true })
   ```

2. **Render form:**
   - Heading: "A few questions for you" (Playfair Display)
   - Subtext: "Our AI needs your input on {n} items to build the best response"
   - For each question:
     - Numbered question (`question_text`)
     - Context hint (`context`) in muted text
     - Input type based on `question_type`:
       - `text` -> `<Textarea>`
       - `number` / `measurement` -> `<Input type="text">` (measurements might include units)
       - `choice` -> Radio buttons from `options` JSONB array
     - Pre-fill with `answer_text` if already partially answered

3. **Submit handler:**
   ```ts
   const handleSubmit = async () => {
     setSubmitting(true)
     // Update each answer in contractor_answers table
     for (const answer of answers) {
       await supabase
         .schema('crossbeam')
         .from('contractor_answers')
         .update({ answer_text: answer.value, is_answered: true })
         .eq('id', answer.id)
     }
     // Trigger Phase 2
     await fetch('/api/generate', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         project_id: projectId,
         user_id: userId,
         flow_type: 'corrections-response',
       }),
     })
     // Polling will detect status change to processing-phase2
   }
   ```

4. **Styling:** Use a Card with the standard floating shadow. Pill-shaped "Submit & Generate Response" button.

---

### components/results-viewer.tsx (NEW)

Renders when `project.status === 'completed'`. Includes a small ADU miniature at the top as a "celebration" — the project is done, the house is built.

```tsx
// At the top of the results layout:
<div className="text-center space-y-4 animate-fade-up">
  <AduMiniature variant="accent" />
  <h1 className="heading-display text-foreground">Your response package is ready</h1>
</div>
```

1. **Fetch outputs:**
   ```ts
   const { data: outputs } = await supabase
     .schema('crossbeam')
     .from('outputs')
     .select('*')
     .eq('project_id', projectId)
     .order('created_at', { ascending: false })
   ```

2. **For city review (flow_phase = 'review'):**
   - Tab 1: "Corrections Letter" -- render `corrections_letter_md` as markdown
   - Tab 2: "Review Checklist" -- render `review_checklist_json` as a checklist table
   - Summary stats sidebar: agent_cost_usd, agent_turns, agent_duration_ms

3. **For contractor flow (both phases):**
   - Tab 1: "Response Letter" -- render `response_letter_md` as markdown
   - Tab 2: "Professional Scope" -- render `professional_scope_md` as markdown
   - Tab 3: "Corrections Report" -- render `corrections_report_md` as markdown
   - Summary stats sidebar

4. **Markdown rendering:**
   ```tsx
   import ReactMarkdown from 'react-markdown'
   import remarkGfm from 'remark-gfm'

   <div className="prose-crossbeam">
     <ReactMarkdown remarkPlugins={[remarkGfm]}>
       {markdownContent}
     </ReactMarkdown>
   </div>
   ```

5. **Heading:** "Your response package is ready" or "Review complete" (Playfair Display)

6. **Summary stats card:**
   ```
   Duration: {formatDuration(agent_duration_ms)}
   Agent turns: {agent_turns}
   Cost: ${agent_cost_usd?.toFixed(2)}
   ```

7. **Download button** (stretch goal -- can be a simple "Copy to clipboard" as MVP)

---

### app/api/generate/route.ts (ADAPT from Mako)

Fork Mako's `app/api/generate/route.ts` with these changes:

1. **Add `flow_type`** to the request body: `{ project_id, user_id, flow_type }`
2. **Remove credits check** entirely (lines 36-49 in Mako)
3. **Change schema reference:** `.schema('mako')` to `.schema('crossbeam')`
4. **Change table reference:** `'projects'` stays the same
5. **Pass `flow_type` to Cloud Run:**
   ```ts
   body: JSON.stringify({
     project_id,
     user_id: user.id,
     flow_type,
   })
   ```

The `flow_type` field accepts three values:
- `'city-review'` -- triggers plan-review.ts on the server
- `'corrections-analysis'` -- triggers corrections-analysis.ts (Phase 1)
- `'corrections-response'` -- triggers corrections-response.ts (Phase 2, called after answering questions)

---

### types/database.ts (REWRITE)

Full TypeScript types matching the crossbeam schema from `plan-supabase-0213.md`:

```ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ProjectStatus =
  | 'ready'
  | 'uploading'
  | 'processing'
  | 'processing-phase1'
  | 'awaiting-answers'
  | 'processing-phase2'
  | 'completed'
  | 'failed'

export type FlowType = 'city-review' | 'corrections-analysis'
export type FlowPhase = 'analysis' | 'response' | 'review'
export type FileType = 'plan-binder' | 'corrections-letter' | 'other'
export type MessageRole = 'system' | 'assistant' | 'tool'
export type QuestionType = 'text' | 'number' | 'choice' | 'measurement'

export interface Project {
  id: string
  user_id: string
  flow_type: FlowType
  project_name: string
  project_address: string | null
  city: string | null
  status: ProjectStatus
  error_message: string | null
  is_demo: boolean
  created_at: string
  updated_at: string
}

export interface ProjectFile {
  id: string
  project_id: string
  file_type: FileType
  filename: string
  storage_path: string
  mime_type: string | null
  size_bytes: number | null
  created_at: string
}

export interface Message {
  id: number  // BIGSERIAL
  project_id: string
  role: MessageRole
  content: string
  created_at: string
}

export interface Output {
  id: string
  project_id: string
  flow_phase: FlowPhase
  version: number

  // City Review outputs
  corrections_letter_md: string | null
  corrections_letter_pdf_path: string | null
  review_checklist_json: Json | null

  // Contractor Phase 1 outputs
  corrections_analysis_json: Json | null
  contractor_questions_json: Json | null

  // Contractor Phase 2 outputs
  response_letter_md: string | null
  response_letter_pdf_path: string | null
  professional_scope_md: string | null
  corrections_report_md: string | null

  // Catch-all
  raw_artifacts: Json | null

  // Agent run metadata
  agent_cost_usd: number | null
  agent_turns: number | null
  agent_duration_ms: number | null

  created_at: string
}

export interface ContractorAnswer {
  id: string
  project_id: string
  question_key: string
  question_text: string
  question_type: QuestionType
  options: Json | null       // For choice-type: string[]
  context: string | null
  correction_item_id: string | null
  answer_text: string | null
  is_answered: boolean
  created_at: string
  updated_at: string
}

// Database type for Supabase client generic
export interface Database {
  crossbeam: {
    Tables: {
      projects: {
        Row: Project
        Insert: Partial<Project> & Pick<Project, 'user_id' | 'flow_type' | 'project_name'>
        Update: Partial<Project>
      }
      files: {
        Row: ProjectFile
        Insert: Partial<ProjectFile> & Pick<ProjectFile, 'project_id' | 'file_type' | 'filename' | 'storage_path'>
        Update: Partial<ProjectFile>
      }
      messages: {
        Row: Message
        Insert: Partial<Message> & Pick<Message, 'project_id' | 'role' | 'content'>
        Update: Partial<Message>
      }
      outputs: {
        Row: Output
        Insert: Partial<Output> & Pick<Output, 'project_id' | 'flow_phase'>
        Update: Partial<Output>
      }
      contractor_answers: {
        Row: ContractorAnswer
        Insert: Partial<ContractorAnswer> & Pick<ContractorAnswer, 'project_id' | 'question_key' | 'question_text'>
        Update: Partial<ContractorAnswer>
      }
    }
  }
}
```

---

## Supabase Client Usage

**CRITICAL:** All CrossBeam queries use `.schema('crossbeam')`:

```ts
// Reading projects
const { data } = await supabase
  .schema('crossbeam')
  .from('projects')
  .select('*')
  .eq('id', projectId)
  .single()

// Polling messages (efficient)
const { data } = await supabase
  .schema('crossbeam')
  .from('messages')
  .select('*')
  .eq('project_id', projectId)
  .gt('id', lastSeenId)
  .order('id', { ascending: true })

// Updating contractor answers
await supabase
  .schema('crossbeam')
  .from('contractor_answers')
  .update({ answer_text: 'user response', is_answered: true })
  .eq('id', answerId)
```

---

## Environment Variables

Create `frontend/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://bhjrpklzqyrelnhexhlj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=(copy from existing .env.local in repo root)
CLOUD_RUN_URL=http://localhost:8080
```

For production (Vercel):
```
NEXT_PUBLIC_SUPABASE_URL=https://bhjrpklzqyrelnhexhlj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=(same)
CLOUD_RUN_URL=https://crossbeam-server-xxx.run.app
```

---

## Demo Project IDs

These UUIDs are hardcoded in the dashboard page and seed data:

| Flow | Project ID | Project Name |
|---|---|---|
| City Review | `a0000000-0000-0000-0000-000000000001` | 742 Flint Ave ADU -- City Review |
| Contractor | `a0000000-0000-0000-0000-000000000002` | 742 Flint Ave ADU -- Corrections Response |

Both projects reference 742 Flint Ave, Buena Park, CA.

---

## Design Bible Rules -- REPEAT (CRITICAL)

Read `DESIGN-BIBLE.md` before writing any code. These rules are non-negotiable:

### ALWAYS
- Use CSS variables: `bg-primary`, `text-primary-foreground`, `bg-card`, etc.
- Use `cn()` utility for conditional classes
- Playfair Display ONLY for headings 24px+ (text-2xl and above). Letter-spacing: `-0.02em`. Weight 700 for sections, 900 for heroes.
- Nunito for everything else (body, buttons, labels, form elements). Weight 400 body, 600 labels, 700 buttons.
- Deep soft shadows on cards: `shadow-[0_8px_32px_rgba(28,25,23,0.08)]`
- Generous whitespace: `p-6` minimum on cards, generous gaps
- Pill-shaped primary CTAs: `rounded-full`
- Sky-to-earth gradient background on root layout (`bg-crossbeam-gradient`) with `background-attachment: fixed`
- Card hover: `translateY(-2px)` + shadow deepens (200ms transition)
- Button hover glow: `hover:shadow-[0_0_20px_rgba(45,106,79,0.15)]`
- Status badges: pill-shaped (`rounded-full`), use semantic colors (success/warning/accent/destructive/info)
- Maintain background/foreground pairs for contrast
- **Use `<AduMiniature>` component for all ADU visuals — never raw `<img>` tags**
- **Place ADU miniatures on every major screen** (landing hero, persona cards, agent working, results header, login accent)
- **Use Next.js `<Image>` with `quality={85}`** for all ADU assets
- Animations: smooth, subtle, purposeful. Max 500ms. Easing: `cubic-bezier(0.4, 0, 0.2, 1)` or `cubic-bezier(0, 0.55, 0.45, 1)`.

### NEVER
- Hardcode colors: NO `bg-blue-600`, `text-[#2D6A4F]`, `bg-green-500`
- Use `!important`
- Add cartoon, whimsical, or fantasy decorative elements
- Add particle systems, floating leaves, cloud animations
- Use bounce or spring animations
- Use framer-motion (use CSS animations instead)
- Use Inter, Roboto, Arial, or system fonts directly
- Forget the `hsl()` wrapper in `@theme inline` (this breaks all Tailwind color utilities)
- Create new files when you can edit existing ones
- Add sidebar navigation (CrossBeam uses top nav only)
- **Use Lucide icons where an ADU miniature should go** (persona cards, hero sections)
- **Add dark mode** -- light-only for hackathon
- **Import `next-themes` or `ThemeProvider`** -- not needed

---

## Build Order (Design + Engineering Interleaved)

This build order mixes design and engineering so the app looks right from the first `npm run dev`. Each step produces a visually complete screen, not a wireframe that gets styled later.

### Phase 1: Foundation (infrastructure + visual identity)

1. **Image pipeline** -- Copy and compress ADU miniature PNGs into `frontend/public/images/adu/` (see Image Pipeline section above)
2. **Copy infrastructure files** -- middleware, supabase clients, utils, shadcn components, configs (NOT theme-provider)
3. **Write globals.css** -- Design Bible palette, `@theme inline`, gradient with `background-attachment: fixed`, topo lines, animations, typography utilities. NO dark mode.
4. **Write layout.tsx** -- Playfair + Nunito fonts, `bg-crossbeam-gradient` body, CrossBeam metadata. NO ThemeProvider.
5. **Write types/database.ts** -- CrossBeam schema types

### Phase 2: First screens (design-forward — make it beautiful immediately)

6. **Write `<AduMiniature>` component** -- Reusable component with `hero`, `card`, `accent`, `background` variants. Random selection from pool. Video-swap-ready architecture.
7. **Write `useRandomAdu` hook** -- Stable random selection per mount
8. **Write landing page** (`app/page.tsx`) -- Hero ADU miniature, headline, CTA, feature cards, topo lines background. **This is the first thing judges see.**
9. **Write login page** -- Judge button + Google OAuth + accent ADU miniature
10. **Test: `npm run dev`** -- verify landing page looks premium, gradient works on scroll, miniatures render

### Phase 3: Dashboard flow (persona cards with miniatures)

11. **Write nav-bar component** -- Simple top nav, CrossBeam branding
12. **Write dashboard layout** -- Protected, top nav
13. **Write persona-card component** -- ADU miniature hero in each card (NOT Lucide icons)
14. **Write dashboard page** -- Two persona cards with different ADU styles
15. **Test** -- verify dashboard renders, cards show miniatures, links work

### Phase 4: The demo screen (agent working + status-driven rendering)

16. **Write agent-stream component** -- Polling, message log, CSS animations
17. **Write progress-phases component** -- Progress dots (`● ◉ ○`)
18. **Write project detail client component** -- Status-driven rendering with ADU miniature on every state (hero on ready, center on processing, accent on results)
19. **Write project detail server page** -- Data fetching wrapper
20. **Test** -- verify ready state looks impressive, CTA is prominent

### Phase 5: Completion screens

21. **Write contractor-questions-form** -- Awaiting-answers state, accent miniature
22. **Write results-viewer** -- Completed state, markdown tabs, accent miniature header
23. **Write API generate route** -- Cloud Run proxy

### Phase 6: Final check

24. **Full flow test: `npm run dev`** -- Login → dashboard → project → (simulate status changes) → results
25. **Polish: hover effects, animations, stagger timings** -- ensure all animations are smooth and purposeful

---

## What NOT to Build

- No Stripe/billing UI
- No settings page
- No admin page
- No help page / documentation
- No file upload flow for new projects (stretch goal only -- the demo uses pre-seeded projects)
- No onboarding popups/tooltips (stretch goal)
- No sidebar navigation
- No signup page (judge button is sufficient)
- No complex state management (use React state + polling)
- No dark mode (no ThemeProvider, no `next-themes`, no `.dark` CSS)
- No framer-motion animations (CSS only)

This is a hackathon demo. Keep it focused: landing page, login, dashboard, project detail (status-driven), results. The ADU miniatures are on every screen. The gradient is the canvas. That is the entire app.

---

*Brief written: Feb 13, 2026*
*Revised: Feb 13, 2026 — Design integration pass (landing page, ADU miniatures, no dark mode, gradient fix, topo lines, image pipeline)*
*For: Stream 2 Claude Code instance*
*Author: Foreman Claude (orchestrating instance) + Design Claude (design direction)*
