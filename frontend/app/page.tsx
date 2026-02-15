import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AduMiniature } from '@/components/adu-miniature'
import {
  FileTextIcon,
  SearchIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  DollarSignIcon,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="bg-topo-lines">
      {/* Nav */}
      <nav className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <span className="heading-card text-primary">CrossBeam</span>
        <Link href="/login">
          <Button variant="outline" className="font-body font-semibold text-primary border-primary/50">
            Sign In
          </Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 pt-8 pb-2 text-center space-y-5 animate-fade-up">
        <h1 className="heading-display text-foreground">
          Your ADU Permit, Simplified
        </h1>
        <p className="text-xl text-muted-foreground font-body max-w-2xl mx-auto">
          California issues 30,000+ ADU permits a year — and 90% get sent back
          for corrections. CrossBeam uses AI to interpret correction letters,
          verify code citations, and draft professional responses in minutes.
        </p>
        <Link href="/login">
          <Button className="rounded-full px-10 py-6 text-lg font-bold font-body
                             hover:shadow-[0_0_24px_rgba(45,106,79,0.3)] hover:brightness-110 mt-4"
                  size="lg">
            Get Started
          </Button>
        </Link>
      </section>

      {/* ADU Hero Miniature — THE VISUAL CENTERPIECE */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 py-2 animate-fade-up stagger-1">
        <AduMiniature variant="hero" />
      </section>

      {/* Feature Cards */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pb-8 grid gap-6 md:grid-cols-3 animate-fade-up stagger-2">
        <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.08)] border-border/50">
          <CardContent className="p-6 space-y-3">
            <FileTextIcon className="w-8 h-8 text-primary" />
            <h3 className="heading-card text-foreground">Corrections Interpreter</h3>
            <p className="text-muted-foreground font-body text-sm">
              Upload your corrections letter. Every item categorized, code-referenced,
              and explained — so you know exactly what to fix and why.
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.08)] border-border/50">
          <CardContent className="p-6 space-y-3">
            <SearchIcon className="w-8 h-8 text-primary" />
            <h3 className="heading-card text-foreground">Code Verification</h3>
            <p className="text-muted-foreground font-body text-sm">
              Every correction cross-checked against California building code
              and your city&apos;s municipal code. No more guessing.
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.08)] border-border/50">
          <CardContent className="p-6 space-y-3">
            <ShieldCheckIcon className="w-8 h-8 text-primary" />
            <h3 className="heading-card text-foreground">Response Letter</h3>
            <p className="text-muted-foreground font-body text-sm">
              Professional response letter drafted automatically with code citations,
              ready for your engineer to sign and submit.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Stats Strip — The Numbers */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3 text-center">
          <div className="space-y-1">
            <div className="flex justify-center mb-2">
              <TrendingUpIcon className="w-6 h-6 text-primary" />
            </div>
            <p className="text-3xl font-bold font-display text-foreground">429,503</p>
            <p className="text-sm text-muted-foreground font-body">
              ADU permits issued in California since 2018
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex justify-center mb-2">
              <AlertTriangleIcon className="w-6 h-6 text-accent" />
            </div>
            <p className="text-3xl font-bold font-display text-foreground">90%+</p>
            <p className="text-sm text-muted-foreground font-body">
              of applications sent back for corrections
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex justify-center mb-2">
              <DollarSignIcon className="w-6 h-6 text-secondary" />
            </div>
            <p className="text-3xl font-bold font-display text-foreground">$30,000</p>
            <p className="text-sm text-muted-foreground font-body">
              average cost of a 6-month permit delay
            </p>
          </div>
        </div>
      </section>

      {/* The Problem — Why This Exists */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-[1fr,280px] items-center">
          <div className="space-y-4">
            <h2 className="heading-section text-foreground">
              The permit system can&apos;t keep up
            </h2>
            <p className="text-muted-foreground font-body leading-relaxed">
              California is in the biggest ADU boom in American history — but building
              departments are understaffed and overwhelmed. Most projects need 2-3 correction
              cycles before approval. Each cycle costs weeks and thousands of dollars.
            </p>
            <p className="text-muted-foreground font-body leading-relaxed">
              CrossBeam sits in the gap between what the state wants — more ADUs, faster — and
              what cities can deliver. AI-powered review that helps contractors get it right
              the first time.
            </p>
          </div>
          <div className="hidden md:flex justify-center">
            <Image
              src="/images/adu/interior-lakewood-786sf.png"
              alt="ADU interior — 786 sq ft Lakewood unit"
              width={280}
              height={200}
              className="object-contain drop-shadow-lg"
              quality={85}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/30 py-6 text-center">
        <p className="text-sm text-muted-foreground font-body">
          Built with Claude Opus 4.6 · CrossBeam © 2026
        </p>
      </footer>
    </div>
  )
}
