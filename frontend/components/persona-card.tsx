import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRightIcon } from 'lucide-react'

interface PersonaCardProps {
  aduImage: string         // Path to ADU miniature PNG (e.g., "/images/adu/exterior-garage-2story.png")
  title: string
  description: string
  projectName: string
  projectCity: string
  projectId: string
  ctaText: string
}

export function PersonaCard({
  aduImage,
  title,
  description,
  projectName,
  projectCity,
  projectId,
  ctaText,
}: PersonaCardProps) {
  return (
    <Link href={`/projects/${projectId}`}>
      <Card className="hover-lift shadow-[0_8px_32px_rgba(28,25,23,0.08)] border-border/50 cursor-pointer h-full">
        <CardContent className="p-8 space-y-6">
          {/* ADU Miniature — the hero of the card */}
          <div className="relative w-full h-48 flex items-center justify-center">
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

          {/* CTA */}
          <Button className="w-full rounded-full font-bold font-body hover:shadow-[0_0_20px_rgba(45,106,79,0.15)]">
            {ctaText}
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </Link>
  )
}
