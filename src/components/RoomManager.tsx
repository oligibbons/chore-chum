// components/RoomManager.tsx

'use client'

import { useState, useTransition, useRef } from 'react'
import { DbRoom } from '@/types/database'
import { createRoom, deleteRoom } from '@/app/room-actions'
import { Loader2, Plus, Trash2, X } from 'lucide-react'

// Sub-component for the "Add Room" form
function AddRoomForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null) // To reset the form

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)
    
    startTransition(async () => {
      try {
        await createRoom(formData)
        formRef.current?.reset() // Clear the form on success
      } catch (err: any) {
        setError(err.message)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} ref={formRef} className="space-y-3">
      <h3 className="font-heading text-xl font-semibold text-support-dark">
        Add a New Room
      </h3>
      <div>
        <label htmlFor="roomName" className="sr-only">Room Name</label>
        <input
          type="text"
          id="roomName"
          name="roomName"
          required
          placeholder="e.g. 'Upstairs Bathroom'"
          className="block w-full rounded-lg border-support-light shadow-sm transition-all focus:border-brand-primary focus:ring-brand-primary"
        />
      </div>
      
      {error && <p className="text-sm text-status-overdue">{error}</p>}
      
      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-5 py-3 font-heading text-base font-semibold text-brand-white shadow-sm transition-all hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Plus className="h-5 w-5" />
        )}
        Add Room
      </button>
    </form>
  )
}

// Sub-component for the list of existing rooms
function RoomList({ rooms }: { rooms: DbRoom[] }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleDelete = (roomId: number) => {
    // Optional: Add a confirmation dialog here
    // if (!confirm('Are you sure you want to delete this room?')) {
    //   return
    // }
    
    setError(null)
    startTransition(async () => {
      try {
        await deleteRoom(roomId)
      } catch (err: any) {
        setError(err.message)
      }
    })
  }
  
  return (
    <div className="space-y-3">
       <h3 className="font-heading text-xl font-semibold text-support-dark">
        Existing Rooms
      </h3>
      {error && <p className="text-sm text-status-overdue">{error}</sObject>}
      
      {rooms.length === 0 ? (
        <p className="rounded-lg border border-dashed border-support-light p-6 text-center text-support-dark/80">
          You haven't added any rooms yet.
        </p>
      ) : (
        <ul className="rounded-lg border border-support-light shadow-sm">
          {rooms.map((room, index) => (
            <li
              key={room.id}
              className={`flex items-center justify-between p-4
                ${index === 0 ? '' : 'border-t border-support-light'}
                ${isPending ? 'opacity-50' : ''}
              `}
            >
              <span className="font-medium text-support-dark">{room.name}</span>
              <button
                onClick={() => handleDelete(room.id)}
                disabled={isPending}
                className="rounded-lg p-2 text-status-overdue/70 transition-all hover:bg-status-overdue/10 hover:text-status-overdue disabled:opacity-50"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Main component that wraps the others
export default function RoomManager({ rooms }: { rooms: DbRoom[] }) {
  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-10 md:grid-cols-2">
      <div>
        <AddRoomForm />
      </div>
      <div>
        <RoomList rooms={rooms} />
      </div>
    </div>
  )
}