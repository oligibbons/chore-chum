// src/components/RoomManager.tsx
'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useEffect } from 'react'
import { createRoom, deleteRoom, FormState } from '@/app/room-actions'
import { Trash2, Loader2, Home, ArrowRight, AlertTriangle } from 'lucide-react'
import { RoomWithChoreCount } from '@/types/database'
import { toast } from 'sonner'
import { getRoomIcon } from '@/lib/room-icons'

const initialState: FormState = {
  success: false,
  message: '',
}

// Extended type to support "Rot" feature
type RoomWithPotentialRot = RoomWithChoreCount & {
    overdue_count?: number 
}

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

export default function RoomManager({ rooms }: { rooms: RoomWithPotentialRot[] }) {
  const [createState, createAction] = useFormState(createRoom, initialState)

  // Handle Create Toast
  useEffect(() => {
    if (createState.message) {
      if (createState.success) {
        toast.success(createState.message)
      } else {
        toast.error(createState.message)
      }
    }
  }, [createState])

  const handleDelete = async (formData: FormData) => {
    try {
      await deleteRoom(formData)
      toast.success("Room deleted successfully")
    } catch (error) {
      toast.error("Could not delete room. Make sure it has no chores.")
    }
  }
  
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
            rooms.map((room) => {
                // Visual "Rot" Logic:
                // If a room has > 8 chores or > 3 overdue (simulated), highlight it.
                const isRotting = (room.overdue_count ?? 0) > 3 || room.chore_count > 8;
                
                return (
                  <div
                    key={room.id}
                    className={`
                        flex items-center justify-between rounded-xl border p-4 shadow-card transition-all hover:shadow-card-hover
                        ${isRotting ? 'bg-amber-50 border-amber-200' : 'bg-card border-border'}
                    `}
                  >
                    <div className="flex items-center space-x-4">
                        <div className={`
                            relative flex items-center justify-center h-12 w-12 rounded-full transition-all
                            ${isRotting ? 'bg-amber-100 text-amber-700 grayscale-[0.5]' : 'bg-brand-light text-brand'}
                        `}>
                            {/* Render Dynamic Icon based on Name */}
                            {getRoomIcon(room.name, "h-6 w-6")}
                            
                            {/* Rot Overlay */}
                            {isRotting && (
                                <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 border-2 border-white" title="Neglected Room">
                                    <AlertTriangle className="h-3 w-3" />
                                </div>
                            )}
                        </div>
                        
                        <div className="flex flex-col">
                          <span className={`font-heading text-lg font-medium ${isRotting ? 'text-amber-900' : 'text-foreground'}`}>
                              {room.name}
                          </span>
                          <span className={`text-sm ${isRotting ? 'text-amber-700/70' : 'text-text-secondary'}`}>
                              {room.chore_count} {room.chore_count === 1 ? 'chore' : 'chores'}
                              {isRotting && " (Needs attention)"}
                          </span>
                        </div>
                    </div>
                    
                    <form action={handleDelete}>
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
                )
            })
          )}
        </div>
      </div>
    </div>
  )
}