// src/components/Avatar.tsx
'use client'

import { User } from 'lucide-react'
import { useState } from 'react'

type Props = {
  url?: string | null
  alt: string
  size?: number
  className?: string
}

export default function Avatar({ url, alt, size = 40, className = '' }: Props) {
  const [error, setError] = useState(false)

  const initials = alt
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      className={`relative flex-shrink-0 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border ${className}`}
      style={{ width: size, height: size }}
    >
      {url && !error ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <span
          className="font-bold text-muted-foreground select-none flex items-center justify-center w-full h-full"
          style={{ fontSize: Math.max(10, size * 0.4) }}
        >
          {initials || <User style={{ width: size * 0.6, height: size * 0.6 }} />}
        </span>
      )}
    </div>
  )
}