// src/components/ChoreItem.tsx
'use client'

import { ChoreWithDetails, DbProfile } from '@/types/database'
import { Check, Clock, Home, Calendar, Loader2, RotateCw, FileText, Coffee, Sun, Moon, User, ChevronDown, ChevronUp, Hand, Lock, ShieldAlert } from 'lucide-react'
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
  status: 'overdue' | 'due' | 'upcoming' | 'completed'
  members?: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'>[]
  currentUserId?: string
}

type OptimisticAction = 
  | { type: 'SET_STATUS'; status: string }
  | { type: 'TOGGLE_SUBTASK'; subtaskId: number }

// --- Helper: Subtask List ---
function SubtaskList({ 
  subtasks, 
  onToggle 
}: { 
  subtasks: ChoreWithDetails[], 
  onToggle: (id: number, currentStatus: string) => void 
}) {
  if (!subtasks || subtasks.length === 0) return null

  return (
    <ul className="mt-3 ml-1 space-y-2 border-l-2 border-border/50 pl-3 animate-in slide-in-from-top-1 fade-in">
      {subtasks.map(st => (
        <li key={st.id} className="flex items-start gap-3 group/sub py-1">
          <button
            onClick={() => onToggle(st.id, st.status)}
            className={`
                mt-0.5 h-5 w-5 rounded border flex items-center justify-center transition-all flex-shrink-0 shadow-sm
                ${st.status === 'complete' 
                  ? 'bg-brand border-brand text-white scale-100' 
                  : 'border-gray-300 hover:border-brand bg-white'}
            `}
          >
            {st.status === 'complete' && <Check className="h-3 w-3" />}
          </button>
          <span 
            className={`
              text-sm transition-all duration-300 leading-tight
              ${st.status === 'complete' ? 'line-through text-text-secondary/60' : 'text-text-primary group-hover/sub:text-foreground'}
            `}
          >
            {st.name}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default function ChoreItem({ chore, showActions, status, members = [], currentUserId = '' }: Props) {
  const [isPending, startTransition] = useTransition()
  const [isNudging, setIsNudging] = useState(false)
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [showSubtasks, setShowSubtasks] = useState(false)
  const [showFullNotes, setShowFullNotes] = useState(false)
  
  const { interact, triggerHaptic } = useGameFeel()

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
  const isHardDeadline = chore.deadline_type === 'hard'

  // Subtask Stats
  const subtasks = optimisticChore.subtasks || []
  const completedSubtasks = subtasks.filter(s => s.status === 'complete').length
  const totalSubtasks = subtasks.length
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

  // Styling Logic
  let cardClasses = 'border-border bg-card'
  let statusIconColor = 'text-text-secondary'

  if (isCompleted) {
    cardClasses = 'border-status-complete/20 bg-status-complete/5'
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

  // Actions
  const handleToggleCompletion = async () => {
    interact(isCompleted ? 'neutral' : 'success')

    // If shared, force modal to attribute credit
    if (!isCompleted && isShared) {
        setIsCompleteModalOpen(true)
        return
    }

    const nextStatus = isCompleted ? 'pending' : 'complete'
    
    startTransition(async () => {
      setOptimisticChore({ type: 'SET_STATUS', status: nextStatus })

      if (nextStatus === 'complete') {
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 }, disableForReducedMotion: true })
      }

      try {
        const result = isCompleted 
          ? await uncompleteChore(chore.id) 
          : await completeChore(chore.id, [currentUserId])

        if (!result.success) {
            toast.error(result.message || 'Failed to update chore')
        } else {
          const toastFn = nextStatus === 'complete' ? toast.success : toast.info
          toastFn(result.message, { description: result.motivation })
        }
      } catch (error) {
        toast.error("Something went wrong.")
      }
    })
  }

  const handleDelayClick = () => {
      if (isHardDeadline) {
          triggerHaptic('heavy') // Error feedback
          toast.error("This chore has a Hard Deadline", {
              description: "It cannot be delayed. You got this!",
              icon: <ShieldAlert className="h-5 w-5 text-red-500" />
          })
          return
      }
      interact('neutral')
      setIsDelayModalOpen(true)
  }

  const handleSubtaskToggle = async (id: number, currentStatus: string) => {
      interact('neutral')
      startTransition(async () => {
          setOptimisticChore({ type: 'TOGGLE_SUBTASK', subtaskId: id })
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
      } catch {
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
          flex flex-col rounded-2xl border p-4
          shadow-sm transition-all duration-200 hover:shadow-md
          ${cardClasses}
          ${isCompleted ? 'opacity-70' : 'opacity-100'}
        `}
      >
        {/* Top Row */}
        <div className="flex items-start justify-between gap-3">
          
          {/* LEFT: Checkbox / Status Button */}
          <div className="flex-shrink-0 pt-1">
             <button
                onClick={handleToggleCompletion}
                disabled={isPending || (totalSubtasks > 0 && progress < 100)}
                className={`
                    group relative flex items-center justify-center transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${isCompleted 
                        ? 'h-8 w-8 rounded-full bg-status-complete text-white' 
                        : 'h-6 w-6 mt-1 rounded-lg border-2 border-text-secondary/40 hover:border-brand hover:bg-brand/5 text-transparent'
                    }
                `}
             >
                {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : isCompleted ? (
                    <Check className="h-5 w-5" />
                ) : (
                    // Hover state hint
                    <div className="hidden group-hover:block w-2 h-2 rounded-full bg-brand/50" />
                )}
             </button>
          </div>

          {/* MIDDLE: Content */}
          <div className="flex flex-col flex-1 min-w-0 gap-1">
              <div className="flex items-start justify-between gap-2">
                  <h4 className={`font-heading text-lg font-bold leading-tight transition-all break-words ${isCompleted ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                    {chore.name}
                  </h4>
                  
                  {/* Avatars */}
                  <div className="flex -space-x-2 overflow-visible flex-shrink-0 pt-0.5">
                    {chore.assignees && chore.assignees.length > 0 ? (
                        chore.assignees.map((p, i) => (
                            <div key={p.id} className="ring-2 ring-white rounded-full z-0 relative" style={{ zIndex: 10 - i }}>
                                <Avatar url={p.avatar_url ?? undefined} alt={p.full_name ?? ''} size={28} />
                            </div>
                        ))
                    ) : (
                        <div className="h-7 w-7 rounded-full bg-gray-100 border border-border flex items-center justify-center">
                            <User className="h-3 w-3 text-text-secondary" />
                        </div>
                    )}
                  </div>
              </div>

              {/* Metadata Pills */}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                  {/* Deadline Pill */}
                  {chore.due_date && (
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${isHardDeadline ? 'bg-red-50 border-red-100 text-red-700' : 'bg-gray-50 border-gray-100 text-text-secondary'}`}>
                        {isHardDeadline ? <Lock className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                        <span>{formatDate(chore.due_date)}</span>
                    </div>
                  )}
                  
                  {/* Time Pill */}
                  {(chore.time_of_day !== 'any' || chore.exact_time) && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium text-text-secondary bg-background border border-border/50">
                          {chore.time_of_day === 'morning' && <Coffee className="h-3 w-3" />}
                          {chore.time_of_day === 'afternoon' && <Sun className="h-3 w-3" />}
                          {chore.time_of_day === 'evening' && <Moon className="h-3 w-3" />}
                          <span>{chore.exact_time ? formatTime(chore.exact_time) : chore.time_of_day}</span>
                      </div>
                  )}

                  {chore.recurrence_type !== 'none' && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium text-text-secondary bg-background border border-border/50">
                          <RotateCw className="h-3 w-3" />
                      </div>
                  )}
              </div>

              {/* Subtasks Progress */}
              {totalSubtasks > 0 && (
                  <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                  className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-brand'}`} 
                                  style={{ width: `${progress}%` }} 
                              />
                          </div>
                          <button 
                            onClick={() => setShowSubtasks(!showSubtasks)}
                            className="text-[10px] font-bold text-text-secondary hover:text-brand flex items-center gap-0.5"
                          >
                              {completedSubtasks}/{totalSubtasks}
                              {showSubtasks ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                      </div>
                      {showSubtasks && <SubtaskList subtasks={subtasks} onToggle={handleSubtaskToggle} />}
                  </div>
              )}

              {/* Notes */}
              {chore.notes && (
                <button 
                    onClick={() => setShowFullNotes(!showFullNotes)}
                    className="mt-2 flex items-start gap-1.5 text-xs text-text-secondary hover:text-text-primary text-left group"
                >
                    <FileText className="h-3 w-3 mt-0.5 flex-shrink-0 opacity-50 group-hover:opacity-100" />
                    <span className={`leading-relaxed ${showFullNotes ? '' : 'line-clamp-1'}`}>
                        {chore.notes}
                    </span>
                </button>
              )}
          </div>
        </div>

        {/* Bottom Actions Row */}
        {showActions && !isCompleted && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                
                {/* Complete Action (Text Button) */}
                <button
                    onClick={handleToggleCompletion}
                    disabled={totalSubtasks > 0 && progress < 100}
                    className="text-sm font-bold text-text-secondary hover:text-brand transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isCompleted ? 'bg-brand border-brand' : 'border-current'}`}>
                        {isCompleted && <Check className="h-3 w-3 text-white" />}
                    </div>
                    Mark Done
                </button>

                <div className="flex items-center gap-1">
                    {/* Nudge */}
                    {showNudge && (
                        <button
                            onClick={handleNudge}
                            disabled={isNudging}
                            className="p-2 rounded-full text-amber-500 hover:bg-amber-50 transition-colors disabled:opacity-50"
                            title="Nudge Assignee"
                        >
                            {isNudging ? <Loader2 className="h-4 w-4 animate-spin" /> : <Hand className="h-4 w-4" />}
                        </button>
                    )}

                    {/* Delay (Conditional) */}
                    <button 
                        onClick={handleDelayClick}
                        className={`
                            p-2 rounded-full transition-colors
                            ${isHardDeadline 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : 'text-text-secondary hover:bg-gray-100 hover:text-brand'}
                        `}
                        title={isHardDeadline ? "Hard deadline cannot be delayed" : "Delay Chore"}
                    >
                        {isHardDeadline ? <Lock className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </button>

                    <ChoreMenu chore={chore} />
                </div>
            </div>
        )}
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