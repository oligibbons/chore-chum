// src/app/profile-actions.ts
'use server'

import { createSupabaseClient } from '@/lib/supabase/server'
import { TablesUpdate, TypedSupabaseClient } from '@/types/database'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { notifyHousehold } from '@/app/push-actions'

export type ProfileFormState = {
  success: boolean
  message: string
  timestamp?: number
}

// Helper: Activity Logger
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

  await supabase.from('activity_logs').insert(logData as any)
}

// Helper to get profile safely
async function getCurrentUserProfile(supabase: TypedSupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('id, full_name, household_id').eq('id', user.id).single()
  return profile
}

export async function updateProfile(
  prevState: ProfileFormState | null, 
  formData: FormData
): Promise<ProfileFormState> {
  const supabase = await createSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Not authenticated', timestamp: Date.now() }

  const fullName = formData.get('fullName') as string
  const avatarUrl = formData.get('avatarUrl') as string
  
  // Notification Preferences
  const notif_morning = formData.get('notif_morning') === 'true'
  const notif_evening = formData.get('notif_evening') === 'true'
  const notif_updates = formData.get('notif_updates') === 'true'

  if (!fullName || fullName.trim().length < 2) {
    return { success: false, message: 'Name must be at least 2 characters.', timestamp: Date.now() }
  }

  const notification_preferences = {
      morning_brief: notif_morning,
      evening_motivation: notif_evening,
      chore_updates: notif_updates,
      nudges: true // Always true
  }

  const updateData: any = { 
    full_name: fullName.trim(),
    notification_preferences: notification_preferences, // Save as JSONB
    updated_at: new Date().toISOString()
  }

  if (avatarUrl) {
    updateData.avatar_url = avatarUrl
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)

  if (error) {
    return { success: false, message: error.message, timestamp: Date.now() }
  }

  // Log update if they are in a household
  const profile = await getCurrentUserProfile(supabase)
  if (profile?.household_id) {
      await logActivity(profile.household_id, 'update', 'Profile', { member: fullName })
  }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  
  return { success: true, message: 'Profile settings updated', timestamp: Date.now() }
}

export async function leaveHousehold() {
  const supabase = await createSupabaseClient()
  const profile = await getCurrentUserProfile(supabase)
  
  if (!profile || !profile.household_id) throw new Error('No household to leave')

  // Check how many members are left in the household
  const { count } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('household_id', profile.household_id)

  const isLastMember = count === 1

  if (isLastMember) {
    // 1. Delete Household
    const { error } = await supabase
      .from('households')
      .delete()
      .eq('id', profile.household_id)

    if (error) throw new Error(`Failed to close household: ${error.message}`)
    
    await supabase
      .from('profiles')
      .update({ household_id: null })
      .eq('id', profile.id)

  } else {
    // Log the leave event BEFORE removing the user
    await logActivity(profile.household_id, 'leave', 'Household', { member: profile.full_name })

    // Notify remaining members
    await notifyHousehold(
      profile.household_id,
      {
        title: 'Member Left 🏠',
        body: `${profile.full_name || 'Someone'} has left the household.`,
        url: '/rooms'
      },
      profile.id
    )

    // Remove self
    const { error } = await supabase
      .from('profiles')
      .update({ household_id: null })
      .eq('id', profile.id)

    if (error) throw new Error(error.message)
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}