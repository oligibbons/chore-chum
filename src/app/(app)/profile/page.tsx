import { createSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/ProfileForm'
import { DbProfile, DbHousehold } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // 1. Fetch profile safely
  const { data: profileData, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 2. Handle the case where profileData might be null
  if (error || !profileData) {
    console.error('Error fetching profile:', error)
    // If the profile is missing (rare), redirect to dashboard to avoid crashing
    redirect('/dashboard') 
  }

  // Now TypeScript knows profileData is definitely a DbProfile
  const profile = profileData as DbProfile

  // 3. Fetch household if user has one
  let household: Pick<DbHousehold, 'name' | 'invite_code'> | null = null
  
  if (profile.household_id) {
    const { data: householdData } = await supabase
      .from('households')
      .select('name, invite_code')
      .eq('id', profile.household_id)
      .single()
      
    if (householdData) {
      household = householdData
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-heading font-bold text-text-primary">
          Your Profile
        </h1>
        <p className="mt-2 text-lg text-text-secondary">
          Manage your account settings and household membership.
        </p>
      </header>

      <ProfileForm profile={profile} household={household} />
    </div>
  )
}