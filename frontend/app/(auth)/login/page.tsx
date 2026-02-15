'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AduMiniature } from '@/components/adu-miniature'
import { KeyIcon, Loader2Icon } from 'lucide-react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleJudgeLogin = async () => {
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'judge@crossbeam.app',
        password: 'crossbeam-hackathon-2026',
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

  const handleGoogleLogin = async () => {
    setError(null)
    setGoogleLoading(true)
    const callbackUrl = `${window.location.origin}/auth/callback?next=/dashboard`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
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

          {/* Judge Button -- Primary CTA */}
          <Button
            onClick={handleJudgeLogin}
            disabled={loading}
            className="w-full rounded-full px-8 py-6 text-base font-bold font-body
                       hover:shadow-[0_0_24px_rgba(45,106,79,0.3)] hover:brightness-110"
            size="lg"
          >
            {loading ? (
              <Loader2Icon className="w-4 h-4 animate-spin" />
            ) : (
              <KeyIcon className="w-4 h-4" />
            )}
            {loading ? 'Signing in...' : 'Sign in as a Judge'}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground font-body">or</span>
            </div>
          </div>

          {/* Google OAuth -- Secondary */}
          <Button
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full py-5 font-body"
          >
            {googleLoading ? (
              <Loader2Icon className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <GoogleIcon className="w-4 h-4 mr-2" />
            )}
            {googleLoading ? 'Redirecting...' : 'Sign in with Google'}
          </Button>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive font-body">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}
