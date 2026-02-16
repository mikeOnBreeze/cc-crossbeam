import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProjectDetailClient } from './project-detail-client'

export const dynamic = 'force-dynamic'

interface ProjectPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ showcase?: string }>
}

export default async function ProjectPage({ params, searchParams }: ProjectPageProps) {
  const { id } = await params
  const { showcase } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Fetch project
  const { data: project, error } = await supabase
    .schema('crossbeam')
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !project) notFound()

  // Fetch files
  const { data: files } = await supabase
    .schema('crossbeam')
    .from('files')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: true })

  return (
    <ProjectDetailClient
      initialProject={project}
      initialFiles={files || []}
      userId={user.id}
      showcaseOutputId={showcase}
    />
  )
}
