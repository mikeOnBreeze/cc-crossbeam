# Product Demo Video Workflow Analysis

A breakdown of the workflow used to create professional demo videos for technical projects, based on the Magnite SIMID POC video production.

---

## Overview

The workflow produces **2-minute explainer videos** with:
- Professional voiceover (ElevenLabs)
- Parallel build options (Remotion vs ffmpeg)
- Multi-persona critic review with quantified quality gates
- Iterative refinement loop

**Key insight:** Parallel execution + persona-based critics catch more issues faster than sequential review.

---

## The 7-Phase Pipeline

```
1. DISCOVERY     → Clone/read the repo, understand what was built
2. SCRIPT        → Write scene-by-scene voiceover script (~2 min target)
3. PARALLEL BUILD → Spawn 2 sub-agents: Option A (Remotion) + Option B (slides)
4. PARALLEL CRITICS → Spawn 2 critics: Business + Technical personas
5. ITERATE       → Address feedback, regenerate problem scenes
6. FINAL REVIEW  → Both critics approve (7.5+/10)
7. DELIVER       → Send to Slack with summary
```

**Time budget:**
| Phase | Time |
|-------|------|
| Discovery | 5-10 min |
| Script | 10-15 min |
| Parallel Build | 30-60 min |
| Critics | 10-15 min |
| Iterate | 0-3 loops |
| Final/Deliver | 5 min |

Total: **1-2 hours** for a polished video (faster with iteration-free passes)

---

## The Critic Personas

### Business Critic — "Mike"

**Role:** VP of Business Development evaluating a partner pitch

**Scoring criteria:**
- **Clarity (1-10):** Can I explain this to my boss in 30 seconds?
- **Professionalism (1-10):** Would I show this to partners?
- **Business Value (1-10):** Is the value proposition clear?

**What Mike catches:**
- Jargon that loses non-technical stakeholders
- Missing "so what?" explanations
- Weak CTAs
- Pacing issues (too fast/slow)

**Example feedback:** "Show me the click, not the code. The partner doesn't care about the protocol handshake — they care that users can tap and buy."

---

### Technical Critic — "Senior SDK Engineer"

**Role:** 10+ year veteran evaluating technical accuracy

**Scoring criteria:**
- **Technical Accuracy (1-10):** Is this correct? Does it follow the spec?
- **Credibility (1-10):** Would a peer engineer respect this?
- **Completeness (1-10):** Are key technical details covered?

**What the Engineer catches:**
- Overclaims ("production-ready" when it's a POC)
- Missing caveats (error handling, edge cases)
- Incorrect terminology
- Architecture diagrams that don't match reality

**Example feedback:** "Change 'production-ready' to 'integration-ready reference implementation.' This is real code but needs retry logic and rate limiting for production."

---

## Quality Gates

| Gate | Criteria | Action |
|------|----------|--------|
| ✅ Ship | Both critics ≥7.5/10, no Critical issues | Deliver |
| 🔄 Iterate | Any critic <7.0 OR any Critical issue | Fix and re-review |
| ⛔ Escalate | 3+ iterations without passing | Human review |

**Issue severity:**
- **Critical:** Factually wrong, misleading, or embarrassing if shipped
- **Important:** Noticeably hurts quality, should fix
- **Nice-to-have:** Polish items, fix if time allows

---

## Parallel Execution Model

**Why parallel?**

1. **Build options:** Two approaches simultaneously means you can pick the best result instead of hoping your one approach works
2. **Critics:** Business and Technical personas evaluate simultaneously, cutting review time in half
3. **Iteration:** If critics flag different scenes, fixes can parallelize

**Implementation:**
```typescript
// Spawn sub-agents for parallel work
sessions_spawn({
  label: "demo-video-option-a",
  task: "Build Remotion version...",
})

sessions_spawn({
  label: "demo-video-option-b",
  task: "Build slides version...",
})

// Wait for both, compare results
```

---

## Tools Used

| Tool | Purpose |
|------|---------| 
| **sessions_spawn** | Parallel sub-agents for builds + critics |
| **Remotion** | React-based video rendering (Option A) |
| **ffmpeg** | Video assembly from segments (Option B) |
| **Puppeteer** | Capture HTML slides as images |
| **ElevenLabs** | Professional voiceover (Jeremy voice) |

---

## What Made It Successful

1. **Script first, video second**
   - Getting the narrative right before rendering saves hours of re-work
   - 150 words/minute, max 20 words/sentence, active voice

2. **Persona-based critics**
   - Business + Technical perspectives catch different issues
   - Quantified thresholds (7.5+ to ship) remove subjective debate

3. **Parallel execution**
   - Build two video options simultaneously
   - Critique both, pick the best
   - Sub-agents can regenerate specific scenes without restarting

4. **Iteration is cheap**
   - Critics flag specific scenes
   - Only re-render what's broken
   - Max 3 iterations before escalating

5. **Clear quality gates**
   - No ambiguity about "good enough"
   - Scores provide objective decision criteria

---

## Adapting This Workflow

**For your own projects:**

1. **Clone the skill:** `npx skills add smb-pbc/agent-skills@product-demo-video`

2. **Customize critics:** Edit `references/critic-business.md` and `references/critic-technical.md` with personas relevant to your domain

3. **Adjust script template:** Modify `references/script-template.md` for your typical content structure

4. **Swap tools:** If you prefer different TTS or video tools, update the build scripts

**The workflow is tool-agnostic.** The key patterns are:
- Parallel builds
- Persona-based review
- Quantified quality gates
- Iterative refinement

---

## Example: Magnite SIMID POC

**Input:** GitHub repo with iOS/Android SIMID implementation

**Output:** 2-minute video explaining:
- The $50B streaming ad problem (can't click those ads)
- How SIMID enables interactive overlays
- What we actually built (apps, creatives, test server)
- Why it matters for Magnite's partners

**Scores:** Business 8.2/10, Technical 7.8/10

**Time:** ~90 minutes from repo clone to final video

---

*This workflow is packaged as an agent skill at `skills/product-demo-video/SKILL.md`*
