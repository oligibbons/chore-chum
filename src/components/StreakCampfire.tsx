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
  // We determine the status based on the client's local "Today".
  // - Active: User has completed a chore today.
  // - Risk: User completed a chore yesterday (needs to extend today).
  // - Inactive: Last chore was older than yesterday (streak technically broken/frozen).
  
  let status: 'active' | 'risk' | 'inactive' = 'inactive'
  
  if (isClient && streak > 0 && lastChoreDate) {
    const now = new Date()
    // Format dates as YYYY-MM-DD in local time for comparison
    const todayStr = now.toLocaleDateString('en-CA') 
    
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toLocaleDateString('en-CA')

    // lastChoreDate from DB is YYYY-MM-DD string
    if (lastChoreDate === todayStr) {
        status = 'active'
    } else if (lastChoreDate === yesterdayStr) {
        status = 'risk'
    } else {
        status = 'inactive'
    }
  }

  // --- Logic: Tiers & Progress Math ---
  // Milestones: 3, 7, 14, 30
  let nextMilestone = 3
  let prevMilestone = 0
  
  if (streak >= 30) { nextMilestone = 100; prevMilestone = 30; }
  else if (streak >= 14) { nextMilestone = 30; prevMilestone = 14; }
  else if (streak >= 7) { nextMilestone = 14; prevMilestone = 7; }
  else if (streak >= 3) { nextMilestone = 7; prevMilestone = 3; }
  
  const rawProgress = ((streak - prevMilestone) / (nextMilestone - prevMilestone)) * 100
  const progress = Math.min(100, Math.max(0, rawProgress))

  // SVG Circle Configuration
  const radius = 14
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  // --- Visual Config ---
  let icon = <Flame className="w-5 h-5 text-gray-400" />
  let label = "No Streak"
  let subLabel = "Complete a chore"
  let containerStyles = "bg-gray-100/80 border-gray-200 text-gray-500"
  let ringColor = "text-gray-300"

  if (streak > 0) {
      // 1. Determine Base Tier Visuals
      if (streak < 3) {
          // SPARK (1-2 Days)
          label = `${streak} Day Spark`
          subLabel = "Keep it going!"
          icon = <Flame className={`w-5 h-5 ${status === 'active' ? 'text-orange-400' : 'text-orange-300'}`} />
          containerStyles = "bg-orange-50 border-orange-100 text-orange-700"
          ringColor = "text-orange-400"
      } else if (streak < 7) {
          // CAMPFIRE (3-6 Days)
          label = `${streak} Day Campfire`
          subLabel = "Heating up!"
          icon = <Flame className={`w-5 h-5 ${status === 'active' ? 'text-orange-500 fill-orange-500' : 'text-orange-400'}`} />
          containerStyles = "bg-orange-100/50 border-orange-200 text-orange-800"
          ringColor = "text-orange-500"
      } else if (streak < 30) {
          // BLAZE (7-29 Days)
          label = `${streak} Day Blaze`
          subLabel = "You're on fire!"
          icon = <Flame className={`w-5 h-5 ${status === 'active' ? 'text-red-500 fill-red-500 animate-flicker' : 'text-red-400'}`} />
          containerStyles = "bg-red-50 border-red-200 text-red-900"
          ringColor = "text-red-500"
      } else {
          // MYTHIC (30+ Days)
          label = `${streak} Day Mythic`
          subLabel = "Unstoppable."
          icon = <Zap className={`w-5 h-5 ${status === 'active' ? 'text-violet-500 fill-violet-500 animate-bounce' : 'text-violet-400'}`} />
          containerStyles = "bg-violet-50 border-violet-200 text-violet-900 shadow-sm"
          ringColor = "text-violet-500"
      }

      // 2. Apply Status Overrides
      if (status === 'risk') {
          icon = <Wind className="w-5 h-5 text-amber-600 animate-pulse" />
          subLabel = "Extend it today!"
          containerStyles = "bg-amber-50 border-amber-300 ring-2 ring-amber-400/30 text-amber-800 animate-pulse"
          ringColor = "text-amber-500"
      } else if (status === 'inactive') {
          icon = <AlertCircle className="w-5 h-5 text-gray-400" />
          subLabel = "Streak broken?"
          containerStyles = "bg-gray-100 border-gray-200 text-gray-500 grayscale"
          ringColor = "text-gray-300"
      }
  }

  return (
    <button 
        onClick={() => interact('neutral')}
        className={`
            group relative flex items-center gap-3 pl-2 pr-4 py-2 rounded-2xl border transition-all duration-300
            hover:scale-105 active:scale-95 shadow-sm hover:shadow-md
            ${containerStyles}
        `}
        title={`Next milestone: ${nextMilestone} days`}
    >
       {/* Progress Ring Wrapper */}
       <div className="relative flex items-center justify-center w-10 h-10 flex-shrink-0">
          {/* Background Circle */}
          <svg className="absolute inset-0 transform -rotate-90 w-full h-full pointer-events-none">
            <circle 
                cx="20" cy="20" r={radius} 
                stroke="currentColor" 
                strokeWidth="3" 
                fill="transparent" 
                className="text-black/5" 
            />
            {/* Active Progress Circle */}
            {streak > 0 && (
                <circle
                    cx="20" cy="20" r={radius} 
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
          <span className="text-[10px] font-bold opacity-80 leading-none mt-1">
            {subLabel}
          </span>
       </div>
    </button>
  )
}