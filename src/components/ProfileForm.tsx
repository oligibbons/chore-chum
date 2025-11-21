'use client'

import { useState, useRef, useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { User, Copy, Check, Loader2, Mail, Home, ShieldAlert, Upload, Bell, Share2 } from 'lucide-react'
import { updateProfile, leaveHousehold, ProfileFormState } from '@/app/profile-actions'
import { DbProfile, DbHousehold } from '@/types/database'
import Avatar from '@/components/Avatar'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Props = {
  profile: DbProfile
  household: Pick<DbHousehold, 'name' | 'invite_code'> | null
  email?: string
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

export default function ProfileForm({ profile, household, email }: Props) {
  const [state, formAction] = useFormState(updateProfile, initialState)
  const [copied, setCopied] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url)
  const [isUploading, setIsUploading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createSupabaseBrowserClient()

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
      if (!event.target.files || event.target.files.length === 0) return

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
      toast.success("Photo uploaded! Click 'Save Changes' to apply.")

    } catch (error: any) {
      toast.error('Error uploading avatar: ' + error.message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleShareCode = async () => {
    if (!household?.invite_code) return

    // Native Share (Mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my ChoreChum Household',
          text: `Join my household on ChoreChum! Use code: ${household.invite_code}`,
          url: window.location.origin
        })
      } catch (err) {
        // Ignore abort errors
      }
    } else {
      // Fallback to Copy
      navigator.clipboard.writeText(household.invite_code)
      setCopied(true)
      toast.success("Invite code copied")
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
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
      
      {/* Left Column: User Settings */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* Card 1: Public Profile */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="mb-6 font-heading text-xl font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-brand" />
            Public Profile
          </h2>

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-3">
               <div className="relative h-24 w-24">
                  <Avatar 
                    url={avatarUrl} 
                    alt={profile.full_name || 'User'} 
                    size={96} 
                  />
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
               </div>
               <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={isUploading}
                />
               <button 
                 type="button"
                 onClick={() => fileInputRef.current?.click()}
                 disabled={isUploading}
                 className="text-sm font-semibold text-brand hover:text-brand-dark flex items-center gap-1"
               >
                 <Upload className="h-3 w-3" />
                 Change Photo
               </button>
            </div>

            {/* Form Fields */}
            <form action={formAction} className="flex-1 w-full space-y-4">
              <input type="hidden" name="avatarUrl" value={avatarUrl || ''} />

              <div className="grid gap-4">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-text-secondary mb-1">
                        Full Name
                    </label>
                    <input
                        type="text"
                        name="fullName"
                        defaultValue={profile.full_name || ''}
                        className="block w-full rounded-xl border-border bg-background p-3 transition-all focus:border-brand focus:ring-brand"
                        placeholder="e.g. Alex Smith"
                    />
                </div>
                
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-text-secondary mb-1">
                        Email Address
                    </label>
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-gray-50 p-3 text-text-secondary">
                        <Mail className="h-4 w-4" />
                        <span>{email || 'No email found'}</span>
                    </div>
                    <p className="mt-1 text-xs text-text-secondary">Email cannot be changed.</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <SaveButton />
              </div>
            </form>
          </div>
        </div>

        {/* Card 2: Preferences (Notifications) */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
           <h2 className="mb-4 font-heading text-xl font-semibold flex items-center gap-2">
              <Bell className="h-5 w-5 text-brand" />
              Preferences
           </h2>
           
           <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-text-primary">Push Notifications</p>
                <p className="text-sm text-text-secondary">Get alerted about new and completed chores.</p>
              </div>
              <button 
                onClick={() => (window as any).requestPushPermission?.()}
                className="rounded-lg bg-brand-light px-4 py-2 text-sm font-bold text-brand hover:bg-brand/20 transition-colors"
              >
                Enable
              </button>
           </div>
        </div>

      </div>

      {/* Right Column: Household & Danger */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Household Card */}
        {household ? (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 font-heading text-xl font-semibold flex items-center gap-2">
                <Home className="h-5 w-5 text-brand" />
                Household
            </h2>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-text-secondary">
                        Current Home
                    </label>
                    <p className="text-lg font-medium text-text-primary mt-0.5">
                        {household.name}
                    </p>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-text-secondary">
                        Invite Code
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                        <code className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-lg font-bold tracking-wider text-brand text-center">
                        {household.invite_code}
                        </code>
                        <button
                            onClick={handleShareCode}
                            className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-text-secondary transition-colors hover:border-brand hover:text-brand"
                            title="Share Code"
                        >
                        {copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
                        </button>
                    </div>
                    <p className="text-xs text-text-secondary mt-1.5">
                        Share this code to add members.
                    </p>
                </div>
            </div>
          </div>
        ) : (
            <div className="rounded-2xl border-2 border-dashed border-border bg-card/50 p-6 text-center">
                <Home className="h-8 w-8 text-text-secondary mx-auto mb-2" />
                <p className="text-text-secondary font-medium">No household joined.</p>
            </div>
        )}

        {/* Danger Zone */}
        <div className="rounded-2xl border border-status-overdue/20 bg-status-overdue/5 p-6">
             <h2 className="mb-4 font-heading text-base font-bold text-status-overdue flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                Danger Zone
            </h2>
            
            {household && (
                <button
                    onClick={handleLeave}
                    className="w-full rounded-lg border border-status-overdue/30 bg-white px-4 py-2 text-sm font-semibold text-status-overdue transition-all hover:bg-status-overdue hover:text-white shadow-sm"
                >
                    Leave Household
                </button>
            )}
            
             <button
                disabled
                className="mt-3 w-full rounded-lg border border-transparent px-4 py-2 text-sm font-semibold text-status-overdue/50 cursor-not-allowed"
            >
                Delete Account (Coming Soon)
            </button>
        </div>

      </div>
    </div>
  )
}