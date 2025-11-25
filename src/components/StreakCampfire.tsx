// src/components/StreakCampfire.tsx
'use client'

import { Flame, Zap, Wind, Trophy, AlertCircle } from 'lucide-react'
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

  // --- Logic: Streak State Determination ---
  let status: 'active' | 'risk' | 'inactive' = 'inactive'
  
  if (isClient && streak > 0 && lastChoreDate) {
    const now = new Date()
    const todayStr = now.toLocaleDateString('en-CA') 
    
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toLocaleDateString('en-CA')

    if (lastChoreDate === todayStr) {
        status = 'active'
    } else if (lastChoreDate === yesterdayStr) {
        status = 'risk'
    } else {
        status = 'inactive'
    }
  }

  // --- Logic: Tiers & Progress Math ---
  let nextMilestone = 3
  let prevMilestone = 0
  
  if (streak >= 30) { nextMilestone = 100; prevMilestone = 30; }
  else if (streak >= 14) { nextMilestone = 30; prevMilestone = 14; }
  else if (streak >= 7) { nextMilestone = 14; prevMilestone = 7; }
  else if (streak >= 3) { nextMilestone = 7; prevMilestone = 3; }
  
  const rawProgress = ((streak - prevMilestone) / (nextMilestone - prevMilestone)) * 100
  const progress = Math.min(100, Math.max(0, rawProgress))

  // SVG Config
  const radius = 14
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  // --- Visual Config (Dark Mode Compatible) ---
  let icon = <Flame className="w-5 h-5 text-muted-foreground" />
  let label = "No Streak"
  let subLabel = "Complete a chore"
  // Standardized height (h-[42px]) to match Zen Button
  let containerStyles = "h-[42px] bg-card border-border text-muted-foreground" 
  let ringColor = "text-muted"

  if (streak > 0) {
      if (streak < 3) {
          // SPARK
          label = `${streak} Day Spark`
          subLabel = "Keep it going!"
          icon = <Flame className={`w-5 h-5 ${status === 'active' ? 'text-orange-400' : 'text-orange-300/50'}`} />
          containerStyles = "h-[42px] bg-orange-50/50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400"
          ringColor = "text-orange-400"
      } else if (streak < 7) {
          // CAMPFIRE
          label = `${streak} Day Campfire`
          subLabel = "Heating up!"
          icon = <Flame className={`w-5 h-5 ${status === 'active' ? 'text-orange-500 fill-orange-500' : 'text-orange-400'}`} />
          containerStyles = "h-[42px] bg-orange-100/50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 text-orange-800 dark:text-orange-300"
          ringColor = "text-orange-500"
      } else if (streak < 30) {
          // BLAZE
          label = `${streak} Day Blaze`
          subLabel = "You're on fire!"
          icon = <Flame className={`w-5 h-5 ${status === 'active' ? 'text-red-500 fill-red-500 animate-flicker' : 'text-red-400'}`} />
          containerStyles = "h-[42px] bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-400"
          ringColor = "text-red-500"
      } else {
          // MYTHIC
          label = `${streak} Day Mythic`
          subLabel = "Unstoppable."
          icon = <Zap className={`w-5 h-5 ${status === 'active' ? 'text-violet-500 fill-violet-500 animate-bounce' : 'text-violet-400'}`} />
          containerStyles = "h-[42px] bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-900 dark:text-violet-400 shadow-sm"
          ringColor = "text-violet-500"
      }

      // Status Overrides
      if (status === 'risk') {
          icon = <Wind className="w-5 h-5 text-amber-600 animate-pulse" />
          subLabel = "Extend it today!"
          containerStyles = "h-[42px] bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 ring-2 ring-amber-400/30 text-amber-800 dark:text-amber-400 animate-pulse"
          ringColor = "text-amber-500"
      } else if (status === 'inactive') {
          icon = <AlertCircle className="w-5 h-5 text-muted-foreground" />
          subLabel = "Streak broken?"
          containerStyles = "h-[42px] bg-muted/50 border-border text-muted-foreground grayscale"
          ringColor = "text-muted"
      }
  }

  return (
    <button 
        onClick={() => interact('neutral')}
        className={`
            group relative flex items-center gap-3 pl-2 pr-4 py-1 rounded-2xl border transition-all duration-300
            hover:scale-105 active:scale-95 shadow-sm hover:shadow-md
            ${containerStyles}
        `}
        title={`Next milestone: ${nextMilestone} days`}
    >
       {/* Progress Ring Wrapper */}
       <div className="relative flex items-center justify-center w-8 h-8 flex-shrink-0">
          {/* Background Circle */}
          <svg className="absolute inset-0 transform -rotate-90 w-full h-full pointer-events-none">
            <circle 
                cx="16" cy="16" r={radius} 
                stroke="currentColor" 
                strokeWidth="3" 
                fill="transparent" 
                className="text-black/5 dark:text-white/10" 
            />
            {/* Active Progress Circle */}
            {streak > 0 && (
                <circle
                    cx="16" cy="16" r={radius} 
                    stroke="currentColor" 
                    strokeWidth="3" 
                    fill="transparent"
                    strokeDasharray={circumference} 
                    strokeDashoffset={strokeDashoffset} 
                    strokeLinecap="round"
                    className={`transition-all duration-1000 ease-out ${ringColor}`}
                />
            )}
          </svg>

          {/* The Centered Icon */}
          <div className="relative z-10">
             {icon}
          </div>
       </div>
       
       {/* Text Labels */}
       <div className="flex flex-col items-start text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-heading font-bold leading-none">
                {label}
            </span>
            {streak >= 30 && <Trophy className="w-3 h-3 text-yellow-500" />}
          </div>
          <span className="text-[10px] font-bold opacity-80 leading-none mt-0.5">
            {subLabel}
          </span>
       </div>
    </button>
  )
}