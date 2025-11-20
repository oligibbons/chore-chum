'use server'

import { createSupabaseClient } from '@/lib/supabase/server' 
import { 
  HouseholdData, 
  ChoreWithDetails, 
  DbChore, 
  DbHousehold, 
  TablesInsert,
  TablesUpdate,
  DbProfile,
  TypedSupabaseClient
} from '@/types/database'
import { revalidatePath } from 'next/cache'
import { RRule } from 'rrule'

type ActionResponse = {
  success: boolean
  message: string
}

type ChoreDisplayData = {
    overdue: ChoreWithDetails[]
    dueSoon: ChoreWithDetails[]
    upcoming: ChoreWithDetails[]
    completed: ChoreWithDetails[]
}

// --- Helper: Activity Logger ---
async function logActivity(
  householdId: string,
  actionType: string,
  entityName: string,
  details: any = null
) {
  // FIX: Explicitly type the client to ensure schema visibility
  const supabase: TypedSupabaseClient = await createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const logData: TablesInsert<'activity_logs'> = {
    household_id: householdId,
    user_id: user?.id || null,
    action_type: actionType,
    entity_name: entityName,
    details: details,
  }

  await supabase.from('activity_logs').insert(logData)
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
  const supabase: TypedSupabaseClient = await createSupabaseClient() 
  
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
    .select(`
      *,
      profiles:assigned_to (id, full_name, avatar_url),
      rooms:room_id (id, name)
    `)
    .eq('household_id', householdId)
    .order('due_date', { ascending: true, nullsFirst: true })

  return {
    household: household as unknown as DbHousehold,
    members: (members || []) as unknown as Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'>[],
    rooms: rooms || [],
    chores: (chores as unknown as ChoreWithDetails[]) || [],
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

    categorizedData.completed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return categorizedData
}

export async function completeChore(choreId: number): Promise<ActionResponse> {
    const supabase: TypedSupabaseClient = await createSupabaseClient()
    const { data: chore, error } = await supabase.from('chores').select('*').eq('id', choreId).single()
    
    if (error || !chore) return { success: false, message: error?.message || 'Chore not found' }

    if ((chore.target_instances ?? 1) > 1) {
        return incrementChoreInstance(chore)
    } else {
        return toggleChoreStatus(chore)
    }
}

export async function uncompleteChore(choreId: number): Promise<ActionResponse> {
    const supabase: TypedSupabaseClient = await createSupabaseClient()
    const { data: chore, error } = await supabase.from('chores').select('*').eq('id', choreId).single()
    
    if (error || !chore) return { success: false, message: error?.message || 'Chore not found' }

    if ((chore.target_instances ?? 1) > 1) {
        return decrementChoreInstance(chore)
    } else {
        return toggleChoreStatus(chore)
    }
}

export async function createChore(formData: FormData): Promise<ActionResponse> {
  const supabase: TypedSupabaseClient = await createSupabaseClient() 
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('household_id')
    .eq('id', user.id)
    .single()
  
  if (!profile?.household_id) {
    return { success: false, message: 'You must be part of a household.' }
  }
  
  const householdId = profile.household_id

  const rawName = formData.get('name') as string
  const rawNotes = formData.get('notes') as string
  const rawAssignedTo = formData.get('assignedTo') as string
  const rawRoomId = formData.get('roomId') as string
  const rawDueDate = formData.get('dueDate') as string
  const rawInstances = formData.get('instances') as string
  const rawRecurrence = formData.get('recurrence_type') as string

  if (!rawName) return { success: false, message: 'Chore name is required.' }

  const newChoreData: TablesInsert<'chores'> = {
    name: rawName,
    notes: rawNotes || null,
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

  const { error } = await supabase.from('chores').insert(newChoreData)

  if (error) {
    console.error('Error creating chore:', error)
    return { success: false, message: error.message }
  }

  await logActivity(householdId, 'create', rawName)

  revalidatePath('/dashboard')
  revalidatePath('/feed')
  revalidatePath('/calendar')
  return { success: true, message: 'Chore created successfully' }
}

export async function toggleChoreStatus(
  chore: DbChore
): Promise<ActionResponse> {
  const supabase: TypedSupabaseClient = await createSupabaseClient() 
  
  if (chore.status === 'complete') {
    // Uncompleting
    const { error } = await supabase
      .from('chores')
      .update({ status: 'pending' })
      .eq('id', chore.id)

    if (error) return { success: false, message: error.message }

    revalidatePath('/dashboard')
    revalidatePath('/feed')
    revalidatePath('/calendar')
    return { success: true, message: 'Chore marked as pending' }

  } else {
    // Completing
    const isRecurring = chore.recurrence_type !== 'none'
    
    if (isRecurring) {
      // 1. Mark CURRENT chore as complete
      const { error: updateError } = await supabase
        .from('chores')
        .update({ 
          status: 'complete',
          completed_instances: chore.target_instances || 1 
        })
        .eq('id', chore.id)

      if (updateError) return { success: false, message: updateError.message }

      // 2. Create NEXT chore instance
      const nextDueDate = getNextDueDate(chore.recurrence_type, chore.due_date)
      
      const newChoreData: TablesInsert<'chores'> = {
        name: chore.name,
        notes: chore.notes,
        household_id: chore.household_id,
        created_by: chore.created_by,
        status: 'pending',
        assigned_to: chore.assigned_to,
        room_id: chore.room_id,
        due_date: nextDueDate,
        target_instances: chore.target_instances,
        recurrence_type: chore.recurrence_type, 
        completed_instances: 0,
      }

      await supabase.from('chores').insert(newChoreData)

    } else {
      // Not recurring, just mark complete
      const { error } = await supabase
        .from('chores')
        .update({ 
          status: 'complete',
          completed_instances: chore.target_instances || 1 
        })
        .eq('id', chore.id)
        
      if (error) return { success: false, message: error.message }
    }

    await logActivity(chore.household_id, 'complete', chore.name)

    revalidatePath('/dashboard')
    revalidatePath('/feed')
    revalidatePath('/calendar')
    return { success: true, message: 'Chore completed!' }
  }
}

export async function incrementChoreInstance(
  chore: DbChore
): Promise<ActionResponse> {
  if (chore.status === 'complete') return { success: false, message: 'Already complete' }
  
  const supabase: TypedSupabaseClient = await createSupabaseClient() 
  
  const newInstanceCount = (chore.completed_instances ?? 0) + 1
  const targetInstances = chore.target_instances ?? 1

  if (newInstanceCount >= targetInstances) {
    return toggleChoreStatus(chore)
  } else {
    const { error } = await supabase
      .from('chores')
      .update({ completed_instances: newInstanceCount })
      .eq('id', chore.id)

    if (error) return { success: false, message: error.message }
    
    revalidatePath('/dashboard')
    revalidatePath('/feed')
    revalidatePath('/calendar')
    return { success: true, message: 'Progress updated' }
  }
}

export async function decrementChoreInstance(
  chore: DbChore
): Promise<ActionResponse> {
  const supabase: TypedSupabaseClient = await createSupabaseClient() 
  
  const newInstanceCount = Math.max(0, (chore.completed_instances ?? 0) - 1)

  const { error } = await supabase
    .from('chores')
    .update({
      completed_instances: newInstanceCount,
      status: 'pending',
    })
    .eq('id', chore.id)

  if (error) return { success: false, message: error.message }
  
  revalidatePath('/dashboard')
  revalidatePath('/feed')
  revalidatePath('/calendar')
  return { success: true, message: 'Progress updated' }
}

export async function updateChore(formData: FormData): Promise<ActionResponse> {
  const supabase: TypedSupabaseClient = await createSupabaseClient() 

  const choreId = formData.get('choreId') as string
  if (!choreId) return { success: false, message: 'Chore ID missing' }

  const rawName = formData.get('name') as string
  const rawNotes = formData.get('notes') as string
  const rawAssignedTo = formData.get('assignedTo') as string
  const rawRoomId = formData.get('roomId') as string
  const rawDueDate = formData.get('dueDate') as string
  const rawInstances = formData.get('instances') as string
  const rawRecurrence = formData.get('recurrence_type') as string

  if (!rawName) return { success: false, message: 'Name required' }
  
  const { data: currentChore } = await supabase
    .from('chores')
    .select('household_id, name')
    .eq('id', Number(choreId))
    .single()

  const updateData: TablesUpdate<'chores'> = {
    name: rawName,
    notes: rawNotes || null,
    assigned_to: rawAssignedTo && rawAssignedTo !== '' ? rawAssignedTo : null,
    room_id: rawRoomId && rawRoomId !== '' ? Number(rawRoomId) : null,
    due_date: rawDueDate && rawDueDate !== '' ? rawDueDate : null,
    target_instances: rawInstances ? Number(rawInstances) : 1,
    recurrence_type: rawRecurrence || 'none',
  }

  const { error } = await supabase
    .from('chores')
    .update(updateData)
    .eq('id', Number(choreId))

  if (error) {
    return { success: false, message: error.message }
  }
  
  if (currentChore) {
    await logActivity(currentChore.household_id, 'update', currentChore.name)
  }

  revalidatePath('/dashboard')
  revalidatePath('/feed')
  revalidatePath('/calendar')
  return { success: true, message: 'Chore updated' }
}

export async function deleteChore(choreId: number): Promise<ActionResponse> {
  const supabase: TypedSupabaseClient = await createSupabaseClient() 

  const { data: chore } = await supabase
    .from('chores')
    .select('household_id, name')
    .eq('id', choreId)
    .single()

  const { error } = await supabase
    .from('chores')
    .delete()
    .eq('id', choreId)

  if (error) {
    return { success: false, message: error.message }
  }
  
  if (chore) {
    await logActivity(chore.household_id, 'delete', chore.name)
  }

  revalidatePath('/dashboard')
  revalidatePath('/feed')
  revalidatePath('/calendar')
  return { success: true, message: 'Chore deleted' }
}

export async function delayChore(choreId: number, days: number): Promise<ActionResponse> {
  const supabase: TypedSupabaseClient = await createSupabaseClient()

  const { data: chore } = await supabase
    .from('chores')
    .select('household_id, name, due_date')
    .eq('id', choreId)
    .single()
  
  if (!chore) return { success: false, message: 'Chore not found' }

  const baseDate = chore.due_date ? new Date(chore.due_date) : new Date()
  
  // Add days
  baseDate.setDate(baseDate.getDate() + days)
  
  const newDueDate = baseDate.toISOString()

  const { error } = await supabase
    .from('chores')
    .update({ due_date: newDueDate })
    .eq('id', choreId)

  if (error) {
    return { success: false, message: error.message }
  }
  
  await logActivity(chore.household_id, 'delay', chore.name, { days })

  revalidatePath('/dashboard')
  revalidatePath('/feed')
  revalidatePath('/calendar')
  return { success: true, message: `Delayed by ${days} ${days === 1 ? 'day' : 'days'}` }
}