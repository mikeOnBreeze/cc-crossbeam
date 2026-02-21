'use client'

import { useState, useEffect } from 'react'
/**
 * Workaround for @supabase/ssr createBrowserClient not calling
 * realtime.setAuth() until SIGNED_IN or TOKEN_REFRESHED fires.
 * If you're already logged in, neither event fires on page load,
 * so the Realtime WebSocket connects with just the anon key and
 * RLS blocks the subscription → CHANNEL_ERROR.
 *
 * Call this hook before creating any postgres_changes subscriptions.
 * Returns `true` once the auth token has been set on the Realtime client.
 *
 * @see https://github.com/supabase/supabase-js/issues/1304
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useRealtimeAuth(supabase: { auth: any; realtime: any }): boolean {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: { data: { session: { access_token: string } | null } }) => {
      if (data.session?.access_token) {
        supabase.realtime.setAuth(data.session.access_token)
      }
      setReady(true)
    })
  }, [supabase])

  return ready
}
