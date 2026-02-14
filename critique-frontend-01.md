# Frontend Design Critique & Fix Plan — Round 1

> **Reviewer:** Design Critic Agent (visual walkthrough via Chrome MCP)
> **Date:** Feb 13, 2026
> **Device:** 13" MacBook Air (1440x900 display, ~768px browser viewport height)
> **Screens Reviewed:** Landing, Dashboard, Project Detail (ready/processing/awaiting-answers/completed/failed)
> **Reference Docs:** `DESIGN-BIBLE.md`, `plan-stream-two-frontend.md`

---

## CRITICAL CONTEXT FOR EXECUTING AGENT

**You MUST read `DESIGN-BIBLE.md` and `plan-stream-two-frontend.md` before making any changes.** Follow the Design Bible rules exactly — no hardcoded colors, no `!important`, no bounce/spring animations, no framer-motion. Use CSS variables (`bg-primary`, `text-muted-foreground`, etc.) and `cn()` utility for all styling.

**DO NOT change code patterns, component structure, or add new dependencies.** These are CSS/spacing/opacity tweaks only. Keep edits surgical.

---

## What's Already Working (DO NOT TOUCH)

These are strengths — don't regress them:

- Playfair Display + Nunito font pairing — premium and architectural
- ADU miniature images as visual heroes — unique, photorealistic, memorable
- Persona cards using ADU images (not Lucide icons) — correct decision
- Moss green pill-shaped CTA buttons — distinctive
- Card shadows (`shadow-[0_8px_32px_rgba(28,25,23,0.08)]`) — soft and premium
- Completed results view layout (tabs, markdown prose with blockquotes) — professional
- Contractor questions form structure (numbered, with context text) — clean
- Progress phases indicator (Extract/Analyze/Research/etc.) — communicates well
- Overall color palette (moss green, warm earth tones, meadow edge borders)

---

## FIX 1: Strengthen the Gradient Bottom (HIGH PRIORITY)

**Problem:** The sky-to-earth gradient is too subtle. The warm earth tones only appear in the last 10% of the page. On most screens, the gradient looks like "sky blue → white → white → white → barely warm." The earth concept doesn't land visually.

**File:** `frontend/app/globals.css`

**Current gradient:**
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
}
```

**Change to:**
```css
.bg-crossbeam-gradient {
  background: linear-gradient(180deg,
    #F0F7FF 0%,       /* sky blue */
    #FAFCFF 12%,
    #FEFEFA 30%,      /* slightly warm white (not pure white) */
    #FFFDF8 50%,      /* warm cream — pulled UP from 70% */
    #FAF3E8 68%,      /* warm earth — pulled UP from 90% */
    #E8DCC8 85%,      /* deep soil — pulled UP from 100% */
    #D9CCAF 100%      /* NEW: deeper soil at the very bottom */
  );
}
```

**Why:** Pulling the warm stops up by 20-25% means the bottom third of the visible viewport has real warmth on every page. The 40% pure white stop is gone — replaced with a slightly warm `#FEFEFA` at 30% so the transition is smoother. Added a new deeper soil color (`#D9CCAF`) at 100% to give the very bottom more presence.

---

## FIX 2: Landing Page — Tighten Vertical Spacing (HIGH PRIORITY)

**Problem:** On a 13" MacBook Air, the landing page above the fold shows: headline, subtitle, CTA button, then ~200px of dead empty gradient before the ADU miniature starts appearing. The miniature (the visual payoff) and the feature cards are below the fold. Judges might not scroll.

**File:** `frontend/app/page.tsx`

**Changes:**

1. **Hero section** — reduce top and bottom padding:
   - Change: `pt-12 pb-8` → `pt-8 pb-2`

2. **ADU miniature section** — reduce vertical padding:
   - Change: `py-8` → `py-2`

3. **Feature cards section** — reduce bottom padding:
   - Change: `pb-20` → `pb-12`

