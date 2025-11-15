// src/components/RoomManager.tsx

'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createRoom, deleteRoom, FormState } from '@/app/room-actions'
import { Plus, Trash2, Loader2, Home, ArrowRight } from 'lucide-react'
import { RoomWithChoreCount } from '@/types/database'

// Initial state for our forms
const initialState: FormState = {
  success: false,
  message: '',
}

// A new, sleek Submit Button
function SubmitButton({ 
  text, 
  icon, 
  isDelete = false 
}: { 
  text: string, 
  icon: React.ReactNode,
  isDelete?: boolean
}) {
  const { pending } = useFormStatus()

  const colorClasses = isDelete
    ? 'bg-status-overdue text-white hover:bg-status-overdue/90'
    : 'bg-brand text-white hover:bg-brand-dark'

  return (
    <button
      type="submit"
      disabled={pending}
      className={`
        flex items-center justify-center rounded-xl px-5 py-3 font-heading 
        text-base font-semibold shadow-lg transition-all
        disabled:cursor-not-allowed disabled:opacity-70
        ${colorClasses}
      `}
    >
      {pending ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          {text}
          <div className="ml-2">{icon}</div>
        </>
      )}
    </button>
  )
}

// Main component: Redesigned as a two-column card layout
export default function RoomManager({ rooms }: { rooms: RoomWithChoreCount[] }) {
  const [createState, createAction] = useFormState(createRoom, initialState)
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      
      {/* --- Card 1: Create a Room --- */}
      <div className="md:col-span-1">
        <div className="flex flex-col rounded-2xl border border-border bg-card p-8 shadow-card h-full">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-light text-brand">
            <Home className="h-6 w-6" />
          </div>
          <h2 className="mb-2 font-heading text-2xl font-semibold">
            Add a New Room
          </h2>
          <p className="mb-6 flex-1 text-text-secondary">
            Create a new room for your household.
          </p>
          
          <form action={createAction} className="space-y-4">
            <div>
              <label
                htmlFor="roomName"
                className="block font-heading text-sm font-medium text-text-primary"
              >
                Room Name
              </label>
              <input
                type="text"
                id="roomName"
                name="roomName"
                required
                placeholder="e.g. 'Kitchen'"
                className="mt-1 block w-full rounded-xl border-border bg-background p-3 transition-all focus:border-brand focus:ring-brand"
              />
            </div>
            {createState.message && (
              <p className={`text-sm ${createState.success ? 'text-status-complete' : 'text-status-overdue'}`}>
                {createState.message}
              </p>
            )}
            <div className="pt-2">
              <SubmitButton text="Create Room" icon={<ArrowRight className="h-5 w-5" />} />
            </div>
          </form>
        </div>
      </div>

      {/* --- Column 2: Existing Rooms List --- */}
      <div className="md:col-span-2">
        <h3 className="mb-4 font-heading text-2xl font-semibold">
          Existing Rooms ({rooms.length})
        </h3>
        <div className="space-y-4">
          {rooms.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border bg-card/50 p-8 text-center">
              <p className="font-medium text-text-secondary">
                No rooms created yet.
              </p>
            </div>
          ) : (
            // NEW: Room items are now sleek cards
            rooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center justify-between rounded-xl bg-card p-4 shadow-card ring-1 ring-border transition-all hover:shadow-card-hover"
              >
                <div className="flex items-center space-x-3">
                    <Home className="h-6 w-6 text-brand" />
                    <div className="flex flex-col">
                      <span className="font-heading text-lg font-medium">
                          {room.name}
                      </span>
                      <span className="text-sm text-text-secondary">
                          {room.chore_count} {room.chore_count === 1 ? 'chore' : 'chores'}
                      </span>
                    </div>
                </div>
                
                <form action={deleteRoom}>
                  <input type="hidden" name="roomId" value={room.id} />
                  <button
                    type="submit"
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-status-overdue/10 hover:text-status-overdue"
                    aria-label="Delete room"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}