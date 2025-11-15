// app/(app)/rooms/page.tsx

import { createSupabaseClient } from '@/lib/supabase/server' 
import { DbRoom } from '@/types/database'
import { redirect } from 'next/navigation'
import RoomManager from '@/components/RoomManager'

// Tell Next.js to server-render this page
export const dynamic = 'force-dynamic'


// Helper function to fetch the user's rooms (PRESERVED LOGIC)
async function getRooms() {
  const supabase = await createSupabaseClient() 

  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  // 1. Define the type we EXPECT from our query
  type ProfileType = {
    household_id: string | null
  } | null

  // 2. Get user's profile to find their household
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('household_id')
    .eq('id', user.id)
    .single()

  // 3. Apply our manual type
  const typedProfile = profile as ProfileType

  // 4. Handle errors
  if (profileError) {
    console.error('Error fetching profile for rooms page:', profileError)
    redirect('/dashboard')
  }

  // 5. Check if profile or household exists
  if (!typedProfile || !typedProfile.household_id) {
    redirect('/dashboard')
  }

  const householdId = typedProfile.household_id

  // Fetch all rooms for that household
  const { data: rooms, error: roomsError } = await supabase
    .from('rooms')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true })

  if (roomsError) {
    console.error('Error fetching rooms:', roomsError)
    return [] // Return an empty array on error
  }

  return rooms as DbRoom[]
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