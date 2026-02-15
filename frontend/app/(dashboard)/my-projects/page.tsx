'use client'

import { usePersona } from '@/hooks/use-persona'
import { PersonaToggle } from '@/components/persona-toggle'
import { ContractorDashboard } from '@/components/contractor-dashboard'
import { CityDashboard } from '@/components/city-dashboard'

export default function MyProjectsPage() {
  const persona = usePersona()

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Heading */}
      <div className="text-center space-y-2 pt-2">
        <h1 className="heading-display text-foreground">Your Projects</h1>
        <p className="text-muted-foreground text-lg font-body">
          {persona === 'city'
            ? 'Review permit applications with AI-powered analysis'
            : 'Track your corrections analyses and response packages'}
        </p>
      </div>

      {/* Toggle */}
      <PersonaToggle persona={persona} />

      {/* Dashboard View */}
      {persona === 'city' ? <CityDashboard /> : <ContractorDashboard />}
    </div>
  )
}
