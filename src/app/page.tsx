import AuthForm from '@/components/AuthForm'
import { ClipboardCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 sm:p-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:items-center md:gap-16">
          
          {/* Left Column: Branding */}
          <div className="flex flex-col items-center space-y-6 text-center md:items-start md:text-left">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-light text-brand shadow-sm rotate-3 transform transition-transform hover:rotate-6">
              <ClipboardCheck className="h-10 w-10" />
            </div>
            
            <h1 className="text-5xl font-heading font-extrabold tracking-tight text-foreground lg:text-6xl">
              Stop arguing.
              <br />
              <span className="text-brand">Start organising.</span>
            </h1>
            
            <p className="text-lg text-text-secondary max-w-md leading-relaxed">
              The friendly household manager. Assign chores, track progress, and keep your home running smoothly without the friction.
            </p>
          </div>

          {/* Right Column: Auth Card */}
          <div className="w-full max-w-md mx-auto">
            <div className="rounded-3xl border border-border bg-card p-8 shadow-card shadow-brand/5">
              <h2 className="mb-6 font-heading text-xl font-semibold text-center text-text-primary">
                Sign in to your household
              </h2>
              <AuthForm />
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}