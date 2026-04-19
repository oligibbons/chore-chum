// src/components/ChoreMenu.tsx
'use client'

import { Fragment, useTransition, useState } from 'react'
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react'
import { MoreVertical, Trash2, Edit, Trophy } from 'lucide-react'
import { ChoreWithDetails } from '@/types/database'
import { deleteChore, closeContinuousChore } from '@/app/chore-actions'
import Link from 'next/link'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'

type Props = {
  chore: ChoreWithDetails
  currentUserId?: string // Optional, used for assigning credit when closing projects
}

export default function ChoreMenu({ chore, currentUserId }: Props) {
  const [isPending, startTransition] = useTransition()
  // Optimistic UI state for instant removal visual
  const [isDeleted, setIsDeleted] = useState(false)
  const [isClosed, setIsClosed] = useState(false)

  const isContinuous = chore.target_instances === -1
  const isCompleted = chore.status === 'complete'

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this chore? This cannot be undone.')) {
      // Optimistic update: visually remove immediately
      setIsDeleted(true)

      startTransition(async () => {
        const result = await deleteChore(chore.id)
        if (result.success) {
            toast.success(result.message)
        } else {
            // Revert if failed
            setIsDeleted(false)
            toast.error(result.message || 'Failed to delete chore')
        }
      })
    }
  }

  const handleCloseProject = () => {
    if (confirm('Are you ready to officially close this ongoing project?')) {
      // Optimistic update
      setIsClosed(true)
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } })

      startTransition(async () => {
        // Pass currentUserId in an array if available, otherwise empty
        const completedBy = currentUserId ? [currentUserId] : []
        const result = await closeContinuousChore(chore.id, completedBy)
        
        if (result.success) {
            toast.success(result.message, { description: result.motivation })
        } else {
            setIsClosed(false)
            toast.error(result.message || 'Failed to close project')
        }
      })
    }
  }

  // If optimistically deleted or closed, hide the menu
  if (isDeleted || isClosed) return null

  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton 
        disabled={isPending}
        className="rounded-full p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:opacity-50"
        aria-label="Chore actions menu"
      >
        <MoreVertical className="h-5 w-5" />
      </MenuButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems 
            anchor="bottom end"
            className="z-50 mt-1 w-48 origin-top-right divide-y divide-border rounded-xl bg-popover shadow-xl ring-1 ring-black/5 focus:outline-none border border-border"
        >
          <div className="p-1">
            <MenuItem>
              {({ focus }) => (
                <Link
                  href={`?modal=edit-chore&choreId=${chore.id}`}
                  scroll={false}
                  className={`group flex w-full items-center rounded-lg p-2 text-sm font-medium ${
                    focus 
                        ? 'bg-brand-light dark:bg-brand/20 text-brand-dark dark:text-brand-light' 
                        : 'text-popover-foreground'
                  }`}
                >
                  <Edit className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-brand dark:group-hover:text-brand-light" aria-hidden="true" />
                  Edit Chore
                </Link>
              )}
            </MenuItem>
          </div>

          {/* NEW: Close Project Action */}
          {isContinuous && !isCompleted && (
            <div className="p-1 border-t border-border">
              <MenuItem>
                {({ focus }) => (
                  <button
                    onClick={handleCloseProject}
                    className={`group flex w-full items-center rounded-lg p-2 text-sm font-medium ${
                      focus 
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                          : 'text-green-600 dark:text-green-500'
                    }`}
                  >
                    <Trophy className="mr-2 h-4 w-4" aria-hidden="true" />
                    Close Project
                  </button>
                )}
              </MenuItem>
            </div>
          )}

          <div className="p-1 border-t border-border">
            <MenuItem>
              {({ focus }) => (
                <button
                  onClick={handleDelete}
                  className={`group flex w-full items-center rounded-lg p-2 text-sm font-medium ${
                    focus 
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
                        : 'text-red-500 dark:text-red-400'
                  }`}
                >
                  <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                  Delete Chore
                </button>
              )}
            </MenuItem>
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  )
}