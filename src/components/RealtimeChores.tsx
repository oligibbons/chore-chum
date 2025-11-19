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
    // Subscribe to all changes (INSERT, UPDATE, DELETE) on the 'chores' table
    // BUT filter only for the rows matching our householdId
    const channel = supabase
      .channel('realtime-chores')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chores',
          filter: `household_id=eq.${householdId}`,
        },
        () => {
          // When a change happens, refresh the Server Components to fetch new data
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, router, householdId])

  return null // This component is invisible
}