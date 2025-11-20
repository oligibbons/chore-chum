// src/components/HouseholdManager.tsx
'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useEffect } from 'react'
import {
  createHousehold,
  joinHousehold,
  FormState,
} from '@/app/household-actions'
import { Home, Users, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

const initialState: FormState = {
  success: false,
  message: '',
}

function SubmitButton({ text, icon }: { text: string, icon: React.ReactNode }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center rounded-xl bg-brand px-5 py-3 font-heading text-base font-semibold text-white shadow-lg transition-all hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          {text}
          <div className="ml-2">{icon}</div>
        </>
      )}
    </button>
  )
}

export default function HouseholdManager() {
  const [createState, createAction] = useFormState(createHousehold, initialState)
  const [joinState, joinAction] = useFormState(joinHousehold, initialState)

  // --- Effects for Toasts ---
  
  useEffect(() => {
    if (createState.message) {
      if (createState.success) {
        toast.success(createState.message)
      } else {
        toast.error(createState.message)
      }
    }
  }, [createState])

  useEffect(() => {
    if (joinState.message) {
      if (joinState.success) {
        toast.success(joinState.message)
      } else {
        toast.error(joinState.message)
      }
    }
  }, [joinState])

  // --------------------------

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      
      <div className="text-center">
        <h1 className="text-4xl font-heading font-bold">
          Welcome to ChoreChum!
        </h1>
        <p className="mt-2 text-lg text-text-secondary">
          To get started, create a new household or join an existing one.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        
        {/* --- Card 1: Create --- */}
        <div className="flex flex-col rounded-2xl border border-border bg-card p-8 shadow-card">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-light text-brand">
            <Home className="h-6 w-6" />
          </div>
          <h2 className="mb-2 font-heading text-2xl font-semibold">
            Create a Household
          </h2>
          <p className="mb-6 flex-1 text-text-secondary">
            Start a new home base for your family, roommates, or team.
          </p>
          
          <form action={createAction} className="space-y-4">
            <div>
              <label
                htmlFor="householdName"
                className="block font-heading text-sm font-medium text-text-primary"
              >
                Household Name
              </label>
              <input
                type="text"
                id="householdName"
                name="householdName"
                required
                placeholder="e.g. 'The Johnson Family'"
                className="mt-1 block w-full rounded-xl border-border bg-background p-3 transition-all focus:border-brand focus:ring-brand"
              />
            </div>
            <SubmitButton text="Create Household" icon={<ArrowRight className="h-5 w-5" />} />
          </form>
        </div>

        {/* --- Card 2: Join --- */}
        <div className="flex flex-col rounded-2xl border border-border bg-card p-8 shadow-card">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-light text-brand">
            <Users className="h-6 w-6" />
          </div>
          <h2 className="mb-2 font-heading text-2xl font-semibold">
            Join a Household
          </h2>
          <p className="mb-6 flex-1 text-text-secondary">
            Got an invite code? Enter it here to join your household.
          </p>
          
          <form action={joinAction} className="space-y-4">
            <div>
              <label
                htmlFor="inviteCode"
                className="block font-heading text-sm font-medium text-text-primary"
              >
                Invite Code
              </label>
              <input
                type="text"
                id="inviteCode"
                name="inviteCode"
                required
                placeholder="ABC123"
                className="mt-1 block w-full rounded-xl border-border bg-background p-3 uppercase transition-all focus:border-brand focus:ring-brand"
              />
            </div>
            <SubmitButton text="Join Household" icon={<ArrowRight className="h-5 w-5" />} />
          </form>
        </div>
      </div>
    </div>
  )
}