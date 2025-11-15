// src/components/ChoreItem.tsx
'use client'

import { ChoreWithDetails } from '@/types/database'
import { Check, Clock, User, Home, Calendar, Loader2 } from 'lucide-react'
import { useTransition } from 'react'
import { completeChore, uncompleteChore } from '@/app/chore-actions'
import ChoreMenu from './ChoreMenu'
import Avatar from './Avatar'

type Props = {
  chore: ChoreWithDetails
  showActions: boolean
  status: 'overdue' | 'due' | 'upcoming'
}

// Helper to format due date display
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'No due date'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

// Helper to get styling for the check button
const getButtonClasses = (status: Props['status'], isCompleted: boolean) => {
  if (isCompleted) {
    return 'bg-status-complete text-white border-status-complete'
  }
  switch (status) {
    case 'overdue':
      return 'border-status-overdue text-status-overdue hover:bg-status-overdue/10'
    case 'due':
      return 'border-status-due text-status-due hover:bg-status-due/10'
    default:
      return 'border-border text-text-secondary hover:text-brand hover:border-brand'
  }
}

export default function ChoreItem({ chore, showActions, status }: Props) {
  const [isPending, startTransition] = useTransition()
  
  const isCompleted = chore.completed_instances === (chore.target_instances ?? 1)
  const buttonClasses = getButtonClasses(status, isCompleted)

  const handleToggleCompletion = () => {
    if (isCompleted) {
      startTransition(() => {
        uncompleteChore(chore.id)
      })
    } else {
      startTransition(() => {
        completeChore(chore.id)
      })
    }
  }

  return (
    // --- THE NEW CHORE CARD ---
    <li 
      className={`
        flex flex-col rounded-xl border border-border bg-card p-4
        shadow-card transition-shadow hover:shadow-card-hover
        ${isCompleted ? 'opacity-70' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        {/* Left Side: Chore Name & Completion Button */}
        <div className="flex items-start gap-3">
          {/* Large, satisfying check button */}
          <button
            onClick={handleToggleCompletion}
            disabled={isPending}
            className={`
              flex h-10 w-10 flex-shrink-0 items-center justify-center
              rounded-full border-2 bg-card transition-all
              disabled:opacity-50 ${buttonClasses}
            `}
            aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Check className="h-5 w-5" />
            )}
          </button>
          
          {/* Chore Name & Instance Counter */}
          <div className="flex flex-col pt-1.5">
            <h4 className="font-heading text-lg font-semibold">
              {chore.name}
            </h4>
            {(chore.target_instances ?? 1) > 1 && (
              <span className="text-sm font-medium text-text-secondary">
                {chore.completed_instances ?? 0} / {chore.target_instances ?? 1} completed
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Avatar */}
        {chore.profiles ? (
          <Avatar 
            url={chore.profiles.avatar_url ?? undefined} 
            alt={chore.profiles.full_name ?? 'User avatar'} 
            size={40} 
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-background border border-border flex items-center justify-center">
            <User className="h-5 w-5 text-text-secondary" />
          </div>
        )}
      </div>

      {/* --- Bottom Row: Metadata & Actions --- */}
      <div className="mt-4 flex items-end justify-between">
        {/* Metadata pills */}
        <div className="flex flex-wrap items-center gap-2">
          {chore.due_date && (
            <div className="flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1 text-sm font-medium text-text-secondary">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(chore.due_date)}</span>
            </div>
          )}
          {chore.rooms?.name && (
            <div className="flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1 text-sm font-medium text-text-secondary">
              <Home className="h-4 w-4" />
              <span>{chore.rooms.name}</span>
            </div>
          )}
          {chore.recurrence_type !== 'none' && (
            <div className="flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1 text-sm font-medium text-text-secondary">
              <Clock className="h-4 w-4" />
              <span className="capitalize">{chore.recurrence_type}</span>
            </div>
          )}
        </div>

        {/* Actions Menu */}
        {showActions && (
          <ChoreMenu chore={chore} />
        )}
      </div>
    </li>
  )
}