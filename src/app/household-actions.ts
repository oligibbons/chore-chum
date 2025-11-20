// src/app/household-actions.ts
'use server'

import { createSupabaseClient } from '@/lib/supabase/server' 
import { TablesInsert, TypedSupabaseClient } from '@/types/database'
import { revalidatePath } from 'next/cache'
import { notifyHousehold } from '@/app/push-actions'

export type FormState = {
  success: boolean
  message: string
  timestamp?: number // Helper to trigger useEffect hooks even if message is same
}

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Helper to get profile for notification names
async function getCurrentUserProfile(supabase: TypedSupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('id, full_name').eq('id', user.id).single()
  return profile
}

export async function createHousehold(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createSupabaseClient() 
  const householdName = formData.get('householdName') as string

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'You must be logged in.', timestamp: Date.now() }
    }

    if (!householdName || householdName.trim().length < 3) {
      return {
        success: false,
        message: 'Household name must be at least 3 characters.',
        timestamp: Date.now()
      }
    }

    let inviteCode = ''
    let codeExists = true
    let retries = 0
    const maxRetries = 5

    while (codeExists && retries < maxRetries) {
      inviteCode = generateInviteCode()
      
      const { data, error } = await supabase
        .from('households')
        .select('id')
        .eq('invite_code', inviteCode)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message)
      }

      if (!data) {
        codeExists = false 
      }
      
      retries++
    }

    if (codeExists) {
      return { success: false, message: 'Could not generate a unique invite code. Please try again.', timestamp: Date.now() }
    }

    const newHousehold: TablesInsert<'households'> = {
        name: householdName,
        owner_id: user.id,
        invite_code: inviteCode,
    }

    // Create Household
    const { data: householdData, error: householdError } = await supabase
      .from('households')
      .insert(newHousehold)
      .select('id')
      .single()

    if (householdError || !householdData) {
      return {
        success: false,
        message: `Could not create household: ${householdError?.message || ''}`,
        timestamp: Date.now()
      }
    }

    // Update Profile to join the new household
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ household_id: householdData.id })
      .eq('id', user.id)

    if (profileError) {
      return {
        success: false,
        message: `Could not join new household: ${profileError.message}`,
        timestamp: Date.now()
      }
    }

    revalidatePath('/dashboard')
    return { success: true, message: 'Household created successfully! Welcome home.', timestamp: Date.now() }

  } catch (error: any) {
    return {
      success: false,
      message: `An unknown error occurred: ${error.message}`,
      timestamp: Date.now()
    }
  }
}

export async function joinHousehold(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createSupabaseClient() 
  const inviteCode = (formData.get('inviteCode') as string).toUpperCase()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'You must be logged in.', timestamp: Date.now() }
    }

    // Get profile for notifications (Added)
    const actorProfile = await getCurrentUserProfile(supabase)
    const userName = actorProfile?.full_name || 'Someone'

    if (!inviteCode || inviteCode.trim().length < 6) {
      return { success: false, message: 'Invite code must be 6 characters.', timestamp: Date.now() }
    }

    const { data: householdData, error: householdError } = await supabase
      .from('households')
      .select('id, name') // Added name selection for the notification
      .eq('invite_code', inviteCode)
      .single()

    if (householdError || !householdData) {
      return {
        success: false,
        message: 'Invalid invite code. Please check and try again.',
        timestamp: Date.now()
      }
    }

    // Join Household
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ household_id: householdData.id })
      .eq('id', user.id)

    if (profileError) {
      return {
        success: false,
        message: `Could not join household: ${profileError.message}`,
        timestamp: Date.now()
      }
    }

    // Notify Household Members (Added)
    await notifyHousehold(
      householdData.id,
      {
        title: 'New Member! 👋',
        body: `${userName} just joined ${householdData.name}.`,
        url: '/feed'
      },
      actorProfile?.id // Exclude the person joining
    )

    revalidatePath('/dashboard')
    return { success: true, message: 'Joined household successfully!', timestamp: Date.now() }
    
  } catch (error: any) {
    return {
      success: false,
      message: `An unknown error occurred: ${error.message}`,
      timestamp: Date.now()
    }
  }
}