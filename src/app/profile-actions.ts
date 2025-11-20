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

// Helper to get profile
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

  // Notify household BEFORE removing the user from it
  await notifyHousehold(
    profile.household_id,
    {
      title: 'Member Left 🏠',
      body: `${profile.full_name || 'Someone'} has left the household.`,
      url: '/rooms'
    },
    profile.id
  )

  const { error } = await supabase
    .from('profiles')
    .update({ household_id: null })
    .eq('id', profile.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}