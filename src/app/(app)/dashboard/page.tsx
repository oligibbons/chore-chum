// src/app/(app)/dashboard/page.tsx

import { redirect } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/server'
import { getChoreDisplayData } from '@/app/chore-actions'
import HouseholdManager from '@/components/HouseholdManager'
import { Plus, Flower2 } from 'lucide-react'
import Link from 'next/link'
import FloatingActionLink from '@/components/FloatingActionLink'
import AddChoreModal from '@/components/AddChoreModal'
import { getRoomsAndMembers } from '@/app/room-actions'
import EditChoreModal from '@/components/EditChoreModal'
import { ChoreWithDetails } from '@/types/database'
import FilterBar from '@/components/FilterBar' 
import ZenMode from '@/components/ZenMode'
import Leaderboard from '@/components/Leaderboard'
import StreakCampfire from '@/components/StreakCampfire'
import DailyProgress from '@/components/DailyProgress'
import Greeting from '@/components/Greeting'
import AppBadgeUpdater from '@/components/AppBadgeUpdater'
import ChoreDisplay from '@/components/ChoreDisplay'

export const dynamic = 'force-dynamic'

type DashboardProps = {
  searchParams: Promise<{ modal?: string; choreId?: string; roomId?: string; view?: string; assignee?: string }>
}

