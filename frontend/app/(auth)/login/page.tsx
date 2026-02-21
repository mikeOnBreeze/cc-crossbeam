'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AduMiniature } from '@/components/adu-miniature'
import { Loader2Icon, LogInIcon } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-topo-lines">
      <Card className="relative z-10 w-full max-w-md shadow-[0_8px_32px_rgba(28,25,23,0.08)] border-border/50 animate-fade-up">
        <CardContent className="pt-10 pb-8 px-8 text-center space-y-8">
          {/* ADU Miniature — small, accent size */}
          <div className="flex justify-center">
            <AduMiniature variant="accent" />
          </div>

          {/* Branding */}
          <div className="space-y-2">
            <h1 className="heading-display text-foreground">CrossBeam</h1>
            <p className="text-muted-foreground font-body">
              AI-Powered Permit Review for California ADUs
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="font-body"
              autoComplete="email"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="font-body"
              autoComplete="current-password"
            />
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full px-8 py-6 text-base font-bold font-body
                         hover:shadow-[0_0_24px_rgba(45,106,79,0.3)] hover:brightness-110"
              size="lg"
            >
              {loading ? (
                <Loader2Icon className="w-4 h-4 animate-spin" />
              ) : (
                <LogInIcon className="w-4 h-4" />
              )}
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive font-body">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
