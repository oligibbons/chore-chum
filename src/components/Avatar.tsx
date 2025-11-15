// src/components/Avatar.tsx

import Image from 'next/image'
import { User } from 'lucide-react'

type Props = {
  url: string | null | undefined
  alt: string
  size: number
}

// A sleek, reusable component for displaying user avatars
export default function Avatar({ url, alt, size }: Props) {
  // Utility for generating Tailwind h/w classes (e.g., size=40 -> h-10 w-10)
  const sizeClass = `h-${size / 4} w-${size / 4}` 

  // Handle case where URL is missing or null (show user icon fallback)
  if (!url) {
    return (
      <div 
        className={`flex items-center justify-center rounded-full bg-background border border-border text-text-secondary ${sizeClass}`}
      >
        <User className="h-5 w-5" />
      </div>
    )
  }

  // Normal avatar display
  return (
    <div 
      className={`relative overflow-hidden rounded-full ${sizeClass} ring-2 ring-background`} 
      title={alt}
    >
      <Image 
        src={url} 
        alt={alt} 
        fill
        sizes={`${size}px`}
        className="object-cover"
        priority={true} 
      />
    </div>
  )
}