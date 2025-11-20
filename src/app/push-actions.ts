'use server'

import { createSupabaseClient } from '@/lib/supabase/server'
import { sendNotification, PushPayload } from '@/lib/push'
import { TypedSupabaseClient } from '@/types/database'

export async function subscribeUserToPush(subscription: any) {
  const supabase = await createSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Not authenticated' }

  // We use the 'subscription' JSON column to store the whole object
  // The unique constraint in SQL ensures we don't add duplicates
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { 
        user_id: user.id, 
        subscription: subscription 
      }, 
      { onConflict: 'user_id, subscription' }
    )

  if (error) {
    console.error('Error saving subscription:', error)
    return { success: false, message: 'Failed to save subscription' }
  }

  return { success: true, message: 'Subscribed successfully' }
}

// Internal function to notify a specific user (e.g. when assigned a chore)
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const supabase: TypedSupabaseClient = await createSupabaseClient()
  
  // 1. Get all active subscriptions for this user (phone, laptop, etc.)
  const { data: subs } = await supabase
    .from('push_subscriptions' as any) // Cast to any until types are regenerated
    .select('subscription')
    .eq('user_id', userId)

  if (!subs || subs.length === 0) return

  // 2. Send to all devices in parallel
  const results = await Promise.all(
    subs.map(async (record: any) => {
      const success = await sendNotification(record.subscription, payload)
      return { subscription: record.subscription, success }
    })
  )

  // 3. Clean up invalid subscriptions (410 Gone)
  const invalidSubs = results.filter(r => !r.success).map(r => r.subscription)
  
  if (invalidSubs.length > 0) {
    // We need to convert the subscriptions back to a format Supabase can match for deletion
    // Since JSONB matching can be tricky, typically we might delete by ID if we fetched it,
    // but here we'll just log it or leave it. For a production app, fetching IDs is better.
    // Simple cleanup strategy:
    for (const sub of invalidSubs) {
       await supabase
         .from('push_subscriptions' as any)
         .delete()
         .match({ user_id: userId, subscription: sub })
    }
  }
}

// Public action to notify a whole household (excluding the sender)
export async function notifyHousehold(
  householdId: string, 
  payload: PushPayload, 
  excludeUserId?: string
) {
  const supabase: TypedSupabaseClient = await createSupabaseClient()
  
  // 1. Find all members of the household
  const { data: members } = await supabase
    .from('profiles')
    .select('id')
    .eq('household_id', householdId)

  if (!members) return

  // 2. Filter out the person who performed the action
  const recipientIds = members
    .map(m => m.id)
    .filter(id => id !== excludeUserId)

  // 3. Send to each member
  await Promise.all(
    recipientIds.map(id => sendPushToUser(id, payload))
  )
}