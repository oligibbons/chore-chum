'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { DbRoom } from '@/types/database'
import { User, Users } from 'lucide-react'
import { useGameFeel } from '@/hooks/use-game-feel'

type Props = {
  rooms: DbRoom[]
}

export default function FilterBar({ rooms }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { interact } = useGameFeel()
  
  const currentRoomId = searchParams.get('roomId')
  const viewMode = searchParams.get('assignee') || 'all' // 'all' or 'me'

  const updateParams = (key: string, value: string | null) => {
    interact('neutral') // Haptic feedback
    const params = new URLSearchParams(searchParams.toString())
    if (value === null) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-3 w-full">
        
        {/* 1. Me / Everyone Toggle */}
        <div className="flex bg-card border border-border rounded-xl p-1 self-start">
            <button
                onClick={() => updateParams('assignee', null)}
                className={`
                    flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all
                    ${viewMode === 'all' 
                        ? 'bg-brand-light text-brand shadow-sm' 
                        : 'text-text-secondary hover:text-text-primary'}
                `}
            >
                <Users className="h-4 w-4" />
                Everyone
            </button>
            <button
                onClick={() => updateParams('assignee', 'me')}
                className={`
                    flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all
                    ${viewMode === 'me' 
                        ? 'bg-brand-light text-brand shadow-sm' 
                        : 'text-text-secondary hover:text-text-primary'}
                `}
            >
                <User className="h-4 w-4" />
                My Chores
            </button>
        </div>

        {/* 2. Room Filter (Scrollable) */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mask-gradient">
            <button
                onClick={() => updateParams('roomId', null)}
                className={`
                whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all border
                ${!currentRoomId 
                    ? 'bg-text-primary text-white border-text-primary shadow-md' 
                    : 'bg-white text-text-secondary border-border hover:border-brand hover:text-brand'
                }
                `}
            >
                All Rooms
            </button>
            {rooms.map((room) => (
                <button
                key={room.id}
                onClick={() => updateParams('roomId', room.id.toString())}
                className={`
                    whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all border
                    ${currentRoomId === room.id.toString()
                    ? 'bg-text-primary text-white border-text-primary shadow-md'
                    : 'bg-white text-text-secondary border-border hover:border-brand hover:text-brand'
                    }
                `}
                >
                {room.name}
                </button>
            ))}
        </div>
    </div>
  )
}