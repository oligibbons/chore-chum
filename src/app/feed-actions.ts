// src/app/feed-actions.ts
'use server'

import { createSupabaseClient } from '@/lib/supabase/server'
import { ActivityLogWithUser, TypedSupabaseClient } from '@/types/database'

export async function getActivityFeed(householdId: string): Promise<ActivityLogWithUser[]> {
  const supabase: TypedSupabaseClient = await createSupabaseClient()

  // 1. Fetch Logs (Without complex joins to avoid FK issues)
  const { data: logs, error: logsError } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (logsError) {
    console.error('Error fetching feed:', logsError.message)
    return []
  }

  if (!logs || logs.length === 0) {
    return []
  }

  // 2. Extract unique User IDs from the logs
  const userIds = Array.from(new Set(logs.map(log => log.user_id).filter(Boolean))) as string[]

  // 3. Fetch Profiles manually
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', userIds)

  // 4. Create a lookup map
  const profilesMap: Record<string, any> = {}
  if (profiles) {
    profiles.forEach(p => {
        profilesMap[p.id] = p
    })
  }

  // 5. Merge Profiles into Logs
  const combinedData = logs.map(log => ({
      ...log,
      profiles: log.user_id ? profilesMap[log.user_id] : null
  }))

  return combinedData as ActivityLogWithUser[]
}