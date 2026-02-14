import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { project_id, user_id, flow_type } = await request.json()

    if (!project_id) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 })
    }

    // Verify user owns this project (or it's a demo project)
    const { data: project, error: projectError } = await supabase
      .schema('crossbeam')
      .from('projects')
      .select('id, user_id, is_demo')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.user_id !== user.id && !project.is_demo) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get Cloud Run URL from environment
    const cloudRunUrl = process.env.CLOUD_RUN_URL

    if (!cloudRunUrl) {
      return NextResponse.json({
        success: false,
        error: 'Server not configured: CLOUD_RUN_URL is not set',
      }, { status: 500 })
    }

    // Trigger Cloud Run worker
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(`${cloudRunUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id,
          user_id: user.id,
          flow_type,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Cloud Run error:', response.status, errorData)
        return NextResponse.json({
          success: false,
          error: errorData.error || `Server error: ${response.status}`,
        }, { status: response.status })
      }

      const data = await response.json()
      return NextResponse.json({
        success: true,
        message: data.message || 'Generation started',
      })
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          error: 'Request timed out - the server may be starting up. Please try again.',
        }, { status: 504 })
      }
      console.error('Failed to trigger Cloud Run:', fetchError)
      return NextResponse.json({
        success: false,
        error: `Failed to connect to generation server: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
      }, { status: 502 })
    }
  } catch (error) {
    console.error('Error in generate route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
