// components/Avatar.tsx

import Image from 'next/image'
import { User } from 'lucide-react'

type Props = {
  url: string | null | undefined
  alt: string
  size: number
}

// A sleek, reusable component for displaying user avatars
export default function Avatar({ url, alt, size }: Props) {
  // Utility for generating Tailwind h/w classes based on size prop (e.g., size=36 -> h-9 w-9)
  const sizeClass = `h-${size / 4} w-${size / 4}` 

  // Handle case where URL is missing or null (show user icon fallback)
  if (!url) {
    return (
      <div 
        className={`flex items-center justify-center rounded-full bg-support-light text-support-dark/70 ${sizeClass}`}
      >
        <User className="h-5 w-5" />
      </div>
    )
  }

  // Normal avatar display
  return (
    <div className={`relative overflow-hidden rounded-full ${sizeClass}`} title={alt}>
      <Image 
        src={url} 
        alt={alt} 
        fill
        sizes={`${size}px`}
        className="object-cover"
        // Priority for quick loading of profile images
        priority={true} 
      />
    </div>
  )
}