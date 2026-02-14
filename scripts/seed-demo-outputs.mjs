#!/usr/bin/env node
/**
 * Seed demo output data into Supabase from real session files.
 * Uses raw fetch (no SDK needed).
 * Run: node scripts/seed-demo-outputs.mjs
 */
import { readFileSync } from 'fs'

const SUPABASE_URL = 'https://bhjrpklzqyrelnhexhlj.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoanJwa2x6cXlyZWxuaGV4aGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2ODAxMjQsImV4cCI6MjA2NTI1NjEyNH0.fRp7ld4IIqliwctY-lOrbGrorbZqEg4WVPcEZj3AteI'

const CONTRACTOR_SESSION = 'agents-crossbeam/sessions/l4-2026-02-13T01-16-14'
const CITY_SESSION = 'agents-crossbeam/sessions/l4c-2026-02-13T17-58-31'
const CONTRACTOR_PROJECT_ID = 'a0000000-0000-0000-0000-000000000002'
const CITY_PROJECT_ID = 'a0000000-0000-0000-0000-000000000001'

async function supabasePost(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
      'Content-Profile': 'crossbeam',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`POST ${table} failed: ${res.status} ${text}`)
  }
}

async function main() {
  // Seed contractor output
  console.log('Seeding contractor output...')
  const responseLetter = readFileSync(`${CONTRACTOR_SESSION}/response_letter.md`, 'utf-8')
  const professionalScope = readFileSync(`${CONTRACTOR_SESSION}/professional_scope.md`, 'utf-8')
  const correctionsReport = readFileSync(`${CONTRACTOR_SESSION}/corrections_report.md`, 'utf-8')

  await supabasePost('outputs', {
    project_id: CONTRACTOR_PROJECT_ID,
    flow_phase: 'response',
    version: 1,
    response_letter_md: responseLetter,
    professional_scope_md: professionalScope,
    corrections_report_md: correctionsReport,
    agent_duration_ms: 847000,
    agent_turns: 42,
    agent_cost_usd: 3.42,
  })
  console.log('  Contractor output inserted')

  // Seed city output
  console.log('Seeding city output...')
  const correctionsLetter = readFileSync(`${CITY_SESSION}/draft_corrections.md`, 'utf-8')
  const reviewSummary = JSON.parse(readFileSync(`${CITY_SESSION}/review_summary.json`, 'utf-8'))

  await supabasePost('outputs', {
    project_id: CITY_PROJECT_ID,
    flow_phase: 'review',
    version: 1,
    corrections_letter_md: correctionsLetter,
    review_checklist_json: reviewSummary,
    agent_duration_ms: 723000,
    agent_turns: 38,
    agent_cost_usd: 2.87,
  })
  console.log('  City output inserted')

  console.log('Done! Both outputs seeded.')
}

main().catch(console.error)
