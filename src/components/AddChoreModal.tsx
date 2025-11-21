// src/components/AddChoreModal.tsx
'use client'

import { Fragment, useState, FormEvent, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Loader2, User, Home, Calendar, Repeat, Wand2, Clock, Coffee, Sun, Moon, PlusCircle, Check, Hash } from 'lucide-react'
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
}

type TimeOption = 'morning' | 'afternoon' | 'evening' | 'any';

function ChoreForm({ 
  closeModal, 
  members, 
  rooms 
}: { 
  closeModal: () => void, 
  members: Props['members'], 
  rooms: Props['rooms'] 
}) {
  const [pending, setPending] = useState(false)
  const [smartInput, setSmartInput] = useState('')
  const { interact, triggerHaptic } = useGameFeel()
  
  // WOW FACTOR: Shake State
  const [isShaking, setIsShaking] = useState(false)
  
  // State
  const [name, setName] = useState('')
  const [assignedIds, setAssignedIds] = useState<string[]>([]) // Multi-select array
  const [roomId, setRoomId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [recurrence, setRecurrence] = useState('none')
  const [timeOfDay, setTimeOfDay] = useState<TimeOption>('any')

  const suggestions = [
    "Wash dishes tonight",
    "Take out trash",
    "Vacuum living room",
    "Water plants",
    "Laundry this weekend",
    "Clean bathroom"
  ]

  // Toggle Logic for Avatar Grid
  const toggleMember = (id: string) => {
    interact('neutral')
    setAssignedIds(prev => 
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // Smart Parsing Logic
  useEffect(() => {
    const timer = setTimeout(() => {
        if (!smartInput.trim()) return

        const parsed = parseChoreInput(smartInput, members, rooms)
        
        if (parsed.name) setName(parsed.name)
        if (parsed.roomId) setRoomId(parsed.roomId.toString())
        // Smart parser currently returns a single ID, so we wrap it in an array
        if (parsed.assignedTo) setAssignedIds([parsed.assignedTo]) 
        if (parsed.recurrence) setRecurrence(parsed.recurrence)
        if (parsed.dueDate) setDueDate(parsed.dueDate)
        if (parsed.timeOfDay) setTimeOfDay(parsed.timeOfDay)

    }, 600) 

    return () => clearTimeout(timer)
  }, [smartInput, members, rooms])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    // WOW FACTOR: Validation Shake
    if (!name.trim()) {
        setIsShaking(true)
        triggerHaptic('medium') // Error haptic
        toast.error("Please give your chore a name")
        setTimeout(() => setIsShaking(false), 500) // Reset animation
        return
    }

    setPending(true)
    
    const formData = new FormData(event.currentTarget)
    formData.append('timeOfDay', timeOfDay)
    // NEW: Serialize array to JSON for the backend to parse
    formData.append('assignedTo', JSON.stringify(assignedIds))

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
                placeholder="e.g. 'Vacuum Living Room every Friday'"
                className="block w-full rounded-2xl border-2 border-brand/20 bg-brand/5 p-4 pl-10 text-lg font-medium placeholder:text-text-secondary/50 focus:border-brand focus:ring-brand transition-all"
                autoFocus
            />
        </div>
        
        {/* Quick Chips */}
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
            // Removed 'required' attribute to let custom shake validation handle it
            className={`mt-1 block w-full rounded-xl border bg-background p-3 transition-all focus:border-brand focus:ring-brand ${isShaking ? 'border-red-500 ring-2 ring-red-200 animate-shake' : 'border-border'}`}
        />
      </div>

      {/* ASSIGN TO - AVATAR GRID (Full Width) */}
      <div>
        <label className="block font-heading text-sm font-medium text-text-primary mb-2">
          Assign To
        </label>
        <div className="flex flex-wrap gap-3">
            {/* 'Anyone' Toggle */}
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
            
            {/* Member Toggles */}
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

      {/* ROOM & DUE DATE (Grid) */}
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
          <label htmlFor="dueDate" className="block font-heading text-sm font-medium text-text-primary">
            Due Date
          </label>
          <div className="relative mt-1">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 block w-full appearance-none rounded-xl border-border bg-background p-3 pl-10 transition-all focus:border-brand focus:ring-brand"
            />
          </div>
        </div>
      </div>

      {/* TIME OF DAY SELECTION */}
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

      {/* RECURRENCE & INSTANCES (Grid) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="recurrence_type" className="block font-heading text-sm font-medium text-text-primary">
            Recurs
          </label>
          <div className="relative mt-1">
            <Repeat className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
            <select
              id="recurrence_type"
              name="recurrence_type"
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              className="mt-1 block w-full appearance-none rounded-xl border-border bg-background p-3 pl-10 transition-all focus:border-brand focus:ring-brand"
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        <div>
            <label htmlFor="instances" className="block font-heading text-sm font-medium text-text-primary">
            Instances
            </label>
            <div className="relative mt-1">
              <Hash className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
              <input
                  type="number"
                  id="instances"
                  name="instances"
                  defaultValue={1}
                  min={1}
                  className="mt-1 block w-full appearance-none rounded-xl border-border bg-background p-3 pl-10 transition-all focus:border-brand focus:ring-brand"
              />
            </div>
        </div>
      </div>

      {/* DETAILS TOGGLE (Notes & Exact Time) */}
      <details className="group">
        <summary className="flex items-center gap-2 text-sm font-medium text-brand cursor-pointer list-none">
            <span>More Options (Notes, Exact Time)</span>
        </summary>
        <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-top-2">
            <div>
                <label htmlFor="notes" className="block font-heading text-sm font-medium text-text-primary">
                Notes
                </label>
                <textarea
                    id="notes"
                    name="notes"
                    rows={2}
                    className="mt-1 block w-full rounded-xl border-border bg-background p-3 focus:border-brand focus:ring-brand"
                />
            </div>
             <div>
                <label htmlFor="exactTime" className="block font-heading text-sm font-medium text-text-primary">
                    Exact Time
                </label>
                <div className="relative mt-1">
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
          className="flex items-center justify-center rounded-xl bg-brand px-5 py-3 font-heading text-base font-semibold text-white shadow-lg transition-all hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            'Create Chore'
          )}
        </button>
      </div>
    </form>
  )
}

export default function AddChoreModal({
  isOpen,
  members,
  rooms,
}: Props) {
  const router = useRouter()

  const handleClose = () => {
    router.push('/dashboard')
    router.refresh() 
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-black/30" />
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
                    Add Chore
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
                    members={members}
                    rooms={rooms}
                />

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}