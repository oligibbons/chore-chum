// src/app/(app)/layout.tsx

import { signOut } from '@/app/actions'
import Link from 'next/link'
import NavLink from '@/components/NavLink'
import Logo from '@/components/Logo'
import { Home, LayoutGrid, User } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      
      <header className="sticky top-0 z-20 w-full border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
          
          {/* Logo */}
          <Link href="/dashboard" className="transition-opacity hover:opacity-80">
            <Logo iconClassName="h-8 w-8" />
          </Link>

          {/* Navigation */}
          <nav className="hidden sm:flex items-center gap-2 rounded-full bg-background p-1.5 shadow-sm border border-border/50">
            <NavLink href="/dashboard">
              <LayoutGrid className="h-4 w-4" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink href="/rooms">
              <Home className="h-4 w-4" />
              <span>Rooms</span>
            </NavLink>
            <NavLink href="/profile">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </NavLink>
          </nav>
          
          {/* Mobile Nav (Simple Icon View) */}
          <nav className="flex sm:hidden items-center gap-1">
            <NavLink href="/dashboard">
              <LayoutGrid className="h-5 w-5" />
            </NavLink>
            <NavLink href="/rooms">
              <Home className="h-5 w-5" />
            </NavLink>
            <NavLink href="/profile">
              <User className="h-5 w-5" />
            </NavLink>
          </nav>
          
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-xl px-4 py-2 font-heading text-sm font-semibold text-text-secondary transition-colors hover:bg-gray-100 hover:text-text-primary"
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-8">
        {children}
      </main>
    </div>
  )
}