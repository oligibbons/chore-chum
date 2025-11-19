// src/components/AddChoreModal.tsx
'use client'

import { Fragment, useState, FormEvent } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Loader2, User, Home, Calendar, Repeat, Hash } from 'lucide-react'
import { createChore } from '@/app/chore-actions'
import { DbProfile, DbRoom } from '@/types/database'
import { useRouter } from 'next/navigation'

type Props = {
  isOpen: boolean
  members: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'>[]
  rooms: DbRoom[]
}

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPending(true)
    
    const formData = new FormData(event.currentTarget)
    try {
      await createChore(formData)
      closeModal() // Close modal on success
    } catch (error) {
      console.error(error)
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Chore Name */}
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
            placeholder="e.g. 'Take out the trash'"
            className="mt-1 block w-full rounded-xl border-border bg-background p-3 transition-all focus:border-brand focus:ring-brand"
          />
        </div>
      </div>

      {/* Notes (Optional) */}
      <div>
        <label htmlFor="notes" className="block font-heading text-sm font-medium text-text-primary">
          Notes (Optional)
        </label>
        <div className="relative mt-1">
          <textarea
            id="notes"
            name="notes"
            rows={2}
            placeholder="Any extra details..."
            className="mt-1 block w-full rounded-xl border-border bg-background p-3 transition-all focus:border-brand focus:ring-brand"
          />
        </div>
      </div>

      {/* Grid for details */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Assigned To */}
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
              defaultValue=""
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

        {/* Room */}
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
              defaultValue=""
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

      {/* Grid for date/recurrence */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Due Date */}
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
              className="mt-1 block w-full appearance-none rounded-xl border-border bg-background p-3 pl-10 transition-all focus:border-brand focus:ring-brand"
            />
          </div>
        </div>

        {/* Recurrence */}
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
              defaultValue="none"
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Instances */}
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

      {/* --- FORM ACTIONS --- */}
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
    // Removing the query param closes the modal
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
                    Add a New Chore
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="rounded-full p-2 text-text-secondary transition-colors hover:bg-background"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mt-6">
                  <ChoreForm
                    closeModal={handleClose}
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