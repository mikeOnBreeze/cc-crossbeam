'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import {
  LogOutIcon,
  ChevronDownIcon,
  WrenchIcon,
  EyeIcon,
  RocketIcon,
  LayoutGridIcon,
  BookOpenIcon,
} from 'lucide-react'
import { useAppMode } from '@/hooks/use-app-mode'
import { setAppMode, type AppMode } from '@/lib/app-mode'

interface NavBarProps {
  userEmail: string
}

const MODE_CONFIG: Record<AppMode, { label: string; icon: typeof WrenchIcon }> = {
  'dev-test': { label: 'Dev Test', icon: WrenchIcon },
  'judge-demo': { label: 'Judge Demo', icon: EyeIcon },
  'real': { label: 'Real', icon: RocketIcon },
}

export function NavBar({ userEmail }: NavBarProps) {
  const router = useRouter()
  const mode = useAppMode()

  const handleSignOut = async () => {
    await fetch('/auth/signout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const handleModeChange = (value: string) => {
    setAppMode(value as AppMode)
    router.push('/dashboard')
    router.refresh()
  }

  const ModeIcon = MODE_CONFIG[mode].icon

  return (
    <nav className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="heading-card text-primary">CrossBeam</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/my-projects">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <LayoutGridIcon className="w-4 h-4" />
              <span className="text-sm font-body hidden sm:inline">Projects</span>
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <BookOpenIcon className="w-4 h-4" />
              <span className="text-sm font-body hidden sm:inline">How It Works</span>
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <ModeIcon className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground font-body hidden sm:inline">
                  {userEmail}
                </span>
                <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Mode</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={mode} onValueChange={handleModeChange}>
                {Object.entries(MODE_CONFIG).map(([key, { label, icon: Icon }]) => (
                  <DropdownMenuRadioItem key={key} value={key} className="gap-2">
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} variant="destructive">
                <LogOutIcon className="w-3.5 h-3.5" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
