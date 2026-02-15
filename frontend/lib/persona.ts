export type Persona = 'contractor' | 'city'

const STORAGE_KEY = 'crossbeam-dashboard-persona'

export function getPersona(): Persona {
  if (typeof window === 'undefined') return 'city'
  return (localStorage.getItem(STORAGE_KEY) as Persona) || 'city'
}

export function setPersona(persona: Persona) {
  localStorage.setItem(STORAGE_KEY, persona)
  window.dispatchEvent(new Event('persona-change'))
}
