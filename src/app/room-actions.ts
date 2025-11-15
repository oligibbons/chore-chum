// src/app/room-actions.ts
'use server'

import { createSupabaseClient } from '@/lib/supabase/server' 
import { Database } from '@/types/supabase'
import { revalidatePath } from 'next/cache'

// This is still needed for createRoom
export type FormState = {
  success: boolean
  message: string
}

// Helper function (no changes)
async function getUserHousehold() {
  const supabase = await createSupabaseClient() 
  const {
    data: { user },
  } = await supabase.auth.getUser()
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

// getRoomsAndMembers function (no changes)
export async function getRoomsAndMembers(householdId: string) {
  const supabase = await createSupabaseClient() 

  const [roomsData, membersData] = await Promise.all([
    supabase
      .from('rooms')
      .select('*, chore_count:chores(count)')
      .eq('household_id', householdId)
      .order('created_at', { ascending: true }),
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('household_id', householdId),
  ])

  const rooms = (roomsData.data || []).map(room => ({
    ...room,
    chore_count: (room.chore_count as any)?.[0]?.count ?? 0
  }))

  return { 
    rooms: rooms || [], 
    members: membersData.data || [], 
  }
}


// createRoom function (no changes, this is correct)
export async function createRoom(
  prevState: FormState, 
  formData: FormData
): Promise<FormState> {
  const supabase = await createSupabaseClient() 
  const roomName = formData.get('roomName') as string
  
  let householdId: string;
  try {
    const userHousehold = await getUserHousehold()
    householdId = userHousehold.householdId
  } catch (error: any) {
    return { success: false, message: error.message }
  }

  if (!roomName || roomName.trim().length < 2) {
    return { success: false, message: 'Room name must be at least 2 characters.' }
  }

  const { error } = await supabase.from('rooms').insert({
    name: roomName.trim(),
    household_id: householdId,
  })

  if (error) {
    console.error('Error creating room:', error)
    if (error.code === '23505') {
      return { success: false, message: 'A room with this name already exists.' }
    }
    return { success: false, message: 'Could not create room.' }
  }

  revalidatePath('/rooms')
  revalidatePath('/dashboard')

  return { success: true, message: 'Room created!' }
}

// --- THIS IS THE FIX ---
// Change signature from 'Promise<FormState>' to 'Promise<void>'
// and remove the 'return' statements (or throw errors).
export async function deleteRoom(
  formData: FormData
): Promise<void> { // <-- FIX #1: Return type is void
  
  const roomIdStr = formData.get('roomId') as string
  if (!roomIdStr) {
    // We can't return a FormState, so we throw an error
    throw new Error('Room ID not provided.')
  }
  const roomId = Number(roomIdStr)

  let householdId: string;
  try {
    const userHousehold = await getUserHousehold()
    householdId = userHousehold.householdId
  } catch (error: any) {
    throw error // Re-throw the auth error
  }
  
  const supabase = await createSupabaseClient() 

  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', roomId)
    .eq('household_id', householdId)

  if (error) {
    console.error('Error deleting room:', error)
    // FIX #2: Throw an error instead of returning state
    throw new Error('Could not delete room.')
  }

  // 2. Revalidate paths
  revalidatePath('/rooms')
  revalidatePath('/dashboard')
  
  // FIX #3: No successful 'return' statement
}