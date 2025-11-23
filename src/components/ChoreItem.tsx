// src/components/ChoreItem.tsx
'use client'

import { ChoreWithDetails, DbProfile } from '@/types/database'
import { Check, Clock, Home, Calendar, Loader2, RotateCw, FileText, Coffee, Sun, Moon, User, ChevronDown, ChevronUp, Hand } from 'lucide-react'
import { useTransition, useState, useOptimistic } from 'react'
import { completeChore, uncompleteChore, toggleChoreStatus, nudgeUser } from '@/app/chore-actions'
import ChoreMenu from './ChoreMenu'
import Avatar from './Avatar'
import CompleteChoreModal from './CompleteChoreModal'
import DelayChoreModal from './DelayChoreModal'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'
import { useGameFeel } from '@/hooks/use-game-feel'

// --- Types ---
type ChoreWithSubtasks = ChoreWithDetails & {
    subtasks?: ChoreWithDetails[]
}

type Props = {
  chore: ChoreWithSubtasks
  showActions: boolean
  status: 'overdue' | 'due' | 'upcoming'
  members?: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'>[]
  currentUserId?: string
}

type OptimisticAction = 
  | { type: 'SET_STATUS'; status: string }
  | { type: 'TOGGLE_SUBTASK'; subtaskId: number }

// --- Helper Components (Architecture Fix) ---

function SubtaskList({ 
  subtasks, 
  onToggle 
}: { 
  subtasks: ChoreWithDetails[], 
  onToggle: (id: number, currentStatus: string) => void 
}) {
  if (!subtasks || subtasks.length === 0) return null

  return (
    <ul className="mt-4 ml-4 space-y-2 border-l-2 border-gray-100 pl-4 animate-in slide-in-from-top-2 fade-in">
      {subtasks.map(st => (
        <li key={st.id} className="flex items-center gap-3 group/sub">
          <button
            onClick={() => onToggle(st.id, st.status)}
            className={`
                h-5 w-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 shadow-sm
                ${st.status === 'complete' 
                  ? 'bg-brand border-brand text-white scale-105' 
                  : 'border-gray-300 hover:border-brand bg-white'}
            `}
          >
            {st.status === 'complete' && <Check className="h-3 w-3" />}
          </button>
          <span 
            className={`
              text-sm transition-all duration-300 
              ${st.status === 'complete' ? 'line-through text-gray-400' : 'text-gray-700 group-hover/sub:text-black'}
            `}
          >
            {st.name}
          </span>
        </li>
      ))}
    </ul>
  )
}

// --- Main Component ---

