// components/ChoreMenu.tsx

'use client'

import { Fragment, useState, useTransition } from 'react'
import { ChoreWithDetails } from '@/types/database'
import { deleteChore } from '@/app/chore-actions'
import { Menu, Transition } from '@headlessui/react'
import { MoreVertical, Edit, Trash2, Loader2 } from 'lucide-react'

type Props = {
  chore: ChoreWithDetails
  onEdit: () => void
}

export default function ChoreMenu({ chore, onEdit }: Props) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${chore.name}"?`)) {
      setIsDeleting(true)
      startTransition(async () => {
        try {
          await deleteChore(chore.id)
        } catch (error) {
          console.error(error)
          // You could show an error toast here
        }
        // No need to set isDeleting(false), component will unmount
      })
    }
  }

  return (
    <Menu as="div" className="relative flex-shrink-0">
      <Menu.Button
        disabled={isDeleting}
        className="h-8 w-8 rounded-lg text-support-dark/60 transition-all hover:bg-support-light/50 hover:text-support-dark"
      >
        {isDeleting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <MoreVertical className="h-5 w-5" />
        )}
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-brand-white shadow-lg ring-1 ring-black/5 focus:outline-none">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onEdit}
                  className={`${
                    active ? 'bg-support-light/50 text-support-dark' : 'text-support-dark'
                  } group flex w-full items-center px-4 py-2 text-sm`}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleDelete}
                  className={`${
                    active ? 'bg-status-overdue/10 text-status-overdue' : 'text-status-overdue'
                  } group flex w-full items-center px-4 py-2 text-sm`}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}