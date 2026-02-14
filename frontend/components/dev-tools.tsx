'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  CONTRACTOR_MESSAGES,
  CITY_MESSAGES,
  CAMERON_ANSWERS,
  DEMO_CITY_PROJECT_ID,
  DEMO_CONTRACTOR_PROJECT_ID,
} from '@/lib/dev-fixtures'
import { useAppMode } from '@/hooks/use-app-mode'
import type { ProjectStatus } from '@/types/database'

const CONTRACTOR_STATES: ProjectStatus[] = [
  'ready',
  'processing',
  'awaiting-answers',
  'completed',
  'failed',
]
const CITY_STATES: ProjectStatus[] = [
  'ready',
  'processing',
  'completed',
  'failed',
]

export function DevTools() {
  const [collapsed, setCollapsed] = useState(true)
  const [flow, setFlow] = useState<'city' | 'contractor'>('contractor')
  const [sliderValue, setSliderValue] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(30)
  const [currentState, setCurrentState] = useState<ProjectStatus>('ready')
  const lastInsertedRef = useRef(-1)
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const appMode = useAppMode()

  const projectId =
    flow === 'city' ? DEMO_CITY_PROJECT_ID : DEMO_CONTRACTOR_PROJECT_ID
  const states = flow === 'city' ? CITY_STATES : CONTRACTOR_STATES
  const messages = flow === 'city' ? CITY_MESSAGES : CONTRACTOR_MESSAGES
  const stateIndex = states.indexOf(currentState)

  // Navigate to project page if not already there
  const ensureOnProjectPage = useCallback(() => {
    const target = `/projects/${projectId}`
    if (!pathname.includes('/projects/')) {
      router.push(target)
    } else if (!pathname.includes(projectId)) {
      router.push(target)
    }
  }, [pathname, projectId, router])

  // Update project status in Supabase + broadcast to page instantly
  const setProjectStatus = useCallback(
    async (status: ProjectStatus) => {
      const errorMessage = status === 'failed' ? 'Demo error: testing the failed state UI' : null

      await supabase
        .schema('crossbeam')
        .from('projects')
        .update({ status, error_message: errorMessage })
        .eq('id', projectId)

      setCurrentState(status)

      // Instant sync — tell the page to update without waiting for polling
      window.dispatchEvent(
        new CustomEvent('devtools-state-change', {
          detail: { status, projectId, errorMessage },
        })
      )

      router.refresh()
    },
    [supabase, projectId, router]
  )

  // Clear all messages for the current project
  const clearMessages = useCallback(async () => {
    await supabase
      .schema('crossbeam')
      .from('messages')
      .delete()
      .eq('project_id', projectId)
    lastInsertedRef.current = -1
  }, [supabase, projectId])

  // Insert messages up to a given percentage
  const insertMessagesUpTo = useCallback(
    async (percent: number) => {
      const messagesToInsert = messages.filter(
        (m, i) => m.percent <= percent && i > lastInsertedRef.current
      )

      if (messagesToInsert.length === 0) return

      await supabase
        .schema('crossbeam')
        .from('messages')
        .insert(
          messagesToInsert.map((m) => ({
            project_id: projectId,
            role: m.role,
            content: m.content,
          }))
        )

      const lastIndex = messages.findIndex(
        (m) => m === messagesToInsert[messagesToInsert.length - 1]
      )
      lastInsertedRef.current = lastIndex

      // Update phase via custom event
      const latest = messagesToInsert[messagesToInsert.length - 1]
      window.dispatchEvent(
        new CustomEvent('devtools-phase', { detail: { phase: latest.phase } })
      )
    },
    [messages, supabase, projectId]
  )

  // Go to a specific state — always navigate to the project page
  const goToState = useCallback(
    async (state: ProjectStatus) => {
      setPlaying(false)
      setSliderValue(0)
      await clearMessages()
      await setProjectStatus(state)
      ensureOnProjectPage()
    },
    [clearMessages, setProjectStatus, ensureOnProjectPage]
  )

  // Step forward/back
  const stepForward = () => {
    const nextIndex = Math.min(stateIndex + 1, states.length - 1)
    goToState(states[nextIndex])
  }

  const stepBack = () => {
    const prevIndex = Math.max(stateIndex - 1, 0)
    goToState(states[prevIndex])
  }

  // Handle slider change (manual drag)
  const handleSliderChange = async (value: number) => {
    setSliderValue(value)

    if (value < sliderValue) {
      // Going backwards — clear and re-insert
      await clearMessages()
    }

    await insertMessagesUpTo(value)
  }

  // Play mode
  useEffect(() => {
    if (!playing || currentState !== 'processing') {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
        playIntervalRef.current = null
      }
      return
    }

    const totalMs = duration * 1000
    const stepMs = 500
    const stepPercent = (stepMs / totalMs) * 100

    playIntervalRef.current = setInterval(() => {
      setSliderValue((prev) => {
        const next = Math.min(prev + stepPercent, 100)
        if (next >= 100) {
          setPlaying(false)
        }
        return next
      })
    }, stepMs)

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
        playIntervalRef.current = null
      }
    }
  }, [playing, duration, currentState])

  // When slider value changes during play, insert messages
  useEffect(() => {
    if (currentState === 'processing' && sliderValue > 0) {
      insertMessagesUpTo(sliderValue)
    }
  }, [sliderValue, currentState, insertMessagesUpTo])

  // Auto-fill Cameron's answers
  const autoFillAnswers = async () => {
    for (const [questionKey, answerText] of Object.entries(CAMERON_ANSWERS)) {
      await supabase
        .schema('crossbeam')
        .from('contractor_answers')
        .update({ answer_text: answerText, is_answered: true })
        .eq('project_id', projectId)
        .eq('question_key', questionKey)
    }
    // Refresh to pick up changes
    router.refresh()
    window.location.reload()
  }

  // Switch flow
  const switchFlow = (newFlow: 'city' | 'contractor') => {
    setFlow(newFlow)
    setCurrentState('ready')
    setSliderValue(0)
    setPlaying(false)
    lastInsertedRef.current = -1
    const pid =
      newFlow === 'city' ? DEMO_CITY_PROJECT_ID : DEMO_CONTRACTOR_PROJECT_ID
    router.push(`/projects/${pid}`)
  }

  // Determine phase label from slider
  const currentPhaseLabel = (() => {
    const phaseLabels =
      flow === 'city'
        ? ['Extract', 'Research', 'Review', 'Generate']
        : ['Extract', 'Analyze', 'Research', 'Categorize', 'Prepare']

    const latestMessage = [...messages]
      .reverse()
      .find((m) => m.percent <= sliderValue)
    const phaseIdx = latestMessage?.phase ?? 0
    return phaseLabels[phaseIdx] ?? phaseLabels[0]
  })()

  // Only show in dev-test mode (guard must be after all hooks)
  if (appMode !== 'dev-test') return null

  return (
    <div className="fixed bottom-4 right-4 z-50 font-body">
      {/* Toggle button */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="w-10 h-10 rounded-full bg-foreground text-primary-foreground
                     flex items-center justify-center text-sm font-bold
                     shadow-lg hover:scale-105 transition-transform"
          title="Open DevTools"
        >
          DT
        </button>
      )}

      {/* Panel */}
      {!collapsed && (
        <div
          className="w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
          style={{ fontSize: '13px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-foreground text-primary-foreground">
            <span className="font-bold text-xs tracking-wide">DEV TOOLS</span>
            <div className="flex gap-1">
              <button
                onClick={() => setCollapsed(true)}
                className="w-5 h-5 rounded flex items-center justify-center
                           hover:bg-white/20 text-xs"
              >
                _
              </button>
              <button
                onClick={() => setCollapsed(true)}
                className="w-5 h-5 rounded flex items-center justify-center
                           hover:bg-white/20 text-xs"
              >
                x
              </button>
            </div>
          </div>

          <div className="p-3 space-y-3">
            {/* Flow Toggle */}
            <div className="flex gap-1">
              <button
                onClick={() => switchFlow('city')}
                className={`flex-1 px-2 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  flow === 'city'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                City Review
              </button>
              <button
                onClick={() => switchFlow('contractor')}
                className={`flex-1 px-2 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  flow === 'contractor'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Contractor
              </button>
            </div>

            {/* State Navigator */}
            <div>
              <div className="text-xs text-muted-foreground mb-1">State</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={stepBack}
                  disabled={stateIndex === 0}
                  className="w-7 h-7 rounded-md bg-muted flex items-center justify-center
                             hover:bg-muted/80 disabled:opacity-30 text-foreground font-bold"
                >
                  &lt;
                </button>
                <div className="flex-1 text-center">
                  <span className="font-bold text-foreground">
                    {currentState}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    ({stateIndex + 1}/{states.length})
                  </span>
                </div>
                <button
                  onClick={stepForward}
                  disabled={stateIndex === states.length - 1}
                  className="w-7 h-7 rounded-md bg-muted flex items-center justify-center
                             hover:bg-muted/80 disabled:opacity-30 text-foreground font-bold"
                >
                  &gt;
                </button>
              </div>
            </div>

            {/* State pills */}
            <div className="flex flex-wrap gap-1">
              {states.map((s) => (
                <button
                  key={s}
                  onClick={() => goToState(s)}
                  className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                    s === currentState
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Timeline (only in processing state) */}
            {currentState === 'processing' && (
              <div className="space-y-2 pt-1 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Timeline
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {Math.round(sliderValue)}% · {currentPhaseLabel}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={sliderValue}
                  onChange={(e) => handleSliderChange(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                             bg-muted accent-primary"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) =>
                      setDuration(Math.max(1, Number(e.target.value)))
                    }
                    className="w-14 px-1.5 py-1 text-xs border border-border rounded-md
                               text-foreground bg-card text-center"
                    min="1"
                  />
                  <span className="text-xs text-muted-foreground">sec</span>
                  <button
                    onClick={() => setPlaying(!playing)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-colors ${
                      playing
                        ? 'bg-destructive text-destructive-foreground'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    {playing ? 'Pause' : 'Play'}
                  </button>
                  <button
                    onClick={async () => {
                      setSliderValue(0)
                      setPlaying(false)
                      await clearMessages()
                      lastInsertedRef.current = -1
                    }}
                    className="px-2 py-1.5 rounded-md text-xs bg-muted
                               text-muted-foreground hover:bg-muted/80"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}

            {/* Auto-fill button (only in awaiting-answers state + contractor flow) */}
            {currentState === 'awaiting-answers' && flow === 'contractor' && (
              <div className="pt-1 border-t border-border">
                <button
                  onClick={autoFillAnswers}
                  className="w-full py-2 rounded-md text-xs font-bold
                             bg-secondary text-secondary-foreground
                             hover:bg-secondary/90 transition-colors"
                >
                  Fill Cameron&apos;s Answers
                </button>
              </div>
            )}

            {/* Quick navigate */}
            <div className="pt-1 border-t border-border">
              <div className="text-xs text-muted-foreground mb-1">
                Navigate
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 px-2 py-1 rounded-md text-xs bg-muted
                             text-muted-foreground hover:bg-muted/80"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => router.push(`/projects/${projectId}`)}
                  className="flex-1 px-2 py-1 rounded-md text-xs bg-muted
                             text-muted-foreground hover:bg-muted/80"
                >
                  Project
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="flex-1 px-2 py-1 rounded-md text-xs bg-muted
                             text-muted-foreground hover:bg-muted/80"
                >
                  Landing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
