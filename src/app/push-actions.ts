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