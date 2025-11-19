// src/app/household-actions.ts
'use server'

import { createSupabaseClient } from '@/lib/supabase/server' 
import { Database } from '@/types/supabase'
import { revalidatePath } from 'next/cache'

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export type FormState = {
  success: boolean
  message: string
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
      return { success: false, message: 'You must be logged in.' }
    }

    if (!householdName || householdName.trim().length < 3) {
      return {
        success: false,
        message: 'Household name must be at least 3 characters.',
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
      return { success: false, message: 'Could not generate a unique invite code. Please try again.' }
    }

    // FIX: Cast to any
    const { data: householdData, error: householdError } = await supabase
      .from('households')
      .insert({
        name: householdName,
        owner_id: user.id,
        invite_code: inviteCode,
      } as any)
      .select('id')
      .single()

    if (householdError || !householdData) {
      return {
        success: false,
        message: `Could not create household: ${householdError?.message || ''}`,
      }
    }

    // FIX: Cast to any
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ household_id: householdData.id } as any)
      .eq('id', user.id)

    if (profileError) {
      return {
        success: false,
        message: `Could not join new household: ${profileError.message}`,
      }
    }

    revalidatePath('/dashboard')
    return { success: true, message: 'Household created!' }

  } catch (error: any) {
    return {
      success: false,
      message: `An unknown error occurred: ${error.message}`
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
      return { success: false, message: 'You must be logged in.' }
    }

    if (!inviteCode || inviteCode.trim().length < 6) {
      return { success: false, message: 'Invite code must be 6 characters.' }
    }

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

    // FIX: Cast to any
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ household_id: householdData.id } as any)
      .eq('id', user.id)

    if (profileError) {
      return {
        success: false,
        message: `Could not join household: ${profileError.message}`,
      }
    }

    revalidatePath('/dashboard')
    return { success: true, message: 'Joined household!' }
    
  } catch (error: any) {
    return {
      success: false,
      message: `An unknown error occurred: ${error.message}`
    }
  }
}