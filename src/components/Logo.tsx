import { Check } from 'lucide-react'

export default function Logo({ 
  className = "", 
  showText = true, 
  iconClassName = "h-8 w-8" 
}: { 
  className?: string
  showText?: boolean
  iconClassName?: string
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* The Icon */}
      <div className={`relative flex items-center justify-center text-brand ${iconClassName}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
        >
          {/* Left Eye (Bubble) */}
          <circle cx="35" cy="35" r="8" fill="currentColor" />
          
          {/* Right Eye (Bubble) */}
          <circle cx="65" cy="35" r="8" fill="currentColor" />
          
          {/* The "Check-Smile" 
              Starts like a checkmark (down stroke), but curves up into a smile.
              The stroke width varies slightly to give it that dynamic, friendly feel.
          */}
          <path
            d="M25 60 C 25 60, 45 85, 55 85 C 65 85, 85 55, 85 55"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* The Text */}
      {showText && (
        <span className="font-heading font-bold text-xl tracking-tight text-foreground">
          Chore<span className="text-brand">Chum</span>
        </span>
      )}
    </div>
  )
}