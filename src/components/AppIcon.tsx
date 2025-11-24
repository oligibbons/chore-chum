// src/components/AppIcon.tsx
import Image from 'next/image'

type Props = {
  className?: string
  withContainer?: boolean
}

export default function AppIcon({ className = "h-12 w-12", withContainer = true }: Props) {
  return (
    <div 
      className={`
        relative overflow-hidden ${className} 
        ${withContainer ? 'rounded-[22%] shadow-sm' : ''}
      `}
    >
      <Image
        src="/icon-512.png"
        alt="ChoreChum Logo"
        fill
        sizes="(max-width: 768px) 96px, 192px"
        className="object-cover"
        priority
      />
    </div>
  )
}