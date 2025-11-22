// src/components/ChoreMenu.tsx
'use client'

import { Fragment, useTransition, useState } from 'react'
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react'
import { MoreVertical, Trash2, Edit } from 'lucide-react'
import { ChoreWithDetails } from '@/types/database'
import { deleteChore } from '@/app/chore-actions'
import Link from 'next/link'
import { toast } from 'sonner'

type Props = {
  chore: ChoreWithDetails
}

export default function ChoreMenu({ chore }: Props) {
  const [isPending, startTransition] = useTransition()
  // Optimistic UI state for instant removal visual
  const [isDeleted, setIsDeleted] = useState(false)

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this chore? This cannot be undone.')) {
      setIsDeleted(true)

      startTransition(async () => {
        const result = await deleteChore(chore.id)
        if (result.success) {
            toast.success(result.message)
        } else {
            setIsDeleted(false)
            toast.error(result.message || 'Failed to delete chore')
        }
      })
    }
  }

  if (isDeleted) return null

  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton 
        disabled={isPending}
        className="rounded-full p-2 text-text-secondary transition-all hover:bg-background hover:text-text-primary disabled:opacity-50"
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
        {/* FIX: 'anchor="bottom end"' tells Headless UI to intelligently position 
            this popup outside of the scroll container, fixing the clipping issue.
        */}
        <MenuItems 
            anchor="bottom end"
            className="z-50 mt-1 w-48 origin-top-right divide-y divide-border rounded-xl bg-white shadow-xl ring-1 ring-black/5 focus:outline-none"
        >
          <div className="p-1">
            <MenuItem>
              {({ focus }) => (
                <Link
                  href={`?modal=edit-chore&choreId=${chore.id}`}
                  scroll={false}
                  className={`group flex w-full items-center rounded-lg p-2 text-sm font-medium ${
                    focus ? 'bg-brand-light text-brand-dark' : 'text-text-primary'
                  }`}
                >
                  <Edit className="mr-2 h-4 w-4 text-text-secondary group-hover:text-brand-dark" aria-hidden="true" />
                  Edit Chore
                </Link>
              )}
            </MenuItem>
          </div>
          <div className="p-1">
            <MenuItem>
              {({ focus }) => (
                <button
                  onClick={handleDelete}
                  className={`group flex w-full items-center rounded-lg p-2 text-sm font-medium ${
                    focus ? 'bg-status-overdue/10 text-status-overdue' : 'text-status-overdue'
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