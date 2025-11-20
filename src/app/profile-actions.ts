'use server'

import { createSupabaseClient } from '@/lib/supabase/server'
import { TablesUpdate } from '@/types/database'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type ProfileFormState = {
  success: boolean
  message: string
  timestamp?: number
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
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('profiles')
    .update({ household_id: null })
    .eq('id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}