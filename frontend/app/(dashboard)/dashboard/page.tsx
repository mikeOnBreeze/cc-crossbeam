'use client'

import { PersonaCard } from '@/components/persona-card'
import { useAppMode } from '@/hooks/use-app-mode'
import {
  DEMO_CITY_PROJECT_ID,
  DEMO_CONTRACTOR_PROJECT_ID,
} from '@/lib/dev-fixtures'
import {
  JUDGE_CITY_PROJECT_ID,
  JUDGE_CONTRACTOR_PROJECT_ID,
} from '@/lib/app-mode'
import { RocketIcon } from 'lucide-react'

export default function DashboardPage() {
  const mode = useAppMode()

  const cityId = mode === 'dev-test' ? DEMO_CITY_PROJECT_ID : JUDGE_CITY_PROJECT_ID
  const contractorId = mode === 'dev-test' ? DEMO_CONTRACTOR_PROJECT_ID : JUDGE_CONTRACTOR_PROJECT_ID

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
          aduImage="/images/adu/exterior-garage-2story.png"
          title="City Reviewer"
          description="I'm reviewing a permit submission. Help me pre-screen it against state + city code."
          projectName="1232 N Jefferson ADU"
          projectCity="Placentia, CA"
          projectId={cityId}
          ctaText="Run AI Review"
        />
        <PersonaCard
          aduImage="/images/adu/exterior-whittier-2story.png"
          title="Contractor"
          description="I got a corrections letter back. Help me understand what to fix and build a response."
          projectName="1232 N Jefferson ADU"
          projectCity="Placentia, CA"
          projectId={contractorId}
          ctaText="Analyze Corrections"
        />
      </div>
    </div>
  )
}
