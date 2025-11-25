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

  // --- The Beacon ---
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
    <div className="fixed inset-0 z-[100] flex flex-col bg-background/90 backdrop-blur-3xl animate-in fade-in duration-500">
      
      {/* --- Ethereal Background --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Soft pulsating orbs */}
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-teal-200/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-brand/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
          <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-blue-200/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
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
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto pb-32">
        <div className="w-full max-w-md mx-auto text-center space-y-10">
            
            {pendingChores.length === 0 ? (
            <div className="space-y-8 animate-in zoom-in duration-500">
                <div className="mx-auto h-40 w-40 flex items-center justify-center rounded-full bg-gradient-to-tr from-teal-300 to-emerald-400 text-white shadow-2xl shadow-teal-200 animate-float-up">
                    <Flower2 className="h-20 w-20 animate-pulse" />
                </div>
                <div className="space-y-3">
                    <h2 className="text-4xl font-heading font-bold text-teal-950">Mindful & Done.</h2>
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
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/30 backdrop-blur-sm text-teal-800 font-bold text-xs tracking-widest uppercase border border-white/40">
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
                            className="absolute top-4 left-4 right-4 h-full bg-white/20 backdrop-blur-sm rounded-[2rem] border border-white/30 shadow-lg z-0 transform scale-[0.95] transition-all duration-700"
                            aria-hidden="true"
                        />
                    )}
                    
                    {/* Main Active Card */}
                    <div className="relative z-10">
                        {/* Glow behind active card */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-teal-200/50 to-brand/30 rounded-[2.2rem] blur-xl opacity-50 group-hover:opacity-70 transition duration-1000"></div>
                        
                        <div className="relative bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-white/60 p-4 ring-1 ring-white/80">
                            <ChoreItem 
                                chore={currentChore} 
                                showActions={true} 
                                status="due" 
                                members={activeMembers} 
                                currentUserId={currentUserId}
                            />
                        </div>
                    </div>
                </div>
                
                {/* Controls & Session Stats */}
                <div className="mt-12 flex flex-col items-center gap-6">
                    <button 
                        onClick={handleSkip}
                        className="group flex items-center justify-center gap-2 mx-auto text-sm font-bold text-teal-700 hover:text-teal-900 transition-colors py-2.5 px-5 rounded-xl bg-white/30 hover:bg-white/50"
                    >
                        Skip for now 
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                    
                    <div className="flex items-center gap-2 text-xs font-medium text-teal-700/60">
                        <Layers className="h-3 w-3" />
                        <span>{pendingChores.length} tasks remaining for you</span>
                    </div>
                </div>
            </div>
            )}

            {/* Social Momentum Pill */}
            {othersWorking.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 animate-in slide-in-from-bottom-4 fade-in duration-700">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-teal-900/10 backdrop-blur-md border border-teal-900/5 text-teal-900 shadow-lg">
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