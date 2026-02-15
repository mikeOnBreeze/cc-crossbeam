# Frontend Critique — Round 02

## Landing Page

### Overall Impression
- Love the current look. The design is solid.

### Above-the-Fold / Viewport Fit
- **Problem:** On a 13" MacBook Pro, the hero section pushes the feature cards (Corrections Interpreter, Code Verification, Response Letter) below the fold. You have to scroll to see them.
- **Fix needed:** Tighten the landing page so that when you arrive, it feels like it fits your screen. The hero + feature cards should ideally be visible without scrolling on a standard laptop.

### Copy & Messaging
- The landing page should feel more **hackathon-oriented** — focused on the problem set, why this exists, what problem it solves.
- Reference `marketing.md` to pull in the "reasons why this should exist" messaging.
- The 1-2-3 feature cards need copy refinement — review against marketing.md.
- Below the feature cards: add more copy, leverage the visual assets we have.

### Topographic Contour Lines (Background Design Element)
- Love the contour lines (the elevation/topographic map-style lines in the background). They're rad.
- **Consider:** Adding subtle color to the contours so they're slightly more visible, while still keeping them subtle.
- **Key idea:** Bring these contour lines to OTHER pages throughout the app. They're a signature design element and should carry across the experience. Maybe they don't even need color — they just live there as a recurring motif.

### Sign In Button
- Currently it's a small, understated button in the top-right corner.
- **Fix:** Make it bigger and add color so it feels more intentional. Keep the existing subtle hover animation, but the resting state needs more presence.

---

## Login / Auth Page

### Overall Impression
- Love the look. It looks excellent.

### Randomized ADU Image
- **Bug:** The login page is supposed to show a different ADU image each time you visit. We have a bunch of assets for this. It worked once on a refresh, but most of the time it shows the same ADU. The randomizer is broken or not working reliably.

---

## Dashboard (Judge Realm — "Choose Your Perspective")

### Overall Impression
- The two-card layout (City Reviewer / Contractor) is really solid. The copy and structure feel right.

### Card Hover Animations
- Cards animate up on hover — love that, it's great.

### CTA Buttons ("Run AI Review" / "Analyze Corrections")
- **Problem:** The hover state on the green buttons is too subtle — looks like a faint inner shadow. After the card lifts up nicely on hover, the button itself doesn't feel responsive enough even though it technically is. The interaction feels flat by comparison.
- **Fix:** Give the buttons a more noticeable hover state — something that feels solid and confident. The card pops up but then the button doesn't match that energy.
- **Copy check:** "Run AI Review" and "Analyze Corrections" — are these the best labels? Open to suggestions. Might be fine, might not be a big deal, but worth a second look.

---

## City Reviewer — Review Complete Page

### ADU Image at Top
- Love the ADU images, but they take up too much vertical space at the top of the results page.
- These images are transparent PNGs (generated via Nano Banana with magenta keying). Since they're transparent, we can **overlap** the "Review complete" heading up into the image to save space. Push the text up, nudge the ADU closer to the top nav bar. The transparency gives us creative freedom here — use it.

### Corrections Letter Header
- **Problem:** The header block (DRAFT label, city info, project details, plan set info) feels sloppy. It's all there but the layout/formatting needs polish.
- **Fix:** Clean up the header — better typography hierarchy, spacing, maybe subtle card styling. It's the first thing you read and it should feel professional and structured.

### Corrections Letter Body (Plan Check Corrections)
- The actual correction items look great. Formatting is solid, reads really well.
- **Nice-to-have:** Add some color to highlight important elements (sheet references, code citations, confidence levels, etc.) — but don't overdo it, it already reads well.
- **Future feature:** Sheet references like "Sheet A1" should be clickable — clicking would pop up that sheet so you can see what the correction is talking about. (May be too complex for right now, but note it as a goal.)

### Items Reviewed Table & Review Statistics
- The table at the bottom looks excellent. Love the way those look.
- Review statistics section looks good.

### Review Checklist Tab
- **Problem:** The "Review Checklist" tab is a raw JSON dump. It's a wall of unformatted JSON data. This will confuse anyone who clicks on it.
- **Fix:** Either format this into something useful and human-readable (structured summary, checklist UI, expandable sections), or remove/hide it entirely. In its current state it actively hurts the experience.

### URL Structure
- Current URL: `projects/a0000000-0000-0000-0000-000000000001`
- **Observation:** Shouldn't it be something like `projects/city/{uuid}` to indicate this is the city reviewer flow? Not a huge deal, but worth noting for routing clarity.

---

## Contractor — "Your Response Package Is Ready" Page

### ADU Image at Top (Same Issue as City Flow)
- Same problem as the city reviewer page — the ADU image takes up too much vertical space.
- **Fix:** Tuck it beneath the top nav header with less whitespace. Bring the "Your response package is ready" heading closer to the ADU. Should be consistent with whatever solution we apply to the city flow.

### ADU Image Randomizer
- Pretty sure it's showing the same ADU every time here too. The randomizer should swap in a different ADU asset each time you visit or return to this page. Same bug as login page — needs fixing across all pages that use randomized ADU images.

### Response Letter Tab — Header Formatting
- **Problem:** The header area (from "Response to Plan Check Comments" down through the address block, permit info, date/to/from lines, and "Dear Mr. Linares") — the line spacing and formatting feel off. The divider lines, the spacing between fields, the hierarchy — it's not clean.
- **Fix:** Tighten up the header formatting. Better line spacing, clearer visual hierarchy. The rest of the letter below this header looks great, so it just needs to match that quality.

### Response Letter Tab — Body Content
- Once you get past the header into the actual "Building Plan Check Comments" responses, the formatting is excellent. Really killed it there.
- Tables are amazing.

### Professional Scope Tab
- Header formatting is actually not bad here.
- "Required Actions" section — great tables. Excellent work overall.

### Corrections Report Tab
- Tables look amazing.
- **Critical Path diagram:** Currently rendered as ASCII/monospace box art (markdown artifact). It's functional and actually kind of cool — the parallel tracks (Designer / Structural Engineer) with merge points reads well.
- **Nice-to-have:** If we can render this as a proper visual (Mermaid diagram, JSON-driven graph, SVG flowchart, etc.), that'd be awesome. But this is low priority — if it's too complex to implement right now, the ASCII version is fine. We have bigger fish to fry.

---

*Notes taken during live walkthrough — Feb 14, 2026*
