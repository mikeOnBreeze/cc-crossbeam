'use client'

import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AduMiniature } from '@/components/adu-miniature'
import { AgentStream } from '@/components/agent-stream'
import { ProgressPhases } from '@/components/progress-phases'
import { ContractorQuestionsForm } from '@/components/contractor-questions-form'
import { ResultsViewer } from '@/components/results-viewer'
import type { Project, ProjectFile, ProjectStatus } from '@/types/database'
import {
  FileTextIcon,
  PlayIcon,
  Loader2Icon,
  AlertCircleIcon,
  RotateCcwIcon,
} from 'lucide-react'

interface ProjectDetailClientProps {
  initialProject: Project
  initialFiles: ProjectFile[]
  userId: string
  showcaseOutputId?: string  // When set, skip straight to results pinned to this output
}

const CITY_PHASES = ['Extract', 'Research', 'Review', 'Generate']
const CONTRACTOR_P1_PHASES = ['Extract', 'Analyze', 'Research', 'Categorize', 'Prepare']
const CONTRACTOR_P2_PHASES = ['Read Answers', 'Research', 'Draft', 'Generate']

const PROCESSING_STATUSES: ProjectStatus[] = ['processing', 'processing-phase1', 'processing-phase2']
const TERMINAL_STATUSES: ProjectStatus[] = ['completed', 'failed']

