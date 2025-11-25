// src/components/ProfileForm.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { User, Check, Loader2, Mail, Home, ShieldAlert, Upload, Bell, Share2, Palette, Hand, Sun, Moon, Activity } from 'lucide-react'
import { updateProfile, leaveHousehold, ProfileFormState } from '@/app/profile-actions'
import { DbProfile, DbHousehold } from '@/types/database'
import Avatar from '@/components/Avatar'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import ThemeToggle from './ThemeToggle'

type Props = {
  profile: DbProfile
  household: Pick<DbHousehold, 'name' | 'invite_code'> | null
  email?: string
}

// FIXED: Typed preferences helper to handle JSONB safely
type NotificationPreferences = {
  morning_brief?: boolean
  evening_motivation?: boolean
  chore_updates?: boolean
  nudges?: boolean
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

function Toggle({ 
  name, 
  label, 
  description, 
  icon: Icon, 
  defaultChecked, 
  disabled = false 
}: { 
  name?: string, 
  label: string, 
  description: string, 
  icon: any, 
  defaultChecked?: boolean, 
  disabled?: boolean 
}) {
  const [checked, setChecked] = useState(defaultChecked || false)

  return (
    <div className={`flex items-start justify-between p-3 rounded-xl border transition-all ${disabled ? 'bg-muted/50 border-border opacity-80' : 'bg-card border-border hover:border-brand/30'}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-1 p-1.5 rounded-lg ${disabled ? 'bg-muted text-muted-foreground' : 'bg-brand/10 text-brand'}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground leading-tight max-w-[200px]">{description}</p>
        </div>
      </div>
      
      <div className="relative inline-flex items-center cursor-pointer mt-1">
        <input 
          type="checkbox" 
          name={name} 
          className="sr-only peer" 
          checked={checked}
          onChange={(e) => !disabled && setChecked(e.target.checked)}
          disabled={disabled}
          value="true"
        />
        <div className={`
          w-11 h-6 rounded-full peer peer-focus:ring-4 peer-focus:ring-brand/20 
          peer-checked:after:translate-x-full peer-checked:after:border-card 
          after:content-[''] after:absolute after:top-0.5 after:left-[2px] 
          after:bg-card after:border-muted after:border after:rounded-full 
          after:h-5 after:w-5 after:transition-all
          ${disabled 
            ? 'bg-muted after:bg-muted-foreground' 
            : 'bg-muted peer-checked:bg-brand'}
        `}></div>
      </div>
    </div>
  )
}

export default function ProfileForm({ profile, household, email }: Props) {
  const [state, formAction] = useFormState(updateProfile, initialState)
  const [copied, setCopied] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url)
  const [isUploading, setIsUploading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createSupabaseBrowserClient()

  // FIXED: Safely cast and default the JSONB preference data
  // This prevents crashes if the DB column is null or missing keys
  const rawPrefs = profile.notification_preferences as unknown as NotificationPreferences | null
  const prefs: NotificationPreferences = {
    morning_brief: rawPrefs?.morning_brief ?? true,
    evening_motivation: rawPrefs?.evening_motivation ?? true,
    chore_updates: rawPrefs?.chore_updates ?? true,
    nudges: true
  }

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

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my ChoreChum Household',
          text: `Join my household on ChoreChum! Use code: ${household.invite_code}`,
          url: window.location.origin
        })
      } catch (err) {
        // Ignore abort
      }
    } else {
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
          <h2 className="mb-6 font-heading text-xl font-semibold flex items-center gap-2 text-foreground">
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
                    <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">
                        Full Name
                    </label>
                    <input
                        type="text"
                        name="fullName"
                        defaultValue={profile.full_name || ''}
                        className="block w-full rounded-xl border-input bg-background p-3 transition-all focus:border-brand focus:ring-brand text-foreground"
                        placeholder="e.g. Alex Smith"
                    />
                </div>
                
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">
                        Email Address
                    </label>
                    <div className="flex items-center gap-3 rounded-xl border border-input bg-muted/50 p-3 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{email || 'No email found'}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed.</p>
                </div>
              </div>

              {/* APPEARANCE SETTINGS */}
              <div className="pt-6 border-t border-border mt-6">
                <h3 className="mb-4 font-heading text-lg font-semibold flex items-center gap-2 text-foreground">
                    <Palette className="h-5 w-5 text-brand" />
                    Appearance
                </h3>
                <ThemeToggle />
              </div>

              {/* NOTIFICATION SETTINGS */}
              <div className="pt-6 border-t border-border mt-6">
                <h3 className="mb-4 font-heading text-lg font-semibold flex items-center gap-2 text-foreground">
                    <Bell className="h-5 w-5 text-brand" />
                    Notifications
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Toggle 
                        name="notif_morning"
                        label="Morning Brief"
                        description="8am daily summary of tasks."
                        icon={Sun}
                        defaultChecked={prefs.morning_brief}
                    />
                    <Toggle 
                        name="notif_evening"
                        label="Evening Motivation"
                        description="8pm nudge for remaining tasks."
                        icon={Moon}
                        defaultChecked={prefs.evening_motivation}
                    />
                    <Toggle 
                        name="notif_updates"
                        label="Activity"
                        description="When housemates complete tasks."
                        icon={Activity}
                        defaultChecked={prefs.chore_updates}
                    />
                    <Toggle 
                        label="Direct Nudges"
                        description="When someone specifically nudges you."
                        icon={Hand}
                        defaultChecked={true}
                        disabled={true}
                    />
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <SaveButton />
              </div>
            </form>
          </div>
        </div>

        {/* Card 2: App Info */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
           <h2 className="mb-4 font-heading text-xl font-semibold flex items-center gap-2 text-foreground">
              <Share2 className="h-5 w-5 text-brand" />
              App Info
           </h2>
           <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Push Permissions</p>
                <p className="text-sm text-muted-foreground">Ensure your device allows notifications.</p>
              </div>
              <button 
                onClick={() => (window as any).requestPushPermission?.()}
                className="rounded-lg bg-brand-light dark:bg-brand/20 px-4 py-2 text-sm font-bold text-brand dark:text-brand-light hover:bg-brand/20 transition-colors"
              >
                Check Status
              </button>
           </div>
        </div>

      </div>

      {/* Right Column: Household & Danger */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Household Card */}
        {household ? (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 font-heading text-xl font-semibold flex items-center gap-2 text-foreground">
                <Home className="h-5 w-5 text-brand" />
                Household
            </h2>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        Current Home
                    </label>
                    <p className="text-lg font-medium text-foreground mt-0.5">
                        {household.name}
                    </p>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        Invite Code
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                        <code className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2 font-mono text-lg font-bold tracking-wider text-brand text-center">
                        {household.invite_code}
                        </code>
                        <button
                            onClick={handleShareCode}
                            className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-brand hover:text-brand"
                            title="Share Code"
                        >
                        {copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                        Share this code to add members.
                    </p>
                </div>
            </div>
          </div>
        ) : (
            <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6 text-center">
                <Home className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground font-medium">No household joined.</p>
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
                    className="w-full rounded-lg border border-status-overdue/30 bg-card px-4 py-2 text-sm font-semibold text-status-overdue transition-all hover:bg-status-overdue hover:text-white shadow-sm"
                >
                    Leave Household
                </button>
            )}
            
             <button
                disabled
                className="mt-3 w-full rounded-lg border border-transparent px-4 py-2 text-sm font-semibold text-status-overdue/50 cursor-not-allowed"
            >
                Delete Account
            </button>
        </div>

      </div>
    </div>
  )
}