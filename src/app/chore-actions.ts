// src/app/chore-actions.ts
'use server'

import { createSupabaseClient } from '@/lib/supabase/server' 
import { 
  HouseholdData, 
  ChoreWithDetails, 
  DbChore, 
  DbHousehold,
  DbProfile,
  TypedSupabaseClient
} from '@/types/database'
import { revalidatePath } from 'next/cache'
import { RRule } from 'rrule'
import { notifyHousehold } from '@/app/push-actions'

type ActionResponse = {
  success: boolean
  message: string
  motivation?: string 
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
  const supabase: TypedSupabaseClient = await createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Explicitly cast to any to bypass strict type checking on inserts if schemas drift
  const logData = {
    household_id: householdId,
    user_id: user?.id || null,
    action_type: actionType,
    entity_name: entityName,
    details: details,
  }

  const { error } = await supabase.from('activity_logs').insert(logData as any)
  
  if (error) {
    console.error('Error logging activity:', error.message)
  }
}

// --- Helper: Get Current User ---
async function getCurrentUserProfile(supabase: TypedSupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
    
  return profile as unknown as DbProfile
}

// --- Helper: Motivational Generator (Updated) ---
function getCheekyMotivation(isComplete: boolean, isOverdue?: boolean): string {
  const good = [
    "Smashed it! 💥",
    "Look at you go!",
    "One step closer to a clean home.",
    "Legendary effort.",
    "Streak secured! Keep the fire burning.",
    "Productivity looks good on you.",
    "Easy peasy. What's next?",
    "Household hero status: Unlocked.",
    "That wasn't so bad, was it?"
  ]
  const bad = [
    "Moved back to pending. We saw that.",
    "Undo? Really?",
    "Back to the list it goes.",
    "It's okay, just do it later (but actually do it)."
  ]
  
  if (isComplete) return good[Math.floor(Math.random() * good.length)]
  return bad[Math.floor(Math.random() * bad.length)]
}

// --- Helper: Update Streak Logic (Multi-User) ---
async function updateStreaks(supabase: TypedSupabaseClient, userIds: string[]) {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    
    // Get yesterday string
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    for (const userId of userIds) {
        const { data: rawProfile } = await supabase.from('profiles').select('*').eq('id', userId).single()
        
        if (!rawProfile) continue

        const profile = rawProfile as unknown as DbProfile
        const lastDate = profile.last_chore_date ? new Date(profile.last_chore_date).toISOString().split('T')[0] : null
        
        // If already done something today, ignore
        if (lastDate === todayStr) continue

        let newStreak = (profile.current_streak || 0)
        
        if (lastDate === yesterdayStr) {
            // Continued streak
            newStreak += 1
        } else {
            // Broken streak (or first time)
            newStreak = 1
        }

        const newLongest = Math.max(newStreak, profile.longest_streak || 0)

        await supabase.from('profiles').update({
            current_streak: newStreak,
            longest_streak: newLongest,
            last_chore_date: todayStr
        } as any).eq('id', userId)
    }
}

