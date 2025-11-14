// components/EditChoreModal.tsx

'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Loader2 } from 'lucide-react'
import { DbProfile, DbRoom, ChoreWithDetails } from '@/types/database'
import { updateChore } from '@/app/chore-actions'

type Props = {
  // We pass the entire chore object in to pre-fill the form
  chore: ChoreWithDetails | null
  isOpen: boolean
  onClose: () => void
  members: Pick<DbProfile, 'id', 'full_name', 'avatar_url'>[]
  rooms: DbRoom[]
}

// Helper to format date for <input type="date">
const formatDateForInput = (dateString?: string | null) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  } catch (e) {
    return ''
  }
}

export default function EditChoreModal({
  chore,
  isOpen,
  onClose,
  members,
  rooms,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // This `key` is a trick to force React to reset the form
  // every time a *different* chore is opened.
  const [formKey, setFormKey] = useState(0)

  useEffect(() => {
    if (chore) {
      setFormKey(chore.id) // Change the key when the chore changes
    }
  }, [chore])

  if (!chore) return null // Don't render anything if no chore is selected

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    const formData = new FormData(event.currentTarget)
    formData.set('choreId', chore.id.toString()) // Add the chore ID

    try {
      await updateChore(formData)
      onClose() // Close the modal on success
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-brand-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-start justify-between">
                  <Dialog.Title
                    as="h3"
                    className="font-heading text-2xl font-bold leading-6 text-support-dark"
                  >
                    Edit Chore
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-1 text-support-dark/60 transition-all hover:bg-support-light/50 hover:text-support-dark"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Form - Note the `key` to force reset */}
                <form
                  key={formKey}
                  onSubmit={handleSubmit}
                  className="mt-6 space-y-4"
                >
                  {/* Chore Name */}
                  <div>
                    <label htmlFor="name" className="block font-heading text-sm font-medium text-support-dark">
                      Chore Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      defaultValue={chore.name}
                      placeholder="e.g. 'Take out the bins'"
                      className="mt-1 block w-full rounded-lg border-support-light shadow-sm transition-all focus:border-brand-primary focus:ring-brand-primary"
                    />
                  </div>

                  {/* Row: Assign-to and Room */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="assignedTo" className="block font-heading text-sm font-medium text-support-dark">
                        Assign to
                      </label>
                      <select
                        id="assignedTo"
                        name="assignedTo"
                        defaultValue={chore.assigned_to || ''}
                        className="mt-1 block w-full rounded-lg border-support-light shadow-sm transition-all focus:border-brand-primary focus:ring-brand-primary"
                      >
                        <option value="">Anyone</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="roomId" className="block font-heading text-sm font-medium text-support-dark">
                        Room
                      </label>
                      <select
                        id="roomId"
                        name="roomId"
                        defaultValue={chore.room_id || ''}
                        className="mt-1 block w-full rounded-lg border-support-light shadow-sm transition-all focus:border-brand-primary focus:ring-brand-primary"
                      >
                        <option value="">No room</option>
                        {rooms.map((room) => (
                          <option key={room.id} value={room.id}>
                            {room.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row: Due Date and Repeats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="dueDate" className="block font-heading text-sm font-medium text-support-dark">
                        Due Date
                      </label>
                      <input
                        type="date"
                        id="dueDate"
                        name="dueDate"
                        defaultValue={formatDateForInput(chore.due_date)}
                        // This is the line that was cut off.
                        // Notice the closing quote and bracket.
                        className="mt-1 block w-full rounded-lg border-support-light shadow-sm transition-all focus:border-brand-primary focus:ring-brand-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="recurrence_type" className="block font-heading text-sm font-medium text-support-dark">
                        Repeats
                      </label>
                      <select
                        id="recurrence_type"
                        name="recurrence_type"
                        defaultValue={chore.recurrence_type}
                        className="mt-1 block w-full rounded-lg border-support-light shadow-sm transition-all focus:border-brand-primary focus:ring-brand-primary"
                      >
                        <option value="none">Never</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>

                  {/* Row: Instances */}
                  <div>
                    <label htmlFor="instances" className="block font-heading text-sm font-medium text-support-dark">
                      Instances (for multi-step chores)
                    </label>
                    <input
                      type="number"
                      id="instances"
                      name="instances"
                      defaultValue={chore.target_instances}
                      min="1"
                      className="mt-1 block w-full rounded-lg border-support-light shadow-sm transition-all focus:border-brand-primary focus:ring-brand-primary"
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <p className="text-sm text-status-overdue">{error}</p>
                  )}

                  {/* Submit Button */}
                  <div className="!mt-8 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center justify-center rounded-lg bg-brand-secondary px-5 py-3 font-heading text-base font-semibold text-brand-white shadow-sm transition-all hover:bg-brand-secondary/90 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}