// src/components/AppIcon.tsx
type Props = {
    className?: string
    withContainer?: boolean
  }
  
  export default function AppIcon({ className = "h-12 w-12", withContainer = true }: Props) {
    // Colors derived from your tailwind.config.ts
    // Brand Purple: hsl(252, 75%, 60%)
    // Brand Yellow: hsl(38, 92%, 50%) (status-due)
    const PURPLE = "hsl(252, 75%, 60%)" 
    const YELLOW = "hsl(38, 92%, 50%)"
  
    return (
      <svg
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="ChoreChum Logo"
      >
        {/* 1. Container Squircle */}
        {withContainer && (
          <rect width="512" height="512" rx="128" fill={PURPLE} />
        )}
  
        {/* 2. The Helper Bean Body */}
        <path 
          d="M126 380H386C408.091 380 426 362.091 426 340V245C426 156.634 354.366 85 266 85H246C157.634 85 86 156.634 86 245V340C86 362.091 103.909 380 126 380Z" 
          fill={withContainer ? "white" : "currentColor"} 
        />
  
        {/* 3. The Face Features Group */}
        <g fill={withContainer ? PURPLE : "transparent"}>
           {/* Eyes: Wide set = Cute */}
           <circle cx="190" cy="210" r="18" fill={withContainer ? PURPLE : "white"} />
           <circle cx="322" cy="210" r="18" fill={withContainer ? PURPLE : "white"} />
           
           {/* Mouth: The Brand Check-Smile */}
           <path
              d="M190 270C190 270 230 315 256 315C282 315 322 265 322 265"
              stroke={withContainer ? PURPLE : "white"}
              strokeWidth="32"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
        </g>
  
        {/* 4. The Clean Sparkle */}
        <path 
          d="M425 70L440 115L485 130L440 145L425 190L410 145L365 130L410 115L425 70Z" 
          fill={YELLOW} 
        />
      </svg>
    )
  }