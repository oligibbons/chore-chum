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
  
  if (!fullName || fullName.trim().length < 2) {
    return { success: false, message: 'Name must be at least 2 characters.', timestamp: Date.now() }
  }

  const updateData: TablesUpdate<'profiles'> = { 
    full_name: fullName.trim(),
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

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  
  return { success: true, message: 'Profile updated successfully', timestamp: Date.now() }
}

export async function leaveHousehold() {
  const supabase = await createSupabaseClient()
  const profile = await getCurrentUserProfile(supabase)
  
  if (!profile || !profile.household_id) throw new Error('No household to leave')

  // Phase 1.3: Orphaned Data Handling
  // Check how many members are left in the household
  const { count } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('household_id', profile.household_id)

  const isLastMember = count === 1

  if (isLastMember) {
    // 1. Delete Household (Cascading delete handles chores/rooms usually, but we ensure cleanup)
    const { error } = await supabase
      .from('households')
      .delete()
      .eq('id', profile.household_id)

    if (error) throw new Error(`Failed to close household: ${error.message}`)
    
    // Update profile just in case cascade didn't catch it or to be explicit
    await supabase
      .from('profiles')
      .update({ household_id: null })
      .eq('id', profile.id)

  } else {
    // Notify remaining members BEFORE leaving
    await notifyHousehold(
      profile.household_id,
      {
        title: 'Member Left 🏠',
        body: `${profile.full_name || 'Someone'} has left the household.`,
        url: '/rooms'
      },
      profile.id
    )

    // Just remove self
    const { error } = await supabase
      .from('profiles')
      .update({ household_id: null })
      .eq('id', profile.id)

    if (error) throw new Error(error.message)
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}