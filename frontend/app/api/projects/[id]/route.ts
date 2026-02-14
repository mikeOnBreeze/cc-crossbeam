import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, getSupabaseForAuth } from '@/lib/api-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await getSupabaseForAuth(auth)

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .schema('crossbeam')
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Browser auth: check ownership
    if (!auth.isApiKey && project.user_id !== auth.userId && !project.is_demo) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Fetch recent messages (last 50, chronological)
    const { data: messages } = await supabase
      .schema('crossbeam')
      .from('messages')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(50)

    // Fetch latest output
    const { data: outputs } = await supabase
      .schema('crossbeam')
      .from('outputs')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(1)

    // Fetch contractor answers
    const { data: answers } = await supabase
      .schema('crossbeam')
      .from('contractor_answers')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true })

    // Fetch files
    const { data: files } = await supabase
      .schema('crossbeam')
      .from('files')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true })

    return NextResponse.json({
      project,
      files: files || [],
      messages: (messages || []).reverse(),
      latest_output: outputs?.[0] || null,
      contractor_answers: answers || [],
    })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
