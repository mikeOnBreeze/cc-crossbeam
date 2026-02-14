import { cn } from '@/lib/utils'

interface ProgressPhasesProps {
  phases: string[]
  currentPhaseIndex: number
}

export function ProgressPhases({ phases, currentPhaseIndex }: ProgressPhasesProps) {
  return (
    <div className="flex items-center justify-center gap-1 flex-wrap">
      {phases.map((phase, i) => (
        <div key={phase} className="flex items-center gap-1">
          {/* Dot */}
          {i < currentPhaseIndex && (
            <span className="w-3 h-3 rounded-full bg-success" />
          )}
          {i === currentPhaseIndex && (
            <span className="w-3 h-3 rounded-full bg-warning animate-gentle-pulse" />
          )}
          {i > currentPhaseIndex && (
            <span className="w-3 h-3 rounded-full bg-muted-foreground/30" />
          )}

          {/* Label */}
          <span className={cn(
            'text-sm font-body mr-2',
            i <= currentPhaseIndex ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {phase}
          </span>

          {/* Connector line (except after last) */}
          {i < phases.length - 1 && (
            <span className={cn(
              'w-6 h-px mr-1',
              i < currentPhaseIndex ? 'bg-success' : 'bg-muted-foreground/30'
            )} />
          )}
        </div>
      ))}
    </div>
  )
}
