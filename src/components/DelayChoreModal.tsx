'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Loader2, CalendarClock } from 'lucide-react'
import { delayChore } from '@/app/chore-actions'
import { toast } from 'sonner'

type Props = {
  isOpen: boolean
  onClose: () => void
  choreId: number
}

export default function DelayChoreModal({ isOpen, onClose, choreId }: Props) {
  const [pending, setPending] = useState(false)
  const [days, setDays] = useState(1)

  const handleDelay = async () => {
    setPending(true)
    try {
      const result = await delayChore(choreId, days)
      
      if (result.success) {
        toast.success(result.message)
        onClose()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Failed to delay chore')
    } finally {
      setPending(false)
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-card p-6 text-left align-middle shadow-xl transition-all border border-border">
                
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-xl font-heading font-semibold flex items-center gap-2 text-card-foreground">
                    <CalendarClock className="h-5 w-5 text-brand" />
                    Delay Chore
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <p className="text-muted-foreground mb-4 text-sm">
                  Need more time? Delaying this chore will push its due date forward.
                </p>

                <div className="mb-6">
                  <label htmlFor="delayDays" className="block text-sm font-medium text-text-primary mb-1">
                    Delay by:
                  </label>
                  <select
                    id="delayDays"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="block w-full rounded-xl border-input bg-background p-3 transition-all focus:border-brand focus:ring-brand text-foreground"
                  >
                    <option value={1}>1 Day</option>
                    <option value={2}>2 Days</option>
                    <option value={3}>3 Days</option>
                    <option value={4}>4 Days</option>
                    <option value={5}>5 Days</option>
                    <option value={6}>6 Days</option>
                    <option value={7}>1 Week</option>
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={onClose}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelay}
                    disabled={pending}
                    className="flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-dark disabled:opacity-70 transition-all active:scale-95"
                  >
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Delay'}
                  </button>
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}