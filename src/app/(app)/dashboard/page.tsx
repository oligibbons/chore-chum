// src/app/(app)/dashboard/page.tsx

import { redirect } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/server'
import { getChoreDisplayData } from '@/app/chore-actions'
import ChoreDisplay from '@/components/ChoreDisplay'
import HouseholdManager from '@/components/HouseholdManager'
import { Plus, Zap } from 'lucide-react'
import Link from 'next/link'
import AddChoreModal from '@/components/AddChoreModal'
import { getRoomsAndMembers } from '@/app/room-actions'
import EditChoreModal from '@/components/EditChoreModal'
import { ChoreWithDetails } from '@/types/database'
import RealtimeChores from '@/components/RealtimeChores'
import RoomFilter from '@/components/RoomFilter'
import ZenMode from '@/components/ZenMode'
import Leaderboard from '@/components/Leaderboard'

export const dynamic = 'force-dynamic'

type DashboardProps = {
  searchParams: Promise<{ modal?: string; choreId?: string; roomId?: string }>
}

export default async function DashboardPage(props: DashboardProps) {
  const searchParams = await props.searchParams
  const roomIdFilter = searchParams.roomId ? Number(searchParams.roomId) : null
  
  const supabase = await createSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/') 
  }

  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('household_id, full_name')
    .eq('id', user.id)
    .single()

  const profile = rawProfile as { household_id: string | null; full_name: string | null } | null

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

  // Collect all chores for Zen Mode & Leaderboard
  const allChoresRaw = [...data.overdue, ...data.dueSoon, ...data.upcoming, ...data.completed]

  // Filter chores by room if a filter is active for the main dashboard view
  const filterByRoom = (chores: ChoreWithDetails[]) => {
    if (!roomIdFilter) return chores
    return chores.filter(c => c.room_id === roomIdFilter)
  }

  const overdueChores = filterByRoom(data.overdue)
  const dueSoonChores = filterByRoom(data.dueSoon)
  const upcomingChores = filterByRoom(data.upcoming)
  const completedChores = filterByRoom(data.completed)

  let editChore: ChoreWithDetails | null = null
  if (searchParams.modal === 'edit-chore' && searchParams.choreId) {
    editChore = allChoresRaw.find(c => c.id === Number(searchParams.choreId)) || null
  }

  return (
    <div className="space-y-8 pb-24">
      <RealtimeChores householdId={householdId} />
      
      {/* Zen Mode Component - Hidden unless ?view=zen is active */}
      <ZenMode chores={allChoresRaw} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <header>
          <h2 className="text-4xl font-heading font-bold text-foreground">
            Welcome back, {userName}! 👋
          </h2>
          <p className="mt-1 text-lg text-text-secondary">
            Here’s what’s on the list for today.
          </p>
        </header>
        
        {/* Zen Mode Trigger Button */}
        <Link 
          href="?view=zen"
          scroll={false}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-bold text-background shadow-md transition-transform hover:scale-105 active:scale-95"
        >
          <Zap className="h-4 w-4 text-yellow-400" fill="currentColor" />
          Zen Mode
        </Link>
      </div>
      
      {/* Room Filter Section */}
      <div className="sticky top-[73px] z-10 -mx-4 bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:-mx-8 sm:px-8">
        <RoomFilter rooms={roomData.rooms} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-start">
        
        {/* Main Columns: Overdue, Due Soon, Upcoming */}
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

        {/* Sidebar Column: Leaderboard & Completed */}
        <div className="lg:col-span-1 flex flex-col gap-6">
            <Leaderboard members={roomData.members} chores={allChoresRaw} />
            
            <div className="pt-4 border-t border-border">
                <ChoreDisplay 
                    title="Completed" 
                    chores={completedChores} 
                    status="completed" 
                />
            </div>
        </div>
      </div>

      <Link 
        href="?modal=add-chore"
        scroll={false} 
        className="fixed bottom-8 right-8 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-brand shadow-lg transition-transform hover:scale-105 active:scale-95 hover:bg-brand-dark"
        aria-label="Add new chore"
      >
        <Plus className="h-8 w-8 text-white" />
      </Link>

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