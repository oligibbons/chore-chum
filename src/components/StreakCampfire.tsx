// src/components/StreakCampfire.tsx
'use client'

import { Flame, AlertCircle, Trophy, Sparkles, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useGameFeel } from '@/hooks/use-game-feel'

type Props = {
  streak: number
  lastChoreDate?: string | null
}

export default function StreakCampfire({ streak, lastChoreDate }: Props) {
  const [isClient, setIsClient] = useState(false)
  const { interact } = useGameFeel()
  
  useEffect(() => setIsClient(true), [])

  // --- Logic: "At Risk" Check ---
  let isAtRisk = false
  if (isClient && streak > 0) {
    const today = new Date().toLocaleDateString('en-CA') 
    isAtRisk = lastChoreDate !== today
  }

  // --- Logic: Tiers & Progress ---
  // Tiers: 3, 7, 14, 30
  const nextMilestone = streak < 3 ? 3 : streak < 7 ? 7 : streak < 14 ? 14 : streak < 30 ? 30 : 100
  const prevMilestone = streak < 3 ? 0 : streak < 7 ? 3 : streak < 14 ? 7 : streak < 30 ? 14 : 30
  
  const progress = Math.min(100, Math.max(0, ((streak - prevMilestone) / (nextMilestone - prevMilestone)) * 100))
  
  // SVG Circle Params for Progress Ring
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  // --- Visual Config ---
  let fireColor = 'text-gray-300'
  let glowColor = 'bg-gray-200'
  let statusText = 'No Streak'
  let subText = 'Do a chore to spark it!'
  let Icon = Flame
  let showParticles = false

  if (streak > 0) {
    if (streak < 3) {
        fireColor = 'text-orange-400'
        glowColor = 'bg-orange-400/20'
        statusText = `${streak} Day Spark`
        subText = `${nextMilestone - streak} days to Campfire`
    } else if (streak < 7) {
        fireColor = 'text-orange-500'
        glowColor = 'bg-orange-500/30'
        statusText = `${streak} Day Campfire`
        subText = `${nextMilestone - streak} days to Blaze`
    } else if (streak < 30) {
        fireColor = 'text-red-500'
        glowColor = 'bg-red-500/40'
        statusText = `${streak} Day Blaze`
        subText = "You are on fire! 🔥"
        showParticles = true
    } else {
        fireColor = 'text-violet-500'
        glowColor = 'bg-violet-500/40'
        statusText = `${streak} Day Mythic`
        subText = "Unstoppable legend."
        Icon = Zap
        showParticles = true
    }
  }

  // Override visuals if At Risk
  if (isAtRisk) {
      fireColor = 'text-red-600'
      glowColor = 'bg-red-500/20'
      subText = "Save your streak!"
  }

  return (
    <button 
        onClick={() => interact('neutral')}
        className={`
            group relative flex items-center gap-3 p-2 pr-5 rounded-full border border-border/50 bg-white/80 backdrop-blur-sm shadow-sm transition-all hover:shadow-md hover:scale-[1.02] active:scale-95
            ${isAtRisk ? 'ring-2 ring-red-400/50 animate-pulse' : ''}
        `}
        title={`Next milestone: ${nextMilestone} days`}
    >
       {/* Icon Container with Progress Ring */}
       <div className="relative flex items-center justify-center w-12 h-12">
          
          {/* Progress Ring Background */}
          <svg className="absolute inset-0 transform -rotate-90 w-full h-full pointer-events-none">
            <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-gray-100" />
            <circle
              cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent"
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
              className={`transition-all duration-1000 ease-out ${isAtRisk ? 'text-red-400' : fireColor}`}
            />
          </svg>

          {/* Inner Glow */}
          <div className={`absolute inset-2 rounded-full blur-md transition-all duration-500 ${streak > 0 ? glowColor : 'bg-transparent'}`} />

          {/* Particles (CSS Only) */}
          {showParticles && !isAtRisk && (
            <>
                <div className="absolute bottom-2 left-3 w-1 h-1 bg-yellow-300 rounded-full animate-float-up" style={{ animationDelay: '0s' }} />
                <div className="absolute bottom-2 right-3 w-1 h-1 bg-orange-300 rounded-full animate-float-up" style={{ animationDelay: '0.5s' }} />
                <div className="absolute bottom-3 left-4 w-0.5 h-0.5 bg-white rounded-full animate-float-up" style={{ animationDelay: '1.2s' }} />
            </>
          )}

          {/* The Icon */}
          <div className={`relative z-10 transition-all duration-500 ${streak > 0 ? 'animate-flicker' : ''}`}>
             {isAtRisk ? (
                 <AlertCircle className={`w-6 h-6 text-red-500`} />
             ) : (
                 <Icon className={`w-6 h-6 ${fireColor} ${streak >= 30 ? 'drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]' : ''}`} fill={streak > 0 ? "currentColor" : "none"} />
             )}
          </div>
       </div>
       
       {/* Text Content */}
       <div className="flex flex-col items-start">
          <div className="flex items-center gap-1">
            <span className={`text-sm font-bold uppercase tracking-wide ${isAtRisk ? 'text-red-600' : 'text-text-primary'}`}>
                {statusText}
            </span>
            {streak >= 30 && <Trophy className="w-3 h-3 text-yellow-500" />}
          </div>
          <span className={`text-[10px] font-medium ${isAtRisk ? 'text-red-500 font-bold' : 'text-text-secondary'}`}>
            {subText}
          </span>
       </div>
    </button>
  )
}