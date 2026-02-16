# CrossBeam Frontend — Development Prompt

You are building the **CrossBeam frontend** — a Next.js 15 + shadcn/ui web app for AI-powered ADU permit review. Work is organized into **phases** — complete all tasks in a phase, then stop for verification.

## Project Overview

**Goal**: Build a premium, design-forward frontend that makes hackathon judges say "holy shit." The photorealistic ADU tilt-shift miniatures are the visual stars — they appear on every screen. The sky-to-earth gradient is the canvas. Light mode only. Magic Dirt v2 (Refined) design direction.

**Key Files**:
- `plan-stream-two-frontend.md` — Complete build spec with file-by-file instructions and code examples (THIS IS YOUR SPEC)
- `claude-task-frontend.json` — Phases and tasks (your roadmap)
- `DESIGN-BIBLE.md` — Visual design law. Every color, font, shadow, animation, and layout decision. Do not deviate.
- `design-directions/03-magic-dirt.md` — Design direction context (v2 refined)

**Reference Code**:
- `~/openai-demo/CC-Agents-SDK-test-1225/mako/frontend/` — Mako reference frontend. Fork structure (Supabase auth, middleware, polling), NOT styling.

**Reference Data**:
- `plan-supabase-0213.md` — Supabase schema (crossbeam schema, all tables)
- `design-directions/` — Mockup images for visual reference

## CRITICAL: Read Before Writing ANY Code

1. **Read `DESIGN-BIBLE.md`** in its entirety. This is the law.
2. **Read `plan-stream-two-frontend.md`** in its entirety. This is your spec with exact code to write.
3. **Read `claude-task-frontend.json`** to find your current phase and tasks.

The spec contains complete code examples for most files. Use them as your starting point.

## How Phases Work

The project is divided into 6 phases. Each phase has:
- Multiple tasks to complete
- A verification checkpoint at the end

**Your job**: Complete ALL tasks in the current phase, then STOP and give me the verification steps to test.

## Session Startup

1. **Read `claude-task-frontend.json`** — Find the current phase (first one where `status` is not `"complete"`)
2. **Find incomplete tasks** — In that phase, find tasks where `passes: false`
3. **Work through them** — Complete each task, mark `passes: true`
4. **When phase is done** — Output the verification steps and STOP

## Workflow

```
For current phase:
  For each task where passes: false:
    1. Read the task's steps carefully
    2. Read relevant sections in plan-stream-two-frontend.md for code examples
    3. Implement the task
    4. Mark passes: true in claude-task-frontend.json
    5. Git commit: "task-XXX: description"

  When all tasks in phase are done:
    1. Update phase status to "complete"
    2. Output: "Phase X complete. Verification steps:"
    3. List the verification.steps from the phase
    4. STOP and wait for user confirmation
```

## Rules

### Keep Going Within a Phase
- Do NOT stop after each task
- Complete ALL tasks in the current phase before stopping
- Only stop at phase boundaries

### Git Commits
After each task:
```bash
git add -A && git commit -m "task-XXX: Brief description"
```

### Marking Progress
When a task is done, update `claude-task-frontend.json`:
- Set task's `passes: true`
- When all tasks in phase done, set phase's `status: "complete"`

### Design Rules (NON-NEGOTIABLE)
- **Light mode only** — no `.dark` CSS, no ThemeProvider, no `next-themes`
- **ADU miniatures on every major screen** — use `<AduMiniature>` component, never raw `<img>`
- **No Lucide icons where miniatures should go** — persona cards get ADU images, NOT icons
- **CSS variables only** — no hardcoded colors like `bg-blue-600` or `text-[#2D6A4F]`
- **Playfair Display** only for headings 24px+ — **Nunito** for everything else
- **Pill-shaped CTAs** — `rounded-full` on primary action buttons
- **Deep soft shadows** — `shadow-[0_8px_32px_rgba(28,25,23,0.08)]` on cards
- **Gradient must be fixed** — `background-attachment: fixed` on `.bg-crossbeam-gradient`
- **No framer-motion** — CSS animations only. No bounce, no spring, no particles.
- **All Supabase queries use `.schema('crossbeam')`**

