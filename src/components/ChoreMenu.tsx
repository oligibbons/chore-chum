// src/components/ChoreMenu.tsx
'use client'

import { Fragment, useTransition } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { MoreVertical, Trash2, Edit } from 'lucide-react'
import { ChoreWithDetails } from '@/types/database'
import { deleteChore } from '@/app/chore-actions'
import Link from 'next/link'

type Props = {
  chore: ChoreWithDetails
}

export default function ChoreMenu({ chore }: Props) {
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
        {/* Subtle menu button */}
        <Menu.Button 
          disabled={isPending}
          className="rounded-full p-2 text-text-secondary transition-all hover:bg-background hover:text-text-primary disabled:opacity-50"
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
        {/* Modern Menu Card: White, rounded, border, and shadow */}
        <Menu.Items className="absolute right-0 z-30 mt-1 w-48 origin-top-right divide-y divide-border rounded-xl bg-card shadow-card ring-1 ring-border focus:outline-none">
          <div className="p-1">
            <Menu.Item>
              {({ active, close }) => (
                <Link
                  href={`?modal=edit-chore&choreId=${chore.id}`}
                  scroll={false}
                  className={`group flex w-full items-center rounded-lg p-2 text-sm font-medium ${
                    active ? 'bg-brand-light text-brand-dark' : 'text-text-primary'
                  }`}
                  onClick={close}
                >
                  <Edit className="mr-2 h-4 w-4 text-text-secondary group-hover:text-brand-dark" aria-hidden="true" />
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
                    active ? 'bg-status-overdue/10 text-status-overdue' : 'text-status-overdue'
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