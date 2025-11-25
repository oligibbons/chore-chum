// src/components/ZenMode.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChoreWithDetails, DbProfile } from '@/types/database'
import { X, ArrowRight, Sparkles, CheckCircle2, Timer, Coffee, Sun, Moon, Flame, Layers } from 'lucide-react'
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
  
  const { interact, triggerHaptic } = useGameFeel()
  
  // Mount state for Portal
  const [mounted, setMounted] = useState(false)
  // Visible state for CSS transitions
  const [isVisible, setIsVisible] = useState(false)

  const [choreIndex, setChoreIndex] = useState(0)
  const [secondsInZen, setSecondsInZen] = useState(0)

  // Filter Logic
  const pendingChores = useMemo(() => {
    return chores.filter(c => c.status !== 'complete')
  }, [chores])

  const activeChore = pendingChores.length > 0 
    ? pendingChores[choreIndex % pendingChores.length] 
    : null

  const othersWorking = activeMembers.filter(m => m.id !== currentUserId)

  // --- 1. Handle Mounting & Portal ---
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // --- 2. Handle Visibility & Logic ---
  useEffect(() => {
    if (isZen) {
      // Start Entry Animation
      // Small timeout allows the DOM to paint before we add the opacity class
      requestAnimationFrame(() => setIsVisible(true))
      
      notifyZenStart()
      document.body.style.overflow = 'hidden' // Lock scroll
      
      // Shuffle start chore for freshness
      if (pendingChores.length > 1) {
        setChoreIndex(Math.floor(Math.random() * pendingChores.length))
      }
    } else {
      setIsVisible(false)
      document.body.style.overflow = 'unset'
      setSecondsInZen(0)
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isZen, pendingChores.length])

  // Timer
  useEffect(() => {
    if (!isZen) return
    const timer = setInterval(() => setSecondsInZen(s => s + 1), 1000)
    return () => clearInterval(timer)
  }, [isZen])

  // --- Handlers ---

  const handleClose = useCallback(() => {
    interact('neutral')
    setIsVisible(false) // Trigger exit animation
    
    // Wait for animation to finish before unmounting/changing URL
    setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('view')
      router.push(`?${params.toString()}`)
    }, 300)
  }, [interact, router, searchParams])

  const handleSkip = useCallback(() => {
     triggerHaptic('light')
     setChoreIndex(prev => prev + 1)
  }, [triggerHaptic])

  // --- Helpers ---

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const getTimeIcon = (tag?: string | null) => {
    switch(tag) {
        case 'morning': return <Coffee className="h-4 w-4 text-amber-600" />
        case 'afternoon': return <Sun className="h-4 w-4 text-orange-500" />
        case 'evening': return <Moon className="h-4 w-4 text-indigo-400" />
        default: return <Sparkles className="h-4 w-4 text-teal-500" />
    }
  }

  // Prevent hydration mismatch and ensure we only render when requested
  if (!mounted || !isZen) return null

  // --- RENDER (PORTAL) ---
  // We render into document.body to escape any parent transforms (like PullToRefresh)
  return createPortal(
    <div 
        className={`
            fixed inset-0 z-[9999] flex flex-col 
            bg-gradient-to-br from-slate-50 via-teal-50 to-indigo-50 
            dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950
            text-foreground 
            transition-opacity duration-300 ease-in-out
            ${isVisible ? 'opacity-100' : 'opacity-0'}
        `}
        style={{ touchAction: 'none' }} // Prevent pull-to-refresh gestures on this screen
    >
      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/noise.png')]" />

      {/* --- HEADER --- */}
      <div className="relative z-20 flex items-center justify-between p-6 pt-[calc(1.5rem+env(safe-area-inset-top))]">
         <div className={`
            flex items-center gap-3 bg-white/80 dark:bg-black/40 px-4 py-2 rounded-full border border-black/5 dark:border-white/10 shadow-sm backdrop-blur-md
            transition-all duration-500 transform
            ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}
         `}>
            <Timer className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <span className="font-mono text-sm font-bold text-foreground tracking-widest">
                {formatTime(secondsInZen)}
            </span>
         </div>

         <button 
            onClick={handleClose}
            className="p-3 rounded-full bg-white/80 dark:bg-black/40 text-muted-foreground hover:text-foreground border border-black/5 dark:border-white/10 shadow-sm hover:shadow-md backdrop-blur-md transition-all active:scale-95"
         >
            <X className="h-6 w-6" />
         </button>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 w-full max-w-lg mx-auto relative z-10">
        
        {pendingChores.length === 0 ? (
            // --- ALL DONE STATE ---
            <div className={`
                text-center space-y-8 transition-all duration-700 delay-100
                ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
            `}>
                <div className="relative mx-auto h-48 w-48 flex items-center justify-center">
                    <div className="absolute inset-0 bg-teal-400/20 rounded-full blur-3xl animate-pulse" />
                    <div className="relative bg-gradient-to-tr from-teal-400 to-emerald-500 rounded-[2rem] p-8 shadow-2xl shadow-teal-500/20 transform transition-transform hover:scale-105">
                        <CheckCircle2 className="h-24 w-24 text-white" />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <h2 className="text-4xl font-heading font-black text-foreground tracking-tight">
                        Zen Achieved.
                    </h2>
                    <p className="text-xl text-muted-foreground font-medium">
                        Your list is cleared.
                    </p>
                </div>

                <button 
                    onClick={handleClose}
                    className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                    Return Home
                </button>
            </div>
        ) : activeChore ? (
            // --- ACTIVE CHORE STATE ---
            <div className={`
                w-full space-y-8 transition-all duration-500
                ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
            `}>
                
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 dark:bg-brand/20 text-brand-dark dark:text-brand-light text-xs font-bold uppercase tracking-wider">
                        {getTimeIcon(activeChore.time_of_day)}
                        <span>Focus Mode</span>
                    </div>
                    <h2 className="text-3xl font-heading font-bold text-foreground">
                        Just one thing.
                    </h2>
                </div>

                {/* THE CARD */}
                {/* KEY ensures React remounts this entirely on change */}
                <div key={activeChore.id} className="relative group animate-in zoom-in-95 duration-300">
                    
                    {/* Stack Depth Effect */}
                    {pendingChores.length > 1 && (
                        <div className="absolute top-4 left-4 right-4 h-full bg-white/40 dark:bg-white/5 rounded-[2rem] border border-black/5 dark:border-white/5 shadow-sm -z-10" />
                    )}

                    {/* Card Surface */}
                    <div className="
                        relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl 
                        rounded-[2.5rem] shadow-2xl shadow-brand/10 
                        border border-white/50 dark:border-white/10 
                        p-2 ring-1 ring-black/5 dark:ring-white/5
                    ">
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

                {/* Controls */}
                <div className="flex flex-col items-center gap-4">
                    {pendingChores.length > 1 && (
                        <button 
                            onClick={handleSkip}
                            className="group flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/10 transition-all"
                        >
                            Skip for now 
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </button>
                    )}
                    
                    <div className="text-xs font-medium text-muted-foreground flex items-center gap-2 opacity-60">
                        <Layers className="h-3 w-3" />
                        {pendingChores.length} task{pendingChores.length === 1 ? '' : 's'} remaining
                    </div>
                </div>

            </div>
        ) : (
            // --- FALLBACK ---
            <div className="flex flex-col items-center justify-center text-muted-foreground animate-pulse">
                <Sparkles className="h-10 w-10 mb-2 opacity-50" />
                <p>Finding clarity...</p>
            </div>
        )}

      </div>

      {/* --- SOCIAL FOOTER --- */}
      <div className="relative z-10 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex justify-center">
         {othersWorking.length > 0 && (
            <div className={`
                flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-brand/20 shadow-lg
                transition-all duration-700 delay-300
                ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
            `}>
                <div className="flex -space-x-2">
                    {othersWorking.slice(0, 3).map(m => (
                        <div key={m.id} className="ring-2 ring-white dark:ring-zinc-800 rounded-full">
                            <Avatar url={m.avatar_url} alt={m.full_name || ''} size={24} />
                        </div>
                    ))}
                </div>
                <div className="text-xs font-bold text-brand-dark dark:text-brand-light flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 fill-brand text-brand animate-pulse" />
                    <span>
                        {othersWorking.length === 1 
                            ? `${othersWorking[0].full_name?.split(' ')[0]} is focusing` 
                            : `${othersWorking.length} others focusing`}
                    </span>
                </div>
            </div>
         )}
      </div>

    </div>,
    document.body
  )
}