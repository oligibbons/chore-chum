'use client'

import { ChoreWithDetails } from '@/types/database'
import { Check, Clock, User, Home, Calendar, Loader2, RotateCw, FileText } from 'lucide-react'
import { useTransition, useState } from 'react'
import { completeChore, uncompleteChore } from '@/app/chore-actions'
import ChoreMenu from './ChoreMenu'
import Avatar from './Avatar'
import DelayChoreModal from './DelayChoreModal'
import confetti from 'canvas-confetti'

type Props = {
  chore: ChoreWithDetails
  showActions: boolean
  status: 'overdue' | 'due' | 'upcoming'
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'No due date'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export default function ChoreItem({ chore, showActions, status }: Props) {
  const [isPending, startTransition] = useTransition()
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false)
  
  const isCompleted = chore.completed_instances === (chore.target_instances ?? 1)

  // --- Dynamic Styling Logic ---
  let cardClasses = 'border-border bg-card' // Default
  let buttonClasses = 'border-border text-text-secondary hover:text-brand hover:border-brand'
  let statusIconColor = 'text-text-secondary'

  if (isCompleted) {
    // Green for Success
    cardClasses = 'border-status-complete/30 bg-status-complete/5'
    buttonClasses = 'bg-status-complete text-white border-status-complete ring-2 ring-status-complete/20'
    statusIconColor = 'text-status-complete'
  } else {
    switch (status) {
      case 'overdue':
        // Red for Danger
        cardClasses = 'border-status-overdue/30 bg-status-overdue/5'
        buttonClasses = 'border-status-overdue text-status-overdue hover:bg-status-overdue hover:text-white'
        statusIconColor = 'text-status-overdue'
        break
      case 'due':
        // Amber for Warning
        cardClasses = 'border-status-due/40 bg-status-due/5'
        buttonClasses = 'border-status-due text-status-due hover:bg-status-due hover:text-white'
        statusIconColor = 'text-status-due'
        break
      default:
        // Standard Gray/White
        cardClasses = 'border-border bg-card hover:border-brand/30'
    }
  }

  const handleToggleCompletion = () => {
    if (isCompleted) {
      startTransition(() => {
        uncompleteChore(chore.id)
      })
    } else {
      // Fire confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#a78bfa', '#fbbf24', '#34d399', '#f87171'], // Purple, Amber, Green, Red
        disableForReducedMotion: true
      })
      
      startTransition(() => {
        completeChore(chore.id)
      })
    }
  }

  return (
    <>
      <li 
        className={`
          flex flex-col rounded-xl border p-4
          shadow-sm transition-all duration-200 hover:shadow-md
          ${cardClasses}
          ${isCompleted ? 'opacity-80' : 'opacity-100'}
        `}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <button
              onClick={handleToggleCompletion}
              disabled={isPending}
              className={`
                flex h-10 w-10 flex-shrink-0 items-center justify-center
                rounded-full border-2 transition-all duration-200
                active:scale-90 disabled:opacity-50
                ${buttonClasses}
              `}
              aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isCompleted ? (
                <Check className="h-5 w-5" />
              ) : (
                <div className="h-1.5 w-1.5 rounded-full bg-current opacity-0 transition-opacity hover:opacity-100" />
              )}
            </button>
            
            <div className="flex flex-col pt-1.5">
              <h4 
                className={`font-heading text-lg font-semibold transition-all decoration-2 decoration-text-secondary/50 ${isCompleted ? 'line-through text-text-secondary' : 'text-text-primary'}`}
              >
                {chore.name}
              </h4>
              
              {/* NEW: Notes display */}
              {chore.notes && (
                <div className="flex items-start gap-1 text-sm text-text-secondary mt-0.5">
                    <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <p className="line-clamp-2">{chore.notes}</p>
                </div>
              )}

              {(chore.target_instances ?? 1) > 1 && (
                <span className="text-sm font-medium text-text-secondary mt-1">
                  {chore.completed_instances ?? 0} / {chore.target_instances ?? 1} completed
                </span>
              )}
            </div>
          </div>

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

        <div className="mt-4 flex items-end justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {chore.due_date && (
              <div className={`flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-sm font-medium ${statusIconColor}`}>
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(chore.due_date)}</span>
              </div>
            )}
            {chore.rooms?.name && (
              <div className="flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-sm font-medium text-text-secondary">
                <Home className="h-3.5 w-3.5" />
                <span>{chore.rooms.name}</span>
              </div>
            )}
            {chore.recurrence_type !== 'none' && (
              <div className="flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-sm font-medium text-text-secondary">
                <RotateCw className="h-3.5 w-3.5" />
                <span className="capitalize">{chore.recurrence_type}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Delay Button */}
            {!isCompleted && showActions && (
              <button 
                onClick={() => setIsDelayModalOpen(true)}
                className="rounded-full p-2 text-text-secondary transition-all hover:bg-background hover:text-brand"
                title="Delay Chore"
              >
                <Clock className="h-5 w-5" />
              </button>
            )}

            {showActions && (
              <ChoreMenu chore={chore} />
            )}
          </div>
        </div>
      </li>

      <DelayChoreModal 
        isOpen={isDelayModalOpen} 
        onClose={() => setIsDelayModalOpen(false)} 
        choreId={chore.id} 
      />
    </>
  )
}