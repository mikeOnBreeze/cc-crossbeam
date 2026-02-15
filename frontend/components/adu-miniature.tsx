'use client'

import Image from 'next/image'
import { useRandomAdu } from '@/hooks/use-random-adu'

// All available ADU exterior images — 16 keyed transparents + 7 originals = 23 total
const ADU_EXTERIORS = [
  // Keyed ADU series (Nano Banana generated)
  '/images/adu/adu-01-2story-garage-transparent.png',
  '/images/adu/adu-02-studio-greenroof-transparent.png',
  '/images/adu/adu-03-garage-conversion-transparent.png',
  '/images/adu/adu-04-jadu-attached-transparent.png',
  '/images/adu/adu-05-modern-box-transparent.png',
  '/images/adu/adu-06-spanish-style-transparent.png',
  '/images/adu/adu-07-aframe-transparent.png',
  '/images/adu/adu-08-prefab-modular-transparent.png',
  // Cameron real-project series
  '/images/adu/cameron-01-longbeach-transparent.png',
  '/images/adu/cameron-03-lakewood-transparent.png',
  '/images/adu/cameron-04-whittier-2story-transparent.png',
  '/images/adu/cameron-05-lakewood-porch-transparent.png',
  '/images/adu/cameron-06-sandimas-butterfly-transparent.png',
  '/images/adu/cameron-09-signalhill-cottage-transparent.png',
  '/images/adu/cameron-09-signalhill-cottage-v2-transparent.png',
  '/images/adu/cameron-10-downey-lshape-transparent.png',
  // Original exterior series
  '/images/adu/exterior-longbeach-modern.png',
  '/images/adu/exterior-whittier-2story.png',
  '/images/adu/exterior-lakewood-porch.png',
  '/images/adu/exterior-sandimas-raised.png',
  '/images/adu/exterior-signalhill-cottage.png',
  '/images/adu/exterior-garage-2story.png',
  '/images/adu/exterior-modern-box.png',
]

const VARIANT_CONFIG = {
  hero: { width: 600, height: 420, className: 'max-w-[60vw]' },
  card: { width: 280, height: 200, className: 'max-w-[280px]' },
  accent: { width: 140, height: 100, className: 'max-w-[140px]' },
  background: { width: 800, height: 560, className: 'max-w-full opacity-20' },
} as const

interface AduMiniatureProps {
  variant: keyof typeof VARIANT_CONFIG
  src?: string             // Override random selection with specific image
  videoSrc?: string        // When ready: provide MP4 path to switch to <video> loop
  alt?: string
  className?: string
}

export function AduMiniature({
  variant,
  src,
  videoSrc,
  alt = 'ADU architectural miniature',
  className = '',
}: AduMiniatureProps) {
  const randomSrc = useRandomAdu(ADU_EXTERIORS)
  const imageSrc = src || randomSrc
  const config = VARIANT_CONFIG[variant]

  // Video swap: when videoSrc is provided, render <video> instead of <Image>
  if (videoSrc) {
    return (
      <div className={`flex items-center justify-center ${config.className} ${className}`}>
        <video
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          className="object-contain drop-shadow-lg w-full h-auto"
          style={{ maxWidth: config.width, maxHeight: config.height }}
        />
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center ${config.className} ${className}`}>
      <Image
        src={imageSrc}
        alt={alt}
        width={config.width}
        height={config.height}
        className="object-contain drop-shadow-lg"
        quality={85}
        priority={variant === 'hero'}
      />
    </div>
  )
}
