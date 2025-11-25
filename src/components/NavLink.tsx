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
  
  const { triggerHaptic } = useGameFeel()

  return (
    <Link
      href={href}
      onClick={() => triggerHaptic('light')}
      className={`
        flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold
        transition-all duration-200
        ${
          isActive
            ? 'bg-brand-light dark:bg-brand/20 text-brand dark:text-brand-light shadow-sm' 
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50' 
        }
      `}
    >
      {children}
    </Link>
  )
}