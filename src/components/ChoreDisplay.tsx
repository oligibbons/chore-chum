// src/components/ChoreDisplay.tsx
'use client'

import { ChoreWithDetails } from '@/types/database'
import ChoreItem from './ChoreItem'
import { AlertOctagon, AlertTriangle, Calendar } from 'lucide-react' // Icons for headers

type Props = {
  title: string
  chores: ChoreWithDetails[]
  status: 'overdue' | 'due' | 'upcoming'
}

// Helper to get styling for each column
const getStatusConfig = (status: Props['status']) => {
  switch (status) {
    case 'overdue':
      return {
        icon: <AlertOctagon className="h-5 w-5 text-status-overdue" />,
        pillClasses: 'bg-status-overdue/10 text-status-overdue',
      }
    case 'due':
      return {
        icon: <AlertTriangle className="h-5 w-5 text-status-due" />,
        pillClasses: 'bg-status-due/10 text-status-due',
      }
    default:
      return {
        icon: <Calendar className="h-5 w-5 text-text-secondary" />,
        pillClasses: 'bg-gray-100 text-text-secondary',
      }
  }
}

export default function ChoreDisplay({
  title,
  chores,
  status,
}: Props) {
  const config = getStatusConfig(status)

  return (
    // NEW: Column layout
    <div className="flex flex-col space-y-4">
      
      {/* NEW: Playful header with pill count */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {config.icon}
          <h3 className="font-heading text-xl font-semibold">
            {title}
          </h3>
        </div>
        <span 
          className={`rounded-full px-3 py-0.5 text-sm font-bold ${config.pillClasses}`}
        >
          {chores.length}
        </span>
      </div>

      {/* Chore list or empty state */}
      {chores.length > 0 ? (
        <ul className="space-y-3">
          {chores.map((chore) => (
            <ChoreItem
              key={chore.id}
              chore={chore}
              status={status}
              showActions={true}
            />
          ))}
        </ul>
      ) : (
        // NEW: Clean "empty" state card
        <div className="rounded-xl border-2 border-dashed border-border bg-card/50 p-8 text-center">
          <p className="font-medium text-text-secondary">
            {status === 'overdue'
              ? 'Nothing overdue. Nice!'
              : status === 'due'
              ? 'Nothing due soon!'
              : 'All caught up!'}
          </p>
        </div>
      )}
    </div>
  )
}