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
}

async function getUserId() {
  const supabase = await createSupabaseClient() 
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id
}

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
    household: household as unknown as DbHousehold,
    members: (members || []) as any[],
    rooms: (rooms || []) as any[],
    chores: (chores as any[] || []) as ChoreWithDetails[],
  }
}

export async function getChoreDisplayData(householdId: string): Promise<ChoreDisplayData> {
    const fullData = await getHouseholdData(householdId)

    if (!fullData) {
        return { overdue: [], dueSoon: [], upcoming: [] }
    }

    const { chores } = fullData
    const now = new Date()
    const twoDaysFromNow = new Date()
    twoDaysFromNow.setDate(now.getDate() + 2)

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

export async function completeChore(choreId: number): Promise<ActionResponse> {
    const supabase = await createSupabaseClient()
    const { data: rawChore, error } = await supabase.from('chores').select('*').eq('id', choreId).single()
    
    if (error || !rawChore) return { success: false, message: error?.message || 'Chore not found' }

    // Force cast data to 'any' so we can access properties without TS complaining
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

    if ((chore.target_instances ?? 1) > 1) {
        return decrementChoreInstance(chore as DbChore)
    } else {
        return toggleChoreStatus(chore as DbChore)
    }
}

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
    completed_instances: 0,
  }

  // NUCLEAR FIX: Cast builder to 'any'
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
  
  // NUCLEAR FIX: Cast builder to 'any'
  const { error } = await (supabase.from('chores') as any)
    .update(updateData)
    .eq('id', chore.id)

  if (error) {
    return { success: false, message: error.message }
  }
  revalidatePath('/dashboard')
  return { success: true, didComplete }
}

export async function incrementChoreInstance(
  chore: DbChore
): Promise<ActionResponse> {
  if (chore.status === 'complete') return { success: false }
  
  const supabase = await createSupabaseClient() 
  
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
  
  // NUCLEAR FIX: Cast builder to 'any'
  const { error } = await (supabase.from('chores') as any)
    .update(updateData)
    .eq('id', chore.id)

  if (error) {
    return { success: false, message: error.message }
  }
  revalidatePath('/dashboard')
  return { success: true, didComplete }
}

export async function decrementChoreInstance(
  chore: DbChore
): Promise<ActionResponse> {
  const supabase = await createSupabaseClient() 
  
  const newInstanceCount = Math.max(0, (chore.completed_instances ?? 0) - 1)

  // NUCLEAR FIX: Cast builder to 'any'
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

  // NUCLEAR FIX: Cast builder to 'any'
  const { error } = await (supabase.from('chores') as any)
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

  // NUCLEAR FIX: Cast builder to 'any'
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