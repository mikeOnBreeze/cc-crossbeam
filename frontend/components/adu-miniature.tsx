'use client'

import Image from 'next/image'
import { useRandomAdu } from '@/hooks/use-random-adu'

// All available ADU exterior images (from public/images/adu/)
const ADU_EXTERIORS = [
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
