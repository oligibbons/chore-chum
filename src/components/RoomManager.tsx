// components/RoomManager.tsx

'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createRoom, deleteRoom, FormState } from '@/app/room-actions'
import { Plus, Trash2, Loader2, Home } from 'lucide-react'
import { RoomWithChoreCount } from '@/types/database'

// Initial state for our forms
const initialState: FormState = {
  success: false,
  message: '',
}

// A helper component to show a loading spinner on the submit button
function SubmitButton({ text, isDelete }: { text: string, isDelete?: boolean }) {
  const { pending } = useFormStatus()

  // Use primary purple for creation, or secondary red for deletion
  const colorClass = isDelete
    ? 'bg-status-overdue hover:bg-status-overdue/90' // Changed to red
    : 'bg-brand-primary hover:bg-brand-primary/90'

  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex items-center justify-center rounded-xl ${colorClass} px-5 py-2 font-heading text-sm font-semibold text-brand-white shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-70`}
    >
      {pending ? (
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      ) : (
        <>
          {isDelete ? (
            <Trash2 className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          <span className="ml-2">{text}</span>
        </>
      )}
    </button>
  )
}

// Main component
export default function RoomManager({ rooms }: { rooms: RoomWithChoreCount[] }) {
  const [createState, createAction] = useFormState(createRoom, initialState)
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      
      {/* --- Create Room Form (Primary Action - PURPLE) --- */}
      <div className="md:col-span-1">
        {/* NEW: Modern card UI */}
        <div className="rounded-xl border border-support-light bg-brand-white p-6 shadow-xl ring-1 ring-support-light/50">
          <h3 className="mb-4 font-heading text-2xl font-semibold text-brand-primary">
            Add a New Room
          </h3>
          <form action={createAction} className="space-y-4">
            <div>
              <label
                htmlFor="roomName"
                className="block font-heading text-sm font-medium text-support-dark"
              >
                Room Name
              </label>
              <input
                type="text"
                id="roomName"
                name="roomName"
                required
                placeholder="e.g. 'Kitchen'"
                className="mt-1 block w-full rounded-lg border-support-light shadow-sm transition-all focus:border-brand-primary focus:ring-brand-primary"
              />
            </div>
            {!createState.success && createState.message && (
              <p className="text-sm text-status-overdue">{createState.message}</p>
            )}
            <div className="flex justify-end">
              <SubmitButton text="Create Room" />
            </div>
          </form>
        </div>
      </div>

      {/* --- Existing Rooms List --- */}
      <div className="md:col-span-2">
        <h3 className="mb-4 font-heading text-2xl font-semibold text-support-dark">
          Existing Rooms ({rooms.length})
        </h3>
        <div className="space-y-4">
          {rooms.length === 0 ? (
            <p className="rounded-xl border border-dashed border-support-light bg-brand-white p-6 text-center text-support-dark/60">
              No rooms created yet.
            </p>
          ) : (
            // NEW: Room items are now cards
            rooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center justify-between rounded-xl bg-brand-white p-4 shadow-sm ring-1 ring-support-light/50 transition-all hover:shadow-md"
              >
                <div className="flex items-center space-x-3">
                    <Home className="h-6 w-6 text-brand-primary" />
                    <span className="font-heading text-lg font-medium text-support-dark">
                        {room.name}
                    </span>
                    <span className="text-sm text-support-dark/60">
                        ({room.chore_count} chores)
                    </span>
                </div>
                
                <form action={deleteRoom}>
                  <input type="hidden" name="roomId" value={room.id} />
                  <SubmitButton text="Delete" isDelete={true} />
                </form>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}