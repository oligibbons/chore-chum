// app/(app)/layout.tsx

import { createSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions'
import Link from 'next/link' 

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseClient()

  // FIX: Use .getUser() here, not .getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If no user, redirect to the homepage
  if (!user) { // <-- Check for 'user'
    redirect('/')
  }

  // If we have a user, show the protected app layout
  return (
    <div className="flex min-h-screen flex-col">
      
      {/* App Header: Sticky, Clean Top Bar */}
      <header className="sticky top-0 z-20 w-full border-b border-support-light bg-brand-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between px-6 py-4 sm:flex-row">
          
          <div className="flex w-full items-center justify-between sm:w-auto">
            <Link href="/dashboard" legacyBehavior={false}>
              <h1 className="text-2xl font-heading font-bold text-brand-primary transition-colors hover:text-brand-primary/80">
                ChoreChum
              </h1>
            </Link>
          </div>

          {/* Main Navigation */}
          <nav className="mt-4 flex w-full flex-1 items-center justify-center gap-2 sm:mt-0 sm:w-auto sm:justify-end sm:gap-4">
            
            {/* Nav Links */}
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-2 font-heading text-base font-medium text-support-dark transition-colors hover:bg-support-light/50"
            >
              Dashboard
            </Link>
            <Link
              href="/rooms"
              className="rounded-lg px-3 py-2 font-heading text-base font-medium text-support-dark transition-colors hover:bg-support-light/50"
            >
              Rooms
            </Link>
            
            {/* Sign Out Button (Reversed colors for clean look) */}
            <form action={signOut} className="ml-4">
              <button
                type="submit"
                className="rounded-lg bg-support-dark px-4 py-2 font-heading text-sm font-semibold text-brand-white transition-colors hover:bg-support-dark/90"
              >
                Sign Out
              </button>
            </form>
          </nav>
        </div>
      </header>

      {/* Main content area: Changed from bg-gray-50 to bg-brand-white for guaranteed inclusion */}
      <main className="flex-1 bg-brand-white p-4 sm:p-8">
        {children}
      </main>
    </div>
  )
}