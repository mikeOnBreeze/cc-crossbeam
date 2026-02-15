'use client'

import { useState, useEffect } from 'react'

export function useRandomAdu(pool: string[]): string {
  // Deterministic initial value for SSR (avoids hydration mismatch)
  const [selected, setSelected] = useState(pool[0])

  useEffect(() => {
    // Randomize on client mount — true per-visit variety
    setSelected(pool[Math.floor(Math.random() * pool.length)])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return selected
}
