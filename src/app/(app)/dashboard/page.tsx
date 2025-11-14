// app/(app)/dashboard/page.tsx
//
// ** REPLACE the existing file with this **
//

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect }from 'next/navigation'
import HouseholdManager from '@/components/HouseholdManager'
import ChoreDisplay from '@/components/ChoreDisplay' // <-- Import new component
import { getHouseholdData } from '@/app/chore-actions' // <-- Import new action

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('household_id')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    console.error('Error fetching profile:', error)
    return (
      <div className="text-center">
        <p>There was an error loading your profile. Please try refreshing.</p>
      </div>
    )
  }

  // === The Core Logic ===
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