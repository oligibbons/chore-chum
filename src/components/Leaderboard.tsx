// src/components/Leaderboard.tsx
'use client'

import { ChoreWithDetails, DbProfile } from '@/types/database'
import Avatar from './Avatar'
import { Trophy, Medal, Star } from 'lucide-react'

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
  // 1. Calculate Scores
  // Count how many completed chores belong to each user.
  // Ideally, we'd filter by "this week" or "this month", but for now, lifetime stats.
  const scores: LeaderboardEntry[] = members.map(member => {
    const count = chores.filter(c => 
      c.status === 'complete' && 
      // FIX: assigned_to is now an array, so we check if it includes the member ID
      c.assigned_to?.includes(member.id)
    ).length
    
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
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
            <Star className="h-5 w-5" />
        </div>
        <div>
            <h3 className="font-heading text-xl font-semibold">Leaderboard</h3>
            <p className="text-xs text-text-secondary">Top chores crushers</p>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        {sortedScores.length === 0 ? (
            <p className="text-sm text-text-secondary italic">No chores completed yet.</p>
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
                
                <span className="font-medium text-text-primary truncate max-w-[120px] sm:max-w-[150px]">
                    {entry.name.split(' ')[0]}
                </span>
                </div>

                <div className="px-3 py-1 rounded-full bg-brand-light text-brand font-bold text-sm">
                {entry.score}
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  )
}