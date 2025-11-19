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

  // Fetch profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as DbProfile

  // Fetch household if user has one
  let household: Pick<DbHousehold, 'name' | 'invite_code'> | null = null
  
  if (profile?.household_id) {
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