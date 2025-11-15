// app/(app)/rooms/page.tsx

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

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('household_id')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Error fetching profile for rooms page:', profileError)
    redirect('/dashboard')
  }

  if (!profile || !profile.household_id) {
    redirect('/dashboard')
  }

  const householdId = profile.household_id

  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .select('*, chore_count:chores(count)')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true })

  if (roomsError) {
    console.error('Error fetching rooms:', roomsError)
    return []
  }

  const processedRooms = (rooms || []).map(room => ({
    ...room,
    chore_count: (room.chore_count as any)?.[0]?.count ?? 0
  }))

  return processedRooms as RoomWithChoreCount[]
}


export default async function RoomsPage() {
  const rooms = await getRooms()

  return (
    <div className="space-y-10">
      
      {/* NEW: Sleek Page Header */}
      <header className="mb-6">
        <h2 className="font-heading text-4xl font-bold text-support-dark">
          Room Management
        </h2>
        <p className="mt-1 text-lg max-w-2xl text-support-dark/80">
          Add or remove rooms for your household. These will appear in the "Add
          Chore" form, making it easy to assign tasks to a location.
        </p>
      </header>

      {/* Client component to handle interactivity */}
      <RoomManager rooms={rooms} />
    </div>
  )
}