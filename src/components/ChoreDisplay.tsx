// components/ChoreDisplay.tsx
'use client'

import { ChoreWithDetails } from '@/types/database'
import ChoreItem from './ChoreItem'

// This component is now just for the 3-column dashboard layout

type Props = {
  title: string
  chores: ChoreWithDetails[]
  status: string
  showActions: boolean
  // onEdit is no longer needed, ChoreItem/ChoreMenu will use <Link>
}

// Helper to map status to Tailwind classes
const getStatusClasses = (status: string): string => {
  switch (status) {
    case 'overdue':
      return 'border-b-2 border-status-overdue/20 text-status-overdue'
    case 'due-soon':
      return 'border-b-2 border-status-due-soon/20 text-status-due-soon'
    default:
      return 'border-b-2 border-support-light/50 text-support-dark'
  }
}

export default function ChoreDisplay({
  title,
  chores,
  status,
  showActions,
}: Props) {
  const classes = getStatusClasses(status)

  // No more realtime, no more modals, no more state.
  // Just render the list passed to it.

  return (
    <div>
      <h3 className={`mb-4 pb-2 font-heading text-2xl font-semibold ${classes}`}>
        {title}
      </h3>
      {chores.length > 0 ? (
        <ul className="space-y-4">
          {chores.map((chore) => (
            <ChoreItem
              key={chore.id}
              chore={chore}
              // onEdit is removed. ChoreMenu will handle its own link.
              status={status}
              showActions={showActions}
            />
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-support-light p-8 text-center text-support-dark/60">
          {status === 'overdue'
            ? 'Nothing overdue!'
            : status === 'due-soon'
            ? 'Nothing due soon!'
            : 'Nothing upcoming!'}
        </p>
      )}
    </div>
  )
}