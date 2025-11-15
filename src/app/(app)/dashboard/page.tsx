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
  searchParams: { modal: string; choreId?: string }
}) {
  const supabase = await createSupabaseClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('household_id, full_name') // Get full_name for the welcome message
    .eq('id', user.id)
    .single()

  // This logic is still correct from the auth fix
  if (!profile || !profile.household_id) {
    return (
      <div className="py-12 flex items-center justify-center">
        <HouseholdManager />
      </div>
    )
  }

  const householdId = profile.household_id
  const userName = profile.full_name?.split(' ')[0] || 'User' // Get user's first name

  const [data, roomData] = await Promise.all([
    getChoreDisplayData(householdId),
    getRoomsAndMembers(householdId),
  ])

  let editChore: ChoreWithDetails | null = null
  if (searchParams.modal === 'edit-chore' && searchParams.choreId) {
    const allChores = [...data.overdue, ...data.dueSoon, ...data.upcoming]
    editChore = allChores.find(c => c.id === Number(searchParams.choreId)) || null
  }

  // --- NEW "PLAYFUL" UI ---
  return (
    <div className="space-y-8">
      
      {/* 1. NEW Dashboard Header: Playful & Welcoming */}
      <header className="mb-6">
        <h2 className="text-4xl font-heading font-bold text-text-primary">
          Welcome back, {userName}! 👋
        </h2>
        <p className="mt-1 text-lg text-text-secondary">
          Here’s what’s on the list for today.
        </p>
      </header>

      {/* 2. Main Content Area: Spacious 3-column grid */}
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

      {/* 3. NEW Floating Action Button (FAB) for "Add Chore" */}
      <Link 
        href="?modal=add-chore"
        scroll={false} 
        className="fixed bottom-8 right-8 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-brand shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="Add new chore"
      >
        <Plus className="h-8 w-8 text-white" />
      </Link>
      {/* --- END NEW UI --- */}


      {/* Modals: No change, but they will inherit the new styles */}
      {searchParams.modal === 'add-chore' && (
        <AddChoreModal
          isOpen={true}
          onClose={() => redirect('/dashboard')}
          householdId={householdId}
          members={roomData.members}
          rooms={roomData.rooms}
        />
      )}

      {searchParams.modal === 'edit-chore' && editChore && (
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