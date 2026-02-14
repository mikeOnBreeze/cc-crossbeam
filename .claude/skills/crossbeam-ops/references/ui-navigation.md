---
title: "UI Navigation Guide"
category: operations
relevance: "When navigating the CrossBeam UI via Chrome browser automation"
---

# CrossBeam UI Navigation

## Routes

| Route | Auth Required | Description |
|-------|--------------|-------------|
| `/` | No | Landing page with sign-in link |
| `/login` | No | Login page (redirects to dashboard if already signed in) |
| `/dashboard` | Yes | Main hub — persona cards for City Reviewer and Contractor |
| `/projects/:id` | Yes | Project detail page — progress, agent stream, results |

## Login

**Judge demo account:**
- Email: `judge@crossbeam.app`
- Password: `crossbeam-hackathon-2026`

**Google OAuth:** Also available via Supabase Auth

## Dashboard Page

Two persona cards:
1. **City Reviewer** → links to judge city project (`b0000000-0000-0000-0000-000000000001`)
2. **Contractor** → links to judge contractor project (`b0000000-0000-0000-0000-000000000002`)

Each card has a CTA button that navigates to the project detail page.

## Project Detail Page (`/projects/:id`)

### States and UI:

**ready** — Shows "Run AI Review" / "Analyze Corrections" button
**processing / processing-phase1 / processing-phase2** — Shows:
- Progress phases bar (5 phases for contractor, 4 for city)
- Agent stream (live messages feed, polls every 2 seconds)
- ADU miniature visualization

**awaiting-answers** — Shows:
- Contractor questions form (checkboxes, text inputs, dropdowns)
- "Submit Answers" button → triggers corrections-response flow

**completed** — Shows:
- Results viewer with tabs:
  - Corrections analysis / response letter / professional scope / corrections report
  - Agent metrics (duration, turns, cost)
- Rendered markdown via ReactMarkdown

**failed** — Shows error message from `project.error_message`

### Key Interactive Elements:

- **"Run Analysis" button** — triggers POST to `/api/generate`
- **"Reset Project" button** — triggers POST to `/api/reset-project` (demo projects only)
- **Contractor Q&A form** — checkboxes + text inputs for each question
- **"Submit Answers & Generate Response" button** — submits answers + triggers Phase 2

## App Modes (DevTools)

Three modes stored in `localStorage` key `crossbeam-app-mode`:

| Mode | Default | DevTools | Description |
|------|---------|----------|-------------|
| `judge-demo` | Yes | Hidden | Pre-seeded judge projects, clean UI |
| `dev-test` | No | Visible | DevTools panel, demo project IDs |
| `real` | No | Hidden | Placeholder for production |

**Switch mode:** Open browser console, run:
```javascript
localStorage.setItem('crossbeam-app-mode', 'dev-test')
window.dispatchEvent(new Event('app-mode-change'))
location.reload()
```

**DevTools panel** (dev-test mode only, bottom-right corner):
- Flow toggle (City Review / Contractor)
- State navigation buttons (ready → processing → completed)
- Timeline slider (0-100% phase progress)
- Play/pause auto-advance
- Auto-fill contractor answers
- Quick navigation links
