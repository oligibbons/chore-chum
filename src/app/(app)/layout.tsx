// src/app/(app)/layout.tsx

import { signOut } from '@/app/actions'
import Link from 'next/link'
import NavLink from '@/components/NavLink'
import Logo from '@/components/Logo'
import { Home, LayoutGrid, User, Calendar, Activity, Settings, LogOut } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PullToRefresh from '@/components/PullToRefresh'
import RealtimeChores from '@/components/RealtimeChores'
import InstallPwaPrompt from '@/components/InstallPwaPrompt'
import { TutorialProvider } from '@/context/TutorialContext'
import TutorialOverlay from '@/components/TutorialOverlay'
import { DbProfile } from '@/types/database'

const NAV_ITEMS = [
  { 
    href: '/dashboard', 
    label: 'Dashboard', 
    icon: LayoutGrid,
    tourId: 'nav-dashboard' 
  },
  { 
    href: '/calendar', 
    label: 'Calendar', 
    icon: Calendar,
    tourId: 'nav-calendar' 
  },
  { 
    href: '/feed', 
    label: 'Feed', 
    icon: Activity,
    tourId: 'nav-feed' 
  },
  { 
    href: '/rooms', 
    label: 'Rooms', 
    icon: Home,
    tourId: 'nav-rooms' 
  },
  { 
    href: '/profile', 
    label: 'Profile', 
    icon: User,
    mobileIcon: Settings,
    tourId: 'nav-profile' 
  },
]

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('household_id, tutorial_completed')
    .eq('id', user.id)
    .single()

  const profile = rawProfile as DbProfile

  return (
    <TutorialProvider hasCompletedTutorial={!!profile?.tutorial_completed}>
      <TutorialOverlay />
      
      <div className="flex min-h-screen flex-col bg-background pb-[env(safe-area-inset-bottom)]">
        {profile?.household_id && <RealtimeChores householdId={profile.household_id} />}
        
        <header className="sticky top-0 z-20 w-full border-b border-border bg-card/90 backdrop-blur-md supports-[backdrop-filter]:bg-card/60">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 h-[72px]">
            
            <Link href="/dashboard" className="flex-shrink-0 transition-opacity hover:opacity-80 pr-2">
               <Logo iconClassName="h-8 w-8" className="scale-90 origin-left sm:scale-100" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 rounded-full bg-background p-1.5 shadow-sm border border-border/50">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.href} href={item.href}>
                  {/* We wrap the content in a div to attach the tour ID */}
                  <div data-tour={item.tourId} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                </NavLink>
              ))}
            </nav>
            
            <div className="flex md:hidden items-center gap-3">
               <Link href="/profile" className="p-2 rounded-full hover:bg-gray-100 text-text-secondary">
                  <Settings className="h-6 w-6" />
               </Link>
            </div>
            
            <div className="hidden md:block">
              <form action={signOut}>
                  <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl px-4 py-2 font-heading text-sm font-semibold text-text-secondary transition-colors hover:bg-gray-100 hover:text-text-primary"
                  >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                  </button>
              </form>
            </div>
          </div>

          {/* Mobile Bottom Nav */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border pb-[env(safe-area-inset-bottom)] z-50 flex justify-around items-center h-[60px] px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              {NAV_ITEMS.map((item) => {
                const Icon = item.mobileIcon || item.icon
                return (
                  <NavLink key={item.href} href={item.href}>
                    <div data-tour={item.tourId} className="flex flex-col items-center justify-center w-full h-full py-1 px-2">
                      <Icon className="h-5 w-5" />
                      <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
                    </div>
                  </NavLink>
                )
              })}
          </nav>
        </header>

        <PullToRefresh>
          <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-8 pb-24 md:pb-8">
            {children}
          </main>
        </PullToRefresh>

        <InstallPwaPrompt /> 
      </div>
    </TutorialProvider>
  )
}