export default function ChoreItem({ chore, showActions, status, members = [], currentUserId = '' }: Props) {
  const [isPending, startTransition] = useTransition()
  const [isNudging, setIsNudging] = useState(false)
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [showSubtasks, setShowSubtasks] = useState(false)
  const [showFullNotes, setShowFullNotes] = useState(false)
  
  const { interact, triggerHaptic } = useGameFeel()

  // 1. Advanced Optimistic Reducer (Quick Win #4)
  const [optimisticChore, setOptimisticChore] = useOptimistic(
    chore,
    (state, action: OptimisticAction) => {
      switch (action.type) {
        case 'SET_STATUS':
          return { ...state, status: action.status }
        case 'TOGGLE_SUBTASK':
          return {
            ...state,
            subtasks: state.subtasks?.map(s => 
              s.id === action.subtaskId 
                ? { ...s, status: s.status === 'complete' ? 'pending' : 'complete' }
                : s
            )
          }
        default:
          return state
      }
    }
  )

  const isCompleted = optimisticChore.status === 'complete'
  const isShared = (chore.assigned_to?.length ?? 0) > 1
  const isAssignedToOthers = chore.assigned_to && chore.assigned_to.some(id => id !== currentUserId)
  const showNudge = !isCompleted && isAssignedToOthers && showActions

  // Subtask Progress Calculation
  const subtasks = optimisticChore.subtasks || []
  const completedSubtasks = subtasks.filter(s => s.status === 'complete').length
  const totalSubtasks = subtasks.length
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

  // Visual Styles based on Status
  let cardClasses = 'border-border bg-card'
  let statusIconColor = 'text-text-secondary'

  if (isCompleted) {
    cardClasses = 'border-status-complete/30 bg-status-complete/5'
    statusIconColor = 'text-status-complete'
  } else {
    switch (status) {
      case 'overdue':
        cardClasses = 'border-status-overdue/30 bg-status-overdue/5'
        statusIconColor = 'text-status-overdue'
        break
      case 'due':
        cardClasses = 'border-status-due/40 bg-status-due/5'
        statusIconColor = 'text-status-due'
        break
      default:
        cardClasses = 'border-border bg-card hover:border-brand/30'
    }
  }

  // Handlers
  const handleToggleCompletion = async () => {
    interact(isCompleted ? 'neutral' : 'success')

    if (!isCompleted && isShared) {
        setIsCompleteModalOpen(true)
        return
    }

    const nextStatus = isCompleted ? 'pending' : 'complete'
    
    startTransition(async () => {
      setOptimisticChore({ type: 'SET_STATUS', status: nextStatus })

      if (nextStatus === 'complete') {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, disableForReducedMotion: true })
      }

      try {
        const result = isCompleted 
          ? await uncompleteChore(chore.id) 
          : await completeChore(chore.id, [currentUserId])

        if (!result.success) {
            toast.error(result.message || 'Failed to update chore')
            // Revert is automatic via Next.js server action rollback if error throws, 
            // but manual revert might be needed if action returns { success: false }
        } else {
          const toastFn = nextStatus === 'complete' ? toast.success : toast.info
          toastFn(result.message, { description: result.motivation })
        }
      } catch (error) {
        toast.error("Something went wrong.")
      }
    })
  }

  const handleSubtaskToggle = async (id: number, currentStatus: string) => {
      // Immediate tactile feedback
      interact('neutral')
      
      startTransition(async () => {
          // 1. Optimistic Update
          setOptimisticChore({ type: 'TOGGLE_SUBTASK', subtaskId: id })
          
          // 2. Server Action
          await toggleChoreStatus({ id, status: currentStatus } as any)
      })
  }

  const handleNudge = async () => {
      const targetId = chore.assigned_to?.find(id => id !== currentUserId)
      if (!targetId) return

      setIsNudging(true)
      triggerHaptic('light')
      
      try {
          const res = await nudgeUser(chore.id, targetId)
          if (res.success) toast.success(res.message)
          else toast.error("Failed to nudge")
      } catch (e) {
          toast.error("Could not send nudge")
      } finally {
          setIsNudging(false)
      }
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    return new Date(0, 0, 0, +hours, +minutes).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'No due date'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-GB', { month: 'short', day: 'numeric' }).format(date)
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
        {/* Top Row: Checkbox + Content + Avatars */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            
            {/* Main Checkbox */}
            <button
              onClick={handleToggleCompletion}
              disabled={isPending || (totalSubtasks > 0 && progress < 100)}
              aria-label={isCompleted ? `Mark ${chore.name} as pending` : `Mark ${chore.name} as complete`}
              className={`
                group flex h-8 w-8 flex-shrink-0 items-center justify-center
                rounded-full border-2 transition-all duration-200
                active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed
                ${isCompleted 
                    ? 'bg-status-complete border-status-complete text-white' 
                    : 'bg-transparent border-gray-300 text-transparent hover:border-brand hover:text-brand/30'}
              `}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-current" />
              ) : (
                <Check className={`h-4 w-4 ${isCompleted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
              )}
            </button>
            
            <div className="flex flex-col pt-1 flex-1 min-w-0">
              <h4 className={`font-heading text-lg font-semibold transition-all decoration-2 decoration-text-secondary/50 break-words ${isCompleted ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                {chore.name}
              </h4>
              
              {/* Time Tags */}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                  {chore.time_of_day && chore.time_of_day !== 'any' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary bg-background/50 px-1.5 py-0.5 rounded capitalize">
                          {chore.time_of_day === 'morning' && <Coffee className="h-3 w-3" />}
                          {chore.time_of_day === 'afternoon' && <Sun className="h-3 w-3" />}
                          {chore.time_of_day === 'evening' && <Moon className="h-3 w-3" />}
                          {chore.time_of_day}
                      </span>
                  )}
                  {chore.exact_time && (
                       <span className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary bg-background/50 px-1.5 py-0.5 rounded">
                          <Clock className="h-3 w-3" /> {formatTime(chore.exact_time)}
                      </span>
                  )}
              </div>

              {/* Subtask Progress Bar */}
              {totalSubtasks > 0 && (
                  <div className="mt-3 w-full max-w-[240px]">
                      <div className="flex justify-between text-xs text-text-secondary mb-1 font-medium">
                          <span>{completedSubtasks}/{totalSubtasks} steps</span>
                          <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div 
                              className={`h-full transition-all duration-500 ease-out ${progress === 100 ? 'bg-green-500' : 'bg-brand'}`}
                              style={{ width: `${progress}%` }}
                          />
                      </div>
                      <button 
                          onClick={() => setShowSubtasks(!showSubtasks)}
                          className="text-xs text-brand font-bold mt-2 flex items-center gap-1 hover:underline"
                      >
                          {showSubtasks ? 'Hide Steps' : 'Show Steps'}
                          {showSubtasks ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                  </div>
              )}

              {/* Notes */}
              {chore.notes && (
                <div className="mt-2">
                    <button 
                        onClick={() => setShowFullNotes(!showFullNotes)}
                        className="flex items-start gap-1 text-sm text-text-secondary hover:text-brand text-left group w-full"
                    >
                        <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span className={`break-words ${showFullNotes ? '' : 'line-clamp-2'}`}>
                            {chore.notes}
                        </span>
                    </button>
                </div>
              )}
            </div>
          </div>

          {/* Avatars */}
          <div className="flex -space-x-2 overflow-visible pl-2 py-1 flex-shrink-0">
            {chore.assignees && chore.assignees.length > 0 ? (
                chore.assignees.map((p, i) => (
                    <div 
                      key={p.id} 
                      className="ring-2 ring-white rounded-full z-0 relative hover:z-10 transition-all hover:scale-110 shadow-sm" 
                      style={{ zIndex: 10 - i }}
                      title={`Assigned to ${p.full_name}`}
                    >
                        <Avatar url={p.avatar_url ?? undefined} alt={p.full_name ?? ''} size={32} />
                    </div>
                ))
            ) : (
                <div className="h-8 w-8 rounded-full bg-gray-100 border border-border flex items-center justify-center">
                    <User className="h-4 w-4 text-text-secondary" />
                </div>
            )}
          </div>
        </div>

        {/* Collapsible Subtasks List (Extracted Component) */}
        {showSubtasks && (
            <SubtaskList subtasks={subtasks} onToggle={handleSubtaskToggle} />
        )}

        {/* Footer Info & Actions */}
        <div className="mt-4 flex items-end justify-between border-t border-border/50 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {chore.due_date && (
              <div className={`flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-bold ${statusIconColor} bg-gray-50 border border-gray-100`}>
                <Calendar className="h-3 w-3" />
                <span>{formatDate(chore.due_date)}</span>
              </div>
            )}
            {chore.rooms?.name && (
              <div className="flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium text-text-secondary bg-gray-50 border border-gray-100">
                <Home className="h-3 w-3" />
                <span>{chore.rooms.name}</span>
              </div>
            )}
            {chore.recurrence_type !== 'none' && (
              <div className="flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium text-text-secondary bg-gray-50 border border-gray-100">
                <RotateCw className="h-3 w-3" />
                <span className="capitalize">
                    {chore.recurrence_type.startsWith('custom') 
                        ? 'Recurring' 
                        : chore.recurrence_type}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Nudge Button */}
            {showNudge && (
                <button
                    onClick={handleNudge}
                    disabled={isNudging}
                    className="rounded-full p-1.5 text-amber-500 hover:bg-amber-50 transition-colors disabled:opacity-50"
                    title="Nudge Assignee"
                >
                    {isNudging ? <Loader2 className="h-4 w-4 animate-spin" /> : <Hand className="h-4 w-4" />}
                </button>
            )}

            {!isCompleted && showActions && (
              <button 
                onClick={() => { interact('neutral'); setIsDelayModalOpen(true) }}
                className="rounded-full p-1.5 text-text-secondary hover:bg-gray-100 hover:text-brand transition-colors"
                title="Delay Chore"
              >
                <Clock className="h-4 w-4" />
              </button>
            )}
            {showActions && <ChoreMenu chore={chore} />}
          </div>
        </div>
      </li>

      {/* Modals */}
      <DelayChoreModal 
        isOpen={isDelayModalOpen} 
        onClose={() => setIsDelayModalOpen(false)} 
        choreId={chore.id} 
      />
      
      <CompleteChoreModal 
        isOpen={isCompleteModalOpen} 
        onClose={() => setIsCompleteModalOpen(false)} 
        chore={chore} 
        members={members}
        currentUserId={currentUserId}
      />
    </>
  )
}