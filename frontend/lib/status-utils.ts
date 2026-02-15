import type { ProjectStatus } from '@/types/database'

interface StatusConfig {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  className?: string
}

export function getStatusConfig(status: ProjectStatus): StatusConfig {
  switch (status) {
    case 'completed':
      return { label: 'Completed', variant: 'default' }
    case 'processing':
    case 'processing-phase1':
    case 'processing-phase2':
      return { label: 'In Review', variant: 'secondary', className: 'bg-amber-100 text-amber-800 border-amber-200' }
    case 'awaiting-answers':
      return { label: 'Awaiting Input', variant: 'secondary', className: 'bg-blue-100 text-blue-800 border-blue-200' }
    case 'ready':
    case 'uploading':
      return { label: 'Pending', variant: 'outline' }
    case 'failed':
      return { label: 'Failed', variant: 'destructive' }
    default:
      return { label: status, variant: 'outline' }
  }
}

export function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 30) return `${diffDays}d ago`
  return new Date(dateStr).toLocaleDateString()
}

const ADU_IMAGE_POOL = [
  '/images/adu/adu-01-2story-garage-transparent.png',
  '/images/adu/adu-02-studio-greenroof-transparent.png',
  '/images/adu/adu-03-garage-conversion-transparent.png',
  '/images/adu/adu-06-spanish-style-transparent.png',
  '/images/adu/adu-07-aframe-transparent.png',
  '/images/adu/adu-08-prefab-modular-transparent.png',
  '/images/adu/cameron-01-longbeach-transparent.png',
  '/images/adu/cameron-04-whittier-2story-transparent.png',
  '/images/adu/cameron-05-lakewood-porch-transparent.png',
  '/images/adu/cameron-06-sandimas-butterfly-transparent.png',
  '/images/adu/cameron-09-signalhill-cottage-transparent.png',
  '/images/adu/cameron-10-downey-lshape-transparent.png',
]

export function getAduImage(projectId: string): string {
  let hash = 0
  for (let i = 0; i < projectId.length; i++) {
    hash = ((hash << 5) - hash) + projectId.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % ADU_IMAGE_POOL.length
  return ADU_IMAGE_POOL[index]
}
