'use client'

import { useState, useEffect } from 'react'
import { getPersona, type Persona } from '@/lib/persona'

export function usePersona(): Persona {
  const [persona, setPersona] = useState<Persona>('city')

  useEffect(() => {
    setPersona(getPersona())
    const handler = () => setPersona(getPersona())
    window.addEventListener('persona-change', handler)
    return () => window.removeEventListener('persona-change', handler)
  }, [])

  return persona
}
