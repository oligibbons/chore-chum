// src/components/NavLink.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useGameFeel } from '@/hooks/use-game-feel'

type NavLinkProps = {
  href: string
  children: React.ReactNode
}

export default function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href
  
  // QUICK WIN: Haptic Navigation
  const { triggerHaptic } = useGameFeel()

  return (
    <Link
      href={href}
      onClick={() => triggerHaptic('light')} // Subtle tap feel
      className={`
        flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold
        transition-all
        ${
          isActive
            ? 'bg-card text-brand shadow-sm' 
            : 'text-text-secondary hover:text-text-primary' 
        }
      `}
    >
      {children}
    </Link>
  )
}