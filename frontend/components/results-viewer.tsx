'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card, CardContent } from '@/components/ui/card'
import { AduMiniature } from '@/components/adu-miniature'
import { Loader2Icon, ClockIcon, CpuIcon, DollarSignIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Output, FlowType } from '@/types/database'

interface ResultsViewerProps {
  projectId: string
  flowType: FlowType
}

type TabKey = string

export function ResultsViewer({ projectId, flowType }: ResultsViewerProps) {
  const [output, setOutput] = useState<Output | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('')
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    supabase
      .schema('crossbeam')
      .from('outputs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          setOutput(data as Output)
          // Set initial tab
          if (flowType === 'city-review') {
            setActiveTab('corrections_letter_md')
          } else {
            setActiveTab('response_letter_md')
          }
        }
        setLoading(false)
      })
  }, [projectId, flowType, supabase])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2Icon className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!output) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground font-body">No results available yet.</p>
      </div>
    )
  }

  const tabs = flowType === 'city-review'
    ? [
        { key: 'corrections_letter_md', label: 'Corrections Letter' },
        { key: 'review_checklist_json', label: 'Review Checklist' },
      ]
    : [
        { key: 'response_letter_md', label: 'Response Letter' },
        { key: 'professional_scope_md', label: 'Professional Scope' },
        { key: 'corrections_report_md', label: 'Corrections Report' },
      ]

  const getContent = (key: string): string | null => {
    const value = output[key as keyof Output]
    if (typeof value === 'string') return value
    if (value && typeof value === 'object') return JSON.stringify(value, null, 2)
    return null
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return '—'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4 animate-fade-up">
        <div className="flex justify-center">
          <AduMiniature variant="accent" />
        </div>
        <h1 className="heading-display text-foreground">
          {flowType === 'city-review'
            ? 'Review complete'
            : 'Your response package is ready'}
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,280px]">
        {/* Main Content */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-border/50">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-4 py-2.5 text-sm font-body font-semibold transition-colors',
                  activeTab === tab.key
                    ? 'text-foreground border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.08)] border-border/50">
            <CardContent className="p-6">
              <div className="prose-crossbeam">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {getContent(activeTab) || 'No content available for this tab.'}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats Sidebar */}
        <Card className="shadow-[0_8px_32px_rgba(28,25,23,0.08)] border-border/50 h-fit">
          <CardContent className="p-6 space-y-4">
            <h3 className="heading-card text-foreground">Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm font-body">
                <ClockIcon className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Duration</span>
                <span className="ml-auto text-foreground font-semibold">
                  {formatDuration(output.agent_duration_ms)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm font-body">
                <CpuIcon className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Agent turns</span>
                <span className="ml-auto text-foreground font-semibold">
                  {output.agent_turns ?? '—'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm font-body">
                <DollarSignIcon className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Cost</span>
                <span className="ml-auto text-foreground font-semibold">
                  {output.agent_cost_usd ? `$${output.agent_cost_usd.toFixed(2)}` : '—'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
