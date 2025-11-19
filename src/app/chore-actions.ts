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

type ChoreInsert = Database['public']['Tables']['chores']['Insert']

type ActionResponse = {
  success: boolean
  message?: string
  didComplete?: boolean
}

type ChoreDisplayData = {
    overdue: ChoreWithDetails[]
    dueSoon: ChoreWithDetails[]
    upcoming: ChoreWithDetails[]
    completed: ChoreWithDetails[]
}

function getNextDueDate(
  recurrenceType: string,
  currentDueDate: string | null
): string | null {
  if (!currentDueDate) return null
  
  try {
    const startDate = new Date(currentDueDate)
    let rule: RRule | undefined
    
    if (isNaN(startDate.getTime())) return null

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
    
    const allDates = rule.all()
    return allDates.length > 1 ? allDates[1].toISOString() : null
  } catch (error) {
    console.error('Error calculating next due date:', error)
    return null
  }
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
      profiles:profiles!chores_assigned_to_fkey (id, full_name, avatar_url),
      rooms (id, name)
    `
    )
    .eq('household_id', householdId)
    .order('due_date', { ascending: true, nullsFirst: true })

  return {
    household: household as unknown as DbHousehold,
    members: (members || []) as any[],
    rooms: (rooms || []) as any[],
    chores: (chores as any[] || []) as ChoreWithDetails[],
  }
}

export async function getChoreDisplayData(householdId: string): Promise<ChoreDisplayData> {
    const fullData = await getHouseholdData(householdId)

    if (!fullData) {
        return { overdue: [], dueSoon: [], upcoming: [], completed: [] }
    }

    const { chores } = fullData
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    
    const twoDaysFromNow = new Date(now)
    twoDaysFromNow.setDate(now.getDate() + 2)

    const getChoreStatus = (chore: ChoreWithDetails) => {
        if (chore.status === 'complete') return 'complete'
        
        if (!chore.due_date) return 'upcoming'
        
        const dueDate = new Date(chore.due_date)
        dueDate.setHours(0, 0, 0, 0)

        if (dueDate < now) return 'overdue'
        if (dueDate <= twoDaysFromNow) return 'due-soon'
        
        return 'upcoming'
    }

    const categorizedData: ChoreDisplayData = {
        overdue: [],
        dueSoon: [],
        upcoming: [],
        completed: [],
    }

    chores.forEach(chore => {
        const status = getChoreStatus(chore)
        if (status === 'overdue') {
            categorizedData.overdue.push(chore)
        } else if (status === 'due-soon') {
            categorizedData.dueSoon.push(chore)
        } else if (status === 'upcoming') {
            categorizedData.upcoming.push(chore)
        } else if (status === 'complete') {
            categorizedData.completed.push(chore)
        }
    })

    // Sort completed: most recent first (using created_at as a proxy for now)
    categorizedData.completed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return categorizedData
}

export async function completeChore(choreId: number): Promise<ActionResponse> {
    const supabase = await createSupabaseClient()
    const { data: rawChore, error } = await supabase.from('chores').select('*').eq('id', choreId).single()
    
    if (error || !rawChore) return { success: false, message: error?.message || 'Chore not found' }

    const chore = rawChore as any

    if ((chore.target_instances ?? 1) > 1) {
        return incrementChoreInstance(chore as DbChore)
    } else {
        return toggleChoreStatus(chore as DbChore)
    }
}

export async function uncompleteChore(choreId: number): Promise<ActionResponse> {
    const supabase = await createSupabaseClient()
    const { data: rawChore, error } = await supabase.from('chores').select('*').eq('id', choreId).single()
    
    if (error || !rawChore) return { success: false, message: error?.message || 'Chore not found' }

    const chore = rawChore as any

    // If it's a recurring chore that generated a new instance, uncompleting the *old* completed one 
    // is simple (just mark as pending). However, we now have a duplicate "next" chore.
    // For simplicity in this version, we will just mark this specific chore as pending.
    // Users can delete the generated "next" chore manually if they made a mistake.

    if ((chore.target_instances ?? 1) > 1) {
        return decrementChoreInstance(chore as DbChore)
    } else {
        return toggleChoreStatus(chore as DbChore)
    }
}

export async function createChore(formData: FormData) {
  const supabase = await createSupabaseClient() 
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('household_id')
    .eq('id', user.id)
    .single()
  
  const safeProfile = profile as { household_id: string | null } | null

  if (!safeProfile || !safeProfile.household_id) {
    throw new Error('You must be part of a household to create a chore.')
  }
  
  const householdId = safeProfile.household_id

  const rawName = formData.get('name') as string
  const rawAssignedTo = formData.get('assignedTo') as string
  const rawRoomId = formData.get('roomId') as string
  const rawDueDate = formData.get('dueDate') as string
  const rawInstances = formData.get('instances') as string
  const rawRecurrence = formData.get('recurrence_type') as string

  if (!rawName) {
    throw new Error('Chore name is required.')
  }

  const newChoreData: ChoreInsert = {
    name: rawName,
    household_id: householdId,
    created_by: user.id,
    status: 'pending',
    assigned_to: rawAssignedTo && rawAssignedTo !== '' ? rawAssignedTo : null,
    room_id: rawRoomId && rawRoomId !== '' ? Number(rawRoomId) : null,
    due_date: rawDueDate && rawDueDate !== '' ? rawDueDate : null,
    target_instances: rawInstances ? Number(rawInstances) : 1,
    recurrence_type: rawRecurrence || 'none',
    completed_instances: 0,
  }

  const { error } = await (supabase.from('chores') as any).insert(newChoreData)

  if (error) {
    console.error('Error creating chore:', error)
    throw new Error(`Could not create chore: ${error.message}`)
  }
  revalidatePath('/dashboard')
}

export async function toggleChoreStatus(
  chore: DbChore
): Promise<ActionResponse> {
  const supabase = await createSupabaseClient() 
  
  if (chore.status === 'complete') {
    // Uncompleting: just set back to pending
    const { error } = await (supabase.from('chores') as any)
      .update({ status: 'pending' })
      .eq('id', chore.id)

    if (error) return { success: false, message: error.message }
    revalidatePath('/dashboard')
    return { success: true, didComplete: false }
  } else {
    // Completing
    const isRecurring = chore.recurrence_type !== 'none'
    const didComplete = true
    
    if (isRecurring) {
      // 1. Mark CURRENT chore as complete
      const { error: updateError } = await (supabase.from('chores') as any)
        .update({ 
          status: 'complete',
          completed_instances: chore.target_instances || 1 
        })
        .eq('id', chore.id)

      if (updateError) return { success: false, message: updateError.message }

      // 2. Create NEXT chore instance
      const nextDueDate = getNextDueDate(chore.recurrence_type, chore.due_date)
      
      const newChoreData: ChoreInsert = {
        name: chore.name,
        household_id: chore.household_id,
        created_by: chore.created_by,
        status: 'pending',
        assigned_to: chore.assigned_to,
        room_id: chore.room_id,
        due_date: nextDueDate,
        target_instances: chore.target_instances,
        recurrence_type: chore.recurrence_type, // Propagate recurrence settings
        completed_instances: 0,
      }

      const { error: createError } = await (supabase.from('chores') as any).insert(newChoreData)
      
      if (createError) {
        console.error('Error creating next recurring instance:', createError)
        // We don't fail the whole action if the next one fails, but we log it.
      }

    } else {
      // Not recurring, just mark complete
      const { error } = await (supabase.from('chores') as any)
        .update({ 
          status: 'complete',
          completed_instances: chore.target_instances || 1 
        })
        .eq('id', chore.id)
        
      if (error) return { success: false, message: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true, didComplete }
  }
}

export async function incrementChoreInstance(
  chore: DbChore
): Promise<ActionResponse> {
  if (chore.status === 'complete') return { success: false }
  
  const supabase = await createSupabaseClient() 
  
  const newInstanceCount = (chore.completed_instances ?? 0) + 1
  const targetInstances = chore.target_instances ?? 1

  // Check if this increment finishes the chore
  if (newInstanceCount >= targetInstances) {
    // It's finished! Treat it like a normal completion now.
    return toggleChoreStatus(chore)
  } else {
    // Just update the counter
    const { error } = await (supabase.from('chores') as any)
      .update({ completed_instances: newInstanceCount })
      .eq('id', chore.id)

    if (error) return { success: false, message: error.message }
    revalidatePath('/dashboard')
    return { success: true, didComplete: false }
  }
}

export async function decrementChoreInstance(
  chore: DbChore
): Promise<ActionResponse> {
  const supabase = await createSupabaseClient() 
  
  const newInstanceCount = Math.max(0, (chore.completed_instances ?? 0) - 1)

  const { error } = await (supabase.from('chores') as any)
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

  const rawName = formData.get('name') as string
  const rawAssignedTo = formData.get('assignedTo') as string
  const rawRoomId = formData.get('roomId') as string
  const rawDueDate = formData.get('dueDate') as string
  const rawInstances = formData.get('instances') as string
  const rawRecurrence = formData.get('recurrence_type') as string

  if (!rawName) {
    throw new Error('Chore name is required.')
  }

  const updateData = {
    name: rawName,
    assigned_to: rawAssignedTo && rawAssignedTo !== '' ? rawAssignedTo : null,
    room_id: rawRoomId && rawRoomId !== '' ? Number(rawRoomId) : null,
    due_date: rawDueDate && rawDueDate !== '' ? rawDueDate : null,
    target_instances: rawInstances ? Number(rawInstances) : 1,
    recurrence_type: rawRecurrence || 'none',
  }

  const { error } = await (supabase.from('chores') as any)
    .update(updateData)
    .eq('id', Number(choreId))

  if (error) {
    console.error('Error updating chore:', error)
    throw new Error(`Could not update chore: ${error.message}`)
  }
  
  revalidatePath('/dashboard')
}

export async function deleteChore(choreId: number): Promise<ActionResponse> {
  const supabase = await createSupabaseClient() 

  const { error } = await (supabase.from('chores') as any)
    .delete()
    .eq('id', choreId)

  if (error) {
    console.error('Error deleting chore:', error)
    return { success: false, message: error.message }
  }
  
  revalidatePath('/dashboard')
  return { success: true }
}

export async function delayChore(choreId: number, days: number) {
  const supabase = await createSupabaseClient()

  // Get current chore due date
  const { data: chore } = await supabase
    .from('chores')
    .select('due_date')
    .eq('id', choreId)
    .single()

  if (!chore) throw new Error('Chore not found')

  const safeChore = chore as { due_date: string | null }
  
  const baseDate = safeChore.due_date ? new Date(safeChore.due_date) : new Date()
  
  // Add days
  baseDate.setDate(baseDate.getDate() + days)
  
  const newDueDate = baseDate.toISOString()

  const { error } = await (supabase.from('chores') as any)
    .update({ due_date: newDueDate })
    .eq('id', choreId)

  if (error) {
    console.error('Error delaying chore:', error)
    throw new Error('Could not delay chore')
  }
  
  revalidatePath('/dashboard')
  return { success: true }
}