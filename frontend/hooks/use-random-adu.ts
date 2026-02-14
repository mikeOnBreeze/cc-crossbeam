'use client'

import { useState } from 'react'

export function useRandomAdu(pool: string[]): string {
  const [selected] = useState(() => {
    const index = Math.floor(Math.random() * pool.length)
    return pool[index]
  })
  return selected
}
