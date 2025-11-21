// src/components/FloatingActionLink.tsx
'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'

type Props = {
  href: string
  children: React.ReactNode
  className?: string
  [key: string]: any
}

export default function FloatingActionLink({ href, children, className, ...props }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // While not mounted (SSR), return null to avoid hydration mismatch
  if (!mounted) return null

  // QUICK WIN: Respect Safe Area Inset
  // Replaces the hardcoded 'bottom-8' with a calculation including the device's safe area.
  const safeClassName = className?.replace(
    'bottom-8', 
    'bottom-[calc(2rem+env(safe-area-inset-bottom))]'
  )

  // Render directly into document.body to escape any parent transforms (like PullToRefresh)
  return createPortal(
    <Link href={href} className={safeClassName} {...props}>
      {children}
    </Link>,
    document.body
  )
}