**Specific edits (look for these exact class strings in `app/page.tsx`):**

```
FIND:    className="max-w-4xl mx-auto px-4 pt-12 pb-8 text-center space-y-6 animate-fade-up"
REPLACE: className="max-w-4xl mx-auto px-4 pt-8 pb-2 text-center space-y-5 animate-fade-up"

FIND:    className="max-w-3xl mx-auto px-4 py-8 animate-fade-up stagger-1"
REPLACE: className="max-w-3xl mx-auto px-4 py-2 animate-fade-up stagger-1"

FIND:    className="max-w-5xl mx-auto px-4 pb-20 grid gap-6 md:grid-cols-3 animate-fade-up stagger-2"
REPLACE: className="max-w-5xl mx-auto px-4 pb-12 grid gap-6 md:grid-cols-3 animate-fade-up stagger-2"
```

**Goal:** Headline + CTA + ADU miniature should all be visible without scrolling on a 13" screen. The miniature should feel like it's "part of" the hero, floating right below the CTA — not in a separate section with a gap.

---

## FIX 3: Dashboard — Get CTA Buttons Above the Fold (HIGH PRIORITY)

**Problem:** On a 13" screen, the persona card CTA buttons ("Run AI Review" / "Analyze Corrections") are clipped at the very bottom of the viewport. The heading has too much top padding.

**File:** `frontend/app/(dashboard)/dashboard/page.tsx`

**Changes:**

1. Reduce heading top padding:
   - Change: `pt-8` → `pt-2`

2. Reduce the space between heading and cards:
   - Change: `space-y-10` → `space-y-6`

**Specific edits:**
```
FIND:    className="space-y-10 animate-fade-up"
REPLACE: className="space-y-6 animate-fade-up"

FIND:    className="text-center space-y-2 pt-8"
REPLACE: className="text-center space-y-2 pt-2"
```

**File:** `frontend/components/persona-card.tsx`

Reduce the miniature container height inside persona cards:
```
FIND:    className="relative w-full h-48 flex items-center justify-center"
REPLACE: className="relative w-full h-40 flex items-center justify-center"
```

**Goal:** Both CTA buttons should be fully visible without scrolling on a 13" screen.

---

## FIX 4: Ready State (Project Detail) — Tighten Layout (HIGH PRIORITY)

**Problem:** On the project detail ready state, the ADU hero miniature is large, followed by the project name, badges, file list, and then the CTA button. On a 13" screen the CTA is completely below the fold. The most important action on the page requires scrolling.

**File:** `frontend/app/(dashboard)/projects/[id]/project-detail-client.tsx`

**Find the ready state rendering section and make these changes:**

1. The ADU miniature in the ready state should use a smaller variant. Change from `variant="hero"` to `variant="card"` (or if using a custom size, reduce the max dimensions).

2. Tighten spacing around the project info and file list. Look for the wrapper div and reduce padding/gaps. Typical patterns to look for and reduce:
   - `space-y-8` → `space-y-4`
   - `py-8` or `pt-8` → `py-4` or `pt-4`
   - `space-y-6` → `space-y-4`
   - Any `mb-8` → `mb-4`

3. The CTA button should be as close to the file list as possible — no large gaps.

**Goal:** On a 13" screen, the miniature + project name + file list + CTA should ALL be visible without scrolling. The CTA is the action moment — it must be above the fold.

---

## FIX 5: Topo Lines — Increase Visibility (MEDIUM PRIORITY)

**Problem:** The topographic contour lines are barely perceptible at 15% opacity. At normal viewing distance they're invisible. The concept is great but needs more presence.

**File:** `frontend/app/globals.css`

**Find the `.bg-topo-lines::before` rule and change:**
```
FIND:    opacity: 0.15;
REPLACE: opacity: 0.22;
```

**Also increase the stroke width in the SVG data URI within the same rule:**
```
FIND:    stroke-width='0.5'
REPLACE: stroke-width='0.8'
```

