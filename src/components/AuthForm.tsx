'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { signInWithEmail, signUpWithEmail, AuthFormState } from '@/app/actions'
import { Loader2, Mail, Lock, User, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useEffect } from 'react'

const initialState: AuthFormState = {
  success: false,
  message: '',
}

function SubmitButton({ text }: { text: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 font-heading text-base font-semibold text-white shadow-lg transition-all hover:bg-brand-dark disabled:opacity-70"
    >
      {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : (
        <>
          {text} 
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </>
      )}
    </button>
  )
}

export default function AuthForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  
  // Separate states for signin/signup so errors don't persist when switching
  const [signInState, signInAction] = useFormState(signInWithEmail, initialState)
  const [signUpState, signUpAction] = useFormState(signUpWithEmail, initialState)

  // Toast Effects
  useEffect(() => {
    if (signInState.message && !signInState.success) toast.error(signInState.message)
  }, [signInState])

  useEffect(() => {
    if (signUpState.message) {
      if (signUpState.success) toast.success(signUpState.message)
      else toast.error(signUpState.message)
    }
  }, [signUpState])

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Toggle */}
      <div className="mb-8 flex rounded-xl bg-gray-100 p-1 border border-border">
        <button
          onClick={() => setMode('signin')}
          className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${
            mode === 'signin' ? 'bg-white text-brand shadow-sm' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setMode('signup')}
          className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${
            mode === 'signup' ? 'bg-white text-brand shadow-sm' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Forms */}
      {mode === 'signin' ? (
        <form action={signInAction} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div>
            <label className="sr-only" htmlFor="email">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="Email address"
                className="block w-full rounded-xl border-border bg-background p-3 pl-10 transition-all focus:border-brand focus:ring-brand"
              />
            </div>
          </div>
          <div>
            <label className="sr-only" htmlFor="password">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Password"
                className="block w-full rounded-xl border-border bg-background p-3 pl-10 transition-all focus:border-brand focus:ring-brand"
              />
            </div>
          </div>
          <SubmitButton text="Sign In" />
        </form>
      ) : (
        <form action={signUpAction} className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
          <div>
            <label className="sr-only" htmlFor="fullName">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
              <input
                id="fullName"
                name="full_name"
                type="text"
                required
                placeholder="Full Name"
                className="block w-full rounded-xl border-border bg-background p-3 pl-10 transition-all focus:border-brand focus:ring-brand"
              />
            </div>
          </div>
          <div>
            <label className="sr-only" htmlFor="email">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="Email address"
                className="block w-full rounded-xl border-border bg-background p-3 pl-10 transition-all focus:border-brand focus:ring-brand"
              />
            </div>
          </div>
          <div>
            <label className="sr-only" htmlFor="password">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="Password (min 6 chars)"
                className="block w-full rounded-xl border-border bg-background p-3 pl-10 transition-all focus:border-brand focus:ring-brand"
              />
            </div>
          </div>
          <SubmitButton text="Create Account" />
        </form>
      )}
      
      <p className="mt-6 text-center text-xs text-text-secondary">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  )
}