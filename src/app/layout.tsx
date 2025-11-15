// app/(app)/layout.tsx

import { createSupabaseClient } from '@/lib/supabase/server' // <-- UPDATED
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions'
import Link from 'next/link' // Import Link

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createSupabaseClient() // <-- UPDATED

  // Check for an active session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If no session, redirect to the homepage
  if (!session) {
    redirect('/')
  }

  // If we have a session, show the protected app layout
  return (
    <div className="flex min-h-screen flex-col">
      {/* App Header */}
      <header className="flex flex-col items-center border-b border-support-light bg-brand-white px-6 py-4 sm:flex-row">
        <div className="flex w-full items-center justify-between sm:w-auto">
          <Link href="/dashboard" legacyBehavior={false}>
            <h1 className="text-2xl font-heading font-bold text-brand-primary">
              ChoreChum
            </h1>
          </Link>
          {/* Sign Out Button (visible on mobile, hidden on sm+) */}
          <form action={signOut} className="sm:hidden">
            <button
              type="submit"
              className="rounded-lg bg-support-dark px-3 py-1.5 font-heading text-sm font-semibold text-brand-white transition-colors hover:bg-brand-primary"
            >
              Sign Out
            </button>
          </form>
        </div>

        {/* Main Navigation */}
        <nav className="mt-4 flex w-full flex-1 items-center justify-center gap-4 sm:mt-0 sm:justify-end">
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
          
          {/* Sign Out Button (hidden on mobile, visible on sm+) */}
          <form action={signOut} className="hidden sm:block">
            <button
              type="submit"
              className="rounded-lg bg-support-dark px-4 py-2 font-heading text-sm font-semibold text-brand-white transition-colors hover:bg-brand-primary"
            >
              Sign Out
            </button>
          </form>
        </nav>
      </header>

      {/* Main content area */}
      <main className="flex-1 bg-gray-50 p-4 sm:p-8">{children}</main>
    </div>
  )
}