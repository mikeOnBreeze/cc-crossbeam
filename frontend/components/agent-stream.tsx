'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BrainIcon, WrenchIcon, SettingsIcon, ClockIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: number
  role: 'tool' | 'assistant' | 'system'
  content: string
  created_at: string
}

interface AgentStreamProps {
  projectId: string
}

const roleConfig: Record<string, {
  icon: React.ElementType
  bgClass: string
  textClass: string
  borderClass: string
  label: string
}> = {
  tool: {
    icon: WrenchIcon,
    bgClass: 'bg-warning/20',
    textClass: 'text-warning',
    borderClass: 'border-l-warning/50',
    label: 'Tool',
  },
  assistant: {
    icon: BrainIcon,
    bgClass: 'bg-primary/20',
    textClass: 'text-primary',
    borderClass: 'border-l-primary/50',
    label: 'AI',
  },
  system: {
    icon: SettingsIcon,
    bgClass: 'bg-success/20',
    textClass: 'text-success',
    borderClass: 'border-l-success/50',
    label: 'System',
  },
}

const STALE_THRESHOLD_MS = 90_000 // 90 seconds with no new messages

export function AgentStream({ projectId }: AgentStreamProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [staleSeconds, setStaleSeconds] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastMessageTimeRef = useRef<number>(Date.now())
  const completionTriggeredRef = useRef(false)
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  // Initial fetch
  useEffect(() => {
    supabase
      .schema('crossbeam')
      .from('messages')
      .select('*')
      .eq('project_id', projectId)
      .order('id', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setMessages(data as Message[])
          lastMessageTimeRef.current = Date.now()
        }
      })
  }, [projectId, supabase])

  // Realtime: new messages (replaces polling)
  useEffect(() => {
    const channel = supabase
      .channel(`messages-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'crossbeam',
          table: 'messages',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages(prev => [...prev, newMessage])
          lastMessageTimeRef.current = Date.now()
          setStaleSeconds(0)

          // Backup completion detection
          if (
            newMessage.role === 'system' &&
            newMessage.content.startsWith('Completed in ') &&
            !completionTriggeredRef.current
          ) {
            completionTriggeredRef.current = true
            setTimeout(() => {
              router.refresh()
            }, 5000)
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Messages subscription:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, supabase, router])

  // Stale timer — count seconds since last message
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastMessageTimeRef.current
      setStaleSeconds(Math.floor(elapsed / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const isStale = staleSeconds * 1000 >= STALE_THRESHOLD_MS && messages.length > 0

  return (
    <div className="flex flex-col h-full max-h-[400px] bg-card rounded-xl shadow-[0_8px_32px_rgba(28,25,23,0.08)] border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50 flex items-center gap-3">
        <div className={cn(
          'w-2.5 h-2.5 rounded-full',
          isStale ? 'bg-warning animate-pulse' : 'bg-primary animate-gentle-pulse'
        )} />
        <span className="text-base font-semibold text-foreground font-body">Live Activity</span>
        <span className="text-sm text-muted-foreground font-body ml-auto">
          {messages.length} events
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
            <div className="relative">
              <div className="w-4 h-4 rounded-full bg-primary animate-ping absolute" />
              <div className="w-4 h-4 rounded-full bg-primary" />
            </div>
            <p className="text-base text-muted-foreground font-body">
              Waiting for agent activity...
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const config = roleConfig[msg.role] || roleConfig.system
              const Icon = config.icon
              const isLatest = index === messages.length - 1

              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex items-start gap-3 py-2 px-3 rounded-lg border-l-2 animate-slide-in-left',
                    config.borderClass,
                    isLatest ? 'bg-primary/5' : 'bg-transparent hover:bg-muted/30'
                  )}
                >
                  <div className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                    config.bgClass
                  )}>
                    <Icon className={cn('w-3.5 h-3.5', config.textClass)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-relaxed font-body">
                      {msg.content}
                    </p>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              )
            })}

            {/* Stale indicator — agent is still thinking */}
            {isStale && (
              <div className="flex items-start gap-3 py-2 px-3 rounded-lg border-l-2 border-l-warning/50 bg-warning/5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-warning/20">
                  <ClockIcon className="w-3.5 h-3.5 text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground leading-relaxed font-body">
                    Agent is thinking... ({Math.floor(staleSeconds / 60)}:{String(staleSeconds % 60).padStart(2, '0')} since last activity)
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
