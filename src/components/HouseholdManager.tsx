// components/HouseholdManager.tsx

'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createHousehold, joinHousehold, FormState } from '@/app/household-actions'
import { ArrowRight, Loader2 } from 'lucide-react'

// Initial state for our forms
const initialState: FormState = {
  success: false,
  message: '',
}

// A helper component to show a loading spinner on the submit button
function SubmitButton({ text }: { text: string }) {
  const { pending } = useFormStatus() // Hook to check if form is submitting

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center rounded-lg bg-brand-primary px-5 py-3 font-heading text-base font-semibold text-brand-white shadow-sm transition-all hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      ) : (
        <>
          {text}
          <ArrowRight className="ml-2 h-5 w-5" />
        </>
      )}
    </button>
  )
}

// Main component
export default function HouseholdManager() {
  // We use two separate form states, one for each form
  const [createState, createAction] = useFormState(createHousehold, initialState)
  const [joinState, joinAction] = useFormState(joinHousehold, initialState)

  return (
    <div className="mx-auto w-full max-w-lg rounded-lg border border-support-light bg-brand-white p-6 shadow-lg sm:p-10">
      <h2 className="text-center font-heading text-3xl font-bold text-support-dark">
        One last step!
      </h2>
      <p className="mt-2 text-center text-lg text-support-dark/80">
        You need to be in a household to manage chores.
        <br />
        Create one, or join your housemates'.
      </p>

      {/* Divider */}
      <div className="my-8 h-px w-full bg-support-light" />

      {/* --- Create Household Form --- */}
      <form action={createAction} className="space-y-4">
        <h3 className="font-heading text-xl font-semibold text-brand-primary">
          Create a new household
        </h3>
        <div>
          <label
            htmlFor="householdName"
            className="block font-heading text-sm font-medium text-support-dark"
          >
            Household Name
          </label>
          <input
            type="text"
            id="householdName"
            name="householdName"
            required
            placeholder="e.g. 'The Smith Family' or '42 Wallaby Way'"
            className="mt-1 block w-full rounded-lg border-support-light shadow-sm transition-all focus:border-brand-primary focus:ring-brand-primary"
          />
        </div>
        {!createState.success && createState.message && (
          <p className="text-sm text-status-overdue">{createState.message}</p>
        )}
        <SubmitButton text="Create Household" />
      </form>

      {/* --- Or Divider --- */}
      <div className="my-8 flex items-center">
        <div className="flex-grow border-t border-support-light" />
        <span className="mx-4 flex-shrink font-heading text-sm font-semibold uppercase text-support-dark/60">
          Or
        </span>
        <div className="flex-grow border-t border-support-light" />
      </div>

      {/* --- Join Household Form --- */}
      <form action={joinAction} className="space-y-4">
        <h3 className="font-heading text-xl font-semibold text-brand-secondary">
          Join an existing household
        </h3>
        <div>
          <label
            htmlFor="inviteCode"
            className="block font-heading text-sm font-medium text-support-dark"
          >
            Invite Code
          </label>
          <input
            type="text"
            id="inviteCode"
            name="inviteCode"
            required
            placeholder="Ask a housemate for the 6-character code"
            className="mt-1 block w-full rounded-lg border-support-light shadow-sm transition-all focus:border-brand-secondary focus:ring-brand-secondary"
          />
        </div>
        {!joinState.success && joinState.message && (
          <p className="text-sm text-status-overdue">{joinState.message}</p>
        )}
        <SubmitButton text="Join Household" />
      </form>
    </div>
  )
}