export type AppMode = 'dev-test' | 'judge-demo' | 'real'

const STORAGE_KEY = 'crossbeam-app-mode'

export function getAppMode(): AppMode {
  if (typeof window === 'undefined') return 'judge-demo'
  return (localStorage.getItem(STORAGE_KEY) as AppMode) || 'judge-demo'
}

export function setAppMode(mode: AppMode) {
  localStorage.setItem(STORAGE_KEY, mode)
  window.dispatchEvent(new Event('app-mode-change'))
}

// Judge project IDs — pre-seeded projects in `ready` state for live sandbox testing
export const JUDGE_CITY_PROJECT_ID = 'b0000000-0000-0000-0000-000000000001'
export const JUDGE_CONTRACTOR_PROJECT_ID = 'b0000000-0000-0000-0000-000000000002'
