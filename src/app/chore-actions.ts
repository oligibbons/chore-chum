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
import { notifyHousehold, sendPushToUser } from '@/app/push-actions'

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

// --- Helper: Motivational Generator ---
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

// --- Helper: Update Streak Logic ---
async function updateStreaks(supabase: TypedSupabaseClient, userIds: string[]) {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    for (const userId of userIds) {
        const { data: rawProfile } = await supabase.from('profiles').select('*').eq('id', userId).single()
        
        if (!rawProfile) continue

        const profile = rawProfile as unknown as DbProfile
        const lastDate = profile.last_chore_date ? new Date(profile.last_chore_date).toISOString().split('T')[0] : null
        
        if (lastDate === todayStr) continue

        let newStreak = (profile.current_streak || 0)
        
        if (lastDate === yesterdayStr) {
            newStreak += 1
        } else {
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

// --- Helper: Next Due Date Calculation ---
function getNextDueDate(
  recurrenceType: string,
  currentDueDate: string | null
): string | null {
  if (!currentDueDate) return new Date().toISOString()
  
  try {
    const startDate = new Date(currentDueDate)
    if (isNaN(startDate.getTime())) return null

    let options: any = { dtstart: startDate }

    if (recurrenceType.startsWith('custom:')) {
      const parts = recurrenceType.split(':')
      const freqStr = parts[1]
      const intervalStr = parts[2]
      const untilStr = parts[3]
      
      const interval = parseInt(intervalStr) || 1
      options.interval = interval

      if (untilStr) {
          options.until = new Date(untilStr)
      }
      
      switch (freqStr) {
        case 'daily': options.freq = RRule.DAILY; break;
        case 'weekly': options.freq = RRule.WEEKLY; break;
        case 'monthly': options.freq = RRule.MONTHLY; break;
        default: return null;
      }
    } else {
      const ruleMap: Record<string, any> = {
          'daily': RRule.DAILY,
          'weekly': RRule.WEEKLY,
          'monthly': RRule.MONTHLY
      }
      
      if (!ruleMap[recurrenceType]) return null
      options.freq = ruleMap[recurrenceType]
    }

    const rule = new RRule(options)
    const nextDate = rule.after(new Date(), true)
    
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
    
  const historyWindow = new Date()
  historyWindow.setDate(historyWindow.getDate() - 7)

  const { data: allChoresRaw } = await supabase
    .from('chores')
    .select(`
      *,
      rooms:room_id (id, name)
    `)
    .eq('household_id', householdId)
    .or(`status.eq.pending,and(status.eq.complete,created_at.gt.${historyWindow.toISOString()})`)
    .order('due_date', { ascending: true, nullsFirst: true })

  const allChores = (allChoresRaw || []) as unknown as (DbChore & { rooms: any })[]

  const hydrate = (chore: any) => {
      const rawAssigned = chore.assigned_to
      let assigneeIds: string[] = []

      if (rawAssigned && typeof rawAssigned === 'string') {
          if (rawAssigned.startsWith('[')) {
             try {
                const parsed = JSON.parse(rawAssigned)
                if (Array.isArray(parsed)) assigneeIds = parsed
             } catch {
                assigneeIds = [] 
             }
          } else {
             assigneeIds = [rawAssigned]
          }
      }
      
      const assignees = (members || []).filter((m: any) => 
          assigneeIds.includes(m.id)
      )

      return { 
          ...chore, 
          assigned_to: assigneeIds, 
          assignees 
      }
  }

  const parentChores: any[] = []
  const childChoresMap = new Map<number, any[]>()

  allChores.forEach(chore => {
      if (chore.parent_chore_id) {
          if (!childChoresMap.has(chore.parent_chore_id)) {
              childChoresMap.set(chore.parent_chore_id, [])
          }
          childChoresMap.get(chore.parent_chore_id)!.push(hydrate(chore))
      } else {
          parentChores.push(hydrate(chore))
      }
  })

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
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    const endOfToday = new Date(now)
    endOfToday.setHours(23, 59, 59, 999)

    const categorizedData: ChoreDisplayData = {
        overdue: [],
        dueSoon: [],
        upcoming: [],
        completed: [],
    }

    chores.forEach(chore => {
        if (chore.status === 'complete') {
            categorizedData.completed.push(chore)
            return
        }
        if (!chore.due_date) {
            categorizedData.upcoming.push(chore)
            return
        }
        const dueDate = new Date(chore.due_date)
        
        if (dueDate < startOfToday) {
            categorizedData.overdue.push(chore)
        } else if (dueDate <= endOfToday) {
            categorizedData.dueSoon.push(chore)
        } else {
            categorizedData.upcoming.push(chore)
        }
    })

    categorizedData.completed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return categorizedData
}

export async function completeChore(choreId: number, completedBy: string[]): Promise<ActionResponse> {
    const supabase: TypedSupabaseClient = await createSupabaseClient()
    const { data: chore, error } = await supabase.from('chores').select('*').eq('id', choreId).single()
    
    if (error || !chore) return { success: false, message: error?.message || 'Chore not found' }

    const safeChore = chore as unknown as DbChore
    const isSubtask = !!safeChore.parent_chore_id

    if (isSubtask) {
        const { error: subError } = await supabase.from('chores').update({ status: 'complete' }).eq('id', choreId)
        if (subError) return { success: false, message: subError.message }
        
        if (safeChore.parent_chore_id) {
            const { data: siblings } = await supabase
                .from('chores')
                .select('status')
                .eq('parent_chore_id', safeChore.parent_chore_id)
            
            const allDone = siblings?.every(s => s.status === 'complete')
            
            if (allDone) {
                await completeChore(safeChore.parent_chore_id, completedBy)
                return { success: true, message: 'Subtask done & Parent completed!' }
            }
        }
        revalidatePath('/dashboard')
        return { success: true, message: 'Subtask done!' }
    }

    const targetInstances = safeChore.target_instances ?? 1
    
    if (completedBy.length > 0) {
        await updateStreaks(supabase, completedBy)
    }

    let names = 'Someone'
    if (completedBy.length > 0) {
        const { data: completers } = await supabase.from('profiles').select('full_name').in('id', completedBy)
        if (completers) {
            names = completers.map(c => c.full_name?.split(' ')[0]).join(' & ')
        }
    }

    await logActivity(safeChore.household_id, 'complete', safeChore.name, { completed_by: names })

    const isRecurring = safeChore.recurrence_type !== 'none'
    
    await supabase.from('chores').update({ 
        status: 'complete',
        completed_instances: targetInstances,
    }).eq('id', choreId)

    // --- RECURRENCE LOGIC ---
    if (isRecurring) {
        const nextDate = getNextDueDate(safeChore.recurrence_type, safeChore.due_date)
        
        if (nextDate) {
            let nextAssignee = safeChore.assigned_to;
            let nextCustomRecurrence = safeChore.custom_recurrence;

            const customRec = safeChore.custom_recurrence as any;
            
            if (customRec && customRec.rotation) {
                const { memberIds, nextIndex } = customRec.rotation;
                if (Array.isArray(memberIds) && memberIds.length > 0) {
                    const assignee = memberIds[nextIndex % memberIds.length];
                    nextAssignee = [assignee];

                    const newNextIndex = (nextIndex + 1) % memberIds.length;
                    
                    nextCustomRecurrence = {
                        ...customRec,
                        rotation: {
                            ...customRec.rotation,
                            nextIndex: newNextIndex
                        }
                    };
                }
            }

            // 1. Duplicate Parent
            const { data: newParent, error: insertError } = await supabase.from('chores').insert({
                name: safeChore.name,
                notes: safeChore.notes,
                household_id: safeChore.household_id,
                created_by: safeChore.created_by,
                status: 'pending',
                assigned_to: (nextAssignee && nextAssignee.length > 0) ? nextAssignee[0] : null, 
                room_id: safeChore.room_id,
                due_date: nextDate,
                target_instances: safeChore.target_instances,
                recurrence_type: safeChore.recurrence_type,
                completed_instances: 0,
                time_of_day: safeChore.time_of_day,
                exact_time: safeChore.exact_time,
                custom_recurrence: nextCustomRecurrence,
                deadline_type: safeChore.deadline_type // Copy urgency setting
            } as any).select('id').single()

            if (insertError) {
                console.error("Failed to create next recurring chore:", insertError)
            }

            // 2. Duplicate Subtasks
            if (newParent && !insertError) {
                const { data: subtasks } = await supabase.from('chores').select('*').eq('parent_chore_id', choreId)
                
                if (subtasks && subtasks.length > 0) {
                    const newSubtasks = subtasks.map((s: any) => ({
                        name: s.name,
                        household_id: s.household_id,
                        created_by: s.created_by,
                        status: 'pending',
                        parent_chore_id: newParent.id, 
                        recurrence_type: 'none' 
                    }))
                    await supabase.from('chores').insert(newSubtasks)
                }
            }
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

    revalidatePath('/', 'layout')
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
    
    const { error } = await supabase
        .from('chores')
        .update({ 
            status: 'pending', 
            completed_instances: 0 
        })
        .eq('id', choreId)

    if (error) return { success: false, message: error?.message || 'Chore not found' }

    revalidatePath('/dashboard')
    revalidatePath('/', 'layout')
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
  const deadlineType = formData.get('deadlineType') as string || 'soft' // NEW
  
  // Parse AssignedTo
  const rawAssignedTo = formData.get('assignedTo') as string
  let assignedTo: string[] = []
  try {
      assignedTo = JSON.parse(rawAssignedTo)
  } catch(e) {
      if (rawAssignedTo) assignedTo = [rawAssignedTo]
  }

  // Rotation Logic
  const shouldRotate = formData.get('rotateAssignees') === 'true'
  let customRecurrence = null
  let currentAssignee = assignedTo.length > 0 ? assignedTo[0] : null

  if (shouldRotate && assignedTo.length > 1) {
      customRecurrence = {
          rotation: {
              memberIds: assignedTo,
              nextIndex: 1 
          }
      }
  }

  // Parse Subtasks
  const rawSubtasks = formData.get('subtasks') as string
  let subtaskNames: string[] = []
  try {
      subtaskNames = JSON.parse(rawSubtasks)
  } catch(e) {}

  const rawRoomId = formData.get('roomId') as string
  const rawDueDate = formData.get('dueDate') as string || null
  const rawRecurrence = formData.get('recurrence_type') as string
  const rawTimeOfDay = formData.get('timeOfDay') as string
  const rawExactTime = formData.get('exactTime') as string
  const exactTime = rawExactTime && rawExactTime.trim() !== '' ? rawExactTime : null
  
  const instanceCount = parseInt(formData.get('instances') as string || '1')

  if (!rawName) return { success: false, message: 'Chore name is required.' }

  for (let i = 1; i <= instanceCount; i++) {
      let finalName = rawName
      if (instanceCount > 1) {
          finalName = `${rawName} #${i}`
      }

      const { data: parent, error } = await supabase.from('chores').insert({
        name: finalName,
        notes: rawNotes || null,
        household_id: householdId,
        created_by: user.id,
        status: 'pending',
        assigned_to: currentAssignee, 
        room_id: rawRoomId && rawRoomId !== '' ? Number(rawRoomId) : null,
        due_date: rawDueDate,
        target_instances: 1, 
        recurrence_type: rawRecurrence || 'none',
        completed_instances: 0,
        time_of_day: rawTimeOfDay || 'any',
        exact_time: exactTime,
        custom_recurrence: customRecurrence,
        deadline_type: deadlineType // SAVE
      } as any).select('id').single()

      if (error) return { success: false, message: error.message }

      if (subtaskNames.length > 0 && parent) {
          const subtasksData = subtaskNames.map(stName => ({
              name: stName,
              household_id: householdId,
              created_by: user.id,
              status: 'pending',
              parent_chore_id: parent.id, 
              recurrence_type: 'none',
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

  const { data: currentChore } = await supabase.from('chores').select('household_id').eq('id', Number(choreId)).single()

  const rawName = formData.get('name') as string
  const rawExactTime = formData.get('exactTime') as string
  const exactTime = rawExactTime && rawExactTime.trim() !== '' ? rawExactTime : null
  const deadlineType = formData.get('deadlineType') as string || 'soft'

  const shouldRotate = formData.get('rotateAssignees') === 'true'
  const rawAssignedTo = formData.get('assignedTo') as string
  let assignedTo: string[] = []
  let currentAssignee = null

  if (rawAssignedTo) {
      try {
          assignedTo = JSON.parse(rawAssignedTo)
          currentAssignee = assignedTo.length > 0 ? assignedTo[0] : null
      } catch {
          assignedTo = [rawAssignedTo]
          currentAssignee = assignedTo[0]
      }
  }

  let customRecurrence = null
  if (shouldRotate && assignedTo.length > 1) {
      customRecurrence = {
          rotation: {
              memberIds: assignedTo,
              nextIndex: 1 
          }
      }
  }
  
  const updateData: any = {
      name: rawName,
      notes: formData.get('notes') || null,
      recurrence_type: formData.get('recurrence_type'),
      time_of_day: formData.get('timeOfDay'),
      exact_time: exactTime, 
      room_id: formData.get('roomId') ? Number(formData.get('roomId')) : null,
      due_date: formData.get('dueDate') || null,
      assigned_to: currentAssignee,
      custom_recurrence: customRecurrence,
      deadline_type: deadlineType
  }

  const { error } = await supabase
    .from('chores')
    .update(updateData)
    .eq('id', Number(choreId))

  if (error) return { success: false, message: error.message }
  
  if (currentChore) {
      await logActivity(currentChore.household_id, 'update', rawName)
  }

  revalidatePath('/dashboard')
  return { success: true, message: 'Chore updated' }
}

export async function deleteChore(choreId: number): Promise<ActionResponse> {
  const supabase: TypedSupabaseClient = await createSupabaseClient() 
  
  const { data: chore } = await supabase.from('chores').select('household_id, name').eq('id', choreId).single()

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
  
  const { data: chore } = await supabase.from('chores').select('household_id, name, due_date, deadline_type').eq('id', choreId).single()
  if (!chore) return { success: false, message: 'Chore not found' }

  // --- CHECK HARD DEADLINE ---
  const safeChore = chore as unknown as DbChore
  if (safeChore.deadline_type === 'hard') {
      return { success: false, message: "Hard deadlines cannot be delayed!" }
  }

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

export async function nudgeUser(choreId: number, targetUserId: string): Promise<ActionResponse> {
    const supabase: TypedSupabaseClient = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Not authenticated' }

    const { data: chore } = await supabase.from('chores').select('name, household_id').eq('id', choreId).single()
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    const { data: targetProfile } = await supabase.from('profiles').select('full_name').eq('id', targetUserId).single()
    
    const senderName = profile?.full_name?.split(' ')[0] || 'A housemate'
    
    await sendPushToUser(targetUserId, {
        title: `Nudge from ${senderName} 👋`,
        body: `Don't forget: ${chore?.name || 'Your chore'} is pending!`,
        url: '/dashboard'
    })

    if (chore) {
        await logActivity(chore.household_id, 'nudge', chore.name, { to: targetProfile?.full_name || 'someone' })
    }

    return { success: true, message: 'Nudge sent!' }
}

export async function incrementChoreInstance(chore: DbChore): Promise<ActionResponse> {
    return { success: true, message: "Use complete action" }
}

export async function decrementChoreInstance(chore: DbChore): Promise<ActionResponse> {
    return { success: true, message: "Use uncomplete action" }
}