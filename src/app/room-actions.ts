// app/room-actions.ts
'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper function to get the current user and their household
async function getUserHousehold() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('household_id')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.household_id) {
    throw new Error('User has no household')
  }

  return { userId: user.id, householdId: profile.household_id }
}

// ACTION: Create a new room
export async function createRoom(formData: FormData) {
  const roomName = formData.get('roomName') as string
  const { householdId } = await getUserHousehold()

  // 1. Validate
  if (!roomName || roomName.trim().length < 2) {
    throw new Error('Room name must be at least 2 characters.')
  }

  // 2. Insert into database
  const { error } = await supabase.from('rooms').insert({
    name: roomName.trim(),
    household_id: householdId,
  })

  if (error) {
    console.error('Error creating room:', error)
    if (error.code === '23505') { // Unique constraint violation
      throw new Error('A room with this name already exists.')
    }
    throw new Error('Could not create room.')
  }

  // 3. Revalidate both the rooms page and the dashboard (so the modal updates)
  revalidatePath('/rooms')
  revalidatePath('/dashboard')
}

// ACTION: Delete an existing room
export async function deleteRoom(roomId: number) {
  const { householdId } = await getUserHousehold()
  const supabase = createSupabaseServerClient()

  // 1. Delete the room
  // We also check household_id to ensure a user can't delete another household's room
  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', roomId)
    .eq('household_id', householdId)

  if (error) {
    console.error('Error deleting room:', error)
    throw new Error('Could not delete room.')
  }
  
  // 2. Revalidate paths
  revalidatePath('/rooms')
  revalidatePath('/dashboard')
}