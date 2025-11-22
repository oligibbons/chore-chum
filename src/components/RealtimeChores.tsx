// src/components/RealtimeChores.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

type Props = {
  householdId: string
}

export default function RealtimeChores({ householdId }: Props) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const channel = supabase
      .channel('realtime-household')
      // Listen for Chore changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chores',
          filter: `household_id=eq.${householdId}`,
        },
        () => router.refresh()
      )
      // Listen for Activity Log changes (Feed updates, Nudges, etc)
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Logs are usually just inserts
          schema: 'public',
          table: 'activity_logs',
          filter: `household_id=eq.${householdId}`,
        },
        () => router.refresh()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, router, householdId])

  return null
}