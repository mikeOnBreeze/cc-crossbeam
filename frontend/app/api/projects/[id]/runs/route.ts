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

    // Verify project exists and user has access
    const { data: project, error: projectError } = await supabase
      .schema('crossbeam')
      .from('projects')
      .select('id, is_demo, user_id')
      .eq('id', id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (!auth.isApiKey && project.user_id !== auth.userId && !project.is_demo) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Optional filter by flow_phase
    const { searchParams } = new URL(request.url)
    const flowPhase = searchParams.get('flow_phase')

    let query = supabase
      .schema('crossbeam')
      .from('outputs')
      .select('id, flow_phase, version, agent_cost_usd, agent_turns, agent_duration_ms, raw_artifacts, created_at')
      .eq('project_id', id)
      .order('created_at', { ascending: false })

    if (flowPhase) {
      query = query.eq('flow_phase', flowPhase)
    }

    const { data: outputs, error: outputsError } = await query

    if (outputsError) {
      console.error('Error fetching runs:', outputsError)
      return NextResponse.json({ error: 'Failed to fetch runs' }, { status: 500 })
    }

    return NextResponse.json({
      project_id: id,
      total_runs: outputs?.length || 0,
      runs: outputs || [],
    })
  } catch (error) {
    console.error('Error fetching runs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
