// app/(app)/dashboard/page.tsx

import { createSupabaseClient } from '@/lib/supabase/server' // <-- THE FIX
import { redirect } from 'next/navigation'
import HouseholdManager from '@/components/HouseholdManager'
import ChoreDisplay from '@/components/ChoreDisplay'
import { getHouseholdData } from '@/app/chore-actions'

// Tell Next.js to server-render this page
export const dynamic = 'force-dynamic'
// Tell Cloudflare to use the Edge Runtime
export const runtime = 'edge'

export default async function DashboardPage() {
  const supabase = createSupabaseClient() // <-- THE FIX

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  // 1. Define the type we EXPECT from our query
  type ProfileType = {
    household_id: string | null
  } | null

  // 2. Make the query
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('household_id')
    .eq('id', user.id)
    .single()

  // 3. Apply our manual type
  const typedProfile = profile as ProfileType

  // 4. Check for errors
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

  // 5. Check if the profile was found
  if (!typedProfile) {
    console.error('Profile not found (user trigger might be pending).')
    return (
      <div className="text-center">
        <p>Loading your profile...</p>
        <p>If this takes a while, please try refreshing.</p>
      </div>
    )
  }

  // === The Core Logic ===
  if (!typedProfile.household_id) {
    // 1. User has NO household.
    return <HouseholdManager />
  } else {
    // 2. User IS in a household.
    const householdId = typedProfile.household_id
    const householdData = await getHouseholdData(householdId)

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