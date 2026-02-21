'use client'

import { PersonaCard } from '@/components/persona-card'
import { useAppMode } from '@/hooks/use-app-mode'
import { useRandomAdu } from '@/hooks/use-random-adu'
import {
  DEMO_CITY_PROJECT_ID,
  DEMO_CONTRACTOR_PROJECT_ID,
} from '@/lib/dev-fixtures'
import {
  JUDGE_CITY_PROJECT_ID,
  JUDGE_CONTRACTOR_PROJECT_ID,
  SHOWCASE_CITY_OUTPUT_ID,
  SHOWCASE_CONTRACTOR_OUTPUT_ID,
} from '@/lib/app-mode'
import { RocketIcon } from 'lucide-react'

// Exterior pool for persona card randomization (subset — best-looking ones)
const PERSONA_POOL = [
  '/images/adu/adu-01-2story-garage-transparent.png',
  '/images/adu/adu-03-garage-conversion-transparent.png',
  '/images/adu/adu-04-jadu-attached-transparent.png',
  '/images/adu/adu-05-modern-box-transparent.png',
  '/images/adu/adu-06-spanish-style-transparent.png',
  '/images/adu/adu-07-aframe-transparent.png',
  '/images/adu/adu-08-prefab-modular-transparent.png',
  '/images/adu/cameron-01-longbeach-transparent.png',
  '/images/adu/cameron-03-lakewood-transparent.png',
  '/images/adu/cameron-04-whittier-2story-transparent.png',
  '/images/adu/cameron-05-lakewood-porch-transparent.png',
  '/images/adu/cameron-06-sandimas-butterfly-transparent.png',
  '/images/adu/cameron-09-signalhill-cottage-transparent.png',
  '/images/adu/cameron-09-signalhill-cottage-v2-transparent.png',
  '/images/adu/cameron-10-downey-lshape-transparent.png',
]

export default function DashboardPage() {
  const mode = useAppMode()

  const cityId = mode === 'dev-test' ? DEMO_CITY_PROJECT_ID : JUDGE_CITY_PROJECT_ID
  const contractorId = mode === 'dev-test' ? DEMO_CONTRACTOR_PROJECT_ID : JUDGE_CONTRACTOR_PROJECT_ID

  // Random ADU images for persona cards — each hook call gets a different image via useId()
  const cityAdu = useRandomAdu(PERSONA_POOL)
  const contractorAdu = useRandomAdu(PERSONA_POOL)

  // Real mode — coming soon
  if (mode === 'real') {
    return (
      <div className="space-y-6 animate-fade-up">
        <div className="text-center space-y-2 pt-2">
          <h1 className="heading-display text-foreground">Your Projects</h1>
          <p className="text-muted-foreground text-lg font-body">
            Upload plans and start a new review
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <RocketIcon className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-muted-foreground font-body text-center max-w-md">
            Full project creation with file upload is coming soon.
            Switch to <span className="font-semibold text-foreground">Judge Demo</span> mode
            to test with pre-loaded Placentia plans.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Heading */}
      <div className="text-center space-y-2 pt-2">
        <h1 className="heading-display text-foreground">Choose your perspective</h1>
        <p className="text-muted-foreground text-lg font-body">
          {mode === 'dev-test'
            ? 'Dev mode — step through screens with scripted data'
            : 'Select a demo scenario to run CrossBeam live'}
        </p>
      </div>

      {/* Persona Cards */}
      <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
        <PersonaCard
          aduImage={cityAdu}
          title="City Reviewer"
          description="I'm reviewing a permit submission. Help me pre-screen it against state + city code."
          projectName="1232 N Jefferson ADU"
          projectCity="Placentia, CA"
          projectId={cityId}
          ctaText="Run AI Review"
          showcaseOutputId={mode === 'judge-demo' ? SHOWCASE_CITY_OUTPUT_ID : undefined}
        />
        <PersonaCard
          aduImage={contractorAdu}
          title="Contractor"
          description="I got a corrections letter back. Help me understand what to fix and build a response."
          projectName="1232 N Jefferson ADU"
          projectCity="Placentia, CA"
          projectId={contractorId}
          ctaText="Analyze Corrections"
          showcaseOutputId={mode === 'judge-demo' ? SHOWCASE_CONTRACTOR_OUTPUT_ID : undefined}
        />
      </div>
    </div>
  )
}
