import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { project_id } = await request.json()

    if (!project_id) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 })
    }

    // Only allow resetting demo projects
    const { data: project, error: projectError } = await supabase
      .schema('crossbeam')
      .from('projects')
      .select('id, is_demo')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (!project.is_demo) {
      return NextResponse.json({ error: 'Only demo projects can be reset' }, { status: 403 })
    }

    // Clear messages
    await supabase
      .schema('crossbeam')
      .from('messages')
      .delete()
      .eq('project_id', project_id)

    // Clear outputs
    await supabase
      .schema('crossbeam')
      .from('outputs')
      .delete()
      .eq('project_id', project_id)

    // Clear contractor answers
    await supabase
      .schema('crossbeam')
      .from('contractor_answers')
      .delete()
      .eq('project_id', project_id)

    // Reset project status to ready
    await supabase
      .schema('crossbeam')
      .from('projects')
      .update({ status: 'ready', error_message: null })
      .eq('id', project_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error resetting project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
