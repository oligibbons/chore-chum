// src/components/NavLink.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavLinkProps = {
  href: string
  children: React.ReactNode
}

export default function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={`
        flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold
        transition-all
        ${
          isActive
            ? 'bg-card text-brand shadow-sm' // Active: White, purple text, shadow
            : 'text-text-secondary hover:text-text-primary' // Inactive: Gray text
        }
      `}
    >
      {children}
    </Link>
  )
}