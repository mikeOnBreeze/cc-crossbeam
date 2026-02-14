'use client'

import { useState, useEffect } from 'react'
import { getAppMode, type AppMode } from '@/lib/app-mode'

export function useAppMode(): AppMode {
  const [mode, setMode] = useState<AppMode>('judge-demo')

  useEffect(() => {
    setMode(getAppMode())
    const handler = () => setMode(getAppMode())
    window.addEventListener('app-mode-change', handler)
    return () => window.removeEventListener('app-mode-change', handler)
  }, [])

  return mode
}
