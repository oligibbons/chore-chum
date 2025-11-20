'use client'

import { useState, useRef, useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { User, LogOut, Copy, Check, Loader2, Camera } from 'lucide-react'
import { updateProfile, leaveHousehold, ProfileFormState } from '@/app/profile-actions'
import { DbProfile, DbHousehold } from '@/types/database'
import Avatar from '@/components/Avatar'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Props = {
  profile: DbProfile
  household: Pick<DbHousehold, 'name' | 'invite_code'> | null
}

const initialState: ProfileFormState = {
  success: false,
  message: '',
}

function SaveButton() {
  const { pending } = useFormStatus()
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center justify-center rounded-xl bg-brand px-6 py-2.5 font-heading text-sm font-semibold text-white shadow-lg transition-all hover:bg-brand-dark disabled:opacity-70"
    >
      {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Changes'}
    </button>
  )
}

export default function ProfileForm({ profile, household }: Props) {
  const [state, formAction] = useFormState(updateProfile, initialState)
  const [copied, setCopied] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url)
  const [isUploading, setIsUploading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createSupabaseBrowserClient()

  // Listen for Server Action State changes to trigger Toasts
  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message)
      } else {
        toast.error(state.message)
      }
    }
  }, [state])

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true)
      if (!event.target.files || event.target.files.length === 0) {
        return
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const userId = profile.id
      const filePath = `${userId}/${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setAvatarUrl(data.publicUrl)
      toast.success("Photo uploaded! Don't forget to save.")

    } catch (error: any) {
      toast.error('Error uploading avatar: ' + error.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleCopyCode = () => {
    if (household?.invite_code) {
      navigator.clipboard.writeText(household.invite_code)
      setCopied(true)
      toast.success("Invite code copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleLeave = async () => {
    if (confirm('Are you sure you want to leave this household? You will lose access to all chores.')) {
      try {
        await leaveHousehold()
      } catch (error: any) {
        toast.error(error.message)
      }
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          
          {/* Avatar Upload Section */}
          <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar 
                url={avatarUrl} 
                alt={profile.full_name || 'User'} 
                size={80} 
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-6 w-6 text-white" />
              </div>
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={isUploading}
              />
            </div>
            
            <div className="text-center sm:text-left">
              <h2 className="font-heading text-xl font-semibold">Personal Info</h2>
              <p className="text-sm text-text-secondary">Click the picture to upload a new photo.</p>
            </div>
          </div>

          <form action={formAction} className="space-y-4">
            {/* Hidden input to pass the avatar URL to the Server Action */}
            <input type="hidden" name="avatarUrl" value={avatarUrl || ''} />

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

            <div className="flex justify-end">
              <SaveButton />
            </div>
          </form>
        </div>
      </div>

      {/* Household Info (Right Column) */}
      <div className="lg:col-span-1 space-y-6">
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