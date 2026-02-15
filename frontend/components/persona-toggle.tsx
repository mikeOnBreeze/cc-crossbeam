'use client'

import { HardHatIcon, Building2Icon } from 'lucide-react'
import { setPersona, type Persona } from '@/lib/persona'
import { cn } from '@/lib/utils'

interface PersonaToggleProps {
  persona: Persona
}

export function PersonaToggle({ persona }: PersonaToggleProps) {
  return (
    <div className="flex justify-center">
      <div className="relative inline-flex rounded-full bg-muted/60 p-1 border border-border/50">
        {/* Sliding indicator */}
        <div
          className={cn(
            'absolute top-1 bottom-1 rounded-full bg-primary shadow-md transition-all duration-200 ease-out',
            persona === 'contractor' ? 'left-1 w-[calc(50%-4px)]' : 'left-[calc(50%+2px)] w-[calc(50%-4px)]'
          )}
        />

        {/* Contractor button */}
        <button
          onClick={() => setPersona('contractor')}
          className={cn(
            'relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold font-body transition-colors duration-200',
            persona === 'contractor'
              ? 'text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <HardHatIcon className="w-4 h-4" />
          Contractor
        </button>

        {/* City Reviewer button */}
        <button
          onClick={() => setPersona('city')}
          className={cn(
            'relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold font-body transition-colors duration-200',
            persona === 'city'
              ? 'text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Building2Icon className="w-4 h-4" />
          City Reviewer
        </button>
      </div>
    </div>
  )
}
