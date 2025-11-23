// src/app/bounty-actions.ts
'use server'

import { createSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { DbBounty } from '@/types/database'

export type BountyState = {
  success: boolean
  message: string
}

async function getHouseholdId() {
  const supabase = await createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('household_id')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) throw new Error('No household found')
  return { householdId: profile.household_id, userId: user.id }
}

export async function getActiveBounty(): Promise<DbBounty | null> {
  const supabase = await createSupabaseClient()
  try {
    const { householdId } = await getHouseholdId()

    const { data, error } = await supabase
      .from('bounties')
      .select('*')
      .eq('household_id', householdId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return null
    return data as DbBounty
  } catch (error) {
    return null
  }
}

export async function setNewBounty(description: string): Promise<BountyState> {
  const supabase = await createSupabaseClient()
  
  try {
    const { householdId, userId } = await getHouseholdId()

    if (!description.trim()) {
      return { success: false, message: 'Description cannot be empty' }
    }

    // 1. Deactivate old bounties
    await supabase
      .from('bounties')
      .update({ is_active: false })
      .eq('household_id', householdId)

    // 2. Insert new bounty
    const { error } = await supabase
      .from('bounties')
      .insert({
        household_id: householdId,
        created_by: userId,
        description: description.trim(),
        is_active: true
      })

    if (error) throw error

    // 3. Log Activity
    await supabase.from('activity_logs').insert({
        household_id: householdId,
        user_id: userId,
        action_type: 'create',
        entity_name: 'New Bounty',
        details: { description }
    } as any)

    revalidatePath('/dashboard')
    return { success: true, message: 'New bounty set!' }

  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to set bounty' }
  }
}

export async function clearBounty(bountyId: number): Promise<BountyState> {
  const supabase = await createSupabaseClient()
  
  try {
    const { error } = await supabase
      .from('bounties')
      .update({ is_active: false })
      .eq('id', bountyId)

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true, message: 'Bounty cleared' }
  } catch (error: any) {
    return { success: false, message: 'Failed to clear bounty' }
  }
}