// src/app/(app)/dashboard/page.tsx

import { redirect } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/server'
import { getChoreDisplayData } from '@/app/chore-actions'
import ChoreDisplay from '@/components/ChoreDisplay'
import HouseholdManager from '@/components/HouseholdManager'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import AddChoreModal from '@/components/AddChoreModal'
import { getRoomsAndMembers } from '@/app/room-actions'
import EditChoreModal from '@/components/EditChoreModal'
import { ChoreWithDetails } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ modal?: string; choreId?: string }>
}) {
  // 1. Await the params before using them (Next.js 15 requirement)
  const params = await searchParams
  
  const supabase = await createSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/') 
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('household_id, full_name')
    .eq('id', user.id)
    .single()

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

  let editChore: ChoreWithDetails | null = null
  
  // 2. Use the awaited 'params' object here
  if (params.modal === 'edit-chore' && params.choreId) {
    const allChores = [...data.overdue, ...data.dueSoon, ...data.upcoming]
    editChore = allChores.find(c => c.id === Number(params.choreId)) || null
  }

  return (
    <div className="space-y-8">
      
      <header className="mb-6">
        <h2 className="text-4xl font-heading font-bold">
          Welcome back, {userName}! 👋
        </h2>
        <p className="mt-1 text-lg text-text-secondary">
          Here’s what’s on the list for today.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        <div className="lg:col-span-1">
          <ChoreDisplay 
            title="Overdue" 
            chores={data.overdue} 
            status="overdue" 
          />
        </div>

        <div className="lg:col-span-1">
          <ChoreDisplay 
            title="Due Soon" 
            chores={data.dueSoon} 
            status="due" 
          />
        </div>

        <div className="lg:col-span-1">
          <ChoreDisplay 
            title="Upcoming" 
            chores={data.upcoming} 
            status="upcoming" 
          />
        </div>
      </div>

      <Link 
        href="?modal=add-chore"
        scroll={false} 
        className="fixed bottom-8 right-8 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-brand shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="Add new chore"
      >
        <Plus className="h-8 w-8 text-white" />
      </Link>

      {/* 3. Use 'params' here as well */}
      {params.modal === 'add-chore' && (
        <AddChoreModal
          isOpen={true}
          onClose={() => redirect('/dashboard')}
          householdId={householdId}
          members={roomData.members}
          rooms={roomData.rooms}
        />
      )}

      {params.modal === 'edit-chore' && editChore && (
        <EditChoreModal
          isOpen={true}
          onClose={() => redirect('/dashboard')}
          chore={editChore}
          members={roomData.members}
          rooms={roomData.rooms}
        />
      )}
    </div>
  )
}