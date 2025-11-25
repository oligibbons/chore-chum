// src/components/RoomManager.tsx
'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useEffect } from 'react'
import { createRoom, deleteRoom, FormState } from '@/app/room-actions'
import { Trash2, Loader2, Home, ArrowRight, Bug, Skull, Sparkles, AlertTriangle, ExternalLink } from 'lucide-react'
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
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-light dark:bg-brand/20 text-brand">
            <Home className="h-6 w-6" />
          </div>
          <h2 className="mb-2 font-heading text-2xl font-semibold text-foreground">
            Add a New Room
          </h2>
          <p className="mb-6 flex-1 text-muted-foreground">
            Create a new room for your household.
          </p>
          
          <form action={createAction} className="space-y-4">
            <div>
              <label
                htmlFor="roomName"
                className="block font-heading text-sm font-medium text-foreground"
              >
                Room Name
              </label>
              <input
                type="text"
                id="roomName"
                name="roomName"
                required
                placeholder="e.g. 'Kitchen'"
                className="mt-1 block w-full rounded-xl border-input bg-background p-3 transition-all focus:border-brand focus:ring-brand placeholder:text-muted-foreground"
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
        <h3 className="mb-4 font-heading text-2xl font-semibold text-foreground">
          Existing Rooms ({rooms.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rooms.length === 0 ? (
            <div className="col-span-full rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 text-center">
              <p className="font-medium text-muted-foreground">
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
                let iconBg = 'bg-brand-light dark:bg-brand/20 text-brand';
                let statusText = 'Sparkling';
                let statusColor = 'text-muted-foreground';

                if (rotLevel === 1) {
                    // Grimy: Slight sepia/yellow tint
                    cardStyles = 'bg-[#fffcf5] dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-900/50 hover:border-amber-300';
                    iconBg = 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
                    statusText = 'Grimy';
                    statusColor = 'text-amber-600 dark:text-amber-400';
                } else if (rotLevel === 2) {
                    // Filthy: Noise texture simulation using gradients, brown tint
                    cardStyles = 'bg-[#faf5f0] dark:bg-orange-950/20 border-orange-300/50 dark:border-orange-800/50 hover:border-orange-400 overflow-hidden relative';
                    iconBg = 'bg-orange-200 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300';
                    statusText = 'Filthy';
                    statusColor = 'text-orange-700 dark:text-orange-400 font-bold';
                } else if (rotLevel === 3) {
                    // Critical: Red/Brown, pulsating
                    cardStyles = 'bg-[#fff0f0] dark:bg-red-950/20 border-red-300/50 dark:border-red-900/50 ring-1 ring-red-100 dark:ring-red-900/30 overflow-hidden relative';
                    iconBg = 'bg-red-200 dark:bg-red-900/40 text-red-900 dark:text-red-200 animate-pulse';
                    statusText = 'CRITICAL';
                    statusColor = 'text-red-700 dark:text-red-400 font-black tracking-widest';
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
                    {/* CSS-based Noise Overlay for Rot > 1 */}
                    {rotLevel >= 2 && (
                        <div 
                            className="absolute inset-0 opacity-10 pointer-events-none mix-blend-multiply dark:mix-blend-overlay"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                            }}
                        />
                    )}

                    {/* Flies Animation for Rot > 1 */}
                    {rotLevel >= 2 && (
                        <div className="absolute top-2 right-2 animate-bounce-slow pointer-events-none opacity-50">
                            <Bug className="h-4 w-4 text-stone-600 dark:text-stone-400 transform rotate-12" />
                        </div>
                    )}
                    {rotLevel >= 3 && (
                        <div className="absolute bottom-10 left-4 animate-pulse pointer-events-none opacity-40">
                            <Bug className="h-3 w-3 text-stone-800 dark:text-stone-300 transform -rotate-45" />
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
                                className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
                                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full border border-green-100 dark:border-green-900/50">
                                    <Sparkles className="h-3 w-3" />
                                    Clean
                                </div>
                            ) : (
                                <div className={`flex items-center gap-1 text-xs ${statusColor} bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-full border border-black/5 dark:border-white/5`}>
                                    {rotLevel === 3 ? <Skull className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                    {overdue} Overdue
                                </div>
                            )}
                            <span className="text-xs text-muted-foreground">
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