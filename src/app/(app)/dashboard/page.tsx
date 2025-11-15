// app/(app)/dashboard/page.tsx

import { redirect } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/server'
import { getChoreDisplayData } from '@/app/chore-actions'
import ChoreDisplay from '@/components/ChoreDisplay'
import HouseholdManager from '@/components/HouseholdManager'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import AddChoreModal from '@/components/AddChoreModal'
import { getRoomsAndMembers } from '@/app/room-actions'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { modal: string }
}) {
  const supabase = await createSupabaseClient()
  
  // 1. Get session and profile (PRESERVED)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If no session, redirect. This also fixes the TypeScript error.
  if (!session) {
    redirect('/')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('household_id')
    .eq('id', session.user.id) // <-- FIX: No longer optional '?'
    .single()

  // If no session, redirect will be handled by layout. If no profile, we can't do anything
  if (!profile) {
    redirect('/')
  }

  // 2. Check if user is in a household (PRESERVED)
  const householdId = profile.household_id
  if (!householdId) {
    return (
      <div className="py-12 flex items-center justify-center">
        <HouseholdManager />
      </div>
    )
  }

  // 3. Fetch all data for the dashboard (PRESERVED)
  const [data, roomData] = await Promise.all([
    getChoreDisplayData(householdId),
    getRoomsAndMembers(householdId),
  ])

  // --- UI Overhaul: Modern Grid Layout ---
  return (
    <div className="space-y-10">
      
      {/* Dashboard Header: Clean, Prominent Title and Purple CTA */}
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

      {/* Main Content Area: Chore Status Groups in a modern 3-column grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Overdue Chores */}
        <div className="lg:col-span-1">
          <ChoreDisplay 
            title="Overdue" 
            chores={data.overdue} 
            status="overdue" 
            showActions={true}
          />
        </div>

        {/* Due Soon Chores */}
        <div className="lg:col-span-1">
          <ChoreDisplay 
            title="Due Soon" 
            chores={data.dueSoon} 
            status="due-soon" 
            showActions={true}
          />
        </div>

        {/* Assigned/Unassigned Chores (The 'Backlog') */}
        <div className="lg:col-span-1">
          <ChoreDisplay 
            title="Upcoming" 
            chores={data.upcoming} 
            status="upcoming" 
            showActions={true}
          />
        </div>
      </div>

      {/* Chore Modal Integration (PRESERVED) */}
      {searchParams.modal === 'add-chore' && (
        <AddChoreModal
          isOpen={true}
          onClose={() => redirect('/dashboard')}
          householdId={householdId}
          members={roomData.members}
          rooms={roomData.rooms}
        />
      )}
    </div>
  )
}