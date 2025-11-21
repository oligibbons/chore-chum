'use client'

import { useState } from 'react'
import { ChoreWithDetails, DbProfile } from '@/types/database'
import Avatar from './Avatar'
import { Trophy, Medal, Star, Calendar, Infinity } from 'lucide-react'
import { useGameFeel } from '@/hooks/use-game-feel'

type Props = {
  members: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'>[]
  chores: ChoreWithDetails[]
}

type LeaderboardEntry = {
  memberId: string
  name: string
  avatarUrl: string | null
  score: number
}

export default function Leaderboard({ members, chores }: Props) {
  const [timeframe, setTimeframe] = useState<'all' | 'week'>('all')
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
        // Fallback to created_at if updated_at is missing (though actions set updated_at on complete)
        // We assume 'updated_at' captures the completion time for this MVP logic.
        const dateToCheck = (c as any).updated_at || c.created_at
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
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500 fill-yellow-500/20" />
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400 fill-gray-400/20" />
    if (index === 2) return <Medal className="h-5 w-5 text-amber-700 fill-amber-700/20" />
    return <span className="text-sm font-bold text-text-secondary w-5 text-center">{index + 1}</span>
  }

  return (
    <div className="flex flex-col h-full rounded-2xl border border-border bg-card p-6 shadow-card">
      
      {/* Header with Toggle */}
      <div className="flex items-start justify-between mb-6">
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

      <div className="flex-1 space-y-4">
        {sortedScores.every(s => s.score === 0) ? (
            <div className="flex flex-col items-center justify-center h-32 text-center opacity-60">
                <Trophy className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-text-secondary italic">
                    {timeframe === 'week' ? 'No chores this week.' : 'No chores completed yet.'}
                </p>
            </div>
        ) : (
            sortedScores.map((entry, index) => (
            <div 
                key={entry.memberId}
                className="flex items-center justify-between p-2 rounded-xl transition-colors hover:bg-background"
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
                    
                    <span className="font-medium text-text-primary truncate max-w-[100px] sm:max-w-[140px]">
                        {entry.name.split(' ')[0]}
                    </span>
                </div>

                <div className="px-3 py-1 rounded-full bg-brand-light text-brand font-bold text-sm min-w-[2rem] text-center">
                    {entry.score}
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  )
}