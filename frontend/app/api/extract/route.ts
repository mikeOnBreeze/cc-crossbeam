import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, getSupabaseForAuth } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request)
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { project_id } = await request.json()

    if (!project_id) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 })
    }

    // Verify project ownership (browser auth only)
    if (!auth.isApiKey) {
      const supabase = await getSupabaseForAuth(auth)
      const { data: project, error: projectError } = await supabase
        .schema('crossbeam')
        .from('projects')
        .select('id, user_id, is_demo')
        .eq('id', project_id)
        .single()

      if (projectError || !project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      if (project.user_id !== auth.userId && !project.is_demo) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    const cloudRunUrl = process.env.CLOUD_RUN_URL
    if (!cloudRunUrl) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    const response = await fetch(`${cloudRunUrl}/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.error || `Server error: ${response.status}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json({ success: true, ...data })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timed out' }, { status: 504 })
    }
    console.error('Error in extract route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
