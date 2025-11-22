// src/app/(app)/profile/page.tsx

import { createSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/ProfileForm'
import { DbProfile, DbHousehold } from '@/types/database'
import { LogOut } from 'lucide-react'
import { signOut } from '@/app/actions'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: profileData, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profileData) {
    console.error('Error fetching profile:', error)
    redirect('/dashboard') 
  }

  const profile = profileData as DbProfile

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
    <div className="space-y-8 pb-10">
      <header className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-heading font-bold text-text-primary">
            Your Profile
            </h1>
            <p className="mt-2 text-lg text-text-secondary">
            Manage your account settings and household membership.
            </p>
        </div>
      </header>

      <ProfileForm profile={profile} household={household} email={user.email} />
      
      {/* Sign Out Section */}
      <div className="border-t border-border pt-8 mt-8 flex justify-center">
        <form action={signOut}>
            <button 
                type="submit"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 text-text-secondary font-bold hover:bg-gray-200 hover:text-text-primary transition-colors"
            >
                <LogOut className="h-5 w-5" />
                Sign Out
            </button>
        </form>
      </div>
    </div>
  )
}