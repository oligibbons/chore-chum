// src/app/api/cron/reminders/route.ts
import { createClient } from '@supabase/supabase-js'
import { sendNotification } from '@/lib/push'
import { Database } from '@/types/supabase'
import { NextResponse } from 'next/server'

// Force this route to be dynamic (not cached) so it runs every time
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Optional: Check for Vercel Cron Header security
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  // We use a SERVICE_ROLE key because this runs on the server without a user session
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const targetTime = new Date(now.getTime() + 5 * 60 * 1000) // Now + 5 mins
  
  // Format to HH:MM:00 for strict SQL comparison
  // Note: This assumes server time matches user time or exact_time is stored appropriately.
  // In a global app, you'd store Timezones. For now, we match on strict HH:MM string.
  const timeString = targetTime.toISOString().split('T')[1].substring(0, 5) + ":00" 

  try {
    // 1. Find pending chores due at this exact time
    const { data: chores, error } = await supabase
      .from('chores')
      .select('id, name, assigned_to, household_id')
      .eq('status', 'pending')
      .eq('exact_time', timeString)

    if (error) throw error
    if (!chores || chores.length === 0) return NextResponse.json({ message: 'No chores due.' })

    let notificationsSent = 0

    // 2. Loop through chores and notify assignees
    for (const chore of chores) {
        const assigneeIds: string[] = []
        
        if (chore.assigned_to) {
            try {
                const parsed = JSON.parse(chore.assigned_to as any)
                if (Array.isArray(parsed)) assigneeIds.push(...parsed)
            } catch {
                assigneeIds.push(chore.assigned_to as any)
            }
        }

        if (assigneeIds.length === 0) continue

        // Fetch subscriptions for these users
        const { data: subs } = await supabase
            .from('push_subscriptions')
            .select('subscription')
            .in('user_id', assigneeIds)

        if (subs && subs.length > 0) {
            const payload = {
                title: 'Chore Reminder ⏰',
                body: `"${chore.name}" is due in 5 minutes!`,
                url: '/dashboard'
            }

            await Promise.all(subs.map(s => sendNotification(s.subscription as any, payload)))
            notificationsSent += subs.length
        }
    }

    return NextResponse.json({ 
        success: true, 
        choresMatched: chores.length, 
        notificationsSent 
    })

  } catch (err: any) {
    console.error('Cron Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}