'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRightIcon, PlayIcon, EyeIcon, Loader2Icon } from 'lucide-react'

interface PersonaCardProps {
  aduImage: string
  title: string
  description: string
  projectName: string
  projectCity: string
  projectId: string
  ctaText: string
  showcaseOutputId?: string  // When set, show dual buttons (Showcase + Live)
}

export function PersonaCard({
  aduImage,
  title,
  description,
  projectName,
  projectCity,
  projectId,
  ctaText,
  showcaseOutputId,
}: PersonaCardProps) {
  const router = useRouter()
  const [resetting, setResetting] = useState(false)

  const handleRunLive = async () => {
    setResetting(true)
    try {
      await fetch('/api/reset-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      })
    } catch {
      // proceed anyway
    }
    router.push(`/projects/${projectId}`)
  }

  // Single-link mode (dev-test) vs dual-button mode (judge-demo)
  const hasDualMode = !!showcaseOutputId

  const cardInner = (
    <CardContent className="p-8 space-y-6">
      {/* ADU Miniature — the hero of the card */}
      <div className="relative w-full h-40 flex items-center justify-center">
        <Image
          src={aduImage}
          alt={title}
          width={280}
          height={200}
          className="object-contain drop-shadow-lg"
          quality={85}
        />
      </div>

      {/* Title */}
      <h2 className="heading-card text-foreground">{title}</h2>

      {/* Description */}
      <p className="text-muted-foreground font-body leading-relaxed">
        {description}
      </p>

      {/* Demo project info */}
      <div className="text-sm text-muted-foreground font-body border-t border-border/50 pt-4">
        <p className="font-semibold text-foreground">{projectName}</p>
        <p>{projectCity}</p>
      </div>

      {/* CTAs */}
      {hasDualMode ? (
        <div className="flex gap-3">
          <Button asChild variant="outline" className="flex-1 rounded-full font-bold font-body">
            <Link href={`/projects/${projectId}?showcase=${showcaseOutputId}`}>
              <EyeIcon className="w-4 h-4 mr-2" />
              Showcase
            </Link>
          </Button>
          <Button
            onClick={handleRunLive}
            disabled={resetting}
            className="flex-1 rounded-full font-bold font-body hover:shadow-[0_0_24px_rgba(45,106,79,0.3)] hover:brightness-110"
          >
            {resetting ? <Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> : <PlayIcon className="w-4 h-4 mr-2" />}
            {resetting ? 'Preparing...' : 'Run Live'}
          </Button>
        </div>
      ) : (
        <Button className="w-full rounded-full font-bold font-body hover:shadow-[0_0_24px_rgba(45,106,79,0.3)] hover:brightness-110">
          {ctaText}
          <ArrowRightIcon className="w-4 h-4 ml-2" />
        </Button>
      )}
    </CardContent>
  )

  // Dev-test mode: entire card is clickable. Judge mode: buttons handle navigation.
  if (hasDualMode) {
    return (
      <Card className="hover-lift shadow-[0_8px_32px_rgba(28,25,23,0.08)] border-border/50 h-full">
        {cardInner}
      </Card>
    )
  }

  return (
    <Link href={`/projects/${projectId}`}>
      <Card className="hover-lift shadow-[0_8px_32px_rgba(28,25,23,0.08)] border-border/50 cursor-pointer h-full">
        {cardInner}
      </Card>
    </Link>
  )
}
