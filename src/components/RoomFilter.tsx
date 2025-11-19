'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { DbRoom } from '@/types/database'

type Props = {
  rooms: DbRoom[]
}

export default function RoomFilter({ rooms }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentRoomId = searchParams.get('roomId')

  const handleRoomChange = (roomId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (roomId === 'all') {
      params.delete('roomId')
    } else {
      params.set('roomId', roomId)
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <button
        onClick={() => handleRoomChange('all')}
        className={`
          whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors
          ${!currentRoomId 
            ? 'bg-brand text-white shadow-md' 
            : 'bg-white text-text-secondary border border-border hover:border-brand hover:text-brand'
          }
        `}
      >
        All Rooms
      </button>
      {rooms.map((room) => (
        <button
          key={room.id}
          onClick={() => handleRoomChange(room.id.toString())}
          className={`
            whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors
            ${currentRoomId === room.id.toString()
              ? 'bg-brand text-white shadow-md'
              : 'bg-white text-text-secondary border border-border hover:border-brand hover:text-brand'
            }
          `}
        >
          {room.name}
        </button>
      ))}
    </div>
  )
}