// app/(app)/dashboard/page.tsx

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HouseholdManager from '@/components/HouseholdManager'
import ChoreDisplay from '@/components/ChoreDisplay' // <-- Import new component
import { getHouseholdData } from '@/app/chore-actions' // <-- Import new action

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('household_id')
    .eq('id', user.id)
    .single()

  // --- THIS IS THE FIX ---
  // 1. Handle the case where the profile might not exist yet
  if (!profile) {
    // This can happen if the 'handle_new_user' trigger is slow
    // or if there's a database error.
    console.error('Error fetching profile:', error)
    return (
      <div className="text-center">
        <p>Loading your profile...</p>
        <p>If this takes a while, please try refreshing.</p>
      </div>
    )
  }

  // 2. Handle any other unexpected errors
  if (error) {
    console.error('Error fetching profile:', error)
    return (
      <div className="text-center">
        <p>
          There was an error loading your profile data. Please try refreshing.
        </p>
      </div>
    )
  }
  // --- END OF FIX ---

  // === The Core Logic ===
  // At this point, TypeScript knows 'profile' is not null
  if (!profile.household_id) {
    // 1. User has NO household.
    return <HouseholdManager />
  } else {
    // 2. User IS in a household.
    // Fetch all the household data on the server
    const householdData = await getHouseholdData(profile.household_id)

    if (!householdData) {
      return (
        <div className="text-center">
          <p>Could not load your household data. Please try again.</p>
        </div>
      )
    }

    // Pass all the data to the client component for display
    return <ChoreDisplay data={householdData} />
  }
}