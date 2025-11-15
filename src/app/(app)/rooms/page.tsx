// app/(app)/rooms/page.tsx

import { createSupabaseClient } from '@/lib/supabase/server' // <-- THE FIX
import { DbRoom } from '@/types/database'
import { redirect } from 'next/navigation'
import RoomManager from '@/components/RoomManager'

// Tell Next.js to server-render this page
export const dynamic = 'force-dynamic'
// Tell Cloudflare to use the Edge Runtime
export const runtime = 'edge'

// Helper function to fetch the user's rooms
async function getRooms() {
  const supabase = createSupabaseClient() // <-- THE FIX

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

// The Page component
export default async function RoomsPage() {
  const rooms = await getRooms()

  return (
    <div>
      <h2 className="mb-6 font-heading text-3xl font-bold text-support-dark">
        Manage Rooms
      </h2>
      <p className="mb-8 max-w-2xl text-lg text-support-dark/80">
        Add or remove rooms for your household. These will appear in the "Add
        Chore" form, making it easy to assign tasks to a location.
      </p>

      {/* Client component to handle interactivity */}
      <RoomManager rooms={rooms} />
    </div>
  )
}