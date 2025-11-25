// src/app/api/cron/reminders/route.ts
import { createClient } from '@supabase/supabase-js'
import { sendNotification } from '@/lib/push'
import { Database } from '@/types/supabase'
import { NextResponse } from 'next/server'

// Force dynamic to ensure it runs freshly every time
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Service Role key is required for background processing without a user session
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') // 'morning', 'evening', or null (standard)

  let notificationsSent = 0

  try {
    // --- CASE 1: MORNING BRIEF (8 AM) ---
    if (type === 'morning') {
      // 1. Get all profiles who want morning briefs
      // Note: We filter in JS because JSONB filtering can be complex depending on DB version/types
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, household_id, notification_preferences')
      
      const recipients = profiles?.filter((p: any) => {
        const prefs = p.notification_preferences
        // Default to true if not set, or check explicit true
        return !prefs || prefs.morning_brief !== false
      }) || []

      // 2. For each recipient, count their pending chores
      for (const profile of recipients) {
        const { count } = await supabase
          .from('chores')
          .select('id', { count: 'exact', head: true })
          .eq('household_id', profile.household_id)
          .eq('status', 'pending')
          // Simple logic: Count chores assigned to them OR unassigned
          .or(`assigned_to.cs.{"${profile.id}"},assigned_to.is.null`) 

        if (count && count > 0) {
           const { data: subs } = await supabase
             .from('push_subscriptions')
             .select('subscription')
             .eq('user_id', profile.id)
           
           if (subs && subs.length > 0) {
             const payload = {
               title: 'Morning Brief ☀️',
               body: `You have ${count} pending chores today. Let's crush them!`,
               url: '/dashboard'
             }
             await Promise.all(subs.map(s => sendNotification(s.subscription as any, payload)))
             notificationsSent += subs.length
           }
        }
      }
      
      return NextResponse.json({ success: true, type: 'morning', sent: notificationsSent })
    }

    // --- CASE 2: EVENING MOTIVATION (8 PM) ---
    if (type === 'evening') {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, household_id, notification_preferences')
      
      const recipients = profiles?.filter((p: any) => {
        const prefs = p.notification_preferences
        return !prefs || prefs.evening_motivation !== false
      }) || []

      for (const profile of recipients) {
        // Check strictly for overdue or due today
        const today = new Date().toISOString().split('T')[0]
        
        const { count } = await supabase
          .from('chores')
          .select('id', { count: 'exact', head: true })
          .eq('household_id', profile.household_id)
          .eq('status', 'pending')
          .lte('due_date', today) // Due today or before
          .or(`assigned_to.cs.{"${profile.id}"},assigned_to.is.null`)

        if (count && count > 0) {
           const { data: subs } = await supabase
             .from('push_subscriptions')
             .select('subscription')
             .eq('user_id', profile.id)
           
           if (subs && subs.length > 0) {
             const payload = {
               title: 'Finish Strong 💪',
               body: `${count} tasks left. You can do this!`,
               url: '/dashboard'
             }
             await Promise.all(subs.map(s => sendNotification(s.subscription as any, payload)))
             notificationsSent += subs.length
           }
        }
      }
      return NextResponse.json({ success: true, type: 'evening', sent: notificationsSent })
    }

    // --- CASE 3: STANDARD REMINDERS (Exact Time) ---
    // Runs frequently (e.g. every 15 mins)
    
    const now = new Date()
    const windowEnd = new Date(now.getTime() + 15 * 60 * 1000) // +15 mins
    const nowStr = now.toTimeString().slice(0, 5)
    const windowEndStr = windowEnd.toTimeString().slice(0, 5)

    const { data: chores } = await supabase
      .from('chores')
      .select('id, name, assigned_to, household_id, exact_time, last_reminded_at')
      .eq('status', 'pending')
      .neq('exact_time', null)

    const choresToUpdate: number[] = []

    for (const chore of (chores || [])) {
        const choreTime = chore.exact_time as string
        const choreHM = choreTime.slice(0, 5)

        // Check Time Window
        if (choreHM < nowStr || choreHM > windowEndStr) continue

        // Check already reminded today
        if (chore.last_reminded_at) {
            const lastReminded = new Date(chore.last_reminded_at)
            if (lastReminded.getDate() === now.getDate()) continue
        }

        // Send
        const assigneeIds: string[] = []
        if (chore.assigned_to) {
            try {
                const parsed = typeof chore.assigned_to === 'string' 
                    ? JSON.parse(chore.assigned_to) 
                    : (Array.isArray(chore.assigned_to) ? chore.assigned_to : [chore.assigned_to])
                
                if (Array.isArray(parsed)) assigneeIds.push(...parsed)
            } catch {}
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

    if (choresToUpdate.length > 0) {
        await supabase
            .from('chores')
            .update({ last_reminded_at: new Date().toISOString() } as any)
            .in('id', choresToUpdate)
    }

    return NextResponse.json({ 
        success: true, 
        type: 'exact_time',
        remindersSent: choresToUpdate.length,
        notificationsSent 
    })

  } catch (err: any) {
    console.error('Cron Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}