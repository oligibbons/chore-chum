// src/app/(app)/rooms/page.tsx

import { createSupabaseClient } from '@/lib/supabase/server' 
import { RoomWithChoreCount } from '@/types/database'
import { redirect } from 'next/navigation'
import RoomManager from '@/components/RoomManager'

export const dynamic = 'force-dynamic'

async function getRooms(): Promise<RoomWithChoreCount[]> {
  const supabase = await createSupabaseClient() 

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/') 
  }

  const { data: rawProfile, error: profileError } = await supabase
    .from('profiles')
    .select('household_id')
    .eq('id', user.id)
    .single()

  const profile = rawProfile as { household_id: string | null } | null

  if (profileError || !profile || !profile.household_id) {
    redirect('/dashboard')
  }

  const householdId = profile.household_id

  const { data: roomsData, error: roomsError } = await supabase
    .from('rooms')
    .select('*, chore_count:chores(count)')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true })

  if (roomsError) {
    console.error('Error fetching rooms:', roomsError)
    return []
  }

  // FIX: Explicitly cast to 'any[]' to prevent TypeScript from inferring 'never[]'
  // due to the complex join query above.
  const rooms = roomsData as any[] | null

  const processedRooms = (rooms || []).map(room => ({
    ...room,
    chore_count: room.chore_count?.[0]?.count ?? 0
  }))

  return processedRooms as RoomWithChoreCount[]
}

export default async function RoomsPage() {
  const rooms = await getRooms()

  return (
    <div className="space-y-8">
      <header className="mb-6">
        <h2 className="text-4xl font-heading font-bold">
          Household Rooms
        </h2>
        <p className="mt-1 text-lg max-w-2xl text-text-secondary">
          Manage the locations in your home. Rooms help you assign chores
          to a specific place.
        </p>
      </header>

      <RoomManager rooms={rooms} />
    </div>
  )
}