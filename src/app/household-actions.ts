// src/app/household-actions.ts
'use server'

import { createSupabaseClient } from '@/lib/supabase/server' 
import { Database } from '@/types/supabase'
import { revalidatePath } from 'next/cache'

// Helper function to generate a random 6-character code
function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Type for our form's return state
export type FormState = {
  success: boolean
  message: string
}

// SERVER ACTION: createHousehold
export async function createHousehold(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createSupabaseClient() 
  const householdName = formData.get('householdName') as string

  // Wrap the entire action in a try/catch block for robust error handling
  try {
    // 1. Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'You must be logged in.' }
    }

    // 2. Validate input
    if (!householdName || householdName.trim().length < 3) {
      return {
        success: false,
        message: 'Household name must be at least 3 characters.',
      }
    }

    // --- THIS IS THE FIX ---
    // 3. Generate a unique invite code with a retry limit
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
        // 'PGRST116' is "No rows found", which is good.
        // Any other error is a real database problem.
        throw new Error(error.message)
      }

      if (!data) {
        codeExists = false // Code is unique
      }
      
      retries++
    }

    if (codeExists) {
      // This is the error you were seeing. It now works.
      return { success: false, message: 'Could not generate a unique invite code. Please try again.' }
    }
    // --- END FIX ---

    // 4. Create the new household
    const { data: householdData, error: householdError } = await supabase
      .from('households')
      .insert({
        name: householdName,
        owner_id: user.id,
        invite_code: inviteCode,
      })
      .select('id')
      .single()

    if (householdError || !householdData) {
      return {
        success: false,
        message: `Could not create household: ${householdError?.message || ''}`,
      }
    }

    // 5. Add this user to the new household
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ household_id: householdData.id })
      .eq('id', user.id)

    if (profileError) {
      return {
        success: false,
        message: `Could not join new household: ${profileError.message}`,
      }
    }

    // 6. Success! Refresh the page.
    revalidatePath('/dashboard')
    return { success: true, message: 'Household created!' }

  } catch (error: any) {
    return {
      success: false,
      message: `An unknown error occurred: ${error.message}`
    }
  }
}

// SERVER ACTION: joinHousehold (with robust error handling)
export async function joinHousehold(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createSupabaseClient() 
  const inviteCode = (formData.get('inviteCode') as string).toUpperCase()

  try {
    // 1. Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, message: 'You must be logged in.' }
    }

    // 2. Validate input
    if (!inviteCode || inviteCode.trim().length < 6) {
      return { success: false, message: 'Invite code must be 6 characters.' }
    }

    // 3. Find the household with this invite code
    const { data: householdData, error: householdError } = await supabase
      .from('households')
      .select('id')
      .eq('invite_code', inviteCode)
      .single()

    if (householdError || !householdData) {
      return {
        success: false,
        message: 'Invalid invite code. Please check and try again.',
      }
    }

    // 4. Add this user to the household
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ household_id: householdData.id })
      .eq('id', user.id)

    if (profileError) {
      return {
        success: false,
        message: `Could not join household: ${profileError.message}`,
      }
    }

    // 5. Success! Refresh the page.
    revalidatePath('/dashboard')
    return { success: true, message: 'Joined household!' }
    
  } catch (error: any) {
    return {
      success: false,
      message: `An unknown error occurred: ${error.message}`
    }
  }
}