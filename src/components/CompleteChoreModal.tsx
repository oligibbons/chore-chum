// src/components/CompleteChoreModal.tsx
'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Loader2, Users, Check } from 'lucide-react'
import { ChoreWithDetails, DbProfile } from '@/types/database'
import { completeChore } from '@/app/chore-actions'
import { toast } from 'sonner'
import Avatar from './Avatar'
import confetti from 'canvas-confetti'

type Props = {
  isOpen: boolean
  onClose: () => void
  chore: ChoreWithDetails
  members: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'>[]
  currentUserId: string
}

export default function CompleteChoreModal({ isOpen, onClose, chore, members, currentUserId }: Props) {
  const [pending, setPending] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([currentUserId])

  const relevantMembers = members.filter(m => 
    chore.assigned_to?.includes(m.id) || m.id === currentUserId
  )

  const toggleUser = (userId: string) => {
    if (selectedIds.includes(userId)) {
        if (selectedIds.length > 1) {
            setSelectedIds(selectedIds.filter(id => id !== userId))
        }
    } else {
        setSelectedIds([...selectedIds, userId])
    }
  }

  const handleComplete = async () => {
    setPending(true)
    try {
      const result = await completeChore(chore.id, selectedIds)
      
      if (result.success) {
        confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.7 },
            colors: ['#a78bfa', '#34d399', '#fbbf24'],
            disableForReducedMotion: true
        })
        toast.success(result.message, { description: result.motivation })
        onClose()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Something went wrong')
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
                
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-xl font-heading font-semibold flex items-center gap-2 text-card-foreground">
                    <Users className="h-5 w-5 text-brand" />
                    Who completed this?
                  </Dialog.Title>
                  <button onClick={onClose} className="rounded-full p-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><X className="h-5 w-5" /></button>
                </div>

                <div className="space-y-3 mb-8">
                    {relevantMembers.map(member => {
                        const isSelected = selectedIds.includes(member.id)
                        return (
                            <button
                                key={member.id}
                                onClick={() => toggleUser(member.id)}
                                className={`
                                    w-full flex items-center justify-between p-3 rounded-xl border transition-all
                                    ${isSelected 
                                        ? 'bg-brand-light dark:bg-brand/20 border-brand ring-1 ring-brand' 
                                        : 'bg-background border-border hover:border-brand/50'}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar url={member.avatar_url} alt={member.full_name || ''} size={40} />
                                    <span className={`font-semibold ${isSelected ? 'text-brand-dark dark:text-brand-light' : 'text-foreground'}`}>
                                        {member.full_name}
                                    </span>
                                </div>
                                {isSelected && (
                                    <div className="bg-brand text-white rounded-full p-1">
                                        <Check className="h-4 w-4" />
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-muted-foreground font-semibold hover:bg-muted rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button 
                        onClick={handleComplete} 
                        disabled={pending || selectedIds.length === 0}
                        className="flex items-center gap-2 bg-brand text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-brand-dark disabled:opacity-50 transition-all active:scale-95"
                    >
                        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mark Complete'}
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