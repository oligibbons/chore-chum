// src/components/ChoreDisplay.tsx
'use client'

import { useState } from 'react'
import { ChoreWithDetails, DbProfile } from '@/types/database'
import ChoreItem from './ChoreItem'
import { AlertOctagon, AlertTriangle, Calendar, CheckCircle2, ChevronDown, ChevronUp, Coffee } from 'lucide-react'

type Props = {
  title: string
  chores: ChoreWithDetails[]
  status: 'overdue' | 'due' | 'upcoming' | 'completed'
  members?: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'>[]
  currentUserId?: string
}

const getStatusConfig = (status: Props['status']) => {
  switch (status) {
    case 'overdue':
      return {
        icon: <AlertOctagon className="h-5 w-5 text-status-overdue" />,
        pillClasses: 'bg-status-overdue/10 text-status-overdue',
        emptyText: "Nothing overdue. Nice!",
        emptyIcon: <CheckCircle2 className="h-8 w-8 text-green-400 mb-2 opacity-50" />,
        defaultOpen: true
      }
    case 'due':
      return {
        icon: <AlertTriangle className="h-5 w-5 text-status-due" />,
        pillClasses: 'bg-status-due/10 text-status-due',
        emptyText: "You're all caught up for today!",
        emptyIcon: <Coffee className="h-8 w-8 text-brand/40 mb-2" />,
        defaultOpen: true
      }
    case 'completed':
      return {
        icon: <CheckCircle2 className="h-5 w-5 text-status-complete" />,
        pillClasses: 'bg-status-complete/10 text-status-complete',
        emptyText: "No completed chores yet.",
        emptyIcon: <div className="h-8 w-8 rounded-full border-2 border-dashed border-gray-300 mb-2" />,
        defaultOpen: false
      }
    default:
      return {
        icon: <Calendar className="h-5 w-5 text-text-secondary" />,
        pillClasses: 'bg-gray-100 text-text-secondary',
        emptyText: "Nothing scheduled.",
        emptyIcon: <Calendar className="h-8 w-8 text-gray-300 mb-2" />,
        defaultOpen: true
      }
  }
}

export default function ChoreDisplay({
  title,
  chores,
  status,
  members,
  currentUserId
}: Props) {
  const config = getStatusConfig(status)
  const [isOpen, setIsOpen] = useState(config.defaultOpen)
  const [isExpanded, setIsExpanded] = useState(false)

  // Logic: Collapse long lists by default (limit to 4 items)
  const LIMIT = 4
  const shouldClamp = chores.length > LIMIT
  const visibleChores = (shouldClamp && !isExpanded) ? chores.slice(0, LIMIT) : chores

  return (
    <div className="flex flex-col space-y-2 bg-white/50 rounded-2xl border border-transparent hover:border-border/60 transition-colors">
      
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-3 w-full hover:bg-gray-50/80 rounded-xl transition-all group"
      >
        <div className="flex items-center gap-3">
          {config.icon}
          <h3 className="font-heading text-lg font-bold text-text-primary">
            {title}
          </h3>
          <span 
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${config.pillClasses}`}
          >
            {chores.length}
          </span>
        </div>
        
        <div className="text-text-secondary/50 group-hover:text-brand transition-colors">
            {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-1 pb-2 animate-in slide-in-from-top-2 fade-in duration-300">
            {chores.length > 0 ? (
                <div className="space-y-3">
                    <div className="max-h-[600px] overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                        {visibleChores.map((chore) => (
                            <ChoreItem
                                key={chore.id}
                                chore={chore}
                                status={status === 'completed' ? 'upcoming' : status} 
                                showActions={true}
                                members={members}
                                currentUserId={currentUserId}
                            />
                        ))}
                    </div>
                    
                    {/* Show More / Show Less Button */}
                    {shouldClamp && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="w-full py-2 text-xs font-bold text-brand hover:bg-brand/5 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                            {isExpanded ? (
                                <>Show Less <ChevronUp className="h-3 w-3" /></>
                            ) : (
                                <>Show {chores.length - LIMIT} More <ChevronDown className="h-3 w-3" /></>
                            )}
                        </button>
                    )}
                </div>
            ) : (
                <div className="rounded-xl border-2 border-dashed border-border/60 bg-card/30 p-6 text-center flex flex-col items-center justify-center min-h-[100px]">
                {config.emptyIcon}
                <p className="font-medium text-text-secondary text-sm">
                    {config.emptyText}
                </p>
                </div>
            )}
        </div>
      )}
    </div>
  )
}