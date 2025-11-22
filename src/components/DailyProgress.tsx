// src/components/DailyProgress.tsx
'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import confetti from 'canvas-confetti'

type Props = {
  total: number
  completed: number
}

export default function DailyProgress({ total, completed }: Props) {
  const [progress, setProgress] = useState(0)
  
  // Calculate percentage, avoiding divide by zero
  const percentage = total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100))
  
  // Animate the bar on mount/update
  useEffect(() => {
    const timer = setTimeout(() => setProgress(percentage), 100)
    
    // Trigger confetti if hitting 100% from a lower number
    if (percentage === 100 && progress < 100 && total > 0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a78bfa', '#34d399', '#fbbf24']
      })
    }
    return () => clearTimeout(timer)
  }, [percentage, total, progress])

  // SVG Params
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  if (total === 0) return null

  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-card relative overflow-hidden">
       <div className="flex flex-col z-10">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Daily Goal</span>
          <div className="flex items-baseline gap-1">
             <span className="text-3xl font-heading font-bold text-brand">{completed}</span>
             <span className="text-lg text-text-secondary font-medium">/ {total}</span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
             {percentage === 100 ? "All done! Relax." : `${total - completed} to go`}
          </p>
       </div>

       <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
          {/* Background Circle */}
          <svg className="transform -rotate-90 w-full h-full">
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-100"
            />
            {/* Progress Circle */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-1000 ease-out ${percentage === 100 ? 'text-green-500' : 'text-brand'}`}
            />
          </svg>
          
          {/* Center Icon/Text */}
          <div className="absolute inset-0 flex items-center justify-center">
             {percentage === 100 ? (
                 <CheckCircle2 className="w-6 h-6 text-green-500 animate-in zoom-in" />
             ) : (
                 <span className="text-xs font-bold text-brand">{Math.round(progress)}%</span>
             )}
          </div>
       </div>
       
       {/* Background fill animation for 100% */}
       <div 
         className={`absolute inset-0 bg-green-50 transition-opacity duration-500 pointer-events-none ${percentage === 100 ? 'opacity-100' : 'opacity-0'}`} 
       />
    </div>
  )
}