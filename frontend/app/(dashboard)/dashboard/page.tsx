import { PersonaCard } from '@/components/persona-card'

export const dynamic = 'force-dynamic'

const DEMO_CITY_PROJECT_ID = 'a0000000-0000-0000-0000-000000000001'
const DEMO_CONTRACTOR_PROJECT_ID = 'a0000000-0000-0000-0000-000000000002'

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-up">
      {/* Heading */}
      <div className="text-center space-y-2 pt-2">
        <h1 className="heading-display text-foreground">Choose your perspective</h1>
        <p className="text-muted-foreground text-lg font-body">
          Select a demo scenario to see CrossBeam in action
        </p>
      </div>

      {/* Persona Cards — each with a different ADU miniature */}
      <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
        <PersonaCard
          aduImage="/images/adu/exterior-garage-2story.png"
          title="City Reviewer"
          description="I'm reviewing a permit submission. Help me pre-screen it against state + city code."
          projectName="742 Flint Ave ADU"
          projectCity="Buena Park, CA"
          projectId={DEMO_CITY_PROJECT_ID}
          ctaText="Run AI Review"
        />
        <PersonaCard
          aduImage="/images/adu/exterior-whittier-2story.png"
          title="Contractor"
          description="I got a corrections letter back. Help me understand what to fix and build a response."
          projectName="742 Flint Ave ADU"
          projectCity="Buena Park, CA"
          projectId={DEMO_CONTRACTOR_PROJECT_ID}
          ctaText="Analyze Corrections"
        />
      </div>
    </div>
  )
}
