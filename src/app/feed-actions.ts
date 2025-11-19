// src/app/feed-actions.ts
'use server'

import { createSupabaseClient } from '@/lib/supabase/server'
import { ActivityLogWithUser } from '@/types/database'

export async function getActivityFeed(householdId: string): Promise<ActivityLogWithUser[]> {
  const supabase = await createSupabaseClient()

  // We select the log and join with profiles to get the user's name/avatar
  // Note: We use the foreign key name 'activity_logs_user_id_fkey' defined in the schema
  const { data, error } = await supabase
    .from('activity_logs')
    .select(`
      *,
      profiles:profiles!activity_logs_user_id_fkey (id, full_name, avatar_url)
    `)
    .eq('household_id', householdId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching feed:', error)
    return []
  }

  // Cast to our combined type
  return (data || []) as ActivityLogWithUser[]
}