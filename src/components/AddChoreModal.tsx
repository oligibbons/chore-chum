// src/components/AddChoreModal.tsx
'use client'

import { Fragment, useState, FormEvent, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Loader2, User, Home, Calendar, Repeat, Wand2, Clock, Coffee, Sun, Moon, PlusCircle, Check, Copy, Trash2, Ban } from 'lucide-react'
import { createChore } from '@/app/chore-actions'
import { DbProfile, DbRoom } from '@/types/database'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { parseChoreInput } from '@/lib/smart-parser'
import { useGameFeel } from '@/hooks/use-game-feel'
import Avatar from './Avatar'

type Props = {
  isOpen: boolean
  members: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'>[]
  rooms: DbRoom[]
  currentUserId: string
}

type TimeOption = 'morning' | 'afternoon' | 'evening' | 'any';

function ChoreForm({ 
  closeModal, 
  members, 
  rooms,
  currentUserId
}: { 
  closeModal: () => void, 
  members: Props['members'], 
  rooms: Props['rooms'],
  currentUserId: string
}) {
  const [pending, setPending] = useState(false)
  const [smartInput, setSmartInput] = useState('')
  const { interact, triggerHaptic } = useGameFeel()
  const [isShaking, setIsShaking] = useState(false)
  
  // State
  const [name, setName] = useState('')
  const [assignedIds, setAssignedIds] = useState<string[]>([])
  const [roomId, setRoomId] = useState('')
  
  // Date States
  const [dueDate, setDueDate] = useState('')
  const [hasDueDate, setHasDueDate] = useState(true)
  
  const [timeOfDay, setTimeOfDay] = useState<TimeOption>('any')
  
  // Advanced Recurrence State
  const [recurrenceFreq, setRecurrenceFreq] = useState('none')
  const [recurrenceInterval, setRecurrenceInterval] = useState(1)
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')
  
  // Instance State
  const [instanceCount, setInstanceCount] = useState(1)

  // Subtasks State
  const [subtasks, setSubtasks] = useState<string[]>([])
  const [newSubtask, setNewSubtask] = useState('')

  const suggestions = [
    "Wash dishes tonight",
    "Take out trash",
    "Vacuum living room",
    "Water plants every 3 days",
    "Laundry this weekend",
    "Clean my room"
  ]

  const toggleMember = (id: string) => {
    interact('neutral')
    setAssignedIds(prev => 
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const addSubtask = () => {
    if(newSubtask.trim()) {
        setSubtasks([...subtasks, newSubtask.trim()])
        setNewSubtask('')
    }
  }

  // Helper to clear due date
  const clearDueDate = () => {
      setDueDate('')
      setHasDueDate(false)
  }

  // Helper to enable due date
  const enableDueDate = () => {
      setHasDueDate(true)
      if (!dueDate) setDueDate(new Date().toISOString().split('T')[0])
  }

  // Smart Parsing Logic
  useEffect(() => {
    const timer = setTimeout(() => {
        if (!smartInput.trim()) return

        const parsed = parseChoreInput(smartInput, members, rooms, currentUserId)
        
        if (parsed.name) setName(parsed.name)
        if (parsed.roomId) setRoomId(parsed.roomId.toString())
        if (parsed.assignedTo) setAssignedIds([parsed.assignedTo]) 
        
        if (parsed.recurrence) {
            if (parsed.recurrence.startsWith('custom:')) {
                const parts = parsed.recurrence.split(':')
                setRecurrenceFreq(parts[1])
                setRecurrenceInterval(parseInt(parts[2]) || 1)
            } else {
                setRecurrenceFreq(parsed.recurrence)
                setRecurrenceInterval(1)
            }
        }
        
        if (parsed.dueDate) {
            setDueDate(parsed.dueDate)
            setHasDueDate(true)
        }
        if (parsed.timeOfDay) setTimeOfDay(parsed.timeOfDay)

    }, 600) 

    return () => clearTimeout(timer)
  }, [smartInput, members, rooms, currentUserId])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    if (!name.trim()) {
        setIsShaking(true)
        triggerHaptic('medium')
        toast.error("Please give your chore a name")
        setTimeout(() => setIsShaking(false), 500)
        return
    }

    setPending(true)
    
    const formData = new FormData(event.currentTarget)
    formData.append('timeOfDay', timeOfDay)
    formData.append('assignedTo', JSON.stringify(assignedIds))
    formData.append('instances', instanceCount.toString())
    formData.append('subtasks', JSON.stringify(subtasks))

    if (!hasDueDate) {
        formData.delete('dueDate')
    }

    // Construct Recurrence String
    let finalRecurrence = 'none'
    if (recurrenceFreq !== 'none') {
        const base = recurrenceInterval > 1 
            ? `custom:${recurrenceFreq}:${recurrenceInterval}` 
            : recurrenceFreq
        
        // If end date exists, force custom format to include it
        if (recurrenceEndDate) {
            const safeBase = recurrenceInterval === 1 && !base.startsWith('custom') 
                ? `custom:${recurrenceFreq}:1` 
                : base.startsWith('custom') ? base : `custom:${recurrenceFreq}:${recurrenceInterval}`
            
            finalRecurrence = `${safeBase}:${recurrenceEndDate}`
        } else {
            finalRecurrence = base
        }
    }
    formData.set('recurrence_type', finalRecurrence)

    try {
      const result = await createChore(formData)
      
      if (result.success) {
        toast.success(result.message)
        closeModal()
      } else {
        toast.error(result.message)
        setPending(false)
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* SMART INPUT HERO */}
      <div className="relative space-y-3">
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Wand2 className="h-5 w-5 text-brand animate-pulse" />
            </div>
            <input
                type="text"
                value={smartInput}
                onChange={(e) => setSmartInput(e.target.value)}
                placeholder="e.g. 'Water plants every 3 days until Dec 25'"
                className="block w-full rounded-2xl border-2 border-brand/20 bg-brand/5 p-4 pl-10 text-lg font-medium placeholder:text-text-secondary/50 focus:border-brand focus:ring-brand transition-all"
                autoFocus
            />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar mask-gradient">
            {suggestions.map(s => (
                <button
                    key={s}
                    type="button"
                    onClick={() => setSmartInput(s)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-text-secondary hover:bg-brand-light hover:text-brand transition-colors whitespace-nowrap flex-shrink-0"
                >
                    <PlusCircle className="h-3 w-3" />
                    {s}
                </button>
            ))}
        </div>
      </div>

      <div className="h-px bg-border w-full" />

      {/* NAME FIELD */}
      <div>
        <label htmlFor="name" className="block font-heading text-sm font-medium text-text-primary">
          Chore Name
        </label>
        <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`mt-1 block w-full rounded-xl border bg-background p-3 transition-all focus:border-brand focus:ring-brand ${isShaking ? 'border-red-500 ring-2 ring-red-200 animate-shake' : 'border-border'}`}
        />
      </div>

      {/* ASSIGN TO */}
      <div>
        <label className="block font-heading text-sm font-medium text-text-primary mb-2">
          Assign To
        </label>
        <div className="flex flex-wrap gap-3">
            <button
                type="button"
                onClick={() => setAssignedIds([])}
                className={`
                    flex items-center gap-2 px-3 py-2 rounded-xl border transition-all
                    ${assignedIds.length === 0 
                        ? 'bg-brand-light border-brand text-brand shadow-sm' 
                        : 'bg-white border-border text-text-secondary hover:border-brand/50'}
                `}
            >
                <User className="h-5 w-5" />
                <span className="text-sm font-bold">Anyone</span>
            </button>
            
            {members.map(m => {
                const isSelected = assignedIds.includes(m.id)
                return (
                    <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleMember(m.id)}
                        className={`
                            relative flex items-center gap-2 pr-3 rounded-xl border transition-all overflow-hidden
                            ${isSelected 
                                ? 'bg-brand-light border-brand ring-1 ring-brand shadow-sm' 
                                : 'bg-white border-border hover:border-brand/50'}
                        `}
                    >
                        <Avatar url={m.avatar_url} alt={m.full_name || ''} size={40} />
                        <span className={`text-sm font-bold ${isSelected ? 'text-brand-dark' : 'text-text-secondary'}`}>
                            {m.full_name?.split(' ')[0]}
                        </span>
                        {isSelected && (
                            <div className="absolute top-0 right-0 bg-brand text-white rounded-bl-lg p-0.5">
                                <Check className="h-3 w-3" />
                            </div>
                        )}
                    </button>
                )
            })}
        </div>
      </div>

      {/* ROOM & DUE DATE */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="roomId" className="block font-heading text-sm font-medium text-text-primary">
            Room
          </label>
          <div className="relative mt-1">
            <Home className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
            <select
              id="roomId"
              name="roomId"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="mt-1 block w-full appearance-none rounded-xl border-border bg-background p-3 pl-10 transition-all focus:border-brand focus:ring-brand"
            >
              <option value="">No Room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center">
            <label htmlFor="dueDate" className="block font-heading text-sm font-medium text-text-primary">
                Due Date
            </label>
            {!hasDueDate ? (
                <button type="button" onClick={enableDueDate} className="text-xs text-brand font-semibold hover:underline">
                    + Set Date
                </button>
            ) : (
                <button type="button" onClick={clearDueDate} className="text-xs text-text-secondary hover:text-red-500 hover:underline">
                    Clear
                </button>
            )}
          </div>
          
          <div className="relative mt-1">
            {hasDueDate ? (
                <>
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
                    <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1 block w-full appearance-none rounded-xl border-border bg-background p-3 pl-10 transition-all focus:border-brand focus:ring-brand"
                    />
                </>
            ) : (
                <div className="mt-1 block w-full rounded-xl border border-dashed border-border bg-gray-50 p-3 text-text-secondary text-center text-sm italic">
                    No due date set
                </div>
            )}
          </div>
        </div>
      </div>

      {/* TIME OF DAY */}
      <div>
         <label className="block font-heading text-sm font-medium text-text-primary mb-2">
            Time of Day
         </label>
         <div className="flex gap-2">
            {['any', 'morning', 'afternoon', 'evening'].map((t) => (
                <button
                    key={t}
                    type="button"
                    onClick={() => setTimeOfDay(t as TimeOption)}
                    className={`
                        flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all
                        ${timeOfDay === t 
                            ? 'bg-brand-light border-brand text-brand shadow-sm' 
                            : 'bg-background border-border text-text-secondary hover:border-brand/50'}
                    `}
                >
                    {t === 'morning' && <Coffee className="h-4 w-4" />}
                    {t === 'afternoon' && <Sun className="h-4 w-4" />}
                    {t === 'evening' && <Moon className="h-4 w-4" />}
                    {t === 'any' && <Clock className="h-4 w-4" />}
                    <span className="text-xs font-medium capitalize">{t}</span>
                </button>
            ))}
         </div>
      </div>

      {/* ADVANCED RECURRENCE */}
      <div className="p-4 bg-gray-50 rounded-xl border border-border space-y-4">
        <div className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-brand" />
            <h4 className="font-heading font-semibold text-sm">Recurrence</h4>
        </div>
        
        <div className="flex flex-col gap-3">
            <div className="flex gap-3 items-center">
                <span className="text-sm text-text-secondary whitespace-nowrap w-12">Repeat</span>
                
                <input 
                    type="number" 
                    min="1" 
                    max="99"
                    value={recurrenceInterval}
                    onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                    className={`w-16 rounded-lg border-border p-2 text-center font-bold text-sm ${recurrenceFreq === 'none' ? 'opacity-50' : ''}`}
                    disabled={recurrenceFreq === 'none'}
                />
                
                <select
                value={recurrenceFreq}
                onChange={(e) => setRecurrenceFreq(e.target.value)}
                className="flex-1 rounded-lg border-border bg-white p-2 text-sm"
                >
                <option value="none">Never</option>
                <option value="daily">Day(s)</option>
                <option value="weekly">Week(s)</option>
                <option value="monthly">Month(s)</option>
                </select>
            </div>

            {recurrenceFreq !== 'none' && (
                <div className="flex gap-3 items-center animate-in slide-in-from-top-2 fade-in">
                    <span className="text-sm text-text-secondary whitespace-nowrap w-12">Until</span>
                    <div className="flex-1 relative">
                        <input 
                            type="date" 
                            value={recurrenceEndDate}
                            onChange={(e) => setRecurrenceEndDate(e.target.value)}
                            className="w-full rounded-lg border-border bg-white p-2 text-sm pl-9"
                        />
                        <Ban className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
                    </div>
                    {recurrenceEndDate && (
                        <button 
                            type="button" 
                            onClick={() => setRecurrenceEndDate('')}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Clear End Date"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* MULTIPLE INSTANCES */}
      <div className="p-4 bg-gray-50 rounded-xl border border-border space-y-2">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Copy className="h-5 w-5 text-brand" />
                <h4 className="font-heading font-semibold text-sm">Multiple Copies</h4>
            </div>
            <div className="flex items-center gap-3">
                <button 
                    type="button" 
                    onClick={() => setInstanceCount(Math.max(1, instanceCount - 1))}
                    className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center hover:bg-gray-100"
                >
                    -
                </button>
                <span className="font-bold w-4 text-center">{instanceCount}</span>
                <button 
                    type="button" 
                    onClick={() => setInstanceCount(Math.min(10, instanceCount + 1))}
                    className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center hover:bg-gray-100"
                >
                    +
                </button>
            </div>
         </div>
         {instanceCount > 1 && (
             <p className="text-xs text-text-secondary">
                 Creates {instanceCount} separate chores named "{name} #1" to "#{instanceCount}"
             </p>
         )}
      </div>

      {/* SUBTASKS UI */}
      <div className="space-y-2">
          <label className="block font-heading text-sm font-medium text-text-primary">Sub-steps</label>
          <div className="flex gap-2">
              <input 
                type="text" 
                value={newSubtask} 
                onChange={(e) => setNewSubtask(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                placeholder="e.g. 'Sort whites'"
                className="flex-1 rounded-xl border-border bg-background p-2 text-sm"
              />
              <button 
                type="button" 
                onClick={addSubtask} 
                className="p-2 bg-gray-100 rounded-xl hover:bg-brand-light text-brand"
              >
                  <PlusCircle className="h-5 w-5" />
              </button>
          </div>
          {subtasks.length > 0 && (
              <ul className="space-y-1 pl-1">
                  {subtasks.map((st, i) => (
                      <li key={i} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-lg">
                          <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-brand/50" />
                              <span>{st}</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setSubtasks(subtasks.filter((_, idx) => idx !== i))} 
                            className="text-gray-400 hover:text-red-500"
                          >
                              <Trash2 className="h-4 w-4" />
                          </button>
                      </li>
                  ))}
              </ul>
          )}
      </div>

      {/* DETAILS TOGGLE */}
      <details className="group">
        <summary className="flex items-center gap-2 text-sm font-medium text-brand cursor-pointer list-none">
            <span>Add Notes & Exact Time</span>
        </summary>
        <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-top-2">
            <div>
                <textarea
                    id="notes"
                    name="notes"
                    rows={2}
                    placeholder="Add details..."
                    className="mt-1 block w-full rounded-xl border-border bg-background p-3 focus:border-brand focus:ring-brand"
                />
            </div>
             <div>
                <label htmlFor="exactTime" className="block font-heading text-sm font-medium text-text-primary mb-1">
                    Exact Time (Optional)
                </label>
                <div className="relative">
                    <Clock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
                    <input
                        type="time"
                        id="exactTime"
                        name="exactTime"
                        className="mt-1 block w-full appearance-none rounded-xl border-border bg-background p-3 pl-10 focus:border-brand focus:ring-brand"
                    />
                </div>
            </div>
        </div>
      </details>

      {/* ACTIONS */}
      <div className="flex items-center justify-end space-x-4 pt-4">
        <button
          type="button"
          onClick={closeModal}
          className="rounded-xl px-5 py-3 font-heading text-base font-semibold text-text-secondary transition-all hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex items-center justify-center rounded-xl bg-brand px-6 py-3 font-heading text-base font-semibold text-white shadow-lg transition-all hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            `Create ${instanceCount > 1 ? instanceCount : ''} Chore${instanceCount > 1 ? 's' : ''}`
          )}
        </button>
      </div>
    </form>
  )
}

export default function AddChoreModal(props: Props) {
  const router = useRouter()

  const handleClose = () => {
    router.push('/dashboard')
    router.refresh() 
  }

  return (
    <Transition appear show={props.isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-card p-8 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-2xl font-heading font-semibold">
                    Add New Chore
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="rounded-full p-2 text-text-secondary transition-colors hover:bg-background"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <ChoreForm
                    closeModal={handleClose}
                    members={props.members}
                    rooms={props.rooms}
                    currentUserId={props.currentUserId}
                />

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}