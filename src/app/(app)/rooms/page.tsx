// src/app/(app)/rooms/page.tsx

import { createSupabaseClient } from '@/lib/supabase/server' 
import { RoomWithChoreCount } from '@/types/database'
import { redirect } from 'next/navigation'
import RoomManager from '@/components/RoomManager'

export const dynamic = 'force-dynamic'

async function getRooms(): Promise<RoomWithChoreCount[]> {
  const supabase = await createSupabaseClient() 

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/') 

  const { data: profile } = await supabase
    .from('profiles')
    .select('household_id')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) redirect('/dashboard')

  const householdId = profile.household_id

  // Fetch Rooms with:
  // 1. Total Chore Count
  // 2. Overdue Chore Count (chores where due_date < now)
  const { data: roomsData, error } = await supabase
    .from('rooms')
    .select(`
        *,
        chores!room_id (
            status,
            due_date
        )
    `)
    .eq('household_id', householdId)
    .neq('chores.status', 'complete') // Only count pending chores
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching rooms:', error)
    return []
  }

  // Post-process to get counts
  const rooms = (roomsData || []).map((room: any) => {
      const pendingChores = room.chores || []
      
      const overdueCount = pendingChores.filter((c: any) => 
          c.due_date && new Date(c.due_date) < new Date()
      ).length

      return {
          id: room.id,
          name: room.name,
          created_at: room.created_at,
          household_id: room.household_id,
          chore_count: pendingChores.length,
          overdue_count: overdueCount
      }
  })

  return rooms as RoomWithChoreCount[]
}

export default async function RoomsPage() {
  const rooms = await getRooms()

  return (
    <div className="space-y-8 pb-20">
      <header className="mb-6">
        <h2 className="text-4xl font-heading font-bold text-foreground">
          Household Rooms
        </h2>
        <p className="mt-1 text-lg max-w-2xl text-muted-foreground">
          Manage the locations in your home. Tap a room to see what needs doing.
        </p>
      </header>

      <RoomManager rooms={rooms} />
    </div>
  )
}