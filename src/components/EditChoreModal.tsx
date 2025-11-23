// src/components/EditChoreModal.tsx
'use client'

import { Fragment, useState, FormEvent } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Loader2, User, Home, Calendar, Repeat, Clock, Coffee, Sun, Moon, Check, Ban } from 'lucide-react'
import { updateChore } from '@/app/chore-actions'
import { ChoreWithDetails, DbProfile, DbRoom } from '@/types/database'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useGameFeel } from '@/hooks/use-game-feel'
import Avatar from './Avatar'

type EditFormProps = {
  closeModal: () => void
  chore: ChoreWithDetails
  members: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'>[]
  rooms: DbRoom[]
}

type TimeOption = 'morning' | 'afternoon' | 'evening' | 'any';

function EditForm({ closeModal, chore, members, rooms }: EditFormProps) {
  const [pending, setPending] = useState(false)
  const { triggerHaptic, interact } = useGameFeel()
  const [isShaking, setIsShaking] = useState(false)

  const [timeOfDay, setTimeOfDay] = useState<TimeOption>(
    (chore.time_of_day as TimeOption) || 'any'
  )
  
  const [assignedIds, setAssignedIds] = useState<string[]>(chore.assigned_to || [])

  // --- Recurrence State Initialization ---
  const parseRecurrence = (rec: string | null) => {
    if (!rec || rec === 'none') return { freq: 'none', interval: 1, until: '' }
    if (rec.startsWith('custom:')) {
        const parts = rec.split(':')
        // custom:daily:3 or custom:daily:3:2025-12-31
        return { 
            freq: parts[1], 
            interval: parseInt(parts[2]) || 1,
            until: parts[3] || '' 
        }
    }
    return { freq: rec, interval: 1, until: '' }
  }

  const initialRec = parseRecurrence(chore.recurrence_type)
  const [recurrenceFreq, setRecurrenceFreq] = useState(initialRec.freq)
  // Input Fix: Allow string for easier editing
  const [recurrenceInterval, setRecurrenceInterval] = useState<number | string>(initialRec.interval)
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(initialRec.until)

  // Date State
  const [dueDate, setDueDate] = useState(chore.due_date ? new Date(chore.due_date).toISOString().split('T')[0] : '')
  const [hasDueDate, setHasDueDate] = useState(!!chore.due_date)

  const toggleMember = (id: string) => {
    interact('neutral')
    setAssignedIds(prev => 
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    const formData = new FormData(event.currentTarget)
    const name = formData.get('name') as string

    if (!name || !name.trim()) {
        setIsShaking(true)
        triggerHaptic('medium')
        toast.error("Name is required")
        setTimeout(() => setIsShaking(false), 500)
        return
    }

    setPending(true)
    formData.append('timeOfDay', timeOfDay)
    formData.append('assignedTo', JSON.stringify(assignedIds))
    
    // Serialize Recurrence
    let finalRecurrence = 'none'
    if (recurrenceFreq !== 'none') {
        const finalInterval = recurrenceInterval === '' ? 1 : Number(recurrenceInterval)
        const base = finalInterval > 1 
            ? `custom:${recurrenceFreq}:${finalInterval}` 
            : recurrenceFreq
        
        if (recurrenceEndDate) {
            const safeBase = finalInterval === 1 && !base.startsWith('custom') 
                ? `custom:${recurrenceFreq}:1` 
                : base.startsWith('custom') ? base : `custom:${recurrenceFreq}:${finalInterval}`
            
            finalRecurrence = `${safeBase}:${recurrenceEndDate}`
        } else {
            finalRecurrence = base
        }
    }
    formData.set('recurrence_type', finalRecurrence)

    // Handle Due Date
    if (!hasDueDate) {
        formData.delete('dueDate')
    }
    
    try {
      const result = await updateChore(formData)
      
      if (result.success) {
        toast.success(result.message)
        closeModal()
      } else {
        toast.error(result.message)
        setPending(false)
      }
    } catch (error) {
      toast.error('Failed to update chore')
      setPending(false)
    }
  }
  
  const timeOptions: TimeOption[] = ['any', 'morning', 'afternoon', 'evening'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="choreId" value={chore.id} />

      <div>
        <label htmlFor="name" className="block font-heading text-sm font-medium text-text-primary">
          Chore Name
        </label>
        <div className="relative mt-1">
          <input
            type="text"
            id="name"
            name="name"
            defaultValue={chore.name}
            className={`mt-1 block w-full rounded-xl border bg-background p-3 transition-all focus:border-brand focus:ring-brand ${isShaking ? 'border-red-500 ring-2 ring-red-200 animate-shake' : 'border-border'}`}
          />
        </div>
      </div>

      {/* ASSIGNEES */}
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
                    ${assignedIds.length === 0 ? 'bg-brand-light border-brand text-brand shadow-sm' : 'bg-white border-border text-text-secondary hover:border-brand/50'}
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
                            ${isSelected ? 'bg-brand-light border-brand ring-1 ring-brand shadow-sm' : 'bg-white border-border hover:border-brand/50'}
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

      <div>
        <label htmlFor="notes" className="block font-heading text-sm font-medium text-text-primary">
          Notes
        </label>
        <div className="relative mt-1">
          <textarea
            id="notes"
            name="notes"
            rows={2}
            defaultValue={chore.notes || ''}
            className="mt-1 block w-full rounded-xl border-border bg-background p-3 transition-all focus:border-brand focus:ring-brand"
          />
        </div>
      </div>

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
              className="mt-1 block w-full appearance-none rounded-xl border-border bg-background p-3 pl-10 transition-all focus:border-brand focus:ring-brand"
              defaultValue={chore.room_id ?? ''}
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
                <button type="button" onClick={() => { setHasDueDate(true); setDueDate(new Date().toISOString().split('T')[0]); }} className="text-xs text-brand font-semibold">
                    + Add Date
                </button>
            ) : (
                <button type="button" onClick={() => { setHasDueDate(false); setDueDate(''); }} className="text-xs text-text-secondary hover:text-red-500">
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
                    No due date
                </div>
            )}
          </div>
        </div>
      </div>

       {/* Time of Day Selection */}
       <div>
         <label className="block font-heading text-sm font-medium text-text-primary mb-2">
            Time of Day
         </label>
         <div className="flex gap-2">
            {timeOptions.map((t) => (
                <button
                    key={t}
                    type="button"
                    onClick={() => setTimeOfDay(t)}
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
                    onChange={(e) => setRecurrenceInterval(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className={`w-16 rounded-lg border-border p-2 text-center font-bold text-sm ${recurrenceFreq === 'none' ? 'opacity-50' : ''}`}
                    disabled={recurrenceFreq === 'none'}
                />
                
                <select
                value={recurrenceFreq}
                onChange={(e) => setRecurrenceFreq(e.target.value)}
                className="flex-1 rounded-lg border-border bg-white p-2 text-sm"
                >
                <option value="none">Don't repeat</option>
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
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            title="Clear End Date"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            )}
        </div>
      </div>

      <div>
          <label htmlFor="exactTime" className="block font-heading text-sm font-medium text-text-primary">
            Exact Time (Optional)
          </label>
          <div className="relative mt-1">
            <Clock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
            <input
              type="time"
              id="exactTime"
              name="exactTime"
              defaultValue={chore.exact_time || ''}
              className="mt-1 block w-full appearance-none rounded-xl border-border bg-background p-3 pl-10 transition-all focus:border-brand focus:ring-brand"
            />
          </div>
      </div>

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
            'Save Changes'
          )}
        </button>
      </div>
    </form>
  )
}

type Props = {
  isOpen: boolean
  chore: ChoreWithDetails
  members: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'>[]
  rooms: DbRoom[]
}

export default function EditChoreModal({
  isOpen,
  chore,
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
                <div className="flex items-center justify-between">
                  <Dialog.Title as="h3" className="text-2xl font-heading font-semibold">
                    Edit Chore
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="rounded-full p-2 text-text-secondary transition-colors hover:bg-background"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mt-6">
                  <EditForm 
                    closeModal={handleClose}
                    chore={chore}
                    members={members}
                    rooms={rooms}
                  />
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}