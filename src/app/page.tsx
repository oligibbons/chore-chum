// app/page.tsx

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AuthForm from '@/components/AuthForm'
import { ArrowRight } from 'lucide-react'

// --- THIS IS THE FIX ---
// This tells Cloudflare to run this page on the Edge Runtime
export const runtime = 'edge'
// --- END OF FIX ---

export default async function HomePage() {
  const supabase = createSupabaseServerClient()

  // Check for an active session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If the user is already logged in, send them to the main app dashboard
  if (session) {
    return redirect('/dashboard')
  }

  // If no session, show the landing/login page
  return (
    <div className="min-h-screen bg-brand-white">
      {/* Header */}
      <header className="p-6">
        <h1 className="text-3xl font-heading font-bold text-brand-primary">
          ChoreChum
        </h1>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center px-6 py-12 sm:py-24">
        <div className="mx-auto w-full max-w-md">
          {/* Inviting Text */}
          <div className="text-center">
            <h2 className="font-heading text-4xl font-extrabold text-support-dark sm:text-5xl">
              Stop arguing.
              <br />
              <span className="text-brand-primary">Start organising.</span>
            </h2>
            <p className="mt-4 text-lg text-support-dark/80">
              Welcome to ChoreChum. The simplest way to manage your household,
              assign tasks, and get things done together.
            </p>
          </div>

          {/* Spacer */}
          <div className="my-10 h-px w-full bg-support-light" />

          {/* Auth Form */}
          <AuthForm />
        </div>
      </main>
    </div>
  )
}