// --- Helper: Next Due Date Calculation (Updated for Intervals) ---
function getNextDueDate(
  recurrenceType: string,
  currentDueDate: string | null
): string | null {
  if (!currentDueDate) return new Date().toISOString() // Fallback to now if missing
  
  try {
    const startDate = new Date(currentDueDate)
    if (isNaN(startDate.getTime())) return null

    let options: Partial<RRule> = { dtstart: startDate }

    // Handle "custom:freq:interval" format (e.g., "custom:daily:3")
    // Or standard "daily", "weekly", "monthly"
    if (recurrenceType.startsWith('custom:')) {
      const parts = recurrenceType.split(':')
      // custom:daily:3
      const freqStr = parts[1]
      const intervalStr = parts[2]
      
      const interval = parseInt(intervalStr) || 1
      options.interval = interval
      
      switch (freqStr) {
        case 'daily': options.freq = RRule.DAILY; break;
        case 'weekly': options.freq = RRule.WEEKLY; break;
        case 'monthly': options.freq = RRule.MONTHLY; break;
        default: return null;
      }
    } else {
      // Standard legacy mapping
      const ruleMap: Record<string, any> = {
          'daily': RRule.DAILY,
          'weekly': RRule.WEEKLY,
          'monthly': RRule.MONTHLY
      }
      
      if (!ruleMap[recurrenceType]) return null
      options.freq = ruleMap[recurrenceType]
    }

    // Logic: Find the next occurrence strictly after *now*, based on the schedule
    const rule = new RRule(options)
    const nextDate = rule.after(new Date(), true) // inclusive=true
    
    return nextDate ? nextDate.toISOString() : null
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
    .select('id, full_name, avatar_url, current_streak')
    .eq('household_id', householdId)
    
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('household_id', householdId)
    
  // FILTER REPAIR: Changed 'updated_at' to 'created_at' because 'chores' table lacks updated_at in some migrations.
  // This fixes the "Nothing has appeared" bug in history.
  const historyWindow = new Date()
  historyWindow.setDate(historyWindow.getDate() - 7)

  // Fetch ALL chores (parents and children) that are relevant
  const { data: allChoresRaw } = await supabase
    .from('chores')
    .select(`
      *,
      rooms:room_id (id, name)
    `)
    .eq('household_id', householdId)
    // Fetch pending items OR items completed recently
    .or(`status.eq.pending,and(status.eq.complete,created_at.gt.${historyWindow.toISOString()})`)
    .order('due_date', { ascending: true, nullsFirst: true })

  const allChores = (allChoresRaw || []) as unknown as (DbChore & { rooms: any })[]

  // Hydrate Assignees Helper
  const hydrate = (chore: any) => {
      const rawAssigned = chore.assigned_to
      let assigneeIds: string[] = []

      // Handle DB Format: It is likely a single UUID string (or null)
      if (rawAssigned && typeof rawAssigned === 'string') {
          if (rawAssigned.startsWith('[')) {
             try {
                const parsed = JSON.parse(rawAssigned)
                if (Array.isArray(parsed)) assigneeIds = parsed
             } catch {
                assigneeIds = [] 
             }
          } else {
             // Correct behavior: It's a single UUID
             assigneeIds = [rawAssigned]
          }
      }
      
      // Find members who match the IDs
      const assignees = (members || []).filter((m: any) => 
          assigneeIds.includes(m.id)
      )

      return { 
          ...chore, 
          assigned_to: assigneeIds, 
          assignees 
      }
  }

  // Logic: Nest Children under Parents
  // We separate chores into "Parents" (top-level) and "Children" (subtasks)
  const parentChores: any[] = []
  const childChoresMap = new Map<number, any[]>()

  allChores.forEach(chore => {
      if (chore.parent_chore_id) {
          // It's a subtask
          if (!childChoresMap.has(chore.parent_chore_id)) {
              childChoresMap.set(chore.parent_chore_id, [])
          }
          childChoresMap.get(chore.parent_chore_id)!.push(hydrate(chore))
      } else {
          // It's a parent/solo chore
          parentChores.push(hydrate(chore))
      }
  })

  // Attach children to parents
  const nestedChores = parentChores.map(parent => ({
      ...parent,
      subtasks: childChoresMap.get(parent.id) || []
  }))

  return {
    household: household as unknown as DbHousehold,
    members: (members || []) as unknown as Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'>[],
    rooms: rooms || [],
    chores: nestedChores as ChoreWithDetails[],
  }
}

export async function getChoreDisplayData(householdId: string): Promise<ChoreDisplayData> {
    const fullData = await getHouseholdData(householdId)

    if (!fullData) {
        return { overdue: [], dueSoon: [], upcoming: [], completed: [] }
    }

    const { chores } = fullData
    const now = new Date()
    
    // UPDATED: "Due Soon" now strictly means within the next 24 hours
    const dueSoonThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const categorizedData: ChoreDisplayData = {
        overdue: [],
        dueSoon: [],
        upcoming: [],
        completed: [],
    }

    chores.forEach(chore => {
        // If completed, it goes to completed regardless of date
        if (chore.status === 'complete') {
            categorizedData.completed.push(chore)
            return
        }
        
        // If no due date, it's just upcoming
        if (!chore.due_date) {
            categorizedData.upcoming.push(chore)
            return
        }
        
        const dueDate = new Date(chore.due_date)
        
        // Use precise comparison
        if (dueDate < now) {
            categorizedData.overdue.push(chore)
        } else if (dueDate <= dueSoonThreshold) {
            categorizedData.dueSoon.push(chore)
        } else {
            categorizedData.upcoming.push(chore)
        }
    })

    // Sort completed by most recent first
    categorizedData.completed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return categorizedData
}

// UPDATED: Now accepts an array of user IDs who completed the task
export async function completeChore(choreId: number, completedBy: string[]): Promise<ActionResponse> {
    const supabase: TypedSupabaseClient = await createSupabaseClient()
    const { data: chore, error } = await supabase.from('chores').select('*').eq('id', choreId).single()
    
    if (error || !chore) return { success: false, message: error?.message || 'Chore not found' }

    const safeChore = chore as unknown as DbChore
    const isSubtask = !!safeChore.parent_chore_id

    // If it's a subtask, we just mark it complete. Parent progress is calculated on read.
    if (isSubtask) {
        const { error: subError } = await supabase.from('chores').update({ status: 'complete' }).eq('id', choreId)
        if (subError) return { success: false, message: subError.message }
        
        revalidatePath('/dashboard')
        // Subtasks generally don't trigger big notifications or streaks, but we could add that if desired.
        return { success: true, message: 'Subtask done!' }
    }

    // --- Standard Parent/Solo Chore Logic ---

    const targetInstances = safeChore.target_instances ?? 1
    
    // Update streaks for everyone who participated
    if (completedBy.length > 0) {
        await updateStreaks(supabase, completedBy)
    }

    // Get names for notification
    let names = 'Someone'
    if (completedBy.length > 0) {
        const { data: completers } = await supabase.from('profiles').select('full_name').in('id', completedBy)
        if (completers) {
            names = completers.map(c => c.full_name?.split(' ')[0]).join(' & ')
        }
    }

    await logActivity(safeChore.household_id, 'complete', safeChore.name, { completed_by: names })

    const isRecurring = safeChore.recurrence_type !== 'none'
    
    // Step 1: Always mark the current chore as complete so it stays in "Completed" list
    await supabase.from('chores').update({ 
        status: 'complete',
        completed_instances: targetInstances,
    }).eq('id', choreId)

    // Step 2: If recurring, create a NEW upcoming task (and its subtasks if applicable)
    if (isRecurring) {
        const nextDate = getNextDueDate(safeChore.recurrence_type, safeChore.due_date)
        
        // 1. Duplicate Parent for Next Due Date
        const { data: newParent, error: insertError } = await supabase.from('chores').insert({
            name: safeChore.name,
            notes: safeChore.notes,
            household_id: safeChore.household_id,
            created_by: safeChore.created_by,
            status: 'pending',
            assigned_to: safeChore.assigned_to,
            room_id: safeChore.room_id,
            due_date: nextDate,
            target_instances: safeChore.target_instances,
            recurrence_type: safeChore.recurrence_type,
            completed_instances: 0,
            time_of_day: safeChore.time_of_day,
            exact_time: safeChore.exact_time,
        } as any).select('id').single()

        if (insertError) {
            console.error("Failed to create next recurring chore:", insertError)
        }

        // 2. Duplicate Subtasks if they exist and we successfully created a new parent
        if (newParent && !insertError) {
             // Find all subtasks of the COMPLETED chore
             const { data: subtasks } = await supabase.from('chores').select('*').eq('parent_chore_id', choreId)
             
             if (subtasks && subtasks.length > 0) {
                 const newSubtasks = subtasks.map((s: any) => ({
                     name: s.name,
                     household_id: s.household_id,
                     created_by: s.created_by,
                     status: 'pending', // Reset subtasks to pending
                     parent_chore_id: newParent.id, // Attach to the NEW parent
                     recurrence_type: 'none' // Subtasks inherit recurrence from parent implicitly by being recreated
                 }))
                 
                 await supabase.from('chores').insert(newSubtasks)
             }
        }

        revalidatePath('/dashboard')
        return { 
            success: true, 
            message: `Complete! Next due: ${new Date(nextDate!).toLocaleDateString()}`, 
            motivation: getCheekyMotivation(true, false) 
        }
    }

    await notifyHousehold(
        safeChore.household_id,
        {
          title: 'Chore Crushed! 🎉',
          body: `${names} completed "${safeChore.name}".`,
          url: '/feed'
        }
    )

    revalidatePath('/dashboard')
    revalidatePath('/feed')
    revalidatePath('/calendar')
    
    return { 
        success: true, 
        message: 'Chore completed!', 
        motivation: getCheekyMotivation(true, false) 
    }
}

export async function uncompleteChore(choreId: number): Promise<ActionResponse> {
    const supabase: TypedSupabaseClient = await createSupabaseClient()
    
    // Reset status and instances
    const { error } = await supabase
        .from('chores')
        .update({ 
            status: 'pending', 
            completed_instances: 0 
        })
        .eq('id', choreId)

    if (error) return { success: false, message: error?.message || 'Chore not found' }

    revalidatePath('/dashboard')
    return { 
        success: true, 
        message: 'Marked as pending', 
        motivation: getCheekyMotivation(false, false) 
    }
}

export async function createChore(formData: FormData): Promise<ActionResponse> {
  const supabase: TypedSupabaseClient = await createSupabaseClient() 
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('household_id, full_name')
    .eq('id', user.id)
    .single()
  
  if (!profile?.household_id) {
    return { success: false, message: 'You must be part of a household.' }
  }
  
  const householdId = profile.household_id
  const userName = profile.full_name?.split(' ')[0] || 'Someone'

  const rawName = formData.get('name') as string
  const rawNotes = formData.get('notes') as string
  
  // Parse AssignedTo
  const rawAssignedTo = formData.get('assignedTo') as string
  let assignedTo: string[] = []
  try {
      assignedTo = JSON.parse(rawAssignedTo)
  } catch(e) {
      if (rawAssignedTo) assignedTo = [rawAssignedTo]
  }

  // DB WRITE FIX: Single Assignee only
  const singleAssignee = assignedTo.length > 0 ? assignedTo[0] : null;

  // Parse Subtasks
  const rawSubtasks = formData.get('subtasks') as string
  let subtaskNames: string[] = []
  try {
      subtaskNames = JSON.parse(rawSubtasks)
  } catch(e) {
      // ignore invalid json
  }

  const rawRoomId = formData.get('roomId') as string
  const rawDueDate = formData.get('dueDate') as string
  const rawRecurrence = formData.get('recurrence_type') as string
  const rawTimeOfDay = formData.get('timeOfDay') as string
  const rawExactTime = formData.get('exactTime') as string
  
  // Parse Instances - Default to 1
  const instanceCount = parseInt(formData.get('instances') as string || '1')

  if (!rawName) return { success: false, message: 'Chore name is required.' }

  // Create Chores Loop (for multiple instances)
  // If instances > 1, create multiple SEPARATE chores (e.g. "Walk Dog #1", "Walk Dog #2")
  
  for (let i = 1; i <= instanceCount; i++) {
      let finalName = rawName
      if (instanceCount > 1) {
          finalName = `${rawName} #${i}`
      }

      // 1. Create Parent
      const { data: parent, error } = await supabase.from('chores').insert({
        name: finalName,
        notes: rawNotes || null,
        household_id: householdId,
        created_by: user.id,
        status: 'pending',
        assigned_to: singleAssignee, // FIX: Save as single UUID string
        room_id: rawRoomId && rawRoomId !== '' ? Number(rawRoomId) : null,
        due_date: rawDueDate && rawDueDate !== '' ? rawDueDate : null,
        // Reset target to 1 because we are creating separate rows now
        target_instances: 1, 
        recurrence_type: rawRecurrence || 'none',
        completed_instances: 0,
        time_of_day: rawTimeOfDay || 'any',
        exact_time: rawExactTime || null,
      } as any).select('id').single()

      if (error) {
        console.error('Error creating chore instance:', error)
        return { success: false, message: error.message }
      }

      // 2. Create Children (if any) for THIS instance
      if (subtaskNames.length > 0 && parent) {
          const subtasksData = subtaskNames.map(stName => ({
              name: stName,
              household_id: householdId,
              created_by: user.id,
              status: 'pending',
              parent_chore_id: parent.id, // Link to this specific parent instance
              recurrence_type: 'none',
              // Optional: Inherit room/time from parent if desired, but kept simple for now
          }))
          
          await supabase.from('chores').insert(subtasksData)
      }
  }

  await logActivity(householdId, 'create', rawName)

  await notifyHousehold(
    householdId,
    {
      title: 'New Chore Added',
      body: `${userName} added "${rawName}"${instanceCount > 1 ? ` (x${instanceCount})` : ''}.`,
      url: '/dashboard'
    },
    user.id 
  )

  revalidatePath('/dashboard')
  revalidatePath('/feed')
  revalidatePath('/calendar')
  return { success: true, message: `Created ${instanceCount > 1 ? instanceCount + ' chores' : 'chore'} successfully` }
}

// For Brevity: toggleChoreStatus etc. simply delegate to complete/uncomplete
export async function toggleChoreStatus(
  chore: DbChore
): Promise<ActionResponse> {
  const supabase: TypedSupabaseClient = await createSupabaseClient() 
  const actorProfile = await getCurrentUserProfile(supabase)
  
  if (chore.status === 'complete') {
      return uncompleteChore(chore.id)
  } else {
      return completeChore(chore.id, actorProfile ? [actorProfile.id] : [])
  }
}

export async function updateChore(formData: FormData): Promise<ActionResponse> {
  const supabase: TypedSupabaseClient = await createSupabaseClient() 
  
  const choreId = formData.get('choreId') as string
  if (!choreId) return { success: false, message: 'Chore ID missing' }

  const rawName = formData.get('name') as string
  // ... other fields ...
  
  // Basic update implementation
  const updateData: any = {
      name: rawName,
      notes: formData.get('notes') || null,
      recurrence_type: formData.get('recurrence_type'),
      time_of_day: formData.get('timeOfDay'),
      exact_time: formData.get('exactTime')
      // ... handle other fields as needed (room, date, etc)
  }
  
  // Assignee handling
  const rawAssignedTo = formData.get('assignedTo') as string
  if (rawAssignedTo) {
      try {
          const arr = JSON.parse(rawAssignedTo)
          updateData.assigned_to = arr.length > 0 ? arr[0] : null
      } catch {
          updateData.assigned_to = [rawAssignedTo][0]
      }
  }

  const { error } = await supabase
    .from('chores')
    .update(updateData)
    .eq('id', Number(choreId))

  if (error) return { success: false, message: error.message }
  
  revalidatePath('/dashboard')
  return { success: true, message: 'Chore updated' }
}

export async function deleteChore(choreId: number): Promise<ActionResponse> {
  const supabase: TypedSupabaseClient = await createSupabaseClient() 
  
  const { data: chore } = await supabase.from('chores').select('household_id, name').eq('id', choreId).single()

  // Note: ON DELETE CASCADE in Postgres should handle subtasks if FK is set up correctly.
  // If not, we might need to delete subtasks manually here.
  // Assuming standard CASCADE for now.
  const { error } = await supabase.from('chores').delete().eq('id', choreId)

  if (error) return { success: false, message: error.message }
  
  if (chore) {
    await logActivity(chore.household_id, 'delete', chore.name)
  }

  revalidatePath('/dashboard')
  return { success: true, message: 'Chore deleted' }
}

export async function delayChore(choreId: number, days: number): Promise<ActionResponse> {
  const supabase: TypedSupabaseClient = await createSupabaseClient()
  
  const { data: chore } = await supabase.from('chores').select('household_id, name, due_date').eq('id', choreId).single()
  if (!chore) return { success: false, message: 'Chore not found' }

  const baseDate = chore.due_date ? new Date(chore.due_date) : new Date()
  baseDate.setDate(baseDate.getDate() + days)
  
  const { error } = await supabase.from('chores').update({ due_date: baseDate.toISOString() }).eq('id', choreId)

  if (error) return { success: false, message: error.message }
  
  await logActivity(chore.household_id, 'delay', chore.name, { days })

  return { 
      success: true, 
      message: `Delayed by ${days} days`,
      motivation: getCheekyMotivation(false, true) 
  }
}

export async function incrementChoreInstance(chore: DbChore): Promise<ActionResponse> {
    // Legacy support if needed, but completeChore handles most cases now
    return { success: true, message: "Use complete action" }
}

export async function decrementChoreInstance(chore: DbChore): Promise<ActionResponse> {
    return { success: true, message: "Use uncomplete action" }
}