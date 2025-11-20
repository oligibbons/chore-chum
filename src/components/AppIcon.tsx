import { Sparkles } from 'lucide-react'

type Props = {
  className?: string
  withContainer?: boolean
}

export default function AppIcon({ className = "h-12 w-12", withContainer = true }: Props) {
  // Brand Colors derived from Tailwind Config
  const PURPLE = "hsl(252, 75%, 60%)" // brand.DEFAULT
  const YELLOW = "hsl(38, 92%, 50%)"  // status.due

  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ChoreChum Logo"
    >
      {/* Container - Optional if you just want the character floating */}
      {withContainer && (
        <rect width="512" height="512" rx="128" fill={PURPLE} />
      )}

      {/* The Chum Figure */}
      <path 
        d="M145 160C145 104.772 189.772 60 245 60H267C322.228 60 367 104.772 367 160V320C367 397.32 304.32 460 227 460H185C118.726 460 65 406.274 65 340V240C65 195.817 100.817 160 145 160Z" 
        fill={withContainer ? "white" : "currentColor"} 
      />
      
      {/* Face Group - Cuts out the purple background */}
      <g fill={withContainer ? PURPLE : "transparent"}> 
        {/* We use a mask or fill logic depending on container, 
            but simplified here: these are the purple "holes" */}
         <circle cx="180" cy="220" r="25" fill={withContainer ? PURPLE : "white"} />
         <circle cx="300" cy="220" r="25" fill={withContainer ? PURPLE : "white"} />
         <path
            d="M150 300C150 300 210 380 240 380C270 380 330 290 330 290"
            stroke={withContainer ? PURPLE : "white"}
            strokeWidth="36"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
      </g>

      {/* The Clean Sparkle */}
      <path 
        d="M420 60L435 110L485 125L435 140L420 190L405 140L355 125L405 110L420 60Z" 
        fill={YELLOW} 
      />
    </svg>
  )
}