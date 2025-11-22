// src/app/(app)/feed/page.tsx

import { createSupabaseClient } from '@/lib/supabase/server'
import { getActivityFeed } from '@/app/feed-actions'
import { redirect } from 'next/navigation'
import Avatar from '@/components/Avatar'
import { Check, Plus, Trash2, Clock, Edit2, Bell, Zap } from 'lucide-react'

export const dynamic = 'force-dynamic'

function getActionIcon(type: string) {
    switch(type) {
        case 'create': return <div className="bg-blue-100 text-blue-600 p-1.5 rounded-full"><Plus className="h-4 w-4" /></div>
        case 'complete': return <div className="bg-green-100 text-green-600 p-1.5 rounded-full"><Check className="h-4 w-4" /></div>
        case 'delete': return <div className="bg-red-100 text-red-600 p-1.5 rounded-full"><Trash2 className="h-4 w-4" /></div>
        case 'delay': return <div className="bg-amber-100 text-amber-600 p-1.5 rounded-full"><Clock className="h-4 w-4" /></div>
        case 'nudge': return <div className="bg-purple-100 text-purple-600 p-1.5 rounded-full"><Bell className="h-4 w-4" /></div>
        case 'zen_start': return <div className="bg-teal-100 text-teal-600 p-1.5 rounded-full"><Zap className="h-4 w-4" /></div>
        default: return <div className="bg-gray-100 text-gray-600 p-1.5 rounded-full"><Edit2 className="h-4 w-4" /></div>
    }
}

function getActionText(type: string, details: any) {
    switch(type) {
        case 'create': return 'created'
        case 'complete': return 'completed'
        case 'delete': return 'deleted'
        case 'delay': return `delayed ${details?.days ? `by ${details.days} days` : ''}`
        case 'nudge': return 'nudged a housemate about'
        case 'zen_start': return 'entered Zen Mode'
        case 'update': return 'updated'
        default: return 'touched'
    }
}

export default async function FeedPage() {
  const supabase = await createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('household_id')
    .eq('id', user.id)
    .single()
    
  const profile = rawProfile as { household_id: string | null } | null

  if (!profile || !profile.household_id) redirect('/dashboard')

  const logs = await getActivityFeed(profile.household_id)

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <header>
        <h2 className="text-3xl font-heading font-bold">Activity Feed</h2>
        <p className="text-text-secondary">See what's happening in your household.</p>
      </header>

      <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
         {logs.length === 0 ? (
             <div className="p-12 text-center text-text-secondary flex flex-col items-center gap-4">
                <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <ActivityIcon className="h-6 w-6 text-gray-400" />
                </div>
                <p>No activity recorded yet.</p>
             </div>
         ) : (
             <ul className="divide-y divide-border">
                 {logs.map(log => (
                     <li key={log.id} className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                         <div className="flex-shrink-0">
                            <Avatar 
                                url={log.profiles?.avatar_url} 
                                alt={log.profiles?.full_name || 'Unknown'} 
                                size={40} 
                            />
                         </div>
                         <div className="flex-1 min-w-0">
                             <div className="flex flex-wrap items-center gap-x-1.5 mb-1">
                                <span className="font-semibold text-sm text-text-primary">
                                    {log.profiles?.full_name?.split(' ')[0] || 'Someone'}
                                </span>
                                <span className="text-sm text-text-secondary">
                                    {getActionText(log.action_type, log.details)}
                                </span>
                                <span className="font-bold text-sm text-text-primary break-all">
                                    {log.entity_name}
                                </span>
                             </div>
                             <p className="text-xs text-text-secondary">
                                 {new Date(log.created_at).toLocaleString([], { 
                                     month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                                 })}
                             </p>
                         </div>
                         <div className="flex-shrink-0">
                             {getActionIcon(log.action_type)}
                         </div>
                     </li>
                 ))}
             </ul>
         )}
      </div>
    </div>
  )
}

function ActivityIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    )
}