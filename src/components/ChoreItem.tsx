// components/ChoreItem.tsx

'use client'

import { ChoreWithDetails } from '@/types/database'
import { Check, Clock, User, Home, Calendar, Plus } from 'lucide-react'
import { useTransition } from 'react'
import { completeChore, uncompleteChore } from '@/app/chore-actions'
import ChoreMenu from './ChoreMenu'
import Avatar from './Avatar' // New component

type Props = {
  chore: ChoreWithDetails
  showActions: boolean
  status: string // Now accepts a string status from the ChoreDisplay
  onEdit: (chore: ChoreWithDetails) => void // Added back the onEdit handler
}

// Helper to map status to Tailwind classes
const getStatusClasses = (status: string, isCompleted: boolean): string => {
  if (isCompleted) return 'opacity-60 bg-status-complete/10 border-status-complete/50'
  
  switch (status) {
    case 'overdue':
      return 'bg-status-overdue/10 border-status-overdue/50'
    case 'due-soon':
      return 'bg-status-due-soon/10 border-status-due-soon/50'
    default:
      return 'bg-brand-white border-brand-primary/50'
  }
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


export default function ChoreItem({ chore, showActions, status, onEdit }: Props) {
  const [isPending, startTransition] = useTransition()
  const isCompleted = chore.completed_instances === chore.target_instances
  const classes = getStatusClasses(status, isCompleted)

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
    // Modern Chore Card: Subtle shadow, ring-1 for definition
    <div 
      className={`flex items-center justify-between rounded-xl border ring-1 ring-support-light/50 p-4 transition-all ${classes} ${!isCompleted && 'hover:shadow-md'}`}
      // Add a primary color left-border bar for status visual cue
      style={{
        borderLeft: `4px solid ${status === 'overdue' ? '#D92D20' : status === 'due-soon' ? '#FDB022' : isCompleted ? '#079455' : '#ad8ae1'}`,
      }}
    >
      
      {/* --- Left Side: Completion Button and Details --- */}
      <div className="flex flex-1 items-center space-x-4">
        
        {/* Completion Checkbox/Button */}
        <button
          onClick={handleToggleCompletion}
          disabled={isPending}
          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${isCompleted ? 'border-status-complete bg-status-complete' : 'border-brand-primary text-brand-primary hover:bg-brand-primary/10'} transition-all disabled:opacity-50`}
          aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {isCompleted ? (
            <Check className="h-5 w-5 text-brand-white" />
          ) : (
            <Plus className="h-5 w-5 text-brand-primary" />
          )}
        </button>

        {/* Chore Name and Status Info */}
        <div className="flex flex-col space-y-0.5">
          <h4 className="font-heading text-lg font-semibold text-support-dark">
            {chore.name}
            {chore.target_instances > 1 && (
              <span className="ml-2 rounded-full bg-support-dark/10 px-2 py-0.5 text-xs font-medium text-support-dark">
                {chore.completed_instances}/{chore.target_instances}
              </span>
            )}
          </h4>
          
          {/* Metadata Row: Icons and Text */}
          <div className="flex items-center space-x-3 text-sm text-support-dark/70">
            
            {/* Due Date */}
            {chore.due_date && (
              <span className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(chore.due_date)}</span>
              </span>
            )}

            {/* Room */}
            {chore.rooms?.name && (
              <span className="flex items-center space-x-1">
                <Home className="h-4 w-4" />
                <span>{chore.rooms.name}</span>
              </span>
            )}

            {/* Recurrence */}
            {chore.recurrence_type !== 'none' && (
              <span className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{chore.recurrence_type}</span>
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* --- Right Side: Avatar and Menu --- */}
      <div className="flex items-center space-x-3">
        
        {/* Assigned Avatar */}
        {chore.profiles ? (
          <Avatar 
            url={chore.profiles.avatar_url} 
            alt={chore.profiles.full_name} 
            size={36} 
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-support-light flex items-center justify-center">
            <User className="h-5 w-5 text-support-dark/70" />
          </div>
        )}

        {/* Chore Menu */}
        {showActions && (
          <ChoreMenu chore={chore} onEdit={onEdit} />
        )}
      </div>
    </div>
  )
}