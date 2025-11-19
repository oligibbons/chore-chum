'use client'

import { ChoreWithDetails } from '@/types/database'
import ChoreItem from './ChoreItem'
import { AlertOctagon, AlertTriangle, Calendar, CheckCircle2 } from 'lucide-react'

type Props = {
  title: string
  chores: ChoreWithDetails[]
  status: 'overdue' | 'due' | 'upcoming' | 'completed'
}

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
    case 'completed':
      return {
        icon: <CheckCircle2 className="h-5 w-5 text-status-complete" />,
        pillClasses: 'bg-status-complete/10 text-status-complete',
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

  // REMOVED: The check that returned null if chores.length === 0
  // This ensures the column always renders, maintaining the grid layout.

  return (
    <div className="flex flex-col space-y-4">
      
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

      {chores.length > 0 ? (
        <ul className="space-y-3">
          {chores.map((chore) => (
            <ChoreItem
              key={chore.id}
              chore={chore}
              // If status is completed, we pass 'upcoming' to ChoreItem purely to avoid 
              // breaking its internal prop types, but ChoreItem will see the chore is 
              // actually complete via its properties and style it green automatically.
              status={status === 'completed' ? 'upcoming' : status} 
              showActions={true}
            />
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-border bg-card/50 p-8 text-center">
          <p className="font-medium text-text-secondary">
            {status === 'overdue'
              ? 'Nothing overdue. Nice!'
              : status === 'due'
              ? 'Nothing due soon!'
              : status === 'completed'
              ? 'No completed chores yet.'
              : 'All caught up!'}
          </p>
        </div>
      )}
    </div>
  )
}