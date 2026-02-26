import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AduMiniature } from '@/components/adu-miniature'
import {
  FileTextIcon,
  SearchIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  DollarSignIcon,
  CpuIcon,
  LayersIcon,
  GlobeIcon,
  ServerIcon,
  EyeIcon,
  DatabaseIcon,
  RadioIcon,
  WrenchIcon,
  LandmarkIcon,
  CheckCircle2Icon,
  ClockIcon,
  CompassIcon,
  GitBranchIcon,
  PlayIcon,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="bg-topo-lines">
      {/* Nav */}
      <nav className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="heading-card text-cyan-700">CrossBeam Oahu</span>
          <Badge variant="outline" className="text-[10px] tracking-wide">Honolulu ADU / ʻOhana Review</Badge>
        </div>
        <div className="flex items-center gap-2">
          <a href="#demo">
            <Button
              variant="outline"
              className="font-body font-semibold text-cyan-700 border-cyan-600 hover:bg-cyan-50 hover:text-cyan-800"
            >
              Watch Demo
            </Button>
          </a>
          <Link href="/dashboard">
            <Button className="font-body font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
              Try It Live
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 pt-4 pb-2 text-center space-y-4 animate-fade-up">
        <p className="text-sm text-muted-foreground font-body tracking-widest uppercase">
          AI-Powered ADU & ʻOhana Review for Honolulu
        </p>
        <h1 className="heading-display text-foreground">
          CrossBeam Oahu for<br />Honolulu ADU & ʻOhana Units
        </h1>
        <p className="text-lg text-muted-foreground font-body max-w-2xl mx-auto">
          A Honolulu builder gets a 12-item corrections letter from DPP. Instead of waiting weeks
          for responses, CrossBeam Oahu reviews the plans, checks ROH Chapter 21 and SB3202, and
          drafts a code-cited reply in minutes.
        </p>
        <p className="text-base text-muted-foreground/80 font-body max-w-2xl mx-auto">
          Built around Honolulu&apos;s ADU and ʻohana rules: zoning, BWS clearances, parking near bus
          routes, and HFD access. Skills-first design, multi-agent orchestration, full-res plan
          processing with Claude Opus 4.6.
        </p>
        <div className="flex justify-center gap-6 pt-1 text-sm text-muted-foreground font-body">
          <span><strong className="text-foreground">ROH 21</strong> + SB3202 encoded</span>
          <span className="text-border">|</span>
          <span><strong className="text-foreground">4</strong> specialized review agents</span>
          <span className="text-border">|</span>
          <span><strong className="text-foreground">Honolulu</strong> first, Oahu-wide next</span>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <a href="#demo">
            <Button
              className="rounded-full px-8 py-5 text-base font-bold font-body bg-cyan-700 hover:bg-cyan-800 text-white"
              size="lg"
            >
              <PlayIcon className="w-4 h-4 mr-2" />
              Watch Demo
            </Button>
          </a>
          <Link href="/dashboard">
            <Button
              variant="outline"
              className="rounded-full px-8 py-5 text-base font-bold font-body border-emerald-600 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
              size="lg"
            >
              Try It Live
            </Button>
          </Link>
          <a href="https://github.com/mikeOnBreeze/cc-crossbeam" target="_blank" rel="noopener noreferrer">
            <Button
              variant="outline"
              className="rounded-full px-8 py-5 text-base font-bold font-body border-blue-600 text-blue-700 hover:bg-blue-50 hover:text-blue-900"
              size="lg"
            >
              <GitBranchIcon className="w-4 h-4 mr-2" />
              View Source
            </Button>
          </a>
        </div>
      </section>

      {/* ADU Miniature */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 py-1 animate-fade-up stagger-1">
        <AduMiniature variant="hero" />
      </section>

      {/* Demo Video */}
      <section id="demo" className="relative z-10 max-w-4xl mx-auto px-4 py-10 animate-fade-up stagger-2">
        <h2 className="heading-section text-foreground text-center mb-2">See it in action</h2>
        <p className="text-sm text-muted-foreground font-body text-center mb-6">
          Walkthrough of an ADU/ʻohana corrections letter as it would move through Honolulu DPP &mdash;
          items parsed, verified against ROH and SB3202, and answered with local code citations.
        </p>
        <div className="aspect-video rounded-xl overflow-hidden shadow-[0_12px_48px_rgba(28,25,23,0.12)] border border-border/50">
          <iframe
            src="https://www.youtube.com/embed/jHwBkFSvyk0"
            title="CrossBeam Demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        <div className="flex justify-center gap-4 mt-4">
          <span className="inline-flex items-center gap-1.5 bg-muted/60 rounded-full px-3 py-1 text-xs font-body text-muted-foreground">
            <ClockIcon className="w-3 h-3" /> Duration: ~15 min
          </span>
          <span className="inline-flex items-center gap-1.5 bg-muted/60 rounded-full px-3 py-1 text-xs font-body text-muted-foreground">
            <CpuIcon className="w-3 h-3" /> Agent Turns: ~50
          </span>
          <span className="inline-flex items-center gap-1.5 bg-muted/60 rounded-full px-3 py-1 text-xs font-body text-muted-foreground">
            <DollarSignIcon className="w-3 h-3" /> Cost: ~$3
          </span>
        </div>
      </section>

      {/* The Pipeline — Anatomy of a Corrections Flow */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <h2 className="heading-section text-foreground text-center mb-2">Anatomy of a Corrections Flow</h2>
        <p className="text-sm text-muted-foreground font-body text-center mb-8 max-w-2xl mx-auto">
          From PDF upload to professional response letter &mdash; four stages, three
          infrastructure layers, all orchestrated by Claude Opus 4.6.
        </p>

        <div className="space-y-0">
          {/* Step 1 */}
          <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.06)] border-border/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileTextIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="heading-card text-foreground">1. PDF Pre-Processing</h3>
                    <Badge variant="outline" className="text-[10px]">Cloud Run</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground font-body">
                    Construction plans arrive as massive PDFs &mdash; 7,400px &times; 4,000px+
                    at full resolution. Cloud Run splits them into individual PNGs
                    via <code className="text-xs bg-muted px-1.5 py-0.5 rounded">pdftoppm</code> +
                    ImageMagick, archives them, and uploads to Supabase Storage.
                  </p>
                  <p className="text-xs text-muted-foreground/60 font-body">
                    Why Cloud Run: too heavy for the 4GB Vercel Sandbox. Keeps the sandbox pure AI.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="w-px h-6 bg-border/60 mx-auto" />

          {/* Step 2 */}
          <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.06)] border-border/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <LayersIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="heading-card text-foreground">2. Skill Loading</h3>
                    <Badge variant="outline" className="text-[10px]">Vercel Sandbox</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground font-body">
                    Skills are copied into the sandbox filesystem. The California ADU
                    skill (28 reference files) uses a decision tree router to load only the
                    3-5 files relevant to each query &mdash; not dumped as one giant prompt.
                    City research and corrections interpreter skills load alongside.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="w-px h-6 bg-border/60 mx-auto" />

          {/* Step 3 */}
          <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.06)] border-border/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CpuIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="heading-card text-foreground">3. Agent Execution</h3>
                    <Badge variant="outline" className="text-[10px]">Agent SDK + Opus 4.6</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground font-body">
                    The lead agent reads the corrections letter via vision, parses each
                    item, then launches subagents: code research (state law + city municipal
                    code via web search) and plan page analysis (vision on specific PNGs).
                    Rolling window of 3 concurrent subagents &mdash; as each completes, the
                    next launches.
                  </p>
                  <div className="bg-muted/40 rounded-lg p-3 font-mono text-xs text-muted-foreground">
                    query(&#123; prompt, options: &#123; tools: &#123; preset: &apos;claude_code&apos; &#125;, model: &apos;claude-opus-4-6&apos; &#125; &#125;)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="w-px h-6 bg-border/60 mx-auto" />

          {/* Step 4 */}
          <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.06)] border-border/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DatabaseIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="heading-card text-foreground">4. Results Pipeline</h3>
                    <Badge variant="outline" className="text-[10px]">Supabase Realtime</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground font-body">
                    Outputs are read from the sandbox filesystem, uploaded to Supabase
                    Storage, and written to the <code className="text-xs bg-muted px-1.5 py-0.5 rounded">outputs</code> table.
                    Contractor questions feed into an interactive Q&amp;A loop. Supabase
                    Realtime pushes every status update to the frontend &mdash; no polling.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Built for Real People */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 py-10">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.06)] border-l-4 border-l-primary border-border/50">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <WrenchIcon className="w-5 h-5 text-primary" />
                <h3 className="heading-card text-foreground">The Builder</h3>
              </div>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">
                Kai from <strong className="text-foreground">Aloha Builders</strong> gets a 12-item corrections letter
                from Honolulu DPP for an ʻohana unit in Kapahulu. Instead of weeks of back-and-forth
                with consultants, CrossBeam Oahu reads the plans, cross-references ROH Chapter 21 and
                BWS requirements, and drafts a professional response with Hawaii-specific citations.
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.06)] border-l-4 border-l-secondary border-border/50">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <LandmarkIcon className="w-5 h-5 text-secondary" />
                <h3 className="heading-card text-foreground">The Mayor</h3>
              </div>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">
                The Honolulu DPP plan review team is under pressure to approve more ADUs and ʻohana units
                to meet SB3202 housing targets. With CrossBeam Oahu, reviewers get city- and state-grounded
                draft corrections letters, BWS clearance checks, and HFD access notes in minutes instead of hours.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Skills Architecture */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        <h2 className="heading-section text-foreground mb-2">Honolulu Rules, Not One Giant Prompt</h2>
        <p className="text-sm text-muted-foreground font-body mb-8 max-w-2xl">
          The Honolulu ADU skill encodes ROH Chapter 21, DPP guidance, BWS ʻOhana/ADU Pre-Form rules,
          and Hawaii SB3202 (Act 39) as structured reference files. A decision tree router loads only
          the 3-5 files relevant to each question.
        </p>
        <div className="grid gap-8 md:grid-cols-[1fr,1fr]">
          <div className="space-y-4">
            <div className="space-y-3 text-sm text-muted-foreground font-body leading-relaxed">
              <p>
                <strong className="text-foreground">Decision tree, not keyword search.</strong>{' '}
                The router classifies each question through 4 steps: lot type &rarr;
                construction type &rarr; situational modifiers &rarr; process/fees. Each
                step maps to specific reference files.
              </p>
              <p>
                <strong className="text-foreground">Selective loading.</strong>{' '}
                A question about setbacks on a single-family lot loads 3 files. A question
                about fire sprinklers in a coastal zone loads 2 different files. The agent
                never sees all 28 at once &mdash; just what&apos;s relevant.
              </p>
              <p>
                <strong className="text-foreground">Authoritative source.</strong>{' '}
                ROH Chapter 21 (Land Use Ordinance), Honolulu DPP standard details, BWS rules, and
                SB3202 timelines for allowing at least two ADUs on residential lots.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="bg-muted/40 rounded-lg px-3 py-2 text-xs font-body">
                <span className="text-foreground font-semibold">Height:</span>{' '}
                <span className="text-muted-foreground">16-25 ft by type</span>
              </div>
              <div className="bg-muted/40 rounded-lg px-3 py-2 text-xs font-body">
                <span className="text-foreground font-semibold">Size:</span>{' '}
                <span className="text-muted-foreground">850-1,200 sq ft</span>
              </div>
              <div className="bg-muted/40 rounded-lg px-3 py-2 text-xs font-body">
                <span className="text-foreground font-semibold">Setbacks:</span>{' '}
                <span className="text-muted-foreground">4 ft max side/rear</span>
              </div>
              <div className="bg-muted/40 rounded-lg px-3 py-2 text-xs font-body">
                <span className="text-foreground font-semibold">Parking:</span>{' '}
                <span className="text-muted-foreground">max 1, 6 exemptions</span>
              </div>
            </div>
          </div>
          <div>
            <pre className="bg-muted/30 border border-border/50 rounded-xl p-5 text-xs font-mono text-muted-foreground leading-relaxed overflow-x-auto">
{`honolulu-adu/
├── SKILL.md            ← Decision tree router
├── references/
│   ├── ordinance-adu-standards.md   (lot size, coverage, setbacks)
│   ├── ordinance-adu-rules.md       (permitted zones, CPR rules, owner occupancy)
│   ├── compliance-water.md          (BWS Pre-Form, meters, capacity)
│   ├── transit-parking.md           (bus stop waivers, TOD parking)
│   └── context-housing-sb3202.md    (state mandate, HOA limits)
└── Local Honolulu rules only — no web scraping`}
            </pre>
          </div>
        </div>
      </section>

      {/* Multi-Agent PDF Processing */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <h2 className="heading-section text-foreground mb-2">One Page Per Subagent</h2>
        <p className="text-sm text-muted-foreground font-body mb-6 max-w-2xl">
          Construction plan PDFs are 15-26 pages of dense CAD drawings, watermarks,
          stamps, and tiny annotations. Processing them required solving a real
          constraint in the Claude API.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.06)] border-border/50">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangleIcon className="w-5 h-5 text-accent" />
                <h3 className="heading-card text-foreground">The Problem</h3>
              </div>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">
                Multi-page batches accumulate images in the conversation context.
                Claude&apos;s API limits: &gt;20 images caps each at 2,000px. Full-res
                plans are <strong className="text-foreground">7,400px wide</strong> &mdash;
                forced downscaling destroys the detail that matters for permit review.
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.06)] border-border/50">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <EyeIcon className="w-5 h-5 text-primary" />
                <h3 className="heading-card text-foreground">The Solution</h3>
              </div>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">
                One page per subagent. Each gets exactly 1 full-res PNG &mdash; no image
                accumulation, no forced resize. Rolling window: 3 concurrent subagents,
                new one launches as each completes.
              </p>
            </CardContent>
          </Card>
        </div>
        <Card className="mt-6 shadow-[0_8px_32px_rgba(28,25,23,0.06)] border-border/50 border-l-4 border-l-secondary">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <SearchIcon className="w-5 h-5 text-secondary" />
              <h3 className="heading-card text-foreground">The Pivot: Targeted Viewing</h3>
            </div>
            <p className="text-sm text-muted-foreground font-body leading-relaxed">
              95% accuracy with exhaustive extraction took 35 minutes per binder.
              Targeted viewing &mdash; read corrections first, then look at only the
              relevant pages &mdash; drops it to 10-15 minutes. Time pressure during the
              hackathon forced a fundamentally better architecture: figure out what
              matters first, then go look for it.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* City Code Research */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 py-10">
        <h2 className="heading-section text-foreground text-center mb-2">Honolulu DPP, 3 Research Modes</h2>
        <p className="text-sm text-muted-foreground font-body text-center mb-8 max-w-2xl mx-auto">
          Honolulu&apos;s ADU and ʻohana standards live across ROH, DPP bulletins, BWS forms, and fire
          access guidance. The research skill pulls them together into one consistent view for each project.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.06)] border-border/50">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <SearchIcon className="w-5 h-5 text-primary" />
                <Badge variant="outline" className="text-[10px]">~30 sec</Badge>
              </div>
              <h3 className="heading-card text-foreground">Discovery</h3>
              <p className="text-muted-foreground font-body text-sm">
                Find the right Honolulu DPP pages, ROH sections, BWS documents, and HFD memos for ADU and ʻohana projects.
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.06)] border-border/50">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <GlobeIcon className="w-5 h-5 text-primary" />
                <Badge variant="outline" className="text-[10px]">~60-90 sec</Badge>
              </div>
              <h3 className="heading-card text-foreground">Targeted Extraction</h3>
              <p className="text-muted-foreground font-body text-sm">
                Pull specific ordinance text, DPP standard details, submittal checklists, and BWS clearance rules into the agent context.
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.06)] border-border/50">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <EyeIcon className="w-5 h-5 text-primary" />
                <Badge variant="outline" className="text-[10px]">~2-3 min</Badge>
              </div>
              <h3 className="heading-card text-foreground">Browser Fallback</h3>
              <p className="text-muted-foreground font-body text-sm">
                When documents live in tricky viewers, the browser agent navigates Honolulu sites directly to copy the relevant sections.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Infrastructure */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <h2 className="heading-section text-foreground text-center mb-2">Why Three Layers</h2>
        <p className="text-sm text-muted-foreground font-body text-center mb-8 max-w-2xl mx-auto">
          Agent runs take 10-30 minutes. That single constraint shaped the entire
          infrastructure.
        </p>

        <div className="space-y-0">
          <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.06)] border-border/50">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center">
                  <GlobeIcon className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <h3 className="heading-card text-foreground text-base">Next.js on Vercel</h3>
                  <p className="text-sm text-muted-foreground font-body mt-1">
                    Frontend + API routes. Dual auth: Supabase sessions for browser users,
                    Bearer tokens for agent API access.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="w-px h-4 bg-border/60 mx-auto" />

          <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.06)] border-border/50">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center">
                  <ServerIcon className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <h3 className="heading-card text-foreground text-base">Cloud Run (GCP)</h3>
                  <p className="text-sm text-muted-foreground font-body mt-1">
                    Persistent orchestrator process. Serverless functions timeout at 60-300s
                    &mdash; useless for 10-30 min agent runs. Also handles PDF
                    pre-processing (pdftoppm + ImageMagick need system packages).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="w-px h-4 bg-border/60 mx-auto" />

          <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.06)] border-border/50">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center">
                  <CpuIcon className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <h3 className="heading-card text-foreground text-base">Vercel Sandbox</h3>
                  <p className="text-sm text-muted-foreground font-body mt-1">
                    Isolated, ephemeral execution environment. Agent SDK needs filesystem
                    access (<code className="text-xs bg-muted px-1 py-0.5 rounded">claude_code</code> preset).
                    Detached mode for connection resilience &mdash; GCP&apos;s load balancer
                    kills idle connections at ~5 min.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="w-px h-4 bg-border/60 mx-auto" />

          <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.06)] border-border/50">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center">
                  <RadioIcon className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <h3 className="heading-card text-foreground text-base">Supabase</h3>
                  <p className="text-sm text-muted-foreground font-body mt-1">
                    Realtime subscriptions push agent status to the frontend without polling.
                    Storage for uploaded plans and generated outputs. Postgres for projects,
                    messages, outputs, and contractor answers.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* What the Agent Produces */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        <h2 className="heading-section text-foreground mb-2">What the Agent Produces</h2>
        <p className="text-sm text-muted-foreground font-body mb-6">
          Real output from a Placentia ADU corrections flow &mdash; 14 items analyzed,
          categorized, and responded to.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.06)] border-border/50">
            <CardContent className="p-5 space-y-2">
              <ShieldCheckIcon className="w-6 h-6 text-primary" />
              <h3 className="heading-card text-foreground text-base">Corrections Analysis</h3>
              <p className="text-xs text-muted-foreground font-body">
                Each item categorized: 5 auto-fixable, 2 need contractor input,
                6 need professional engineer. Code references verified against state
                and city law.
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.06)] border-border/50">
            <CardContent className="p-5 space-y-2">
              <FileTextIcon className="w-6 h-6 text-primary" />
              <h3 className="heading-card text-foreground text-base">Contractor Questions</h3>
              <p className="text-xs text-muted-foreground font-body">
                Structured questions for on-site data: &ldquo;What is the size of the
                existing waste/sewer line?&rdquo; with CPC Table 702.1 context and
                why the agent needs it.
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.06)] border-border/50">
            <CardContent className="p-5 space-y-2">
              <SearchIcon className="w-6 h-6 text-primary" />
              <h3 className="heading-card text-foreground text-base">Response Letter</h3>
              <p className="text-xs text-muted-foreground font-body">
                Professional tone. Item-by-item responses with sheet references. Code
                citations (CPC, CRC, ASCE 7-16). Technical justifications: sewer capacity
                calc, wind load calcs, drainage slopes.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 py-10">
        <div className="grid gap-8 md:grid-cols-4 text-center">
          <div className="space-y-1">
            <TrendingUpIcon className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold font-display text-foreground">2x</p>
            <p className="text-xs text-muted-foreground font-body">
              ADUs per lot required by SB3202 by 2026
            </p>
          </div>
          <div className="space-y-1">
            <AlertTriangleIcon className="w-5 h-5 text-accent mx-auto mb-1" />
            <p className="text-2xl font-bold font-display text-foreground">80%+</p>
            <p className="text-xs text-muted-foreground font-body">
              Honolulu permits needing at least one corrections cycle
            </p>
          </div>
          <div className="space-y-1">
            <DollarSignIcon className="w-5 h-5 text-secondary mx-auto mb-1" />
            <p className="text-2xl font-bold font-display text-foreground">6 months</p>
            <p className="text-xs text-muted-foreground font-body">
              Typical delay when ʻohana permits ping-pong between DPP and designers
            </p>
          </div>
          <div className="space-y-1">
            <ClockIcon className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold font-display text-foreground">$25,000</p>
            <p className="text-xs text-muted-foreground font-body">
              Carry cost a faster approval can save on a small Oahu ADU
            </p>
          </div>
        </div>
      </section>

      {/* Status */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 py-10">
        <h2 className="heading-section text-foreground text-center mb-8">Where It Stands</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.06)] border-l-4 border-l-success border-border/50">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="w-5 h-5 text-success" />
                <h3 className="heading-card text-foreground text-base">Working</h3>
              </div>
              <ul className="text-xs text-muted-foreground font-body space-y-1.5">
                <li>Skills architecture (28 reference files)</li>
                <li>Corrections analysis pipeline</li>
                <li>Response letter with code citations</li>
                <li>Multi-agent PDF extraction</li>
                <li>City code research (3-mode)</li>
                <li>Cloud Run + Vercel Sandbox deployment</li>
                <li>API key auth (dual: Bearer + session)</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.06)] border-l-4 border-l-warning border-border/50">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-warning" />
                <h3 className="heading-card text-foreground text-base">In Progress</h3>
              </div>
              <ul className="text-xs text-muted-foreground font-body space-y-1.5">
                <li>Cloud deployment stability (detached mode solved 5-min timeout)</li>
                <li>City-side review flow UI polish</li>
                <li>Processing time optimization (35 &rarr; 15 min via targeted viewing)</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.06)] border-l-4 border-l-info border-border/50">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <CompassIcon className="w-5 h-5 text-info" />
                <h3 className="heading-card text-foreground text-base">Roadmap</h3>
              </div>
              <ul className="text-xs text-muted-foreground font-body space-y-1.5">
                <li>PDF plan redrawing (7,400px plans need larger sandbox)</li>
                <li>Per-user API keys + multi-tenant</li>
                <li>Scale city research to 480+ cities</li>
                <li>Contractor mobile experience</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/30 py-8 text-center space-y-2">
        <p className="text-sm text-muted-foreground font-body">
          Built in 7 days &middot; Solo builder &middot; Honolulu, HI
        </p>
        <p className="text-xs text-muted-foreground/70 font-body">
          Claude Opus 4.6 &middot; Claude Code &middot; Agent SDK &middot; Vercel Sandbox
        </p>
        <p className="text-xs text-muted-foreground/50 font-body">
          <a
            href="https://github.com/mikeOnBreeze/cc-crossbeam"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary transition-colors"
          >
            github.com/mikeOnBreeze/cc-crossbeam
          </a>
        </p>
      </footer>
    </div>
  )
}
