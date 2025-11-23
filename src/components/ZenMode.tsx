// src/components/ZenMode.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChoreWithDetails, DbProfile } from '@/types/database'
import { X, ArrowRight, Sparkles, Flower2, Timer, Sun, Moon, Coffee, Layers } from 'lucide-react'
import ChoreItem from './ChoreItem'
import { useGameFeel } from '@/hooks/use-game-feel'
import { notifyZenStart } from '@/app/push-actions'
import Avatar from './Avatar'

type Props = {
  chores: ChoreWithDetails[]
  activeMembers?: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'>[]
  currentUserId?: string
}

export default function ZenMode({ chores, activeMembers = [], currentUserId }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isZen = searchParams.get('view') === 'zen'
  const { interact } = useGameFeel()
  
  const [currentChore, setCurrentChore] = useState<ChoreWithDetails | null>(null)
  const [isFading, setIsFading] = useState(false)
  const [secondsInZen, setSecondsInZen] = useState(0)

  // Ensure we only work with pending items
  const pendingChores = chores.filter(c => c.status !== 'complete')

  // --- Phase 3: The Beacon ---
  useEffect(() => {
    if (isZen) {
      // Fire and forget the server action to notify others
      notifyZenStart()
    }
  }, [isZen])

  // --- Timer & Scroll Lock ---
  useEffect(() => {
    if (!isZen) {
      setSecondsInZen(0)
      return
    }
    const interval = setInterval(() => {
      setSecondsInZen(s => s + 1)
    }, 1000)
    
    document.body.style.overflow = 'hidden'
    
    return () => {
      clearInterval(interval)
      document.body.style.overflow = 'unset'
    }
  }, [isZen])

  const closeZenMode = useCallback(() => {
    interact('neutral')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('view')
    router.push(`?${params.toString()}`)
  }, [interact, router, searchParams])

  const handleSkip = useCallback(() => {
     interact('neutral')
     setIsFading(true)
     setTimeout(() => {
        const otherChores = pendingChores.filter(c => c.id !== currentChore?.id)
        if (otherChores.length > 0) {
           const next = otherChores[Math.floor(Math.random() * otherChores.length)]
           setCurrentChore(next)
        }
        setIsFading(false)
     }, 300)
  }, [interact, pendingChores, currentChore])

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    if (!isZen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeZenMode()
      if (e.key === 'ArrowRight') handleSkip()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isZen, closeZenMode, handleSkip])

  // --- Chore Selection Logic ---
  useEffect(() => {
    if (isZen && pendingChores.length > 0) {
       const currentId = currentChore?.id
       const stillExists = pendingChores.find(c => c.id === currentId)
       
       if (!currentChore || !stillExists) {
         setIsFading(true)
         setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * pendingChores.length)
            setCurrentChore(pendingChores[randomIndex])
            setIsFading(false)
         }, 300)
       }
    }
  }, [isZen, pendingChores.length, currentChore?.id]) 

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const getTimeIcon = (tag?: string | null) => {
    switch(tag) {
        case 'morning': return <Coffee className="h-4 w-4 text-amber-600" />
        case 'afternoon': return <Sun className="h-4 w-4 text-orange-500" />
        case 'evening': return <Moon className="h-4 w-4 text-indigo-500" />
        default: return <Sparkles className="h-4 w-4 text-teal-600" />
    }
  }

  // Identify others working (excluding self)
  const othersWorking = activeMembers.filter(m => m.id !== currentUserId)

  if (!isZen) return null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-teal-50/95 backdrop-blur-xl animate-in fade-in duration-300">
      {/* Ambient Living Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br from-teal-100/40 via-white/60 to-blue-100/40 animate-spin-slow opacity-70" style={{ animationDuration: '60s' }} />
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/20 to-teal-50/80" />
      </div>

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between p-6 pt-safe-top">
         <div className="flex items-center gap-3 bg-white/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/50 shadow-sm ring-1 ring-teal-100/50">
            <Timer className="h-4 w-4 text-teal-600" />
            <span className="font-mono text-sm font-bold text-teal-800 tracking-wider">{formatTime(secondsInZen)}</span>
         </div>

         <button 
            onClick={closeZenMode}
            className="p-3 rounded-full bg-white/40 text-teal-700 border border-white/50 shadow-sm hover:bg-white/60 transition-all active:scale-95"
            aria-label="Close Zen Mode"
         >
            <X className="h-6 w-6" />
         </button>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-start pt-12 sm:pt-24 p-6 overflow-y-auto">
        <div className="w-full max-w-md mx-auto text-center space-y-10">
            
            {pendingChores.length === 0 ? (
            <div className="space-y-8 animate-in zoom-in duration-500 pt-10">
                <div className="mx-auto h-40 w-40 flex items-center justify-center rounded-full bg-gradient-to-tr from-teal-300 to-emerald-400 text-white shadow-2xl shadow-teal-200 animate-float-up">
                    <Flower2 className="h-20 w-20 animate-pulse" />
                </div>
                <div className="space-y-3">
                    <h2 className="text-4xl font-heading font-bold text-teal-900">Mindful & Done.</h2>
                    <p className="text-xl text-teal-700/80 max-w-xs mx-auto">Your space is clear, and so is your mind.</p>
                </div>
                <button 
                onClick={closeZenMode}
                className="inline-flex items-center rounded-2xl bg-white px-8 py-4 text-lg font-bold text-teal-600 shadow-xl ring-1 ring-teal-100 transition-all hover:scale-105 active:scale-95"
                >
                Return to Dashboard
                </button>
            </div>
            ) : currentChore && (
            <div className={`transform transition-all duration-500 ${isFading ? 'opacity-0 translate-y-4 blur-sm' : 'opacity-100 translate-y-0 blur-0'}`}>
                
                {/* Header Text */}
                <div className="mb-10 space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-100/30 text-teal-800 font-bold text-xs tracking-widest uppercase border border-teal-200/30">
                        {getTimeIcon(currentChore.time_of_day)}
                        <span>Focus Mode</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-heading font-bold text-teal-950/90 tracking-tight leading-tight">
                        Just one thing.
                    </h2>
                </div>
                
                {/* Stacked Card Visuals */}
                <div className="relative group min-h-[140px]">
                    {/* The "Next Up" Card Stack */}
                    {pendingChores.length > 1 && (
                        <div 
                            className="absolute top-4 left-4 right-4 h-full bg-white/40 backdrop-blur-sm rounded-[2rem] border border-white/40 shadow-lg z-0 transform scale-[0.95] transition-all duration-700"
                            aria-hidden="true"
                        />
                    )}
                    
                    {/* Main Active Card */}
                    <div className="relative z-10">
                        <div className="absolute -inset-1 bg-gradient-to-r from-teal-200 to-blue-200 rounded-[2.2rem] blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                        <div className="relative bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-3 ring-1 ring-white/80">
                            <ChoreItem 
                                chore={currentChore} 
                                showActions={true} 
                                status="due" // Force standard styling
                                members={activeMembers} // Allow completing with others
                                currentUserId={currentUserId}
                            />
                        </div>
                    </div>
                </div>
                
                {/* Controls & Session Stats */}
                <div className="mt-12 flex flex-col items-center gap-6">
                    <button 
                        onClick={handleSkip}
                        className="group flex items-center justify-center gap-2 mx-auto text-sm font-bold text-teal-600 hover:text-teal-800 transition-colors py-2.5 px-5 rounded-xl bg-white/30 hover:bg-white/50"
                    >
                        Skip for now 
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                    
                    <div className="flex items-center gap-2 text-xs font-medium text-teal-600/60">
                        <Layers className="h-3 w-3" />
                        <span>{pendingChores.length} tasks remaining for you</span>
                    </div>
                </div>
            </div>
            )}

            {/* Social Momentum Pill */}
            {othersWorking.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 animate-in slide-in-from-bottom-4 fade-in duration-700">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-teal-900/10 backdrop-blur-md border border-teal-900/5 text-teal-800 shadow-lg">
                        <div className="flex -space-x-2">
                            {othersWorking.slice(0,3).map(m => (
                                <Avatar key={m.id} url={m.avatar_url} alt={m.full_name || ''} size={24} />
                            ))}
                        </div>
                        <span className="text-xs font-bold">
                            {othersWorking.length === 1 
                                ? `${othersWorking[0].full_name?.split(' ')[0]} is also working` 
                                : `${othersWorking.length} others are working`}
                        </span>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  )
}