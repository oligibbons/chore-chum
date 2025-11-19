'use client'

import { useState } from 'react'
import { User, LogOut, Copy, Check, Loader2 } from 'lucide-react'
import { updateProfile, leaveHousehold } from '@/app/profile-actions'
import { DbProfile, DbHousehold } from '@/types/database'
import Avatar from '@/components/Avatar'

type Props = {
  profile: DbProfile
  household: Pick<DbHousehold, 'name' | 'invite_code'> | null
}

export default function ProfileForm({ profile, household }: Props) {
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleUpdate = async (formData: FormData) => {
    setIsPending(true)
    setMessage(null)
    
    const result = await updateProfile(formData)
    
    setMessage({
      text: result.message,
      type: result.success ? 'success' : 'error'
    })
    setIsPending(false)
  }

  const handleCopyCode = () => {
    if (household?.invite_code) {
      // Use the modern Clipboard API, falling back to execCommand if needed is handled by most browsers now
      navigator.clipboard.writeText(household.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleLeave = async () => {
    if (confirm('Are you sure you want to leave this household? You will lose access to all chores.')) {
      await leaveHousehold()
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      
      {/* Left Column: Edit Profile */}
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="mb-6 flex items-center gap-4">
            <Avatar 
              url={profile.avatar_url} 
              alt={profile.full_name || 'User'} 
              size={64} 
            />
            <div>
              <h2 className="font-heading text-xl font-semibold">Personal Info</h2>
              <p className="text-sm text-text-secondary">Update your details so your housemates know who you are.</p>
            </div>
          </div>

          <form action={handleUpdate} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block font-heading text-sm font-medium text-text-primary">
                Full Name
              </label>
              <div className="relative mt-1">
                <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  defaultValue={profile.full_name || ''}
                  placeholder="e.g. Sarah Jones"
                  className="mt-1 block w-full rounded-xl border-border bg-background p-3 pl-10 transition-all focus:border-brand focus:ring-brand"
                />
              </div>
            </div>

            {message && (
              <p className={`text-sm ${message.type === 'success' ? 'text-status-complete' : 'text-status-overdue'}`}>
                {message.text}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center justify-center rounded-xl bg-brand px-6 py-2.5 font-heading text-sm font-semibold text-white shadow-lg transition-all hover:bg-brand-dark disabled:opacity-70"
              >
                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Column: Household Info */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Household Card */}
        {household ? (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 font-heading text-xl font-semibold">Household</h2>
            
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wide text-text-secondary">
                Current Household
              </label>
              <p className="mt-1 text-lg font-medium text-text-primary">
                {household.name}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wide text-text-secondary">
                Invite Code
              </label>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-lg font-bold tracking-wider text-brand">
                  {household.invite_code}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-text-secondary transition-colors hover:border-brand hover:text-brand"
                  title="Copy Invite Code"
                >
                  {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>
              <p className="mt-2 text-xs text-text-secondary">
                Share this code with others to join your household.
              </p>
            </div>

            <div className="border-t border-border pt-4">
              <button
                onClick={handleLeave}
                className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-status-overdue transition-colors hover:bg-status-overdue/10"
              >
                <LogOut className="h-4 w-4" />
                Leave Household
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-6 text-center">
            <p className="text-text-secondary">You are not in a household.</p>
          </div>
        )}
      </div>
    </div>
  )
}