// components/ChoreMenu.tsx
'use client'

import { Fragment, useTransition } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { MoreVertical, Trash2, Edit } from 'lucide-react'
import { ChoreWithDetails } from '@/types/database'
import { deleteChore } from '@/app/chore-actions'
import Link from 'next/link' // <-- Import Link

type Props = {
  chore: ChoreWithDetails
  // onEdit: (chore: ChoreWithDetails) => void // <-- Remove onEdit
}

export default function ChoreMenu({ chore }: Props) { // <-- Remove onEdit
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this chore? This cannot be undone.')) {
      startTransition(() => {
        deleteChore(chore.id)
      })
    }
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button 
          disabled={isPending}
          className="rounded-full p-2 text-support-dark/60 transition-all hover:bg-support-light/50 hover:text-support-dark disabled:opacity-50"
          aria-label="Chore actions menu"
        >
          <MoreVertical className="h-5 w-5" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        {/* Modern Menu Card: Rounded corners, shadow */}
        <Menu.Items className="absolute right-0 z-30 mt-2 w-48 origin-top-right divide-y divide-support-light/50 rounded-xl bg-brand-white shadow-xl ring-1 ring-black/5 focus:outline-none">
          <div className="p-1">
            <Menu.Item>
              {({ active, close }) => ( // <-- Add 'close'
                <Link // <-- Use Link instead of button
                  href={`?modal=edit-chore&choreId=${chore.id}`}
                  scroll={false}
                  className={`group flex w-full items-center rounded-lg p-2 text-sm font-medium ${
                    active ? 'bg-brand-primary text-brand-white' : 'text-support-dark'
                  }`}
                  onClick={close} // <-- Close menu on click
                >
                  <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
                  Edit Chore
                </Link>
              )}
            </Menu.Item>
          </div>
          <div className="p-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleDelete}
                  className={`group flex w-full items-center rounded-lg p-2 text-sm font-medium ${
                    // Highlight delete red for clear action
                    active ? 'bg-status-overdue text-brand-white' : 'text-status-overdue'
                  }`}
                >
                  <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                  Delete Chore
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}