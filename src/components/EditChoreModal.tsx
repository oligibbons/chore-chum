'use client'

import { Fragment, useState, FormEvent } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Loader2, User, Home, Calendar, Repeat, Hash, Clock, Coffee, Sun, Moon } from 'lucide-react'
import { updateChore } from '@/app/chore-actions'
import { ChoreWithDetails, DbProfile, DbRoom } from '@/types/database'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type EditFormProps = {
  closeModal: () => void
  chore: ChoreWithDetails
  members: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'>[]
  rooms: DbRoom[]
}

// Define the exact type for our time options
type TimeOption = 'morning' | 'afternoon' | 'evening' | 'any';

function EditForm({ closeModal, chore, members, rooms }: EditFormProps) {
  const [pending, setPending] = useState(false)
  // Cast initial state to match our literal type, handling nulls safely
  const [timeOfDay, setTimeOfDay] = useState<TimeOption>(
    (chore.time_of_day as TimeOption) || 'any'
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPending(true)

    const formData = new FormData(event.currentTarget)
    formData.append('timeOfDay', timeOfDay)
    
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

  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toISOString().split('T')[0]
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
            required
            defaultValue={chore.name}
            className="mt-1 block w-full rounded-xl border-border bg-background p-3 transition-all focus:border-brand focus:ring-brand"
          />
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
          <label htmlFor="assignedTo" className="block font-heading text-sm font-medium text-text-primary">
            Assign To
          </label>
          <div className="relative mt-1">
            <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
            <select
              id="assignedTo"
              name="assignedTo"
              className="mt-1 block w-full appearance-none rounded-xl border-border bg-background p-3 pl-10 transition-all focus:border-brand focus:ring-brand"
              defaultValue={chore.assigned_to ?? ''}
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

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
      </div>

       {/* Time of Day Selection */}
       <div>
         <label className="block font-heading text-sm font-medium text-text-primary mb-2">
            Time of Day (Optional)
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              defaultValue={formatDateForInput(chore.due_date)}
              className="mt-1 block w-full appearance-none rounded-xl border-border bg-background p-3 pl-10 transition-all focus:border-brand focus:ring-brand"
            />
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

        <div>
          <label htmlFor="recurrence_type" className="block font-heading text-sm font-medium text-text-primary">
            Recurs
          </label>
          <div className="relative mt-1">
            <Repeat className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
            <select
              id="recurrence_type"
              name="recurrence_type"
              className="mt-1 block w-full appearance-none rounded-xl border-border bg-background p-3 pl-10 transition-all focus:border-brand focus:ring-brand"
              defaultValue={chore.recurrence_type}
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
                defaultValue={chore.target_instances ?? 1}
                min={1}
                className="mt-1 block w-full appearance-none rounded-xl border-border bg-background p-3 pl-10 transition-all focus:border-brand focus:ring-brand"
            />
            </div>
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