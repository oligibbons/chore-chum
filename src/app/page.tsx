// app/page.tsx

import { createSupabaseClient } from '@/lib/supabase/server' 
import { redirect } from 'next/navigation'
import AuthForm from '@/components/AuthForm'

// Tell Next.js to server-render this page
export const dynamic = 'force-dynamic'


export default async function HomePage() {
  const supabase = await createSupabaseClient() 

  // FIX: Use .getUser() here, not .getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If the user is already logged in, send them to the main app dashboard
  if (user) { // <-- Check for 'user'
    return redirect('/dashboard')
  }

  // If no user, show the landing/login page
  return (
    // New: Use a minimal white background for the whole screen
    <div className="flex min-h-screen bg-brand-white">
      
      {/* --- Left Side: Hero Text (Wider, Cleaner) --- */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2 lg:p-12">
        <div className="mx-auto w-full max-w-lg space-y-12 text-center lg:text-left">
          
          <header>
            <h1 className="text-4xl font-heading font-extrabold text-brand-primary sm:text-5xl">
              ChoreChum
            </h1>
          </header>

          <div className="space-y-6">
            <h2 className="font-heading text-5xl font-extrabold text-support-dark sm:text-6xl">
              Stop arguing.
              <br />
              <span className="text-brand-primary">Start organising.</span>
            </h2>
            <p className="text-xl text-support-dark/80">
              Welcome to the simplest way to manage your household tasks,
              assign responsibilities, and get things done together.
            </p>
          </div>
        </div>
      </div>

      {/* --- Right Side: Login Form (Visually Separated) --- */}
      <main className="flex w-full items-center justify-center bg-support-light/10 p-8 lg:w-1/2 lg:p-12">
        <div className="w-full max-w-md rounded-xl bg-brand-white p-6 shadow-2xl ring-1 ring-support-light/50 sm:p-10">
          <p className="mb-8 text-center font-heading text-xl font-medium text-support-dark/80">
            Sign in to your household.
          </p>
          <AuthForm />
        </div>
      </main>
    </div>
  )
}