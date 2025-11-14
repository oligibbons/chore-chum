// app/(app)/rooms/page.tsx

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { DbRoom } from '@/types/database'
import { redirect } from 'next/navigation'
import RoomManager from '@/components/RoomManager' // Our new component

// Helper function to fetch the user's rooms
async function getRooms() {
  const supabase = createSupabaseServerClient()
  
  // Get user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  // Get user's profile to find their household
  const { data: profile } = await supabase
    .from('profiles')
    .select('household_id')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.household_id) {
    // If they have no household, send them to the dashboard to create one
    redirect('/dashboard')
  }

  // Fetch all rooms for that household
  const { data: rooms, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('household_id', profile.household_id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching rooms:', error)
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
        Add or remove rooms for your household. These will appear in the 
        "Add Chore" form, making it easy to assign tasks to a location.
      </p>
      
      {/* Client component to handle interactivity */}
      <RoomManager rooms={rooms} />
    </div>
  )
}