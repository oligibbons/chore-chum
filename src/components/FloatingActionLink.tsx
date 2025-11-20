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

  // Render directly into document.body to escape any parent transforms (like PullToRefresh)
  return createPortal(
    <Link href={href} className={className} {...props}>
      {children}
    </Link>,
    document.body
  )
}