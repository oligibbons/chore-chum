'use client'

import { ChoreWithDetails } from '@/types/database'
import ChoreItem from './ChoreItem'
import { AlertOctagon, AlertTriangle, Calendar, CheckCircle2, PartyPopper, Coffee } from 'lucide-react'

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
        emptyText: "Nothing overdue. Nice!",
        emptyIcon: <CheckCircle2 className="h-8 w-8 text-green-400 mb-2 opacity-50" />
      }
    case 'due':
      return {
        icon: <AlertTriangle className="h-5 w-5 text-status-due" />,
        pillClasses: 'bg-status-due/10 text-status-due',
        emptyText: "You're all caught up for today!",
        emptyIcon: <Coffee className="h-8 w-8 text-brand/40 mb-2" />
      }
    case 'completed':
      return {
        icon: <CheckCircle2 className="h-5 w-5 text-status-complete" />,
        pillClasses: 'bg-status-complete/10 text-status-complete',
        emptyText: "No completed chores yet.",
        emptyIcon: <div className="h-8 w-8 rounded-full border-2 border-dashed border-gray-300 mb-2" />
      }
    default:
      return {
        icon: <Calendar className="h-5 w-5 text-text-secondary" />,
        pillClasses: 'bg-gray-100 text-text-secondary',
        emptyText: "Nothing scheduled.",
        emptyIcon: <Calendar className="h-8 w-8 text-gray-300 mb-2" />
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
              status={status === 'completed' ? 'upcoming' : status} 
              showActions={true}
            />
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-border/60 bg-card/30 p-8 text-center flex flex-col items-center justify-center min-h-[140px]">
          {config.emptyIcon}
          <p className="font-medium text-text-secondary text-sm">
            {config.emptyText}
          </p>
        </div>
      )}
    </div>
  )
}