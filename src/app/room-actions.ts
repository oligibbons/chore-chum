// src/app/room-actions.ts
'use server'

import { createSupabaseClient } from '@/lib/supabase/server' 
import { Database } from '@/types/supabase'
import { revalidatePath } from 'next/cache'

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

// NEW EXPORT: Used by the dashboard page to get members and rooms for the AddChoreModal
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
    chore_count: room.chore_count ? room.chore_count[0].count : 0
  }))

  return { 
    rooms: rooms || [], 
    members: membersData.data || [], 
  }
}


// ACTION: Create a new room
export async function createRoom(formData: FormData) {
  const supabase = await createSupabaseClient() 
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
    if (error.code === '23505') {
      // Unique constraint violation
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
  const supabase = await createSupabaseClient() 

  // 1. Delete the room
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