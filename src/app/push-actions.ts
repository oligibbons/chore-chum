'use server'

import { createSupabaseClient } from '@/lib/supabase/server'
import { sendNotification, PushPayload } from '@/lib/push'
import { TypedSupabaseClient } from '@/types/database'
import { Json } from '@/types/supabase'

export async function subscribeUserToPush(subscription: any) {
  const supabase: TypedSupabaseClient = await createSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Not authenticated' }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { 
        user_id: user.id, 
        subscription: subscription as Json
      }, 
      { onConflict: 'user_id, subscription' }
    )

  if (error) {
    console.error('Error saving subscription:', error)
    return { success: false, message: 'Failed to save subscription' }
  }

  return { success: true, message: 'Subscribed successfully' }
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const supabase: TypedSupabaseClient = await createSupabaseClient()
  
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', userId)

  if (!subs || subs.length === 0) return

  const results = await Promise.all(
    subs.map(async (record) => {
      const subObject = record.subscription as any
      const success = await sendNotification(subObject, payload)
      return { subscription: subObject, success }
    })
  )

  const invalidSubs = results.filter(r => !r.success).map(r => r.subscription)
  
  if (invalidSubs.length > 0) {
    for (const sub of invalidSubs) {
       await supabase
         .from('push_subscriptions')
         .delete()
         .match({ user_id: userId, subscription: sub })
    }
  }
}

export async function notifyHousehold(
  householdId: string, 
  payload: PushPayload, 
  excludeUserId?: string
) {
  const supabase: TypedSupabaseClient = await createSupabaseClient()
  
  const { data: members } = await supabase
    .from('profiles')
    .select('id')
    .eq('household_id', householdId)

  if (!members) return

  const recipientIds = members
    .map(m => m.id)
    .filter(id => id !== excludeUserId)

  await Promise.all(
    recipientIds.map(id => sendPushToUser(id, payload))
  )
}

// --- Phase 3: The Beacon ---
export async function notifyZenStart() {
  const supabase = await createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('household_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) return

  // 1. Debounce Check: Has this user triggered 'zen_start' in the last hour?
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  
  const { count } = await supabase
    .from('activity_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('action_type', 'zen_start')
    .gt('created_at', oneHourAgo)

  if (count && count > 0) {
    return // Too soon, don't spam
  }

  // 2. Log Activity (Actions as the debounce marker)
  await supabase.from('activity_logs').insert({
    household_id: profile.household_id,
    user_id: user.id,
    action_type: 'zen_start',
    entity_name: 'Zen Mode',
    details: null
  } as any)

  // 3. Send Notification
  const firstName = profile.full_name?.split(' ')[0] || 'Someone'
  await notifyHousehold(
    profile.household_id,
    {
      title: 'Focus Mode 🧘',
      body: `${firstName} is focusing on chores right now.`,
      url: '/dashboard?view=zen' // Join them!
    },
    user.id
  )
}