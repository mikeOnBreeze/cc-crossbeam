---
name: product-demo-video
description: Generate 2-minute product demo videos for technical projects (GitHub repos, APIs, technical products). Runs parallel build options with structured critic review. Use when demoing code, explaining architecture, or creating explainer videos.
metadata: {"clawdbot":{"emoji":"🎬"}}
---

# Product Demo Video

Generate 2-minute product demo videos for technical projects with parallel build options and structured critic review.

## When to Use

- Demoing a GitHub repo, API, or technical product
- Need professional explainer video quickly
- Want multiple approach options (animated vs simple)

## Workflow (7 Phases)

```
DISCOVERY → SCRIPT → PARALLEL BUILD → PARALLEL CRITICS → ITERATE → FINAL → DELIVER
   │           │           │                │              │          │         │
 5-10m      10-15m      30-60m           10-15m        0-3 loops   gate    ship it
```

---

## Phase 1: Discovery

**Clone and analyze the repo:**
```bash
gh repo clone <owner/repo> /tmp/<repo>
```

**Extract:**
- What it does (1 sentence)
- Who it's for
- 3-5 key features
- Architecture/flow
- Visual assets (logos, diagrams)

**Ask (or use defaults):**

| Question | Default |
|----------|---------|
| Duration | 2 min |
| Audience | Mixed (tech + business) |
| Tone | Professional-conversational |
| Format | Animated explainer |

---

## Phase 2: Script

Use `references/script-template.md` structure:

```
Scene 1: Hook (0:00-0:15) — Problem statement
Scene 2: Context (0:15-0:30) — Why this matters
Scene 3-5: Features (0:30-1:30) — 3 key capabilities, 20s each
Scene 6: Technical (1:30-1:50) — Architecture/credibility
Scene 7: CTA (1:50-2:00) — What to do next
```

**Guidelines:**
- 150 words/minute
- Max 20 words/sentence
- Active voice
- Concrete over vague

---

## Phase 3: Parallel Build

Spawn 2 sub-agents to build options simultaneously:

```typescript
// Option A: Remotion (animated)
sessions_spawn({
  label: "demo-video-option-a",
  task: `Build animated demo video using Remotion.
  
  Script: [paste script]
  Voice: Use ElevenLabs, voice ID CcEB0ARKH8qIyzh2I1OR
  Output: /tmp/demo-video/option-a.mp4
  
  Approach:
  1. Generate voiceover per scene (ElevenLabs API)
  2. Create Remotion project with scene components
  3. Sync animations to audio timing
  4. Render at 1080p 30fps`
})

// Option B: Slides + ffmpeg (simple)
sessions_spawn({
  label: "demo-video-option-b", 
  task: `Build slide-based demo video.
  
  Script: [paste script]
  Voice: Use ElevenLabs, voice ID CcEB0ARKH8qIyzh2I1OR
  Output: /tmp/demo-video/option-b.mp4
  
  Approach:
  1. Generate voiceover (ElevenLabs API)
  2. Create slides with Puppeteer (HTML → PNG)
  3. Combine with ffmpeg, sync to audio
  4. Add simple transitions`
})
```

**Wait for both.** Present options to user or auto-select based on quality.

---

## Phase 4: Parallel Critics

Spawn 2 critic personas (see `references/` for full rubrics):

```typescript
// Business Critic
sessions_spawn({
  label: "critic-business",
  task: `Review demo video as Business Critic "Mike".
  
  Video: [path]
  Script: [content]
  
  See references/critic-business.md for full persona and rubric.
  
  Score: Clarity, Professionalism, Business Value (1-10 each)
  Output: Structured review with overall score and specific fixes.`
})

// Technical Critic  
sessions_spawn({
  label: "critic-technical",
  task: `Review demo video as Technical Critic "Senior Engineer".
  
  Video: [path]
  Script: [content]
  
  See references/critic-technical.md for full persona and rubric.
  
  Score: Technical Accuracy, Credibility, Completeness (1-10 each)
  Output: Structured review with overall score and specific fixes.`
})
```

---

## Phase 5: Iterate

**Quality gates:**

| Gate | Action |
|------|--------|
| Both critics ≥7.5, no Critical issues | → Ship |
| Any critic <7.0 OR Critical issue | → Iterate |
| After 3 iterations, still failing | → Escalate to human |

**Iteration loop:**
1. Collect all Critical/Important issues
2. Fix in order of severity
3. Re-render affected scenes only (if possible)
4. Re-run critics

---

## Phase 6: Final Review

Before shipping, verify:
- [ ] Both critics passed (7.5+)
- [ ] No Critical issues remain
- [ ] Audio synced correctly
- [ ] All scenes render cleanly
- [ ] CTA is clear

---

## Phase 7: Deliver

**Output:**
```
✅ Demo video complete!

📹 Video: demo-video-final.mp4 (2:03)
🎯 Audience: [target]
📊 Scores: Business 8.2/10 | Technical 7.8/10

Covers:
1. [Key point 1]
2. [Key point 2]  
3. [Key point 3]

Files saved to: [location]
```

**Deliver to:**
- Slack channel (if specified)
- Save to workspace/outputs/

---

## Tools & Dependencies

| Tool | Purpose | Required |
|------|---------|----------|
| ElevenLabs | Voiceover generation | Yes |
| Remotion | React video framework (Option A) | One of A/B |
| ffmpeg | Video processing (Option B) | One of A/B |
| Puppeteer | Slide screenshots (Option B) | One of A/B |
| sessions_spawn | Parallel sub-agents | Yes |

**Voice default:** `CcEB0ARKH8qIyzh2I1OR` (Jeremy - Technical Tutorial Narrator)

---

## File References

- `references/critic-business.md` — Business critic persona & rubric
- `references/critic-technical.md` — Technical critic persona & rubric
- `references/script-template.md` — Scene-by-scene script structure
- `templates/remotion/` — Remotion project scaffold with components
- `scripts/generate-voiceover.py` — ElevenLabs TTS helper
- `scripts/render-slides.sh` — ffmpeg slide-to-video combiner