Note: This `stroke-width` appears multiple times in the SVG data URI string (once per `<path>`). Replace ALL occurrences within that `background-image` URL.

**Goal:** The topo lines should be a "oh, that's a nice touch" detail, not invisible.

---

## FIX 6: Questions Form — Reduce Top Spacing (MEDIUM PRIORITY)

**Problem:** The awaiting-answers screen has an accent miniature + heading + subtext consuming ~280px before the first question appears. The questions are the content — the miniature wastes vertical real estate on a 13" screen.

**File:** `frontend/app/(dashboard)/projects/[id]/project-detail-client.tsx` (look for the awaiting-answers state rendering)

**Options (pick one):**

**Option A (preferred):** Remove the miniature entirely from the questions screen. The questions ARE the content. Just show the heading "A few questions for you" + subtext + questions form.

**Option B:** Keep the miniature but make it smaller — change from `variant="accent"` (140px) to an inline element alongside the heading:
```tsx
<div className="flex items-center justify-center gap-4">
  <AduMiniature variant="accent" className="!max-w-[80px]" />
  <div>
    <h1 className="heading-section text-foreground">A few questions for you</h1>
    <p className="text-muted-foreground font-body">Our AI needs your input...</p>
  </div>
</div>
```

**Goal:** First question visible above the fold without scrolling.

---

## FIX 7: Processing State — Tighten Layout (LOWER PRIORITY)

**Problem:** On the processing screen, the ADU miniature + heading + progress phases + activity log card are vertically spread out. On a 13" screen you'd need to scroll to see the activity log.

**File:** `frontend/app/(dashboard)/projects/[id]/project-detail-client.tsx` (processing state section)

**Changes:** Reduce spacing between the miniature and the heading/progress phases. Look for `space-y-*` or `py-*` gaps in the processing state and reduce them by 2-4 units (e.g., `space-y-8` → `space-y-4`).

**Goal:** The full processing screen (miniature + heading + progress dots + at least the top of the activity log) should be visible without scrolling.

---

## NOT DOING (out of scope for this round)

- **Summary stats sidebar on completed view** — would add credibility (Duration, Agent turns, Cost) but requires more work than a CSS tweak. Save for a later pass if time allows.
- **Failed state background miniature** — the failed state is clean and functional as-is.
- **Nav bar changes** — the landing nav vs dashboard nav inconsistency is fine for the demo.
- **Dark mode** — explicitly excluded per Design Bible.

---

## Execution Order

Do these in order. After each fix, verify with `npm run dev` on a 13" viewport:

1. **Fix 1** — Gradient (globals.css) — 2 min
2. **Fix 5** — Topo lines (globals.css) — 2 min
3. **Fix 2** — Landing page spacing (page.tsx) — 3 min
4. **Fix 3** — Dashboard spacing (dashboard/page.tsx + persona-card.tsx) — 3 min
5. **Fix 4** — Ready state spacing (project-detail-client.tsx) — 5 min
6. **Fix 6** — Questions form miniature (project-detail-client.tsx) — 3 min
7. **Fix 7** — Processing state spacing (project-detail-client.tsx) — 3 min

**Total estimated time: ~20 minutes**

Run `npm run build` after all changes to verify no build errors.

---

## Verification Checklist

After all fixes, open `localhost:3000` in a 768px-tall browser window and verify:

- [ ] Landing page: headline + CTA + ADU miniature visible without scrolling
- [ ] Landing page: gradient visibly warm in the bottom third of the viewport
- [ ] Landing page: topo lines faintly visible (squint test)
- [ ] Dashboard: both persona card CTA buttons visible without scrolling
- [ ] Ready state: miniature + project info + CTA button visible without scrolling
- [ ] Processing state: miniature + heading + progress dots + top of activity log visible
- [ ] Questions form: first question visible without scrolling
- [ ] Completed state: tabs and start of content visible (should already be fine)
- [ ] `npm run build` passes with no errors
