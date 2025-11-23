// src/components/Leaderboard.tsx
'use client'

import { useState } from 'react'
import { ChoreWithDetails, DbProfile } from '@/types/database'
import Avatar from './Avatar'
import { Trophy, Medal, Star, Calendar, Infinity, Crown, Gift } from 'lucide-react'
import { useGameFeel } from '@/hooks/use-game-feel'

type Props = {
  members: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'>[]
  chores: ChoreWithDetails[]
  activeBountyDescription?: string | null
}

type LeaderboardEntry = {
  memberId: string
  name: string
  avatarUrl: string | null
  score: number
}

export default function Leaderboard({ members, chores, activeBountyDescription }: Props) {
  const [timeframe, setTimeframe] = useState<'all' | 'week'>('week') 
  const { interact } = useGameFeel()

  // 1. Calculate Scores
  const scores: LeaderboardEntry[] = members.map(member => {
    const count = chores.filter(c => {
      // Must be completed
      if (c.status !== 'complete') return false
      
      // Must be assigned to this member
      const isAssigned = c.assigned_to?.includes(member.id)
      if (!isAssigned) return false

      // Timeframe Filter
      if (timeframe === 'week') {
        const dateToCheck = c.created_at
        const completedDate = new Date(dateToCheck)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        return completedDate > sevenDaysAgo
      }

      return true
    }).length
    
    return {
      memberId: member.id,
      name: member.full_name || 'Unknown',
      avatarUrl: member.avatar_url,
      score: count
    }
  })

  // 2. Sort Descending
  const sortedScores = scores.sort((a, b) => b.score - a.score)

  // 3. Icons helper
  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-yellow-500 fill-yellow-500 animate-bounce" style={{ animationDuration: '2s' }} />
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400 fill-gray-400/20" />
    if (index === 2) return <Medal className="h-5 w-5 text-amber-700 fill-amber-700/20" />
    return <span className="text-sm font-bold text-text-secondary w-5 text-center">{index + 1}</span>
  }

  return (
    <div className="flex flex-col h-full rounded-2xl border border-border bg-card p-6 shadow-card relative overflow-hidden">
      
      {/* Header with Toggle */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
            <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                <Star className="h-5 w-5" />
            </div>
            <div>
                <h3 className="font-heading text-xl font-semibold">Leaderboard</h3>
                <p className="text-xs text-text-secondary">Top crushers</p>
            </div>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1">
            <button
                onClick={() => { interact('neutral'); setTimeframe('week') }}
                className={`p-1.5 rounded-md transition-all ${timeframe === 'week' ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                title="This Week"
            >
                <Calendar className="h-4 w-4" />
            </button>
            <button
                onClick={() => { interact('neutral'); setTimeframe('all') }}
                className={`p-1.5 rounded-md transition-all ${timeframe === 'all' ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                title="All Time"
            >
                <Infinity className="h-4 w-4" />
            </button>
        </div>
      </div>

      {/* BOUNTY BANNER (Real Data) */}
      {timeframe === 'week' && activeBountyDescription && (
          <div className="mb-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-3 text-white shadow-lg transform transition-all hover:scale-[1.02] animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-1">
                  <Gift className="h-4 w-4 text-yellow-300" />
                  <span className="text-xs font-bold uppercase tracking-wider text-yellow-300">Active Bounty</span>
              </div>
              <p className="text-sm font-medium leading-tight">
                  {activeBountyDescription}
              </p>
          </div>
      )}

      <div className="flex-1 space-y-4">
        {sortedScores.every(s => s.score === 0) ? (
            <div className="flex flex-col items-center justify-center h-32 text-center opacity-60">
                <Trophy className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-text-secondary italic">
                    {timeframe === 'week' ? 'Race hasn\'t started yet!' : 'No chores completed yet.'}
                </p>
            </div>
        ) : (
            sortedScores.map((entry, index) => (
            <div 
                key={entry.memberId}
                className={`
                    flex items-center justify-between p-2 rounded-xl transition-colors 
                    ${index === 0 && timeframe === 'week' ? 'bg-yellow-50 border border-yellow-100' : 'hover:bg-background'}
                `}
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8">
                        {getRankIcon(index)}
                    </div>
                    
                    <Avatar 
                        url={entry.avatarUrl} 
                        alt={entry.name} 
                        size={40} 
                    />
                    
                    <div className="flex flex-col">
                        <span className="font-medium text-text-primary truncate max-w-[100px] sm:max-w-[140px]">
                            {entry.name.split(' ')[0]}
                        </span>
                        {index === 0 && timeframe === 'week' && (
                            <span className="text-[10px] text-yellow-600 font-bold uppercase">Winning</span>
                        )}
                    </div>
                </div>

                <div className={`px-3 py-1 rounded-full font-bold text-sm min-w-[2rem] text-center ${index === 0 ? 'bg-yellow-200 text-yellow-800' : 'bg-brand-light text-brand'}`}>
                    {entry.score}
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  )
}