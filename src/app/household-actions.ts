// src/app/household-actions.ts
'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'
import { revalidatePath } from 'next/cache'

// This is the correct client for Server Actions
const createSupabaseServerActionClient = () => {
  const cookieStore = cookies()
  return createServerActionClient<Database>({
    cookies: () => cookieStore,
  })
}

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
  prevState: FormState, // For useFormState
  formData: FormData
): Promise<FormState> {
  const supabase = createSupabaseServerActionClient() // <-- Use correct client
  const householdName = formData.get('householdName') as string

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

  // 3. Generate a unique invite code
  let inviteCode = generateInviteCode()
  let codeExists = true

  while (codeExists) {
    const { data, error } = await supabase
      .from('households')
      .select('id')
      .eq('invite_code', inviteCode)
      .single()

    if (!data && !error) {
      codeExists = false // Code is unique
    } else {
      inviteCode = generateInviteCode() // Try a new code
    }
  }

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
}

// SERVER ACTION: joinHousehold
export async function joinHousehold(
  prevState: FormState, // For useFormState
  formData: FormData
): Promise<FormState> {
  const supabase = createSupabaseServerActionClient() // <-- Use correct client
  const inviteCode = (formData.get('inviteCode') as string).toUpperCase()

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
    .eq('id', user.id) // Update the profile for the current user

  if (profileError) {
    return {
      success: false,
      message: `Could not join household: ${profileError.message}`,
    }
  }

  // 5. Success! Refresh the page.
  revalidatePath('/dashboard')
  return { success: true, message: 'Joined household!' }
}