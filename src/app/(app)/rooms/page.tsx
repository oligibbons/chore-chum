// app/(app)/rooms/page.tsx

import { createSupabaseClient } from '@/lib/supabase/server' 
import { RoomWithChoreCount } from '@/types/database' // <-- Import new type
import { redirect } from 'next/navigation'
import RoomManager from '@/components/RoomManager'

// Tell Next.js to server-render this page
export const dynamic = 'force-dynamic'


// Helper function to fetch the user's rooms (LOGIC MODIFIED)
async function getRooms(): Promise<RoomWithChoreCount[]> { // <-- Return new type
  const supabase = await createSupabaseClient() 

  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  // 1. Get user's profile to find their household
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('household_id')
    .eq('id', user.id)
    .single()

  // 2. Handle errors
  if (profileError) {
    console.error('Error fetching profile for rooms page:', profileError)
    redirect('/dashboard')
  }

  // 3. Check if profile or household exists
  if (!profile || !profile.household_id) {
    redirect('/dashboard')
  }

  const householdId = profile.household_id

  // Fetch all rooms for that household AND count chores (FIXED QUERY)
  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .select('*, chore_count:chores(count)') // <-- FIXED
    .eq('household_id', householdId)
    .order('created_at', { ascending: true })

  if (roomsError) {
    console.error('Error fetching rooms:', roomsError)
    return [] // Return an empty array on error
  }

  // Process the room data to extract the count (from room-actions.ts)
  const processedRooms = (rooms || []).map(room => ({
    ...room,
    // Ensure chore_count is a number
    chore_count: (room.chore_count as any)?.[0]?.count ?? 0
  }))

  return processedRooms as RoomWithChoreCount[] // <-- Return processed data
}

// The Page component (PRESERVED LOGIC)
export default async function RoomsPage() {
  const rooms = await getRooms()

  return (
    <div className="space-y-10">
      
      {/* New: Sleek Page Header */}
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