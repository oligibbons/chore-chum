// src/components/EditChoreModal.tsx
'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Loader2, User, Home, Calendar, Repeat, Hash } from 'lucide-react'
import { updateChore } from '@/app/chore-actions'
import { ChoreWithDetails, DbProfile, DbRoom } from '@/types/database'
import { useFormStatus } from 'react-dom'

// --- New EditForm Component ---
// This component contains the form itself.
// This is necessary so we can use the `useFormStatus` hook.

type EditFormProps = {
  onClose: () => void
  chore: ChoreWithDetails
  members: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'>[]
  rooms: DbRoom[]
}

function EditForm({ onClose, chore, members, rooms }: EditFormProps) {
  // useFormStatus must be used inside a <form>
  const { pending } = useFormStatus()

  // Helper to format date for input
  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toISOString().split('T')[0]
  }

  return (
    <div className="space-y-6">
      {/* Hidden Chore ID */}
      <input type="hidden" name="choreId" value={chore.id} />

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
            defaultValue={chore.name}
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
              defaultValue={formatDateForInput(chore.due_date)}
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
              defaultValue={chore.recurrence_type}
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
            defaultValue={chore.target_instances ?? 1}
            min={1}
            className="mt-1 block w-full appearance-none rounded-xl border-border bg-background p-3 pl-10 transition-all focus:border-brand focus:ring-brand"
          />
        </div>
      </div>

      {/* --- FORM ACTIONS --- */}
      <div className="flex items-center justify-end space-x-4 pt-4">
        <button
          type="button"
          onClick={onClose}
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
    </div>
  )
}


// --- Main Modal Component ---
// This is the wrapper that controls the modal state.

type Props = {
  isOpen: boolean
  onClose: () => void
  chore: ChoreWithDetails
  members: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'>[]
  rooms: DbRoom[]
}

export default function EditChoreModal({
  isOpen,
  onClose,
  chore,
  members,
  rooms,
}: Props) {

  // This state is just to optimistically close the modal
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFormSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    await updateChore(formData)
    setIsSubmitting(false)
    onClose() // Close the modal on success
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        
        {/* Backdrop overlay */}
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

        {/* Modal content */}
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
                
                {/* Modal Header */}
                <div className="flex items-center justify-between">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-heading font-semibold text-text-primary"
                  >
                    Edit Chore
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-full p-2 text-text-secondary transition-colors hover:bg-background"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mt-6">
                  {/*
                    We wrap the EditForm in a <form> tag here and pass the 
                    server action. This lets useFormStatus work inside.
                  */}
                  <form action={handleFormSubmit}>
                    <EditForm 
                      onClose={onClose}
                      chore={chore}
                      members={members}
                      rooms={rooms}
                    />
                  </form>
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}