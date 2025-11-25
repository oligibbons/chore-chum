// src/components/RoomManager.tsx
'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useEffect } from 'react'
import { createRoom, deleteRoom, FormState } from '@/app/room-actions'
import { Trash2, Loader2, Home, ArrowRight, Bug, Skull, Sparkles, AlertTriangle } from 'lucide-react'
import { RoomWithChoreCount } from '@/types/database'
import { toast } from 'sonner'
import { getRoomIcon } from '@/lib/room-icons'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rooms.length === 0 ? (
            <div className="col-span-full rounded-xl border-2 border-dashed border-border bg-card/50 p-8 text-center">
              <p className="font-medium text-text-secondary">
                No rooms created yet.
              </p>
            </div>
          ) : (
            rooms.map((room) => {
                // --- Visual Rot Logic ---
                const overdue = room.overdue_count ?? 0;
                
                // Levels: 0 (Clean), 1 (Grimy), 2 (Filthy), 3 (Critical)
                let rotLevel = 0;
                if (overdue > 0) rotLevel = 1;
                if (overdue > 3) rotLevel = 2;
                if (overdue > 7) rotLevel = 3;

                let cardStyles = 'bg-card border-border hover:border-brand/50';
                let iconBg = 'bg-brand-light text-brand';
                let statusText = 'Sparkling';
                let statusColor = 'text-text-secondary';

                if (rotLevel === 1) {
                    // Grimy: Slight sepia/yellow tint
                    cardStyles = 'bg-[#fffcf5] border-amber-200 hover:border-amber-300';
                    iconBg = 'bg-amber-100 text-amber-600';
                    statusText = 'Grimy';
                    statusColor = 'text-amber-600';
                } else if (rotLevel === 2) {
                    // Filthy: Noise texture, brown tint
                    cardStyles = 'bg-[#faf5f0] border-orange-300 hover:border-orange-400 overflow-hidden relative';
                    iconBg = 'bg-orange-200 text-orange-800';
                    statusText = 'Filthy';
                    statusColor = 'text-orange-700 font-bold';
                } else if (rotLevel === 3) {
                    // Critical: Red/Brown, pulsating
                    cardStyles = 'bg-[#fff0f0] border-red-300 ring-1 ring-red-100 overflow-hidden relative';
                    iconBg = 'bg-red-200 text-red-900 animate-pulse';
                    statusText = 'CRITICAL';
                    statusColor = 'text-red-700 font-black tracking-widest';
                }

                return (
                  <div
                    key={room.id}
                    onClick={() => router.push(`/dashboard?roomId=${room.id}`)}
                    className={`
                        group relative flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md cursor-pointer h-[160px]
                        ${cardStyles}
                    `}
                  >
                    {/* Noise Overlay for Rot > 1 */}
                    {rotLevel >= 2 && (
                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 pointer-events-none mix-blend-multiply" />
                    )}

                    {/* Flies Animation for Rot > 1 */}
                    {rotLevel >= 2 && (
                        <div className="absolute top-2 right-2 animate-bounce-slow pointer-events-none opacity-50">
                            <Bug className="h-4 w-4 text-stone-600 transform rotate-12" />
                        </div>
                    )}
                    {rotLevel >= 3 && (
                        <div className="absolute bottom-10 left-4 animate-pulse pointer-events-none opacity-40">
                            <Bug className="h-3 w-3 text-stone-800 transform -rotate-45" />
                        </div>
                    )}

                    <div className="flex justify-between items-start relative z-10">
                        <div className={`
                            flex items-center justify-center h-12 w-12 rounded-full transition-transform group-hover:scale-110
                            ${iconBg}
                        `}>
                            {getRoomIcon(room.name, "h-6 w-6")}
                        </div>
                        
                        <form action={handleDelete} onClick={(e) => e.stopPropagation()}>
                            <input type="hidden" name="roomId" value={room.id} />
                            <button
                                type="submit"
                                className="p-2 text-text-secondary/50 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Room"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </form>
                    </div>
                    
                    <div className="relative z-10">
                        <h4 className="font-heading text-lg font-bold text-foreground group-hover:text-brand transition-colors truncate">
                            {room.name}
                        </h4>
                        
                        <div className="flex items-center gap-2 mt-1">
                            {rotLevel === 0 ? (
                                <div className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                                    <Sparkles className="h-3 w-3" />
                                    Clean
                                </div>
                            ) : (
                                <div className={`flex items-center gap-1 text-xs ${statusColor} bg-white/50 px-2 py-0.5 rounded-full border border-black/5`}>
                                    {rotLevel === 3 ? <Skull className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                    {overdue} Overdue
                                </div>
                            )}
                            <span className="text-xs text-text-secondary">
                                • {room.chore_count} total
                            </span>
                        </div>
                    </div>
                  </div>
                )
            })
          )}
        </div>
      </div>
    </div>
  )
}