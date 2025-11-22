// src/app/feed-actions.ts
'use server'

import { createSupabaseClient } from '@/lib/supabase/server'
import { ActivityLogWithUser, TypedSupabaseClient } from '@/types/database'

export async function getActivityFeed(householdId: string): Promise<ActivityLogWithUser[]> {
  const supabase: TypedSupabaseClient = await createSupabaseClient()

  const { data, error } = await supabase
    .from('activity_logs')
    .select(`
      *,
      profiles:user_id (id, full_name, avatar_url)
    `)
    .eq('household_id', householdId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching feed:', error.message)
    return []
  }

  if (!data || data.length === 0) {
    // Optional: Log if empty to help debugging in server logs
    // console.log('Feed is empty for household:', householdId)
    return []
  }

  return data as unknown as ActivityLogWithUser[]
}