// components/ChoreItem.tsx

'use client'

import { useTransition } from 'react'
import { ChoreWithDetails, DbChore } from '@/types/database'
import {
  toggleChoreStatus,
  incrementChoreInstance,
  decrementChoreInstance,
} from '@/app/chore-actions'
import { Check, Plus, Minus } from 'lucide-react'
import confetti from 'canvas-confetti'
import ChoreMenu from './ChoreMenu' // Import the new menu

// --- Confetti Animation ---
const fireConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#b02e46', '#ad8ae1', '#cccecf', '#303030'],
  })
}

// --- Helper to format dates ---
const formatDate = (dateString?: string | null) => {
  if (!dateString) return 'No due date'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'No due date'
  return date.toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

type Props = {
  chore: ChoreWithDetails
  onEdit: (chore: ChoreWithDetails) => void
}

export default function ChoreItem({ chore, onEdit }: Props) {
  const [isPending, startTransition] = useTransition()

  const isOverdue =
    chore.due_date &&
    new Date(chore.due_date) < new Date() &&
    chore.status !== 'complete'
  
  const statusClasses =
    chore.status === 'complete'
      ? 'border-status-complete/30 bg-status-complete/5'
      : isOverdue
      ? 'border-status-overdue/30 bg-status-overdue/5'
      : 'border-support-light bg-brand-white'
  
  const handleAction = (
    action: (chore: DbChore) => Promise<any>
  ) => {
    startTransition(async () => {
      try {
        // We must pass the raw 'chore' object to the action
        const result = await action(chore as DbChore)
        if (result.success && result.didComplete) {
          fireConfetti()
        }
      } catch (error) {
        console.error(error)
      }
    })
  }
  
  // --- THIS IS THE FIX ---
  // Use ?? to treat null as 1 or 0 before comparing
  const targetInstances = chore.target_instances ?? 1
  const completedInstances = chore.completed_instances ?? 0
  const isMultiInstance = targetInstances > 1
  // --- END OF FIX ---

  const isComplete = chore.status === 'complete'

  return (
    <li
      className={`flex items-center justify-between gap-4 rounded-xl border p-4 shadow-sm ${statusClasses} ${
        isPending ? 'opacity-50 blur-sm' : 'transition-all'
      }`}
    >
      <div className="flex flex-1 items-center gap-3 overflow-hidden">
        {/* Interaction Button(s) */}
        {isMultiInstance ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAction(decrementChoreInstance)}
              disabled={isPending || completedInstances === 0}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-support-light text-support-light transition-all hover:border-brand-primary hover:text-brand-primary disabled:opacity-30"
            >
              <Minus className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleAction(incrementChoreInstance)}
              disabled={isPending || isComplete}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-brand-secondary text-brand-secondary transition-all hover:bg-brand-secondary hover:text-white disabled:opacity-30"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleAction(toggleChoreStatus)}
            disabled={isPending}
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all
            ${
              isComplete
                ? 'border-brand-secondary bg-brand-secondary text-white'
                : 'border-support-light text-support-light hover:border-brand-secondary hover:text-brand-secondary'
            }`}
          >
            {isComplete && <Check className="h-5 w-5" />}
          </button>
        )}

        {/* Chore Details */}
        <div className="flex-1 overflow-hidden">
          <h3 className="truncate font-heading text-lg font-semibold text-support-dark">
            {chore.name}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-support-dark/80">
            {isMultiInstance && (
              <span className="font-bold text-brand-secondary">{`${completedInstances} / ${targetInstances} done`}</span>
            )}
            <span className={isOverdue ? 'font-bold text-status-overdue' : ''}>
              {formatDate(chore.due_date)}
            </span>
            {chore.rooms && (
              <>
                <span className="hidden sm:inline">|</span>
                <span>{chore.rooms.name}</span>
              </>
            )}
            {chore.profiles && (
              <>
                <span className="hidden sm:inline">|</span>
                <span>{chore.profiles.full_name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit/Delete Menu */}
      <ChoreMenu chore={chore} onEdit={() => onEdit(chore)} />
    </li>
  )
}