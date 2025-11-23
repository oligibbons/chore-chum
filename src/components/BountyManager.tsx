// src/components/BountyManager.tsx
'use client'

import { useState, useEffect, useTransition } from 'react'
import { DbBounty } from '@/types/database'
import { getActiveBounty, setNewBounty, clearBounty } from '@/app/bounty-actions'
import { Gift, Plus, Trash2, Loader2, Trophy, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { useGameFeel } from '@/hooks/use-game-feel'

export default function BountyManager() {
  const [bounty, setBounty] = useState<DbBounty | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newDescription, setNewDescription] = useState('')
  const [pending, startTransition] = useTransition()
  
  const { interact } = useGameFeel()

  const refreshBounty = async () => {
    const data = await getActiveBounty()
    setBounty(data)
    setLoading(false)
  }

  useEffect(() => {
    refreshBounty()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDescription.trim()) return

    startTransition(async () => {
      const result = await setNewBounty(newDescription)
      if (result.success) {
        toast.success(result.message)
        setNewDescription('')
        setIsCreating(false)
        interact('success')
        refreshBounty()
      } else {
        toast.error(result.message)
      }
    })
  }

  const handleClaim = async () => {
    if (!bounty) return
    if (!confirm('Are you sure you want to clear this bounty? This usually means someone won!')) return

    startTransition(async () => {
      const result = await clearBounty(bounty.id)
      if (result.success) {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#fbbf24', '#f59e0b', '#d97706'] // Golds
        })
        toast.success("Bounty claimed/cleared!")
        setBounty(null)
      } else {
        toast.error(result.message)
      }
    })
  }

  if (loading) return (
    <div className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
  )

  // --- View 1: No Active Bounty ---
  if (!bounty) {
    if (isCreating) {
        return (
            <div className="rounded-2xl border border-dashed border-brand/30 bg-brand/5 p-4 animate-in fade-in slide-in-from-top-2">
                <form onSubmit={handleCreate} className="flex flex-col gap-3">
                    <label className="text-sm font-bold text-brand flex items-center gap-2">
                        <Gift className="h-4 w-4" />
                        Set a Reward
                    </label>
                    <input 
                        type="text" 
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="e.g. 'Winner picks the movie tonight'"
                        className="w-full rounded-xl border-border text-sm focus:border-brand focus:ring-brand"
                        autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                        <button 
                            type="button" 
                            onClick={() => setIsCreating(false)}
                            className="px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={pending || !newDescription.trim()}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-brand hover:bg-brand-dark rounded-lg disabled:opacity-50 flex items-center gap-2"
                        >
                            {pending && <Loader2 className="h-3 w-3 animate-spin" />}
                            Set Bounty
                        </button>
                    </div>
                </form>
            </div>
        )
    }

    return (
        <button 
            onClick={() => setIsCreating(true)}
            className="w-full rounded-2xl border-2 border-dashed border-gray-200 p-4 flex items-center justify-center gap-2 text-gray-400 hover:border-brand/50 hover:text-brand hover:bg-brand/5 transition-all group"
        >
            <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Set a Weekly Bounty</span>
        </button>
    )
  }

  // --- View 2: Active Bounty Display ---
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-6 text-white shadow-lg shadow-orange-200 transition-transform hover:scale-[1.01]">
        
        {/* Shine Effect */}
        <div className="absolute -top-10 -right-10 h-32 w-32 bg-white/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-white/90">Current Bounty</span>
                </div>
                
                <h3 className="text-xl font-heading font-bold leading-tight text-white mb-1">
                    {bounty.description}
                </h3>
                <p className="text-sm text-orange-100 font-medium">
                    Top the leaderboard to claim!
                </p>
            </div>

            <button
                onClick={handleClaim}
                disabled={pending}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-md"
                title="Clear/Claim Bounty"
            >
                {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
            </button>
        </div>
        
        <div className="absolute bottom-2 right-2 text-white/10">
            <Sparkles className="h-12 w-12" />
        </div>
    </div>
  )
}