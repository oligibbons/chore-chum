// src/app/api/cron/reminders/route.ts
import { createClient } from '@supabase/supabase-js'
import { sendNotification } from '@/lib/push'
import { Database } from '@/types/supabase'
import { NextResponse } from 'next/server'

// Force dynamic to ensure it runs freshly every time
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Optional security: Ensure this is triggered by authorized cron only
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Service Role key is required for background processing without a user session
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let notificationsSent = 0
  const now = new Date()

  try {
    // ====================================================================
    // CASE 1: USER-SPECIFIC ROUNDUPS & NUDGES (Timezone Aware)
    // ====================================================================
    
    // 1. Fetch only users who actually have push subscriptions
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('subscription, user_id, profiles(id, household_id, notification_preferences, timezone)')

    // Group subscriptions by user to avoid duplicate DB calls per user
    const activeProfiles = new Map()
    for (const sub of (subs || [])) {
      // Supabase joins can return arrays or objects depending on relations, handle both
      const profile = Array.isArray(sub.profiles) ? sub.profiles[0] : sub.profiles
      if (!profile) continue
      
      if (!activeProfiles.has(profile.id)) {
        activeProfiles.set(profile.id, { ...profile, subscriptions: [] })
      }
      activeProfiles.get(profile.id).subscriptions.push(sub.subscription)
    }

    // 2. Iterate over profiles and check their specific times
    for (const profile of Array.from(activeProfiles.values())) {
      const prefs = (profile.notification_preferences as any) || {}
      const userTimezone = profile.timezone || 'Europe/London'

      // Get user's current local time in HH:mm
      const timeFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: userTimezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      const currentTime = timeFormatter.format(now) // e.g., "08:00"
      
      // Determine user's local date for due_date comparisons (Outputs YYYY-MM-DD)
      const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: userTimezone }) 
      const localToday = dateFormatter.format(now)

      let payload = null

      // Check Morning Brief
      if (prefs.morning_brief !== false && currentTime === (prefs.morning_time || "08:00")) {
        const { count } = await supabase
          .from('chores')
          .select('id', { count: 'exact', head: true })
          .eq('household_id', profile.household_id)
          .eq('status', 'pending')
          .lte('due_date', localToday)
          .or(`assigned_to.cs.{"${profile.id}"},assigned_to.is.null`)

        if (count && count > 0) {
          payload = { 
            title: 'Morning Brief ☀️', 
            body: `You have ${count} pending chores today. Let's crush them!`, 
            url: '/dashboard' 
          }
        }
      } 
      // Check Evening Motivation
      else if (prefs.evening_motivation !== false && currentTime === (prefs.evening_time || "20:00")) {
        const { count } = await supabase
          .from('chores')
          .select('id', { count: 'exact', head: true })
          .eq('household_id', profile.household_id)
          .eq('status', 'pending')
          .lte('due_date', localToday)
          .or(`assigned_to.cs.{"${profile.id}"},assigned_to.is.null`)

        if (count && count > 0) {
          payload = { 
            title: 'Finish Strong 💪', 
            body: `${count} tasks left. You can do this!`, 
            url: '/dashboard' 
          }
        }
      }
      // Check Midday Nudge (Hardcoded to 14:00 local time)
      else if (prefs.nudges !== false && currentTime === "14:00") {
         const { count } = await supabase
          .from('chores')
          .select('id', { count: 'exact', head: true })
          .eq('household_id', profile.household_id)
          .eq('status', 'pending')
          .lte('due_date', localToday)
          .or(`assigned_to.cs.{"${profile.id}"},assigned_to.is.null`)

        if (count && count > 0) {
          payload = { 
            title: 'Midday Nudge ⚡', 
            body: `Busy day? You still have ${count} chores left to tackle.`, 
            url: '/dashboard' 
          }
        }
      }

      // If a payload was generated, fire it to all devices this user owns
      if (payload) {
         await Promise.all(profile.subscriptions.map((s: any) => sendNotification(s, payload!)))
         notificationsSent += profile.subscriptions.length
      }
    }


    // ====================================================================
    // CASE 2: STANDARD REMINDERS (Exact Time)
    // ====================================================================
    
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

        // Parse Assignees
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

        // Get Subscriptions for assignees
        const { data: choreSubs } = await supabase
            .from('push_subscriptions')
            .select('subscription')
            .in('user_id', assigneeIds)

        if (choreSubs && choreSubs.length > 0) {
            const payload = {
                title: 'Chore Reminder ⏰',
                body: `"${chore.name}" is due soon!`,
                url: '/dashboard'
            }
            await Promise.all(choreSubs.map(s => sendNotification(s.subscription as any, payload)))
            notificationsSent += choreSubs.length
            choresToUpdate.push(chore.id)
        }
    }

    // Update reminded status
    if (choresToUpdate.length > 0) {
        await supabase
            .from('chores')
            .update({ last_reminded_at: new Date().toISOString() } as any)
            .in('id', choresToUpdate)
    }

    return NextResponse.json({ 
        success: true, 
        notificationsSent,
        exactTimeSent: choresToUpdate.length
    })

  } catch (err: any) {
    console.error('Cron Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}