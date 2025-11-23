// src/app/api/cron/reminders/route.ts
import { createClient } from '@supabase/supabase-js'
import { sendNotification } from '@/lib/push'
import { Database } from '@/types/supabase'
import { NextResponse } from 'next/server'

// Force this route to be dynamic (not cached) so it runs every time
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // We use a SERVICE_ROLE key because this runs on the server without a user session
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Time Window Logic:
  // We want to catch tasks due around "Now + 5 minutes".
  // To be safe against late cron runs, we check a window:
  // FROM: Now (anything just due)
  // TO:   Now + 15 mins (due very soon)
  // AND:  Has NOT been reminded today.
  
  // NOTE: You must run this migration for this to work:
  // alter table chores add column last_reminded_at timestamptz;

  const now = new Date()
  const windowEnd = new Date(now.getTime() + 15 * 60 * 1000) // +15 mins
  
  // String formatting for 'time' column comparison (HH:MM)
  const nowStr = now.toTimeString().slice(0, 5)
  const windowEndStr = windowEnd.toTimeString().slice(0, 5)

  try {
    // 1. Find pending chores due in our window
    // Note: Supabase/Postgres 'time' comparison is tricky with ranges wrapping midnight.
    // We assume simple day-time for V1.
    
    const { data: chores, error } = await supabase
      .from('chores')
      .select('id, name, assigned_to, household_id, exact_time, last_reminded_at')
      .eq('status', 'pending')
      .neq('exact_time', null) 
      // Logic: We filter in JS for precise "Not Reminded Recently" check 
      // to avoid complex SQL logic for the MVP
      
    if (error) throw error
    if (!chores || chores.length === 0) return NextResponse.json({ message: 'No chores pending with exact time.' })

    let notificationsSent = 0
    const choresToUpdate: number[] = []

    // 2. Filter and Notify
    for (const chore of chores) {
        const choreTime = chore.exact_time as string // HH:MM:00
        const choreHM = choreTime.slice(0, 5)

        // A. Check Time Window
        // Simple check: is choreTime >= nowStr AND choreTime <= windowEndStr
        if (choreHM < nowStr || choreHM > windowEndStr) continue

        // B. Check if already reminded today
        if (chore.last_reminded_at) {
            const lastReminded = new Date(chore.last_reminded_at)
            if (lastReminded.getDate() === now.getDate()) {
                // Already reminded today, skip
                continue
            }
        }

        // --- Send Logic ---
        const assigneeIds: string[] = []
        if (chore.assigned_to) {
            try {
                // Handle array or string legacy
                const parsed = typeof chore.assigned_to === 'string' && chore.assigned_to.startsWith('[') 
                    ? JSON.parse(chore.assigned_to) 
                    : [chore.assigned_to]
                
                if (Array.isArray(parsed)) assigneeIds.push(...parsed)
            } catch {
                // Fallback
            }
        }

        if (assigneeIds.length === 0) continue

        const { data: subs } = await supabase
            .from('push_subscriptions')
            .select('subscription')
            .in('user_id', assigneeIds)

        if (subs && subs.length > 0) {
            const payload = {
                title: 'Chore Reminder ⏰',
                body: `"${chore.name}" is due soon!`,
                url: '/dashboard'
            }

            await Promise.all(subs.map(s => sendNotification(s.subscription as any, payload)))
            notificationsSent += subs.length
            choresToUpdate.push(chore.id)
        }
    }

    // 3. Update `last_reminded_at` to prevent spamming
    if (choresToUpdate.length > 0) {
        await supabase
            .from('chores')
            .update({ last_reminded_at: new Date().toISOString() } as any) // Cast to any if types aren't updated yet
            .in('id', choresToUpdate)
    }

    return NextResponse.json({ 
        success: true, 
        choresChecked: chores.length,
        remindersSent: choresToUpdate.length,
        notificationsSent 
    })

  } catch (err: any) {
    console.error('Cron Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}