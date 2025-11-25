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

  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('household_id')
    .eq('id', user.id)
    .single()

  const profile = rawProfile as { household_id: string | null } | null

  if (!profile || !profile.household_id) redirect('/dashboard')

  const data = await getHouseholdData(profile.household_id)
  if (!data) return null

  const chores = data.chores.filter(c => c.status !== 'complete')

  const today = new Date()
  today.setHours(0,0,0,0)
  
  const getDayName = (date: Date) => new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date)
  const getDateString = (date: Date) => date.toISOString().split('T')[0]

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
    
    const dayBucket = weekDays.find(day => day.dateStr === dStr)
    if (dayBucket) {
      dayBucket.chores.push(chore)
    } else {
      if (new Date(dStr) < today) {
         weekDays[0].chores.push(chore) 
      } else {
         futureChores.push(chore)
      }
    }
  })

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <header>
        {/* FIXED: Tour target moved to header for stability */}
        <h2 
            data-tour="calendar-view"
            className="text-3xl font-heading font-bold text-foreground inline-block"
        >
            Weekly Planner
        </h2>
        <p className="text-muted-foreground">A look at the week ahead.</p>
      </header>

      <div className="space-y-8">
        {weekDays.map((day, index) => (
          <div 
            key={day.dateStr} 
            className={`
                rounded-2xl border bg-card p-6 shadow-sm
                ${index === 0 
                    ? 'border-brand/50 ring-1 ring-brand/20 shadow-md' 
                    : 'border-border'}
            `}
          >
             <h3 className={`text-xl font-bold font-heading mb-4 flex items-baseline gap-2 ${index === 0 ? 'text-brand' : 'text-card-foreground'}`}>
               {day.dayName} 
               <span className="text-sm font-normal text-muted-foreground">
                   {day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
               </span>
             </h3>
             
             {day.chores.length > 0 ? (
               <div className="space-y-3">
                 {day.chores.map(chore => (
                    <ChoreItem 
                      key={chore.id} 
                      chore={chore} 
                      showActions={true} 
                      status={index === 0 ? 'due' : 'upcoming'}
                      members={data.members}
                      currentUserId={user.id}
                    />
                 ))}
               </div>
             ) : (
               <p className="text-sm text-muted-foreground italic">No chores scheduled.</p>
             )}
          </div>
        ))}

        {(futureChores.length > 0 || noDateChores.length > 0) && (
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-6">
                <h3 className="text-lg font-bold font-heading mb-4 text-muted-foreground">Later & Unscheduled</h3>
                <div className="space-y-3 opacity-90 hover:opacity-100 transition-opacity">
                    {futureChores.map(chore => (
                        <ChoreItem 
                          key={chore.id} 
                          chore={chore} 
                          showActions={true} 
                          status="upcoming"
                          members={data.members}
                          currentUserId={user.id}
                        />
                    ))}
                    {noDateChores.map(chore => (
                        <ChoreItem 
                          key={chore.id} 
                          chore={chore} 
                          showActions={true} 
                          status="upcoming"
                          members={data.members}
                          currentUserId={user.id}
                        />
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  )
}