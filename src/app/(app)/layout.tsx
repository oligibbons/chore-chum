// src/app/(app)/layout.tsx

import { signOut } from '@/app/actions'
import Link from 'next/link'
import NavLink from '@/components/NavLink' // We'll create this next
import { Home, LayoutGrid } from 'lucide-react' // Import icons for nav

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <div className="flex min-h-screen flex-col bg-background">
      
      {/* --- THE NEW MODERN HEADER --- */}
      <header className="sticky top-0 z-20 w-full border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
          
          {/* Logo */}
          <Link href="/dashboard" legacyBehavior={false}>
            <h1 className="text-xl font-heading font-bold text-brand">
              ChoreChum
            </h1>
          </Link>

          {/* --- NEW "PILL" NAVIGATION --- */}
          <nav className="flex items-center gap-2 rounded-full bg-background p-1.5">
            <NavLink href="/dashboard">
              <LayoutGrid className="h-4 w-4" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink href="/rooms">
              <Home className="h-4 w-4" />
              <span>Rooms</span>
            </NavLink>
          </nav>
          
          {/* Sign Out Button */}
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg px-4 py-2 font-heading text-sm font-semibold text-text-secondary transition-colors hover:bg-gray-100 hover:text-text-primary"
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>
      {/* --- END NEW HEADER --- */}


      {/* Main content area: Constrained width, generous padding */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-8">
        {children}
      </main>
    </div>
  )
}