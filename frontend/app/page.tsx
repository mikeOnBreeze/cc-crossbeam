import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AduMiniature } from '@/components/adu-miniature'
import { FileTextIcon, SearchIcon, ShieldCheckIcon } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="bg-topo-lines">
      {/* Nav */}
      <nav className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <span className="heading-card text-primary">CrossBeam</span>
        <Link href="/login">
          <Button variant="outline" size="sm" className="font-body">
            Sign In
          </Button>
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 pt-12 pb-8 text-center space-y-6 animate-fade-up">
        <h1 className="heading-display text-foreground">
          Your ADU Permit, Simplified
        </h1>
        <p className="text-xl text-muted-foreground font-body max-w-2xl mx-auto">
          AI-powered permit review for California ADUs. Get corrections interpreted,
          code citations verified, and response letters drafted — in minutes, not weeks.
        </p>
        <Link href="/login">
          <Button className="rounded-full px-10 py-6 text-lg font-bold font-body
                             hover:shadow-[0_0_20px_rgba(45,106,79,0.15)] mt-4"
                  size="lg">
            Get Started
          </Button>
        </Link>
      </section>

      {/* ADU Hero Miniature — THE VISUAL CENTERPIECE */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 py-8 animate-fade-up stagger-1">
        <AduMiniature variant="hero" />
      </section>

      {/* Feature Cards */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pb-20 grid gap-6 md:grid-cols-3 animate-fade-up stagger-2">
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
              Every correction cross-checked against California state law and your city&apos;s municipal code.
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
      <footer className="relative z-10 border-t border-border/30 py-6 text-center">
        <p className="text-sm text-muted-foreground font-body">
          Built with Claude Opus 4.6 · CrossBeam © 2026
        </p>
      </footer>
    </div>
  )
}
