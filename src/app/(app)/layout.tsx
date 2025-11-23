// src/app/(app)/layout.tsx

import { signOut } from '@/app/actions'
import Link from 'next/link'
import NavLink from '@/components/NavLink'
import Logo from '@/components/Logo'
import { Home, LayoutGrid, User, Calendar, Activity, Settings } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PullToRefresh from '@/components/PullToRefresh'
import RealtimeChores from '@/components/RealtimeChores'
import InstallPwaPrompt from '@/components/InstallPwaPrompt'

// Navigation Configuration
const NAV_ITEMS = [
  { 
    href: '/dashboard', 
    label: 'Dashboard', 
    icon: LayoutGrid 
  },
  { 
    href: '/calendar', 
    label: 'Calendar', 
    icon: Calendar 
  },
  { 
    href: '/feed', 
    label: 'Feed', 
    icon: Activity 
  },
  { 
    href: '/rooms', 
    label: 'Rooms', 
    icon: Home 
  },
  { 
    href: '/profile', 
    label: 'Profile', 
    icon: User,
    mobileIcon: Settings // Mobile often uses a gear for profile/settings
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('household_id')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen flex-col bg-background pb-[env(safe-area-inset-bottom)]">
      {/* Global Realtime Listener */}
      {profile?.household_id && <RealtimeChores householdId={profile.household_id} />}
      
      <header className="sticky top-0 z-20 w-full border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
          
          {/* Logo - Optimized for Mobile Space */}
          <Link href="/dashboard" className="transition-opacity hover:opacity-80">
            {/* Mobile: Icon Only */}
            <div className="md:hidden">
               <Logo iconClassName="h-8 w-8" showText={false} />
            </div>
            {/* Desktop: Full Logo */}
            <div className="hidden md:block">
               <Logo iconClassName="h-8 w-8" />
            </div>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-1 rounded-full bg-background p-1.5 shadow-sm border border-border/50">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} href={item.href}>
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          
          {/* Navigation - Mobile (Icon only) */}
          <nav className="flex md:hidden items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.mobileIcon || item.icon
              return (
                <NavLink key={item.href} href={item.href}>
                  <Icon className="h-5 w-5" />
                </NavLink>
              )
            })}
          </nav>
          
          <form action={signOut}>
            <button
              type="submit"
              className="hidden sm:block rounded-xl px-4 py-2 font-heading text-sm font-semibold text-text-secondary transition-colors hover:bg-gray-100 hover:text-text-primary"
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>

      <PullToRefresh>
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-8">
          {children}
        </main>
      </PullToRefresh>

      <InstallPwaPrompt /> 
    </div>
  )
}