### Never Do These
- Do NOT skip phases
- Do NOT work on tasks from future phases
- Do NOT mark tasks complete without implementing them
- Do NOT continue past a phase boundary without user verification
- Do NOT add dark mode
- Do NOT use ThemeProvider or next-themes
- Do NOT use Lucide icons for persona card headers (use ADU miniature images)
- Do NOT use framer-motion (CSS animations only)
- Do NOT hardcode any colors

## Current Phases

| Phase | Name | Tasks | Description |
|-------|------|-------|-------------|
| 1 | Foundation | 6 | Image pipeline, infra files, globals.css, layout, types, configs |
| 2 | Design Components + First Screens | 4 | AduMiniature component, landing page, login page |
| 3 | Dashboard Flow | 4 | Nav bar, dashboard layout, persona cards with ADU images |
| 4 | Project Detail | 4 | Status-driven rendering, agent stream, progress phases |
| 5 | Completion Screens + API | 3 | Questions form, results viewer, API route |
| 6 | Integration & Polish | 3 | Full flow test, animation polish, design compliance check |

## File Structure Target

```
CC-Crossbeam/frontend/
├── public/
│   └── images/
│       └── adu/                              # 9 compressed ADU miniature PNGs
├── app/
│   ├── page.tsx                              # Landing page with ADU hero
│   ├── layout.tsx                            # Fonts, gradient, no ThemeProvider
│   ├── globals.css                           # Design Bible palette, light-only
│   ├── auth/callback/route.ts                # OAuth callback (from Mako)
│   ├── auth/signout/route.ts                 # Sign out (from Mako)
│   ├── (auth)/login/page.tsx                 # Judge + Google login
│   ├── (dashboard)/
│   │   ├── layout.tsx                        # Protected, top nav
│   │   ├── dashboard/page.tsx                # Two persona cards
│   │   └── projects/[id]/
│   │       ├── page.tsx                      # Server component (data fetch)
│   │       └── project-detail-client.tsx     # Client component (status-driven)
│   └── api/generate/route.ts                 # Cloud Run proxy
├── components/
│   ├── ui/                                   # shadcn components (from Mako)
│   ├── adu-miniature.tsx                     # Reusable ADU visual (random, video-ready)
│   ├── persona-card.tsx                      # Card with ADU image header
│   ├── agent-stream.tsx                      # Polling message log
│   ├── progress-phases.tsx                   # Progress dots (● ◉ ○)
│   ├── contractor-questions-form.tsx         # Questions for contractor flow
│   ├── results-viewer.tsx                    # Tabbed markdown results
│   └── nav-bar.tsx                           # Simple top nav
├── hooks/
│   └── use-random-adu.ts                     # Stable random ADU selection
├── lib/
│   ├── supabase/{client,server,middleware}.ts # Supabase clients (from Mako)
│   └── utils.ts                              # cn() utility (from Mako)
├── types/
│   └── database.ts                           # CrossBeam schema types
├── middleware.ts                              # Auth middleware (from Mako)
├── package.json
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── components.json                           # shadcn config (new-york style)
├── .env.local
└── .gitignore
```

## Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Dark mode | None (light-only) | Hackathon deadline — ship one polished mode |
| Animations | CSS only | No framer-motion — restraint over spectacle |
| State management | React state + polling | No Supabase Realtime — simpler, guaranteed to work |
| Image hosting | `public/` folder | Static assets → Vercel CDN auto. No Supabase Storage for these. |
| ADU selection | Random per mount | `useRandomAdu` hook — different page = different house |
| Video support | Prepared but not active | `<AduMiniature>` has `videoSrc` prop for future swap |
| Schema access | `.schema('crossbeam')` | All Supabase queries use CrossBeam schema |
| Polling interval | 2-3 seconds | Status polling for project + message updates |
| Font loading | `next/font/google` | Optimal loading with variable CSS custom properties |

## Questions?

If you're unsure about something:
1. Read `plan-stream-two-frontend.md` for detailed code examples
2. Read `DESIGN-BIBLE.md` for visual decisions
3. Check `claude-task-frontend.json` for task details
4. Ask the user for clarification

---

**Now read `claude-task-frontend.json`, find the current phase, and begin working through its tasks.**
