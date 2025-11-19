'use server'

import { createSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateProfile(formData: FormData) {
  const supabase = await createSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const fullName = formData.get('fullName') as string
  
  if (!fullName || fullName.trim().length < 2) {
    return { success: false, message: 'Name must be at least 2 characters.' }
  }

  // NUCLEAR FIX: Cast builder to 'any'
  const { error } = await (supabase.from('profiles') as any)
    .update({ 
      full_name: fullName.trim(),
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) {
    return { success: false, message: error.message }
  }

  revalidatePath('/profile')
  revalidatePath('/dashboard') // Update dashboard so assignments show new name
  return { success: true, message: 'Profile updated successfully' }
}

export async function leaveHousehold() {
  const supabase = await createSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // NUCLEAR FIX: Cast builder to 'any'
  const { error } = await (supabase.from('profiles') as any)
    .update({ household_id: null })
    .eq('id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
  redirect('/dashboard') // Will redirect to household selection screen
}