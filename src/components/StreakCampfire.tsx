'use client'

import { Flame } from 'lucide-react'

type Props = {
  streak: number
}

export default function StreakCampfire({ streak }: Props) {
  
  // Determine fire intensity
  let fireScale = 0.8
  let fireColor = 'text-gray-400' // Dead fire
  let statusText = 'No Streak'
  let containerClass = 'bg-gray-100'
  
  if (streak > 0) {
      fireColor = 'text-orange-500'
      fireScale = 1
      statusText = `${streak} Day Streak`
      containerClass = 'bg-orange-50 border-orange-100'
  }
  if (streak >= 3) {
      fireColor = 'text-orange-600'
      fireScale = 1.2
      containerClass = 'bg-orange-100 border-orange-200'
  }
  if (streak >= 7) {
      fireColor = 'text-red-500'
      fireScale = 1.4
      statusText = `${streak} Day Streak! 🔥`
      containerClass = 'bg-red-50 border-red-200 shadow-sm shadow-red-100'
  }
  if (streak >= 30) {
      fireColor = 'text-purple-500' // Blue/Purple flame (hottest)
      fireScale = 1.6
      statusText = `${streak} DAYS LEGEND`
      containerClass = 'bg-purple-50 border-purple-200 shadow-md shadow-purple-100'
  }

  return (
    <div className={`flex items-center gap-3 p-2 px-4 rounded-full border transition-all ${containerClass}`}>
       <div className="relative flex items-center justify-center w-8 h-8">
          {/* Animated Glow Background */}
          {streak > 0 && (
              <div className="absolute inset-0 bg-orange-400/30 rounded-full blur-md animate-pulse" />
          )}
          
          <Flame 
            className={`relative z-10 transition-all duration-500 ${fireColor}`} 
            style={{ 
                transform: `scale(${fireScale})`,
                filter: streak > 7 ? 'drop-shadow(0 0 4px rgba(255, 69, 0, 0.6))' : 'none'
            }}
          />
       </div>
       
       <div className="flex flex-col">
          <span className={`text-xs font-bold uppercase tracking-wider ${streak > 0 ? 'text-text-primary' : 'text-text-secondary'}`}>
            {statusText}
          </span>
          {streak === 0 && <span className="text-[10px] text-text-secondary">Do a chore to ignite!</span>}
       </div>
    </div>
  )
}