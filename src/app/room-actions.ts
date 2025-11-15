// src/app/room-actions.ts
'use server'

import { createSupabaseClient } from '@/lib/supabase/server' 
import { Database } from '@/types/supabase'
import { revalidatePath } from 'next/cache'

// FIX 1: Define the FormState that useFormState expects to return
export type FormState = {
  success: boolean
  message: string
}

// Helper function to get the current user and their household
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

// EXPORTED: Used by the dashboard page to get members and rooms
export async function getRoomsAndMembers(householdId: string) {
  const supabase = await createSupabaseClient() 

  const [roomsData, membersData] = await Promise.all([
    supabase
      .from('rooms')
      .select('*, chore_count:chores(count)') // Selects rooms and counts associated chores
      .eq('household_id', householdId)
      .order('created_at', { ascending: true }),
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('household_id', householdId),
  ])

  // Process the room data to extract the count
  const rooms = (roomsData.data || []).map(room => ({
    ...room,
    // PROACTIVE FIX: Safely access the count to avoid potential 'undefined' errors
    chore_count: (room.chore_count as any)?.[0]?.count ?? 0
  }))

  return { 
    rooms: rooms || [], 
    members: membersData.data || [], 
  }
}


// FIX 2: Update createRoom to use the (prevState, formData) signature
export async function createRoom(
  prevState: FormState, 
  formData: FormData
): Promise<FormState> {
  const supabase = await createSupabaseClient() 
  const roomName = formData.get('roomName') as string
  
  let householdId: string;
  try {
    // Get household ID securely
    const userHousehold = await getUserHousehold()
    householdId = userHousehold.householdId
  } catch (error: any) {
    return { success: false, message: error.message }
  }

  // 1. Validate
  if (!roomName || roomName.trim().length < 2) {
    // Return state instead of throwing
    return { success: false, message: 'Room name must be at least 2 characters.' }
  }

  // 2. Insert into database
  const { error } = await supabase.from('rooms').insert({
    name: roomName.trim(),
    household_id: householdId,
  })

  if (error) {
    console.error('Error creating room:', error)
    if (error.code === '23505') {
      // Return state instead of throwing
      return { success: false, message: 'A room with this name already exists.' }
    }
    // Return state instead of throwing
    return { success: false, message: 'Could not create room.' }
  }

  // 3. Revalidate
  revalidatePath('/rooms')
  revalidatePath('/dashboard')

  // 4. Return success state
  return { success: true, message: 'Room created!' }
}

// FIX 3: Update deleteRoom to accept FormData from the form action
export async function deleteRoom(
  formData: FormData
): Promise<FormState> {
  
  const roomIdStr = formData.get('roomId') as string
  if (!roomIdStr) {
    return { success: false, message: 'Room ID not provided.' }
  }
  const roomId = Number(roomIdStr)

  let householdId: string;
  try {
    const userHousehold = await getUserHousehold()
    householdId = userHousehold.householdId
  } catch (error: any) {
    return { success: false, message: error.message }
  }
  
  const supabase = await createSupabaseClient() 

  // 1. Delete the room
  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', roomId) // Use parsed ID
    .eq('household_id', householdId)

  if (error) {
    console.error('Error deleting room:', error)
    return { success: false, message: 'Could not delete room.' }
  }

  // 2. Revalidate paths
  revalidatePath('/rooms')
  revalidatePath('/dashboard')
  
  // 3. Return success state
  return { success: true, message: 'Room deleted.' }
}