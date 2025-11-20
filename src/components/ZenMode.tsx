'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChoreWithDetails } from '@/types/database'
import { X, ArrowRight, Sparkles, Flower2, Timer } from 'lucide-react'
import ChoreItem from './ChoreItem'

type Props = {
  chores: ChoreWithDetails[]
}

export default function ZenMode({ chores }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isZen = searchParams.get('view') === 'zen'
  
  const [currentChore, setCurrentChore] = useState<ChoreWithDetails | null>(null)
  const [isFading, setIsFading] = useState(false)
  const [secondsInZen, setSecondsInZen] = useState(0)

  // Filter only pending chores
  const pendingChores = chores.filter(c => c.status !== 'complete')

  // Focus Timer Logic
  useEffect(() => {
    if (!isZen) {
      setSecondsInZen(0)
      return
    }
    const interval = setInterval(() => {
      setSecondsInZen(s => s + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [isZen])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Chore Selection Logic
  useEffect(() => {
    if (isZen && pendingChores.length > 0) {
       const currentId = currentChore?.id
       const stillExists = pendingChores.find(c => c.id === currentId)
       
       if (!currentChore || !stillExists) {
         // Fade out before switching if we are manually skipping
         setIsFading(true)
         setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * pendingChores.length)
            setCurrentChore(pendingChores[randomIndex])
            setIsFading(false)
         }, 300)
       }
    }
  }, [isZen, pendingChores.length, currentChore?.id]) // Removed 'pendingChores' to prevent loop, used length instead

  const closeZenMode = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('view')
    router.push(`?${params.toString()}`)
  }

  const handleSkip = () => {
     setIsFading(true)
     setTimeout(() => {
        const otherChores = pendingChores.filter(c => c.id !== currentChore?.id)
        if (otherChores.length > 0) {
           const next = otherChores[Math.floor(Math.random() * otherChores.length)]
           setCurrentChore(next)
        }
        setIsFading(false)
     }, 300)
  }

  if (!isZen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal-50/95 backdrop-blur-md animate-in fade-in duration-500">
      {/* Ambient Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-100/50 to-blue-100/50 -z-10" />

      {/* Top Bar */}
      <div className="absolute top-6 left-6 flex items-center gap-3 text-teal-700/60">
         <div className="flex items-center gap-2 bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm border border-teal-100">
            <Timer className="h-4 w-4" />
            <span className="font-mono text-sm font-medium">{formatTime(secondsInZen)}</span>
         </div>
      </div>

      <button 
        onClick={closeZenMode}
        className="absolute top-6 right-6 p-3 rounded-full bg-white text-teal-600 shadow-sm border border-teal-100 hover:scale-110 transition-all hover:shadow-md"
        aria-label="Close Zen Mode"
      >
        <X className="h-6 w-6" />
      </button>

      <div className="max-w-lg w-full space-y-8 text-center p-6">
        
        {pendingChores.length === 0 ? (
           <div className="space-y-8 animate-in zoom-in duration-700">
             <div className="mx-auto h-32 w-32 flex items-center justify-center rounded-full bg-gradient-to-tr from-teal-400 to-blue-500 text-white shadow-2xl shadow-teal-200">
                <Flower2 className="h-16 w-16 animate-pulse" />
             </div>
             <div className="space-y-3">
                <h2 className="text-4xl font-heading font-bold text-teal-900">Mindful & Done.</h2>
                <p className="text-xl text-teal-700/80">You've cleared your space and your list.</p>
             </div>
             <button 
               onClick={closeZenMode}
               className="inline-flex items-center rounded-2xl bg-white px-8 py-4 text-lg font-bold text-teal-600 shadow-xl ring-1 ring-teal-100 transition-all hover:scale-105 hover:shadow-2xl"
             >
               Return to Dashboard
             </button>
           </div>
        ) : currentChore && (
          <div className={`transform transition-all duration-500 ${isFading ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
            <div className="mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-100/50 text-teal-700 font-medium text-sm mb-4">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Current Focus</span>
                </div>
                <h2 className="text-3xl font-heading font-bold text-teal-900 tracking-tight">
                  One thing at a time.
                </h2>
            </div>
            
            {/* Chore Card - Themed for Zen */}
            <div className="bg-white rounded-3xl shadow-2xl shadow-teal-900/5 border border-white/50 p-2 ring-4 ring-teal-50 transform transition-transform hover:scale-[1.01]">
               {/* Pass specific 'due' status to force standard styling, but override with CSS if needed */}
               <ChoreItem 
                 chore={currentChore} 
                 showActions={true} 
                 status="due"
               />
            </div>
            
            <div className="mt-12 space-y-4">
                <button 
                   onClick={handleSkip}
                   className="group flex items-center justify-center gap-2 mx-auto text-sm font-semibold text-teal-600/60 hover:text-teal-600 transition-colors"
                >
                    Skip for now 
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <p className="text-xs text-teal-400">
                   {pendingChores.length - 1} other items waiting nicely
                </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}