export default async function DashboardPage(props: DashboardProps) {
  const searchParams = await props.searchParams
  const roomIdFilter = searchParams.roomId ? Number(searchParams.roomId) : null
  const assigneeFilter = searchParams.assignee === 'me' ? 'me' : 'all'
  
  const supabase = await createSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/') 
  }

  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('household_id, full_name, current_streak, last_chore_date')
    .eq('id', user.id)
    .single()

  const profile = rawProfile as { 
    household_id: string | null; 
    full_name: string | null; 
    current_streak: number;
    last_chore_date: string | null;
  } | null

  if (!profile || !profile.household_id) {
    return (
      <div className="py-12 flex items-center justify-center">
        <HouseholdManager />
      </div>
    )
  }

  const householdId = profile.household_id
  const userName = profile.full_name?.split(' ')[0] || 'User'

  const [data, roomData] = await Promise.all([
    getChoreDisplayData(householdId),
    getRoomsAndMembers(householdId),
  ])

  // --- Active Members Logic (Body Doubling) ---
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { data: activeLogs } = await supabase
    .from('activity_logs')
    .select('user_id')
    .eq('household_id', householdId)
    .gt('created_at', oneHourAgo)

  const activeUserIds = Array.from(new Set(activeLogs?.map(l => l.user_id)))
  const activeMembers = roomData.members.filter(m => activeUserIds.includes(m.id))

  // --- Daily Goal Logic (Fixed) ---
  // Count how many items *this user* completed *today* using the activity log
  const startOfDay = new Date();
  startOfDay.setHours(0,0,0,0);
  
  const { count: completedTodayCount } = await supabase
    .from('activity_logs')
    .select('*', { count: 'exact', head: true })
    .eq('household_id', householdId)
    .eq('user_id', user.id)
    .eq('action_type', 'complete')
    .gt('created_at', startOfDay.toISOString())

  // Calculate total load: (Pending assigned to me) + (Completed today)
  const myPendingChores = [...data.overdue, ...data.dueSoon, ...data.upcoming].filter(c => 
    c.assigned_to?.includes(user.id) || (!c.assigned_to || c.assigned_to.length === 0)
  )
  
  const totalDailyLoad = (completedTodayCount || 0) + myPendingChores.length

  // --- Filter Logic ---
  let allChoresRaw = [...data.overdue, ...data.dueSoon, ...data.upcoming, ...data.completed]

  if (assigneeFilter === 'me') {
      allChoresRaw = allChoresRaw.filter(c => c.assigned_to?.includes(user.id))
  }
  if (roomIdFilter) {
      allChoresRaw = allChoresRaw.filter(c => c.room_id === roomIdFilter)
  }

  // Categorize filtered list
  const overdueChores = allChoresRaw.filter(c => data.overdue.includes(c))
  const dueSoonChores = allChoresRaw.filter(c => data.dueSoon.includes(c))
  const upcomingChores = allChoresRaw.filter(c => data.upcoming.includes(c))
  const completedChores = allChoresRaw.filter(c => data.completed.includes(c))

  // --- Zen Mode Data ---
  const allHouseholdChores = [...data.overdue, ...data.dueSoon, ...data.upcoming, ...data.completed]
  const myZenChores = allHouseholdChores.filter(c => 
    c.assigned_to?.includes(user.id) && 
    c.status !== 'complete'
  )

  // --- Dynamic Greeting ---
  let greetingSubtitle = "Let's get things done."
  if (totalDailyLoad > 0) {
    const ratio = (completedTodayCount || 0) / totalDailyLoad
    if (ratio === 1) greetingSubtitle = "You're absolutely crushing it! 🎉"
    else if (ratio > 0.75) greetingSubtitle = "Almost there, finish strong!"
    else if (ratio > 0.5) greetingSubtitle = "Over halfway! Keep the momentum."
    else if (overdueChores.length > 0) greetingSubtitle = "Let's tackle those overdue items."
  } else if ((completedTodayCount || 0) > 0) {
    greetingSubtitle = "All clear for today. Relax! 😌"
  }

  // --- Modal Logic ---
  let editChore: ChoreWithDetails | null = null
  if (searchParams.modal === 'edit-chore' && searchParams.choreId) {
    const fullList = [...data.overdue, ...data.dueSoon, ...data.upcoming, ...data.completed]
    editChore = fullList.find(c => c.id === Number(searchParams.choreId)) || null
  }

  return (
    <div className="space-y-8 pb-24">
      <ZenMode 
        chores={myZenChores} 
        activeMembers={activeMembers}
        currentUserId={user.id}
      />
      
      <AppBadgeUpdater count={overdueChores.length} />

      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <Greeting name={userName} />
                <p className="text-lg text-text-secondary animate-in fade-in slide-in-from-bottom-1 duration-700 delay-100">
                    {greetingSubtitle}
                </p>
            </div>
            
            <div className="flex items-center gap-3 self-start md:self-auto">
                <StreakCampfire 
                  streak={profile.current_streak || 0} 
                  lastChoreDate={profile.last_chore_date || null}
                />
                <Link 
                  href="?view=zen"
                  scroll={false}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 to-blue-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-teal-200/50 transition-all hover:scale-105 hover:shadow-lg active:scale-95"
                >
                  <Flower2 className="h-4 w-4 transition-transform group-hover:rotate-45" fill="currentColor" />
                  Zen
                </Link>
            </div>
        </div>

        <DailyProgress total={totalDailyLoad} completed={completedTodayCount || 0} />
      </div>
      
      <div className="sticky top-[73px] z-10 -mx-4 bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:-mx-8 sm:px-8 border-b border-transparent transition-all data-[stuck=true]:border-border">
        <FilterBar rooms={roomData.rooms} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-start">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-1 gap-6">
            {/* Collapsible Sections */}
            <ChoreDisplay title="Overdue" chores={overdueChores} status="overdue" />
            <ChoreDisplay title="Due Soon" chores={dueSoonChores} status="due" />
            <ChoreDisplay title="Upcoming" chores={upcomingChores} status="upcoming" />
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
            <Leaderboard members={roomData.members} chores={allHouseholdChores} />
            <div className="pt-4 border-t border-border">
                <ChoreDisplay title="Completed" chores={completedChores} status="completed" />
            </div>
        </div>
      </div>

      <FloatingActionLink 
        href="?modal=add-chore"
        scroll={false} 
        className="fixed bottom-8 right-8 z-[100] flex h-16 w-16 items-center justify-center rounded-full bg-brand shadow-lg transition-transform hover:scale-105 active:scale-95 hover:bg-brand-dark"
        aria-label="Add new chore"
      >
        <Plus className="h-8 w-8 text-white" />
      </FloatingActionLink>

      {searchParams.modal === 'add-chore' && (
        <AddChoreModal
          isOpen={true}
          members={roomData.members}
          rooms={roomData.rooms}
          currentUserId={user.id}
        />
      )}

      {searchParams.modal === 'edit-chore' && editChore && (
        <EditChoreModal
          isOpen={true}
          chore={editChore}
          members={roomData.members}
          rooms={roomData.rooms}
        />
      )}
    </div>
  )
}