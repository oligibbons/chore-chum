// src/app/feed-actions.ts
'use server'

import { createSupabaseClient } from '@/lib/supabase/server'
import { ActivityLogWithUser, TypedSupabaseClient } from '@/types/database'

export async function getActivityFeed(householdId: string): Promise<ActivityLogWithUser[]> {
  // FIX: Explicitly type the client
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
    console.error('Error fetching feed:', error)
    return []
  }

  return (data || []) as unknown as ActivityLogWithUser[]
}