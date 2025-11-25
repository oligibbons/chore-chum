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
  
  // 1. Filter List
  const pendingChores = chores.filter(c => c.status !== 'complete')

  // 2. Index-Based State (Robust vs Data Updates)
  // We store an index, not the object itself. This prevents "stale state" issues.
  const [choreIndex, setChoreIndex] = useState(0)
  const [secondsInZen, setSecondsInZen] = useState(0)

  // 3. Derived Active Chore (Safe Fallback)
  // If list is empty, null. If list exists, always returns a valid item via Modulo.
  const activeChore = pendingChores.length > 0 
    ? pendingChores[choreIndex % pendingChores.length] 
    : null

  // --- Effects ---

  // Notify on entry
  useEffect(() => {
    if (isZen) notifyZenStart()
  }, [isZen])

  // Timer
  useEffect(() => {
    if (!isZen) {
      setSecondsInZen(0)
      return
    }
    const interval = setInterval(() => setSecondsInZen(s => s + 1), 1000)
    document.body.style.overflow = 'hidden'
    return () => {
      clearInterval(interval)
      document.body.style.overflow = 'unset'
    }
  }, [isZen])

  // Shuffle once on mount (Client-side only to avoid Hydration Mismatch)
  useEffect(() => {
    if (isZen && pendingChores.length > 1) {
        setChoreIndex(Math.floor(Math.random() * pendingChores.length))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run once on mount

  // --- Handlers ---

  const closeZenMode = useCallback(() => {
    interact('neutral')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('view')
    router.push(`?${params.toString()}`)
  }, [interact, router, searchParams])

  const handleSkip = useCallback(() => {
     interact('neutral')
     // Simply increment index. Modulo logic above handles the wrapping.
     setChoreIndex(prev => prev + 1)
  }, [interact])

  useEffect(() => {
    if (!isZen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeZenMode()
      if (e.key === 'ArrowRight') handleSkip()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isZen, closeZenMode, handleSkip])

  // --- Helpers ---

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const getTimeIcon = (tag?: string | null) => {
    switch(tag) {
        case 'morning': return <Coffee className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        case 'afternoon': return <Sun className="h-4 w-4 text-orange-500 dark:text-orange-400" />
        case 'evening': return <Moon className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
        default: return <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />
    }
  }

  const othersWorking = activeMembers.filter(m => m.id !== currentUserId)

  if (!isZen) return null

  return (
    // Fixed container with solid background to cover dashboard
    <div className="fixed inset-0 z-[100] flex flex-col bg-teal-50 dark:bg-zinc-950 text-foreground animate-in fade-in duration-300">
      
      {/* Top Bar */}
      <div className="relative flex items-center justify-between p-6 pt-safe-top z-50">
         <div className="flex items-center gap-3 bg-white/60 dark:bg-white/10 px-4 py-2 rounded-full border border-teal-200 dark:border-white/10 shadow-sm">
            <Timer className="h-4 w-4 text-teal-700 dark:text-teal-300" />
            <span className="font-mono text-sm font-bold text-teal-900 dark:text-teal-100 tracking-wider">{formatTime(secondsInZen)}</span>
         </div>

         <button 
            onClick={closeZenMode}
            className="p-3 rounded-full bg-white/60 dark:bg-white/10 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-white/10 shadow-sm hover:bg-white dark:hover:bg-white/20 transition-all active:scale-95"
            aria-label="Close Zen Mode"
         >
            <X className="h-6 w-6" />
         </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto pb-32 w-full">
        <div className="w-full max-w-md mx-auto text-center space-y-10">
            
            {pendingChores.length === 0 ? (
                // --- SUCCESS STATE ---
                <div className="space-y-8 animate-in zoom-in duration-500">
                    <div className="mx-auto h-40 w-40 flex items-center justify-center rounded-full bg-gradient-to-tr from-teal-300 to-emerald-400 text-white shadow-2xl shadow-teal-200/50 animate-float-up">
                        <Flower2 className="h-20 w-20 animate-pulse" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-4xl font-heading font-bold text-teal-950 dark:text-teal-50">Mindful & Done.</h2>
                        <p className="text-xl text-teal-800/80 dark:text-teal-200/80 max-w-xs mx-auto">Your space is clear, and so is your mind.</p>
                    </div>
                    <button 
                    onClick={closeZenMode}
                    className="inline-flex items-center rounded-2xl bg-white dark:bg-teal-900 px-8 py-4 text-lg font-bold text-teal-600 dark:text-teal-100 shadow-xl ring-1 ring-teal-100 dark:ring-teal-800 transition-all hover:scale-105 active:scale-95"
                    >
                    Return to Dashboard
                    </button>
                </div>
            ) : activeChore ? (
                // --- ACTIVE CHORE STATE ---
                <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
                    {/* Header Text */}
                    <div className="mb-10 space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 dark:bg-white/10 text-teal-900 dark:text-teal-100 font-bold text-xs tracking-widest uppercase border border-teal-200/50 dark:border-white/10">
                            {getTimeIcon(activeChore.time_of_day)}
                            <span>Focus Mode</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-heading font-bold text-teal-950 dark:text-white tracking-tight leading-tight">
                            Just one thing.
                        </h2>
                    </div>
                    
                    {/* Stacked Card Visuals */}
                    <div className="relative group min-h-[140px]">
                        {pendingChores.length > 1 && (
                            <div 
                                className="absolute top-4 left-4 right-4 h-full bg-white/40 dark:bg-white/5 rounded-[2rem] border border-teal-100/50 dark:border-white/10 shadow-lg z-0 transform scale-[0.95]"
                                aria-hidden="true"
                            />
                        )}
                        
                        {/* Main Active Card */}
                        <div className="relative z-10 text-left">
                            <div className="absolute -inset-1 bg-gradient-to-r from-teal-200 to-brand/30 rounded-[2.2rem] blur-xl opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                            
                            <div className="relative bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-[2rem] shadow-xl border border-white/60 dark:border-white/10 p-2 ring-1 ring-black/5 dark:ring-white/5">
                                {/* Wrap in UL to satisfy LI requirement of ChoreItem */}
                                <ul className="m-0 p-0 list-none">
                                    <ChoreItem 
                                        chore={activeChore} 
                                        showActions={true} 
                                        status="due" 
                                        members={activeMembers} 
                                        currentUserId={currentUserId}
                                    />
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    {/* Controls */}
                    <div className="mt-12 flex flex-col items-center gap-6">
                        <button 
                            onClick={handleSkip}
                            className="group flex items-center justify-center gap-2 mx-auto text-sm font-bold text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 transition-colors py-2.5 px-5 rounded-xl bg-teal-100/50 dark:bg-white/10 hover:bg-teal-100 dark:hover:bg-white/20"
                        >
                            Skip for now 
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </button>
                        
                        <div className="flex items-center gap-2 text-xs font-medium text-teal-700/60 dark:text-teal-200/60">
                            <Layers className="h-3 w-3" />
                            <span>{pendingChores.length} tasks remaining</span>
                        </div>
                    </div>
                </div>
            ) : (
                // Fallback in rare case where list has length but item is null
                <div className="text-muted-foreground">Loading task...</div>
            )}

            {/* Social Momentum */}
            {othersWorking.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-max max-w-[90vw] z-50">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-md border border-teal-100 dark:border-white/10 text-teal-900 dark:text-teal-100 shadow-lg">
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