// src/app/feed-actions.ts
'use server'

import { createSupabaseClient } from '@/lib/supabase/server'
import { ActivityLogWithUser } from '@/types/database'

export async function getActivityFeed(householdId: string): Promise<ActivityLogWithUser[]> {
  const supabase = await createSupabaseClient()

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
    console.error('Error fetching feed:', error)
    return []
  }

  // Supabase types with Joins can be complex to infer automatically, 
  // but this cast is now safer because our ActivityLogWithUser type 
  // matches the query structure exactly.
  return (data || []) as unknown as ActivityLogWithUser[]
}