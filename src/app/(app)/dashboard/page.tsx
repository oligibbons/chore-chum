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
  
  // 1. Get user (This is safe, middleware protects this)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // This should never be hit if middleware is correct, but as a fallback.
    redirect('/')
  }

  // 2. Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('household_id')
    .eq('id', user.id)
    .single()

  // --- THIS IS THE CRITICAL FIX ---
  // If the user has no profile OR their profile has no household_id,
  // they need to create or join one. Show the HouseholdManager.
  // This STOPS the redirect loop.
  if (!profile || !profile.household_id) {
    return (
      <div className="py-12 flex items-center justify-center">
        <HouseholdManager />
      </div>
    )
  }
  // --- END FIX ---

  // 3. User has a profile and a household. Load the dashboard.
  const householdId = profile.household_id

  const [data, roomData] = await Promise.all([
    getChoreDisplayData(householdId),
    getRoomsAndMembers(householdId),
  ])

  // 4. Logic for Edit Modal
  let editChore: ChoreWithDetails | null = null
  if (searchParams.modal === 'edit-chore' && searchParams.choreId) {
    const allChores = [...data.overdue, ...data.dueSoon, ...data.upcoming]
    editChore = allChores.find(c => c.id === Number(searchParams.choreId)) || null
  }

  // --- Render the full dashboard ---
  return (
    <div className="space-y-10">
      
      <header className="mb-6 flex items-center justify-between">
        <h2 className="font-heading text-4xl font-bold text-support-dark">
          Your Dashboard
        </h2>
        
        <Link 
          href="?modal=add-chore"
          scroll={false} 
          className="flex items-center rounded-xl bg-brand-primary px-5 py-3 font-heading text-base font-semibold text-brand-white shadow-lg transition-colors hover:bg-brand-primary/90"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Chore
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <ChoreDisplay 
            title="Overdue" 
            chores={data.overdue} 
            status="overdue" 
            showActions={true}
          />
        </div>
        <div className="lg:col-span-1">
          <ChoreDisplay 
            title="Due Soon" 
            chores={data.dueSoon} 
            status="due-soon" 
            showActions={true}
          />
        </div>
        <div className="lg:col-span-1">
          <ChoreDisplay 
            title="Upcoming" 
            chores={data.upcoming} 
            status="upcoming" 
            showActions={true}
          />
        </div>
      </div>

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