'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChoreWithDetails } from '@/types/database'
import { X, ArrowRight, Sparkles, Flower2, Timer, Sun, Moon, Coffee } from 'lucide-react'
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

  const pendingChores = chores.filter(c => c.status !== 'complete')

  useEffect(() => {
    if (!isZen) {
      setSecondsInZen(0)
      return
    }
    const interval = setInterval(() => {
      setSecondsInZen(s => s + 1)
    }, 1000)
    
    // Prevent body scroll while in Zen mode
    document.body.style.overflow = 'hidden'
    
    return () => {
      clearInterval(interval)
      document.body.style.overflow = 'unset'
    }
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
         setIsFading(true)
         setTimeout(() => {
            // Simple random selection for now, could be weighted by due date later
            const randomIndex = Math.floor(Math.random() * pendingChores.length)
            setCurrentChore(pendingChores[randomIndex])
            setIsFading(false)
         }, 300)
       }
    }
  }, [isZen, pendingChores.length, currentChore?.id]) 

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

  const getTimeIcon = (tag?: string | null) => {
    switch(tag) {
        case 'morning': return <Coffee className="h-4 w-4 text-amber-600" />
        case 'afternoon': return <Sun className="h-4 w-4 text-orange-500" />
        case 'evening': return <Moon className="h-4 w-4 text-indigo-500" />
        default: return <Sparkles className="h-4 w-4 text-teal-600" />
    }
  }

  if (!isZen) return null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-teal-50/95 backdrop-blur-xl animate-in fade-in duration-300">
      {/* Ambient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-100/50 via-white/50 to-blue-100/50 -z-10" />

      {/* Top Bar */}
      <div className="flex items-center justify-between p-6">
         <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-full backdrop-blur-md border border-teal-100 shadow-sm">
            <Timer className="h-4 w-4 text-teal-600" />
            <span className="font-mono text-sm font-bold text-teal-700">{formatTime(secondsInZen)}</span>
         </div>

         <button 
            onClick={closeZenMode}
            className="p-3 rounded-full bg-white text-teal-600 shadow-sm border border-teal-100 hover:bg-teal-50 transition-all active:scale-95"
            aria-label="Close Zen Mode"
         >
            <X className="h-6 w-6" />
         </button>
      </div>

      {/* Main Content Area - Flex Center */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md mx-auto text-center space-y-8">
            
            {pendingChores.length === 0 ? (
            <div className="space-y-8 animate-in zoom-in duration-500">
                <div className="mx-auto h-32 w-32 flex items-center justify-center rounded-full bg-gradient-to-tr from-teal-400 to-blue-500 text-white shadow-2xl shadow-teal-200">
                    <Flower2 className="h-16 w-16 animate-pulse" />
                </div>
                <div className="space-y-3">
                    <h2 className="text-4xl font-heading font-bold text-teal-900">Mindful & Done.</h2>
                    <p className="text-xl text-teal-700/80">You've cleared your space and your list.</p>
                </div>
                <button 
                onClick={closeZenMode}
                className="inline-flex items-center rounded-2xl bg-white px-8 py-4 text-lg font-bold text-teal-600 shadow-xl ring-1 ring-teal-100 transition-all hover:scale-105 active:scale-95"
                >
                Return to Dashboard
                </button>
            </div>
            ) : currentChore && (
            <div className={`transform transition-all duration-500 ${isFading ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
                <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-100/50 text-teal-800 font-medium text-sm mb-4 border border-teal-200/50">
                        {getTimeIcon(currentChore.time_of_day)}
                        <span className="capitalize">{currentChore.time_of_day && currentChore.time_of_day !== 'any' ? `${currentChore.time_of_day} Focus` : 'Current Focus'}</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-heading font-bold text-teal-950 tracking-tight leading-tight">
                        One thing at a time.
                    </h2>
                </div>
                
                {/* Chore Card - Themed for Zen */}
                <div className="bg-white rounded-[2rem] shadow-2xl shadow-teal-900/10 border border-white/60 p-2 ring-4 ring-white/50">
                    <ChoreItem 
                        chore={currentChore} 
                        showActions={true} 
                        status="due" // Force standard styling
                    />
                </div>
                
                <div className="mt-12 space-y-4">
                    <button 
                    onClick={handleSkip}
                    className="group flex items-center justify-center gap-2 mx-auto text-sm font-bold text-teal-600/60 hover:text-teal-700 transition-colors py-2 px-4 rounded-lg hover:bg-teal-50"
                    >
                        Skip for now 
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                    <p className="text-xs text-teal-400 font-medium">
                    {pendingChores.length - 1} other items waiting nicely
                    </p>
                </div>
            </div>
            )}

        </div>
      </div>
    </div>
  )
}