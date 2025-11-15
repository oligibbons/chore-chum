// src/app/chore-actions.ts
'use server'

import { createSupabaseClient } from '@/lib/supabase/server' 
import { Database } from '@/types/supabase'
import {
  HouseholdData,
  ChoreWithDetails,
  DbChore,
  DbHousehold,
} from '@/types/database'
import { revalidatePath } from 'next/cache'
import { RRule } from 'rrule'

// Define the type for a new chore row
type ChoreInsert = Database['public']['Tables']['chores']['Insert']

type ActionResponse = {
  success: boolean
  message?: string
  didComplete?: boolean
}

// NEW TYPE: Used for the Dashboard Page's categorized lists
type ChoreDisplayData = {
    overdue: ChoreWithDetails[]
    dueSoon: ChoreWithDetails[]
    upcoming: ChoreWithDetails[]
}

// Helper to get user ID
async function getUserId() {
  const supabase = await createSupabaseClient() 
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id
}

// Helper function to calculate the next due date
function getNextDueDate(
  recurrenceType: string,
  currentDueDate: string | null
): string | null {
  const startDate = currentDueDate ? new Date(currentDueDate) : new Date()
  let rule: RRule | undefined
  switch (recurrenceType) {
    case 'daily':
      rule = new RRule({ freq: RRule.DAILY, dtstart: startDate, count: 2 })
      break
    case 'weekly':
      rule = new RRule({ freq: RRule.WEEKLY, dtstart: startDate, count: 2 })
      break
    case 'monthly':
      rule = new RRule({ freq: RRule.MONTHLY, dtstart: startDate, count: 2 })
      break
    default:
      return null
  }
  const nextDate = rule.all()[1]
  return nextDate ? nextDate.toISOString() : null
}

// --- Main Actions ---

export async function getHouseholdData(
  householdId: string
): Promise<HouseholdData | null> {
  const supabase = await createSupabaseClient() 
  const { data: household } = await supabase
    .from('households')
    .select('id, name, invite_code')
    .eq('id', householdId)
    .single()
  if (!household) return null
  const { data: members } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('household_id', householdId)
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('household_id', householdId)
  const { data: chores } = await supabase
    .from('chores')
    .select(
      `
      *,
      profiles (id, full_name, avatar_url),
      rooms (id, name)
    `
    )
    .eq('household_id', householdId)
    .order('due_date', { ascending: true, nullsFirst: true })

  return {
    household: household as DbHousehold,
    members: members || [],
    rooms: rooms || [],
    chores: (chores as any as ChoreWithDetails[]) || [],
  }
}

// EXPORTED: Used by dashboard/page.tsx to get the categorized data
export async function getChoreDisplayData(householdId: string): Promise<ChoreDisplayData> {
    const fullData = await getHouseholdData(householdId)

    if (!fullData) {
        return { overdue: [], dueSoon: [], upcoming: [] }
    }

    const { chores } = fullData
    const now = new Date()
    const twoDaysFromNow = new Date()
    twoDaysFromNow.setDate(now.getDate() + 2)

    // Helper to determine status
    const getChoreStatus = (chore: ChoreWithDetails) => {
        if (chore.status === 'complete') return 'complete'
        if (!chore.due_date) return 'upcoming'
        
        const dueDate = new Date(chore.due_date)

        if (dueDate < now) return 'overdue'
        if (dueDate <= twoDaysFromNow) return 'due-soon'
        
        return 'upcoming'
    }

    const categorizedData: ChoreDisplayData = {
        overdue: [],
        dueSoon: [],
        upcoming: [],
    }

    chores.forEach(chore => {
        const status = getChoreStatus(chore)
        if (status === 'overdue') {
            categorizedData.overdue.push(chore)
        } else if (status === 'due-soon') {
            categorizedData.dueSoon.push(chore)
        } else if (status === 'upcoming') {
            categorizedData.upcoming.push(chore)
        }
    })

    return categorizedData
}

// EXPORTED: Wrapper used by ChoreItem for completion
export async function completeChore(choreId: number): Promise<ActionResponse> {
    const supabase = await createSupabaseClient()
    const { data: chore, error } = await supabase.from('chores').select('*').eq('id', choreId).single()
    if (error || !chore) return { success: false, message: error?.message || 'Chore not found' }

    // If it's a multi-instance chore, increment it. Otherwise, toggle status.
    //
    // <-- FIX: Use '?? 1' to handle possible null value for target_instances
    if ((chore.target_instances ?? 1) > 1) {
        return incrementChoreInstance(chore as DbChore)
    } else {
        // Toggle the status to complete (since ChoreItem only calls this when incomplete)
        return toggleChoreStatus(chore as DbChore)
    }
}

// EXPORTED: Wrapper used by ChoreItem for uncompletion
export async function uncompleteChore(choreId: number): Promise<ActionResponse> {
    const supabase = await createSupabaseClient()
    const { data: chore, error } = await supabase.from('chores').select('*').eq('id', choreId).single()
    if (error || !chore) return { success: false, message: error?.message || 'Chore not found' }

    // If it's a multi-instance chore, decrement it. Otherwise, toggle status.
    //
    // <-- FIX: Use '?? 1' to handle possible null value for target_instances
    if ((chore.target_instances ?? 1) > 1) {
        return decrementChoreInstance(chore as DbChore)
    } else {
        // Toggle the status to pending (since ChoreItem only calls this when complete)
        return toggleChoreStatus(chore as DbChore)
    }
}


// --- All other functions are actions, use the Action client ---

