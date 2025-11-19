// src/app/(app)/calendar/page.tsx

import { createSupabaseClient } from '@/lib/supabase/server'
import { getHouseholdData } from '@/app/chore-actions'
import ChoreItem from '@/components/ChoreItem'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const supabase = await createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('household_id')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.household_id) redirect('/dashboard')

  const data = await getHouseholdData(profile.household_id)
  if (!data) return null

  // Only show active chores
  const chores = data.chores.filter(c => c.status !== 'complete')

  // --- Calendar Logic ---
  const today = new Date()
  today.setHours(0,0,0,0)
  
  const getDayName = (date: Date) => new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date)
  const getDateString = (date: Date) => date.toISOString().split('T')[0]

  // 1. Generate next 7 days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return {
      date: d,
      dateStr: getDateString(d),
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : getDayName(d),
      chores: [] as typeof chores
    }
  })

  const futureChores: typeof chores = []
  const noDateChores: typeof chores = []

  chores.forEach(chore => {
    if (!chore.due_date) {
      noDateChores.push(chore)
      return
    }
    const dStr = chore.due_date.split('T')[0]
    
    // Find if it belongs to one of the next 7 days
    const dayBucket = weekDays.find(day => day.dateStr === dStr)
    if (dayBucket) {
      dayBucket.chores.push(chore)
    } else {
      // Check if it's past or future relative to "today"
      // If it's in the past (overdue), we group it with "Today" for visibility
      if (new Date(dStr) < today) {
         weekDays[0].chores.push(chore) 
      } else {
         futureChores.push(chore)
      }
    }
  })

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header>
        <h2 className="text-3xl font-heading font-bold">Weekly Planner</h2>
        <p className="text-text-secondary">A look at the week ahead.</p>
      </header>

      <div className="space-y-8">
        {weekDays.map((day, index) => (
          <div key={day.dateStr} className={`rounded-2xl border bg-card p-6 shadow-card ${index === 0 ? 'border-brand/50 ring-1 ring-brand/20' : 'border-border'}`}>
             <h3 className={`text-xl font-bold font-heading mb-4 ${index === 0 ? 'text-brand' : 'text-text-primary'}`}>
               {day.dayName} <span className="text-sm font-normal text-text-secondary ml-2">{day.date.toLocaleDateString()}</span>
             </h3>
             
             {day.chores.length > 0 ? (
               <div className="space-y-3">
                 {day.chores.map(chore => (
                    <ChoreItem 
                      key={chore.id} 
                      chore={chore} 
                      showActions={true} 
                      // If it's today (or overdue moved to today), mark as 'due' style
                      status={index === 0 ? 'due' : 'upcoming'} 
                    />
                 ))}
               </div>
             ) : (
               <p className="text-sm text-text-secondary italic">No chores scheduled.</p>
             )}
          </div>
        ))}

        {(futureChores.length > 0 || noDateChores.length > 0) && (
            <div className="rounded-2xl border border-border bg-card/50 p-6">
                <h3 className="text-lg font-bold font-heading mb-4 text-text-secondary">Later & Unscheduled</h3>
                <div className="space-y-3 opacity-80 hover:opacity-100 transition-opacity">
                    {futureChores.map(chore => (
                        <ChoreItem key={chore.id} chore={chore} showActions={true} status="upcoming" />
                    ))}
                    {noDateChores.map(chore => (
                        <ChoreItem key={chore.id} chore={chore} showActions={true} status="upcoming" />
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  )
}