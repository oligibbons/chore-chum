// src/components/ZenMode.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChoreWithDetails, DbProfile } from '@/types/database'
import { X, ArrowRight, Sparkles, CheckCircle2, Timer, Coffee, Sun, Moon, Flame, Users } from 'lucide-react'
import ChoreItem from './ChoreItem'
import { useGameFeel } from '@/hooks/use-game-feel'
import { notifyZenStart } from '@/app/push-actions'
import Avatar from './Avatar'
import confetti from 'canvas-confetti'

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
  
  // --- 1. Robust Data Preparation ---
  // Filter to only pending chores assigned to the current user (or unassigned if that's the logic)
  // We prefer the list passed in via props which is already filtered in the parent Dashboard
  const pendingChores = useMemo(() => {
    return chores.filter(c => c.status !== 'complete')
  }, [chores])

  // --- 2. State ---
  const [choreIndex, setChoreIndex] = useState(0)
  const [secondsInZen, setSecondsInZen] = useState(0)
  const [isExiting, setIsExiting] = useState(false)

  // Derived Active Chore (Safe Circular Access)
  const activeChore = pendingChores.length > 0 
    ? pendingChores[choreIndex % pendingChores.length] 
    : null

  const othersWorking = activeMembers.filter(m => m.id !== currentUserId)

  // --- 3. Lifecycle & Effects ---

  // Notify & Shuffle on Mount
  useEffect(() => {
    if (isZen) {
      notifyZenStart()
      // Randomize start point so it feels fresh
      if (pendingChores.length > 1) {
        setChoreIndex(Math.floor(Math.random() * pendingChores.length))
      }
      // Lock Body Scroll
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
      setSecondsInZen(0)
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isZen]) // Intentionally run only when Zen toggles

  // Timer Tick
  useEffect(() => {
    if (!isZen) return
    const timer = setInterval(() => setSecondsInZen(s => s + 1), 1000)
    return () => clearInterval(timer)
  }, [isZen])

  // Keyboard Shortcuts
  useEffect(() => {
    if (!isZen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
      if (e.key === 'ArrowRight') handleSkip()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isZen])

  // --- 4. Handlers ---

  const handleClose = useCallback(() => {
    setIsExiting(true)
    interact('neutral')
    // Small delay to allow exit animation
    setTimeout(() => {
      setIsExiting(false)
      const params = new URLSearchParams(searchParams.toString())
      params.delete('view')
      router.push(`?${params.toString()}`)
    }, 300)
  }, [interact, router, searchParams])

  const handleSkip = useCallback(() => {
     triggerHaptic('light')
     // Increment index to show next card
     setChoreIndex(prev => prev + 1)
  }, [triggerHaptic])

  // --- 5. Helpers ---

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

  // --- 6. Render ---

  if (!isZen) return null

  return (
    <div 
        className={`
            fixed inset-0 z-[50] flex flex-col 
            bg-gradient-to-br from-slate-50 via-teal-50 to-indigo-50 
            dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950
            text-foreground transition-opacity duration-300 ease-in-out
            ${isExiting ? 'opacity-0' : 'opacity-100'}
        `}
    >
      {/* BACKGROUND NOISE TEXTURE (Optional for texture) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/noise.png')]" />

      {/* --- TOP BAR --- */}
      <div className="relative z-10 flex items-center justify-between p-6 pt-[calc(1.5rem+env(safe-area-inset-top))]">
         {/* Timer Pill */}
         <div className="flex items-center gap-3 bg-white/80 dark:bg-black/40 px-4 py-2 rounded-full border border-black/5 dark:border-white/10 shadow-sm backdrop-blur-md animate-in slide-in-from-top-2 duration-500">
            <div className={`w-2 h-2 rounded-full bg-red-500 ${secondsInZen % 2 === 0 ? 'opacity-100' : 'opacity-50'} transition-opacity`} />
            <span className="font-mono text-sm font-bold text-foreground tracking-widest">
                {formatTime(secondsInZen)}
            </span>
         </div>

         {/* Close Button */}
         <button 
            onClick={handleClose}
            className="p-3 rounded-full bg-white/80 dark:bg-black/40 text-muted-foreground hover:text-foreground border border-black/5 dark:border-white/10 shadow-sm hover:shadow-md backdrop-blur-md transition-all active:scale-95"
            aria-label="Exit Zen Mode"
         >
            <X className="h-6 w-6" />
         </button>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 w-full max-w-lg mx-auto relative z-10">
        
        {pendingChores.length === 0 ? (
            // --- STATE: ALL DONE ---
            <div className="text-center space-y-8 animate-in zoom-in duration-500">
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
                        Your list is cleared. Enjoy the peace.
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
            // --- STATE: ACTIVE CHORE ---
            <div className="w-full space-y-8">
                
                {/* Header Info */}
                <div className="text-center space-y-2 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 dark:bg-brand/20 text-brand-dark dark:text-brand-light text-xs font-bold uppercase tracking-wider">
                        {getTimeIcon(activeChore.time_of_day)}
                        <span>Focus Mode</span>
                    </div>
                    <h2 className="text-3xl font-heading font-bold text-foreground">
                        Just one thing.
                    </h2>
                </div>

                {/* THE CARD */}
                {/* KEY PROP IS CRITICAL HERE: It forces a full remount/animation when ID changes */}
                <div key={activeChore.id} className="relative group perspective-1000">
                    
                    {/* Stack Effect (Visual depth) */}
                    {pendingChores.length > 1 && (
                        <div className="absolute top-4 left-4 right-4 h-full bg-white/40 dark:bg-white/5 rounded-[2rem] border border-black/5 dark:border-white/5 shadow-sm -z-10 scale-95 duration-500" />
                    )}

                    {/* Main Card */}
                    <div className="
                        relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl 
                        rounded-[2.5rem] shadow-2xl shadow-brand/10 border border-white/50 dark:border-white/10 
                        p-2 ring-1 ring-black/5 dark:ring-white/5
                        animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 ease-out
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
                <div className="flex flex-col items-center gap-4 animate-in fade-in duration-1000 delay-200">
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
                        <div className="w-2 h-2 rounded-full bg-foreground/20" />
                        {pendingChores.length} task{pendingChores.length === 1 ? '' : 's'} remaining
                    </div>
                </div>

            </div>
        ) : (
            // --- STATE: LOADING/ERROR FALLBACK ---
            <div className="flex flex-col items-center justify-center text-muted-foreground animate-pulse">
                <Sparkles className="h-10 w-10 mb-2 opacity-50" />
                <p>Finding clarity...</p>
            </div>
        )}

      </div>

      {/* --- BOTTOM BAR: SOCIAL --- */}
      <div className="relative z-10 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex justify-center">
         {othersWorking.length > 0 && (
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-brand/20 shadow-lg animate-in slide-in-from-bottom-4 duration-700">
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

    </div>
  )
}