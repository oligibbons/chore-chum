// src/app/(app)/dashboard/page.tsx

import { redirect } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/server'
import { getChoreDisplayData } from '@/app/chore-actions'
import ChoreDisplay from '@/components/ChoreDisplay'
import HouseholdManager from '@/components/HouseholdManager'
import { Plus, Flower2 } from 'lucide-react'
import Link from 'next/link'
import FloatingActionLink from '@/components/FloatingActionLink'
import AddChoreModal from '@/components/AddChoreModal'
import { getRoomsAndMembers } from '@/app/room-actions'
import EditChoreModal from '@/components/EditChoreModal'
import { ChoreWithDetails } from '@/types/database'
import FilterBar from '@/components/FilterBar' // UPDATED IMPORT
import ZenMode from '@/components/ZenMode'
import Leaderboard from '@/components/Leaderboard'
import StreakCampfire from '@/components/StreakCampfire'
import DailyProgress from '@/components/DailyProgress'

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
    .select('household_id, full_name, current_streak')
    .eq('id', user.id)
    .single()

  // Type assertion to handle new streak column safely
  const profile = rawProfile as { household_id: string | null; full_name: string | null; current_streak: number } | null

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

  // --- 1. Master Filter Logic ---
  let allChoresRaw = [...data.overdue, ...data.dueSoon, ...data.upcoming, ...data.completed]

  // Filter by Assignee (Me vs All)
  if (assigneeFilter === 'me') {
      allChoresRaw = allChoresRaw.filter(c => c.assigned_to === user.id)
  }

  // Filter by Room
  if (roomIdFilter) {
      allChoresRaw = allChoresRaw.filter(c => c.room_id === roomIdFilter)
  }

  // Re-categorize based on filtered list
  const overdueChores = allChoresRaw.filter(c => data.overdue.includes(c))
  const dueSoonChores = allChoresRaw.filter(c => data.dueSoon.includes(c))
  const upcomingChores = allChoresRaw.filter(c => data.upcoming.includes(c))
  const completedChores = allChoresRaw.filter(c => data.completed.includes(c))

  // --- 2. Stats Calculation (Based on ALL household data, not just filtered view, for fairness) ---
  const allHouseholdChores = [...data.overdue, ...data.dueSoon, ...data.upcoming, ...data.completed]
  
  // Only count stats for the current user for personal progress
  const myDailyChores = allHouseholdChores.filter(c => {
      // Is it assigned to me OR unassigned?
      const isMine = c.assigned_to === user.id || c.assigned_to === null
      if (!isMine) return false

      // Is it relevant to "Today"? (Overdue + Due Today + Completed Today)
      if (c.status === 'complete') {
          const d = new Date(c.created_at)
          const today = new Date()
          return d.getDate() === today.getDate() && d.getMonth() === today.getMonth()
      }
      
      if (c.due_date) {
          const d = new Date(c.due_date)
          const today = new Date()
          const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth()
          const isOverdue = d < today
          return isToday || isOverdue
      }
      
      return false
  })

  const completedTodayCount = myDailyChores.filter(c => c.status === 'complete').length
  const totalDailyLoad = myDailyChores.length

  // --- 3. Modal Logic ---
  let editChore: ChoreWithDetails | null = null
  if (searchParams.modal === 'edit-chore' && searchParams.choreId) {
    // We search in the full unfiltered list so you can edit a chore even if filters hide it
    const fullList = [...data.overdue, ...data.dueSoon, ...data.upcoming, ...data.completed]
    editChore = fullList.find(c => c.id === Number(searchParams.choreId)) || null
  }

  return (
    <div className="space-y-8 pb-24">
      <ZenMode chores={allChoresRaw} />

      {/* Header Section */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h2 className="text-4xl font-heading font-bold text-foreground">
                    Hi, {userName}!
                </h2>
                <p className="text-lg text-text-secondary">
                    Let's get things done.
                </p>
            </div>
            
            {/* Zen & Streak Area */}
            <div className="flex items-center gap-3 self-start md:self-auto">
                <StreakCampfire streak={profile.current_streak || 0} />
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

        {/* Progress Ring */}
        <DailyProgress total={totalDailyLoad} completed={completedTodayCount} />
      </div>
      
      {/* New Filter Bar (Replaces RoomFilter) */}
      <div className="sticky top-[73px] z-10 -mx-4 bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:-mx-8 sm:px-8 border-b border-transparent transition-all data-[stuck=true]:border-border">
        <FilterBar rooms={roomData.rooms} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-start">
        
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <ChoreDisplay 
                    title="Overdue" 
                    chores={overdueChores} 
                    status="overdue" 
                />
            </div>

            <div className="md:col-span-1">
                <ChoreDisplay 
                    title="Due Soon" 
                    chores={dueSoonChores} 
                    status="due" 
                />
            </div>

            <div className="md:col-span-1">
                <ChoreDisplay 
                    title="Upcoming" 
                    chores={upcomingChores} 
                    status="upcoming" 
                />
            </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
            <Leaderboard members={roomData.members} chores={allHouseholdChores} />
            
            <div className="pt-4 border-t border-border">
                <ChoreDisplay 
                    title="Completed" 
                    chores={completedChores} 
                    status="completed" 
                />
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