export async function createChore(formData: FormData) {
  const supabase = await createSupabaseClient() 
  const userId = await getUserId()
  if (!userId) throw new Error('Not authenticated')

  const rawData = {
    name: formData.get('name') as string,
    household_id: formData.get('householdId') as string,
    assigned_to: (formData.get('assignedTo') as string) || null,
    room_id: (formData.get('roomId') as string) || null,
    due_date: (formData.get('dueDate') as string) || null,
    target_instances: Number(formData.get('instances') as string) || 1,
    recurrence_type: (formData.get('recurrence_type') as string) || 'none',
  }

  if (!rawData.name || !rawData.household_id) {
    throw new Error('Chore name and household ID are required.')
  }

  const newChoreData: ChoreInsert = {
    ...rawData,
    created_by: userId,
    status: 'pending',
    assigned_to: rawData.assigned_to === '' ? null : rawData.assigned_to,
    room_id: rawData.room_id ? Number(rawData.room_id) : null,
    due_date: rawData.due_date === '' ? null : rawData.due_date,
    completed_instances: 0, // Ensure it's set to 0 on creation
  }

  const { error } = await supabase.from('chores').insert(newChoreData)

  if (error) {
    console.error('Error creating chore:', error)
    throw new Error(`Could not create chore: ${error.message}`)
  }
  revalidatePath('/dashboard')
}

// Internal: used by toggleChoreStatus and uncompleteChore
export async function toggleChoreStatus(
  chore: DbChore
): Promise<ActionResponse> {
  const supabase = await createSupabaseClient() 
  let updateData: Partial<DbChore> = {}
  let didComplete = false
  if (chore.status === 'complete') {
    updateData = { status: 'pending' }
  } else {
    didComplete = true
    if (chore.recurrence_type !== 'none') {
      updateData = {
        status: 'pending',
        completed_instances: 0,
        due_date: getNextDueDate(chore.recurrence_type, chore.due_date),
      }
    } else {
      updateData = { 
        status: 'complete',
        completed_instances: chore.target_instances || 1
      }
    }
  }
  const { error } = await supabase
    .from('chores')
    .update(updateData)
    .eq('id', chore.id)
  if (error) {
    return { success: false, message: error.message }
  }
  revalidatePath('/dashboard')
  return { success: true, didComplete }
}

// Internal: used by completeChore
export async function incrementChoreInstance(
  chore: DbChore
): Promise<ActionResponse> {
  if (chore.status === 'complete') return { success: false }
  
  const supabase = await createSupabaseClient() 
  
  // Use ?? to treat null as 0 before adding 1
  const newInstanceCount = (chore.completed_instances ?? 0) + 1
  const targetInstances = chore.target_instances ?? 1

  let updateData: Partial<DbChore> = {}
  let didComplete = false

  if (newInstanceCount >= targetInstances) {
    didComplete = true
    if (chore.recurrence_type !== 'none') {
      updateData = {
        status: 'pending',
        completed_instances: 0,
        due_date: getNextDueDate(chore.recurrence_type, chore.due_date),
      }
    } else {
      updateData = {
        status: 'complete',
        completed_instances: targetInstances,
      }
    }
  } else {
    updateData = { completed_instances: newInstanceCount }
  }
  const { error } = await supabase
    .from('chores')
    .update(updateData)
    .eq('id', chore.id)
  if (error) {
    return { success: false, message: error.message }
  }
  revalidatePath('/dashboard')
  return { success: true, didComplete }
}

// Internal: used by uncompleteChore
export async function decrementChoreInstance(
  chore: DbChore
): Promise<ActionResponse> {
  const supabase = await createSupabaseClient() 
  
  // Also fix potential null here
  const newInstanceCount = Math.max(0, (chore.completed_instances ?? 0) - 1)

  const { error } = await supabase
    .from('chores')
    .update({
      completed_instances: newInstanceCount,
      status: 'pending',
    })
    .eq('id', chore.id)
  if (error) {
    return { success: false, message: error.message }
  }
  revalidatePath('/dashboard')
  return { success: false }
}

export async function updateChore(formData: FormData) {
  const supabase = await createSupabaseClient() 

  const choreId = formData.get('choreId') as string
  if (!choreId) throw new Error('Chore ID is missing.')

  const rawData = {
    name: formData.get('name') as string,
    assigned_to: (formData.get('assignedTo') as string) || null,
    room_id: (formData.get('roomId') as string) || null,
    due_date: (formData.get('dueDate') as string) || null,
    target_instances: Number(formData.get('instances') as string) || 1,
    recurrence_type: (formData.get('recurrence_type') as string) || 'none',
  }

  if (!rawData.name) {
    throw new Error('Chore name is required.')
  }

  const { error } = await supabase
    .from('chores')
    .update({
      ...rawData,
      assigned_to: rawData.assigned_to === '' ? null : rawData.assigned_to,
      room_id: rawData.room_id ? Number(rawData.room_id) : null,
      due_date: rawData.due_date === '' ? null : rawData.due_date,
    })
    .eq('id', Number(choreId))

  if (error) {
    console.error('Error updating chore:', error)
    throw new Error(`Could not update chore: ${error.message}`)
  }
  
  revalidatePath('/dashboard')
}

export async function deleteChore(choreId: number): Promise<ActionResponse> {
  const supabase = await createSupabaseClient() 

  const { error } = await supabase
    .from('chores')
    .delete()
    .eq('id', choreId)

  if (error) {
    console.error('Error deleting chore:', error)
    return { success: false, message: error.message }
  }
  
  revalidatePath('/dashboard')
  return { success: true }
}