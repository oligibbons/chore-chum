'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChoreWithDetails } from '@/types/database'
import { X, ArrowRight, Sparkles } from 'lucide-react'
import ChoreItem from './ChoreItem'

type Props = {
  chores: ChoreWithDetails[]
}

export default function ZenMode({ chores }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  // We check for ?view=zen in the URL to activate this mode
  const isZen = searchParams.get('view') === 'zen'
  
  const [currentChore, setCurrentChore] = useState<ChoreWithDetails | null>(null)

  // Filter only pending chores
  const pendingChores = chores.filter(c => c.status !== 'complete')

  useEffect(() => {
    // If we are in Zen mode but haven't picked a chore yet, OR
    // the chore we were looking at is no longer in the pending list (completed/deleted)
    // then pick a new one.
    if (isZen && pendingChores.length > 0) {
       const currentId = currentChore?.id
       const stillExists = pendingChores.find(c => c.id === currentId)
       
       if (!currentChore || !stillExists) {
         // Random selection logic
         const randomIndex = Math.floor(Math.random() * pendingChores.length)
         setCurrentChore(pendingChores[randomIndex])
       }
    }
  }, [isZen, pendingChores, currentChore])

  const closeZenMode = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('view')
    router.push(`?${params.toString()}`)
  }

  if (!isZen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <button 
        onClick={closeZenMode}
        className="absolute top-6 right-6 p-2 rounded-full bg-card text-text-secondary hover:text-text-primary shadow-sm border border-border transition-transform hover:scale-110"
        aria-label="Close Zen Mode"
      >
        <X className="h-6 w-6" />
      </button>

      <div className="max-w-lg w-full space-y-8 text-center">
        
        {pendingChores.length === 0 ? (
           <div className="space-y-6 animate-in zoom-in duration-500">
             <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-status-complete/20 text-status-complete">
                <Sparkles className="h-12 w-12" />
             </div>
             <div className="space-y-2">
                <h2 className="text-3xl font-heading font-bold text-text-primary">All Clear!</h2>
                <p className="text-lg text-text-secondary">You've crushed every chore. Time to relax.</p>
             </div>
             <button 
               onClick={closeZenMode}
               className="inline-flex items-center rounded-xl bg-brand px-8 py-3 text-lg font-bold text-white shadow-lg transition-all hover:bg-brand-dark hover:scale-105"
             >
               Exit Zen Mode
             </button>
           </div>
        ) : currentChore && (
          <div className="transform transition-all duration-500">
            <div className="mb-8">
                <h2 className="text-sm font-bold uppercase tracking-widest text-brand mb-2">
                  Focus on this
                </h2>
                <p className="text-text-secondary">
                   {pendingChores.length - 1} other items hidden
                </p>
            </div>
            
            {/* We reuse ChoreItem but wrap it to make it look like a "featured" card */}
            <div className="bg-card rounded-2xl shadow-2xl border border-border/50 p-1 ring-1 ring-black/5 transform transition-transform hover:scale-[1.02]">
               <ChoreItem 
                 chore={currentChore} 
                 showActions={true} 
                 status="due" // Force a generic style so it doesn't look "overdue" red immediately
               />
            </div>
            
            <div className="mt-10">
                <button 
                   onClick={() => {
                     // Skip logic: Filter out current, pick random from remainder
                     const otherChores = pendingChores.filter(c => c.id !== currentChore.id)
                     if (otherChores.length > 0) {
                        const next = otherChores[Math.floor(Math.random() * otherChores.length)]
                        setCurrentChore(next)
                     }
                   }}
                   className="group flex items-center justify-center gap-2 mx-auto text-sm font-semibold text-text-secondary transition-colors hover:text-brand"
                >
                    Skip this one 
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}