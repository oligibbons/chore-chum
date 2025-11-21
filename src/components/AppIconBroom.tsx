type Props = {
    className?: string
    withContainer?: boolean
  }
  
  export default function AppIcon({ className = "h-12 w-12", withContainer = true }: Props) {
    // Derived from tailwind.config.ts
    const PURPLE = "hsl(252, 75%, 60%)" 
  
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
  
        {/* 2. Abstract Broom Character */}
        <g transform="rotate(-15, 256, 256)">
          
          {/* Motion Lines (only visible if container is present or we need contrast) */}
          {withContainer && (
             <g opacity="0.4" stroke="white" strokeWidth="16" strokeLinecap="round">
               <path d="M105 360C105 360 145 400 205 410" transform="rotate(15, 256, 256)" />
               <path d="M85 310C85 310 115 340 165 350" transform="rotate(15, 256, 256)" />
             </g>
          )}
  
          {/* Handle */}
          <path 
            d="M256 100L256 200" 
            stroke={withContainer ? "white" : "currentColor"} 
            strokeWidth="32" 
            strokeLinecap="round" 
          />
  
          {/* Broom Head */}
          <path 
            d="M256 180 C 320 180, 360 220, 380 360 L 132 360 C 152 220, 192 180, 256 180 Z" 
            fill={withContainer ? "white" : "currentColor"} 
          />
  
          {/* Bristles Detail */}
          <path 
            d="M132 360 L132 370 C 132 385, 150 385, 160 370 L 165 380 C 165 395, 185 395, 195 380 L 200 390 C 200 405, 220 405, 230 390 L 256 400 L 282 390 C 292 405, 312 405, 312 390 L 317 380 C 327 395, 347 395, 347 380 L 352 370 C 362 385, 380 385, 380 370 L 380 360" 
            fill={withContainer ? "white" : "currentColor"} 
          />
  
          {/* Face Features (Cutout effect) */}
          <g fill={withContainer ? PURPLE : "transparent"}>
            <circle cx="220" cy="260" r="14" fill={withContainer ? PURPLE : "white"} />
            <circle cx="292" cy="260" r="14" fill={withContainer ? PURPLE : "white"} />
            <path 
              d="M225 290 Q 256 320 287 290" 
              stroke={withContainer ? PURPLE : "white"} 
              strokeWidth="10" 
              strokeLinecap="round" 
              fill="none" 
            />
          </g>
        </g>
      </svg>
    )
  }