export function ProjectDetailClient({
  initialProject,
  initialFiles,
  userId,
  showcaseOutputId,
}: ProjectDetailClientProps) {
  const [project, setProject] = useState<Project>(initialProject)
  const [starting, setStarting] = useState(false)
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)
  const supabase = useMemo(() => createClient(), [])

  // Sync with server re-renders (e.g., after router.refresh())
  useEffect(() => {
    setProject(initialProject)
    setStarting(false)
  }, [initialProject.id, initialProject.status])

  // DevTools instant state sync — no waiting for polling or server refresh
  useEffect(() => {
    const handler = (e: Event) => {
      const { status, projectId, errorMessage } = (e as CustomEvent).detail
      if (projectId === project.id) {
        setProject(prev => ({
          ...prev,
          status,
          error_message: errorMessage ?? null,
        }))
        setStarting(false)
        setCurrentPhaseIndex(0)
      }
    }
    window.addEventListener('devtools-state-change', handler)
    return () => window.removeEventListener('devtools-state-change', handler)
  }, [project.id])

  // DevTools phase control — listen for phase events from dev widget
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (typeof detail?.phase === 'number') {
        setCurrentPhaseIndex(detail.phase)
      }
    }
    window.addEventListener('devtools-phase', handler)
    return () => window.removeEventListener('devtools-phase', handler)
  }, [])

  // Track whether we should act on realtime events (avoids putting status/starting in deps)
  const shouldListenRef = useRef(false)
  useEffect(() => {
    shouldListenRef.current =
      starting || (!TERMINAL_STATUSES.includes(project.status) && project.status !== 'ready')
  }, [project.status, starting])

  // Realtime: project status changes — subscribe ONCE per project, stay alive
  useEffect(() => {
    const channel = supabase
      .channel(`project-status-${project.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'crossbeam',
          table: 'projects',
          filter: `id=eq.${project.id}`,
        },
        (payload) => {
          if (!shouldListenRef.current) return
          const newStatus = payload.new.status as ProjectStatus
          const newError = payload.new.error_message as string | null
          console.log('[Realtime] Project status:', newStatus)
          setProject(prev => ({ ...prev, status: newStatus, error_message: newError }))
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription:', status)
        // Catch-up fetch: grab current status in case we missed the event during handshake
        if (status === 'SUBSCRIBED' && shouldListenRef.current) {
          supabase
            .schema('crossbeam')
            .from('projects')
            .select('status, error_message')
            .eq('id', project.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setProject(prev => ({ ...prev, status: data.status as ProjectStatus, error_message: data.error_message }))
              }
            })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [project.id, supabase])

  const getPhases = useCallback(() => {
    if (project.flow_type === 'city-review') return CITY_PHASES
    if (project.status === 'processing-phase2') return CONTRACTOR_P2_PHASES
    return CONTRACTOR_P1_PHASES
  }, [project.flow_type, project.status])

  const handleStartAnalysis = async () => {
    setStarting(true)
    const flowType = project.flow_type === 'city-review'
      ? 'city-review'
      : 'corrections-analysis'

    try {
      await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          user_id: userId,
          flow_type: flowType,
        }),
      })
    } catch {
      // Status polling will detect any transition
    }
  }

  const handleRetry = () => {
    setProject(prev => ({ ...prev, status: 'ready', error_message: null }))
    setStarting(false)
  }

  // Full reset for demo projects — clears messages, outputs, answers, resets to ready
  const [resetting, setResetting] = useState(false)
  const handleReset = async () => {
    setResetting(true)
    try {
      const res = await fetch('/api/reset-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: project.id }),
      })
      if (res.ok) {
        setProject(prev => ({ ...prev, status: 'ready', error_message: null }))
        setStarting(false)
        setCurrentPhaseIndex(0)
      }
    } catch {
      // ignore
    } finally {
      setResetting(false)
    }
  }

  // SHOWCASE MODE — pinned output, no controls, no reset
  const [preparingLive, setPreparingLive] = useState(false)
  const handleGoLive = async () => {
    setPreparingLive(true)
    try {
      await fetch('/api/reset-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: project.id }),
      })
    } catch {
      // proceed anyway
    }
    window.location.href = `/projects/${project.id}`
  }

  if (showcaseOutputId) {
    return (
      <div className="animate-fade-up space-y-6">
        <ResultsViewer projectId={project.id} flowType={project.flow_type} pinnedOutputId={showcaseOutputId} />
        <div className="flex justify-center pb-8">
          <Button
            onClick={handleGoLive}
            disabled={preparingLive}
            className="rounded-full px-8 font-bold font-body hover:shadow-[0_0_24px_rgba(45,106,79,0.3)] hover:brightness-110"
          >
            {preparingLive ? <Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> : <PlayIcon className="w-4 h-4 mr-2" />}
            {preparingLive ? 'Preparing...' : 'Run Live'}
          </Button>
        </div>
      </div>
    )
  }

  // READY STATE
  if (project.status === 'ready') {
    return (
      <div className="space-y-4 animate-fade-up">
        {/* ADU Miniature */}
        <div className="flex justify-center pt-2">
          <AduMiniature variant="card" />
        </div>

        {/* Project Info */}
        <div className="text-center space-y-2">
          <h1 className="heading-display text-foreground">{project.project_name}</h1>
          <div className="flex items-center justify-center gap-3">
            {project.city && (
              <Badge variant="secondary" className="rounded-full font-body">
                {project.city}
              </Badge>
            )}
            <Badge variant="outline" className="rounded-full font-body">
              {project.flow_type === 'city-review' ? 'City Review' : 'Corrections Analysis'}
            </Badge>
          </div>
        </div>

        {/* Files Card */}
        {initialFiles.length > 0 && (
          <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.08)] border-border/50 max-w-lg mx-auto">
            <CardContent className="p-6">
              <h3 className="heading-card text-foreground mb-4">Files</h3>
              <div className="space-y-2">
                {initialFiles.map(file => (
                  <div key={file.id} className="flex items-center gap-3 text-sm font-body">
                    <FileTextIcon className="w-4 h-4 text-primary" />
                    <span className="text-foreground">{file.filename}</span>
                    {file.size_bytes && (
                      <span className="text-muted-foreground ml-auto">
                        {(file.size_bytes / 1024).toFixed(0)} KB
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA Button — THE BUTTON */}
        <div className="flex justify-center">
          <Button
            onClick={handleStartAnalysis}
            disabled={starting}
            className="rounded-full px-10 py-6 text-lg font-bold font-body
                       hover:shadow-[0_0_24px_rgba(45,106,79,0.3)] hover:brightness-110"
            size="lg"
          >
            {starting ? (
              <Loader2Icon className="w-5 h-5 animate-spin" />
            ) : (
              <PlayIcon className="w-5 h-5" />
            )}
            {starting
              ? 'Starting...'
              : project.flow_type === 'city-review'
                ? 'Run AI Review'
                : 'Analyze Corrections'
            }
          </Button>
        </div>
      </div>
    )
  }

  // PROCESSING STATES
  if (PROCESSING_STATUSES.includes(project.status)) {
    const phases = getPhases()
    const heading = project.status === 'processing-phase2'
      ? 'Building your response...'
      : project.flow_type === 'city-review'
        ? 'Reviewing plans...'
        : 'Analyzing corrections...'

    return (
      <div className="space-y-4 animate-fade-up">
        {/* ADU Miniature — center stage */}
        <div className="flex justify-center pt-2">
          <AduMiniature variant="card" />
        </div>

        {/* Heading */}
        <div className="text-center space-y-1">
          <h1 className="heading-section text-foreground">{heading}</h1>
          <p className="text-muted-foreground font-body">Usually takes 12-18 minutes</p>
        </div>

        {/* Progress Phases */}
        <ProgressPhases phases={phases} currentPhaseIndex={currentPhaseIndex} />

        {/* Agent Activity Stream */}
        <div className="max-w-2xl mx-auto">
          <AgentStream projectId={project.id} />
        </div>
      </div>
    )
  }

  // AWAITING ANSWERS
  if (project.status === 'awaiting-answers') {
    // ContractorQuestionsForm will be built in Phase 5
    return (
      <div className="space-y-6 animate-fade-up">
        <div className="text-center">
          <h1 className="heading-section text-foreground">A few questions for you</h1>
          <p className="text-muted-foreground font-body mt-2">
            Our AI needs your input to build the best response
          </p>
        </div>
        <ContractorQuestionsForm projectId={project.id} userId={userId} />
      </div>
    )
  }

  // COMPLETED
  if (project.status === 'completed') {
    return (
      <div className="animate-fade-up space-y-6">
        <ResultsViewer projectId={project.id} flowType={project.flow_type} />
        {project.is_demo && (
          <div className="flex justify-center pb-8">
            <Button
              onClick={handleReset}
              disabled={resetting}
              variant="outline"
              className="rounded-full font-body"
            >
              <RotateCcwIcon className="w-4 h-4 mr-2" />
              {resetting ? 'Resetting...' : 'Reset & Run Again'}
            </Button>
          </div>
        )}
      </div>
    )
  }

  // FAILED
  if (project.status === 'failed') {
    return (
      <div className="space-y-6 animate-fade-up max-w-lg mx-auto pt-12">
        <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.08)] border-destructive/30">
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircleIcon className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="heading-section text-foreground">Something went wrong</h2>
            <p className="text-muted-foreground font-body">
              {project.error_message || 'The analysis encountered an error. Please try again.'}
            </p>
            <Button
              onClick={project.is_demo ? handleReset : handleRetry}
              disabled={resetting}
              variant="outline"
              className="rounded-full font-body"
            >
              <RotateCcwIcon className="w-4 h-4 mr-2" />
              {resetting ? 'Resetting...' : 'Try Again'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Default fallback
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground font-body">Loading project...</p>
    </div>
  )
}
