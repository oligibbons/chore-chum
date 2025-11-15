// src/app/page.tsx

import AuthForm from '@/components/AuthForm'
import { ClipboardCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          
          <div className="space-y-6 text-center md:text-left">
            <div className="inline-block rounded-full bg-brand-light p-4 text-brand">
              <ClipboardCheck className="h-12 w-12" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-heading font-bold">
              Stop arguing.
              <br />
              <span className="text-brand">Start organising.</span>
            </h1>
            <p className="text-lg text-text-secondary">
              Welcome to the simplest way to manage your household tasks,
              assign responsibilities, and get things done together.
            </p>
          </div>

          <main className="w-full max-w-md rounded-2xl bg-card p-8 shadow-card border border-border mx-auto">
            <h2 className="mb-6 font-heading text-xl font-semibold text-center">
              Sign in to your household
            </h2>
            <AuthForm />
          </main>
        </div>
      </div>
    </div>
  )
}