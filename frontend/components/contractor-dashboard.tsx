'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HardHatIcon, Loader2Icon, InboxIcon } from 'lucide-react'
import { getStatusConfig, relativeTime, getAduImage } from '@/lib/status-utils'
import { cn } from '@/lib/utils'
import type { Project } from '@/types/database'

export function ContractorDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    supabase
      .schema('crossbeam')
      .from('projects')
      .select('*')
      .eq('is_demo', true)
      .eq('flow_type', 'corrections-analysis')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setProjects(data as Project[])
        setLoading(false)
      })
  }, [supabase])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2Icon className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <InboxIcon className="w-10 h-10 text-muted-foreground/40" />
        <p className="text-muted-foreground font-body">No corrections analyses yet.</p>
      </div>
    )
  }

  const cities = new Set(projects.map(p => p.city).filter(Boolean))

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <HardHatIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="heading-card text-foreground">Your Projects</h2>
          <p className="text-sm text-muted-foreground font-body">
            {projects.length} correction{projects.length !== 1 ? 's' : ''} analysis across {cities.size} cit{cities.size !== 1 ? 'ies' : 'y'}
          </p>
        </div>
      </div>

      {/* Project Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map(project => {
          const status = getStatusConfig(project.status)
          return (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover-lift shadow-[0_8px_32px_rgba(28,25,23,0.08)] border-border/50 cursor-pointer h-full">
                <CardContent className="p-6 space-y-4">
                  {/* ADU Miniature */}
                  <div className="relative w-full h-28 flex items-center justify-center">
                    <Image
                      src={getAduImage(project.id)}
                      alt={project.project_name}
                      width={180}
                      height={130}
                      className="object-contain drop-shadow-md"
                      quality={80}
                    />
                  </div>

                  {/* Project Info */}
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground font-body text-sm leading-tight">
                      {project.project_name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-body">
                      {project.project_address}{project.city ? `, ${project.city}` : ''}
                    </p>
                  </div>

                  {/* Status + Time */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <Badge
                      variant={status.variant}
                      className={cn('rounded-sm text-[10px]', status.className)}
                    >
                      {status.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-body">
                      {relativeTime(project.updated_at || project.created_at)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
