export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ProjectStatus =
  | 'ready'
  | 'uploading'
  | 'processing'
  | 'processing-phase1'
  | 'awaiting-answers'
  | 'processing-phase2'
  | 'completed'
  | 'failed'

export type FlowType = 'city-review' | 'corrections-analysis'
export type FlowPhase = 'analysis' | 'response' | 'review'
export type FileType = 'plan-binder' | 'corrections-letter' | 'other'
export type MessageRole = 'system' | 'assistant' | 'tool'
export type QuestionType = 'text' | 'number' | 'choice' | 'measurement'

export interface Project {
  id: string
  user_id: string
  flow_type: FlowType
  project_name: string
  project_address: string | null
  city: string | null
  status: ProjectStatus
  error_message: string | null
  applicant_name: string | null
  is_demo: boolean
  created_at: string
  updated_at: string
}

export interface ProjectFile {
  id: string
  project_id: string
  file_type: FileType
  filename: string
  storage_path: string
  mime_type: string | null
  size_bytes: number | null
  created_at: string
}

export interface Message {
  id: number  // BIGSERIAL
  project_id: string
  role: MessageRole
  content: string
  created_at: string
}

export interface Output {
  id: string
  project_id: string
  flow_phase: FlowPhase
  version: number

  // City Review outputs
  corrections_letter_md: string | null
  corrections_letter_pdf_path: string | null
  review_checklist_json: Json | null

  // Contractor Phase 1 outputs
  corrections_analysis_json: Json | null
  contractor_questions_json: Json | null

  // Contractor Phase 2 outputs
  response_letter_md: string | null
  response_letter_pdf_path: string | null
  professional_scope_md: string | null
  corrections_report_md: string | null

  // Catch-all
  raw_artifacts: Json | null

  // Agent run metadata
  agent_cost_usd: number | null
  agent_turns: number | null
  agent_duration_ms: number | null

  created_at: string
}

export interface ContractorAnswer {
  id: string
  project_id: string
  question_key: string
  question_text: string
  question_type: QuestionType
  options: Json | null       // For choice-type: string[]
  context: string | null
  correction_item_id: string | null
  answer_text: string | null
  is_answered: boolean
  output_id: string | null
  created_at: string
  updated_at: string
}

// Database type for Supabase client generic
export interface Database {
  crossbeam: {
    Tables: {
      projects: {
        Row: Project
        Insert: Partial<Project> & Pick<Project, 'user_id' | 'flow_type' | 'project_name'>
        Update: Partial<Project>
      }
      files: {
        Row: ProjectFile
        Insert: Partial<ProjectFile> & Pick<ProjectFile, 'project_id' | 'file_type' | 'filename' | 'storage_path'>
        Update: Partial<ProjectFile>
      }
      messages: {
        Row: Message
        Insert: Partial<Message> & Pick<Message, 'project_id' | 'role' | 'content'>
        Update: Partial<Message>
      }
      outputs: {
        Row: Output
        Insert: Partial<Output> & Pick<Output, 'project_id' | 'flow_phase'>
        Update: Partial<Output>
      }
      contractor_answers: {
        Row: ContractorAnswer
        Insert: Partial<ContractorAnswer> & Pick<ContractorAnswer, 'project_id' | 'question_key' | 'question_text'>
        Update: Partial<ContractorAnswer>
      }
    }
  }
}
