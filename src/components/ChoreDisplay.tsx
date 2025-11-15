// components/ChoreDisplay.tsx

'use client'

import { useState, useEffect } from 'react'
import { HouseholdData, ChoreWithDetails } from '@/types/database'
import { Plus } from 'lucide-react'
import AddChoreModal from './AddChoreModal'
import EditChoreModal from './EditChoreModal'
import ChoreItem from './ChoreItem'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// --- Main Display Component ---
export default function ChoreDisplay({ data }: { data: HouseholdData }) {
  const { household, members, rooms, chores } = data
  const router = useRouter()
  
  // State for the modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedChore, setSelectedChore] = useState<ChoreWithDetails | null>(null)

  // --- SUPABASE REALTIME HOOK (RESTORED) ---
  useEffect(() => {
    // Create a Supabase client for the browser
    const supabase = createSupabaseBrowserClient()

    // Set up the subscription
    const channel = supabase
      .channel(`chores:${household.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'chores',
          filter: `household_id=eq.${household.id}`, // Only for this household
        },
        (payload) => {
          // When a change is detected, tell Next.js to refresh the data
          console.log('Realtime change detected!', payload)
          router.refresh()
        }
      )
      .subscribe()

    // Cleanup function to remove the subscription when the component unmounts
    return () => {
      supabase.removeChannel(channel)
    }
  }, [household.id, router])
  
  // --- Modal Handlers (RESTORED) ---
  
  const handleEditClick = (chore: ChoreWithDetails) => {
    setSelectedChore(chore)
    setIsEditModalOpen(true)
  }

  const handleCloseEdit = () => {
    setIsEditModalOpen(false)
    setSelectedChore(null)
  }

  // Sort chores (RESTORED)
  const sortedChores = [...chores].sort((a, b) => {
    // Keep sorting logic the same
    if (a.status === 'complete' && b.status !== 'complete') return 1
    if (a.status !== 'complete' && b.status === 'complete') return -1
    if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    if (a.due_date) return -1
    if (b.due_date) return 1
    return 0
  })

  const incompleteChores = sortedChores.filter((c) => c.status !== 'complete')
  const completeChores = sortedChores.filter((c) => c.status === 'complete')

  return (
    // Modernized Container
    <div className="w-full">
      
      {/* Header: Clean, Prominent Title and Purple CTA */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-heading text-4xl font-bold text-support-dark">
            {household.name}
          </h2>
          <p className="mt-1 text-lg text-support-dark/80">
            Invite Code:{' '}
            <span className="font-mono font-bold text-brand-secondary underline decoration-2 decoration-brand-secondary/50">
              {household.invite_code}
            </span>
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-5 py-3 font-heading text-base font-semibold text-brand-white shadow-lg transition-colors hover:bg-brand-primary/90 sm:w-auto"
        >
          <Plus className="h-5 w-5" />
          Add Chore
        </button>
      </div>

      {/* Chore List: Split into two clean columns */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Incomplete Chores (Primary Column) */}
        <div>
          <h3 className="mb-4 border-b-2 border-brand-primary/20 pb-2 font-heading text-2xl font-semibold text-brand-primary">
            To Do
          </h3>
          {incompleteChores.length > 0 ? (
            <ul className="space-y-4">
              {incompleteChores.map((chore) => (
                <ChoreItem 
                  key={chore.id} 
                  chore={chore} 
                  onEdit={handleEditClick} 
                  // Assuming chore.status maps to 'overdue', 'due-soon', etc.
                  status={chore.status} 
                  showActions={true} 
                />
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-support-light p-8 text-center text-support-dark/60">
              Nothing left to do! Everything is clean.
            </p>
          )}
        </div>

        {/* Complete Chores (Secondary Column) */}
        <div>
          <h3 className="mb-4 border-b-2 border-support-light/50 pb-2 font-heading text-2xl font-semibold text-support-dark/80">
            Complete
          </h3>
          {completeChores.length > 0 && (
            <ul className="space-y-4 opacity-70">
              {completeChores.map((chore) => (
                <ChoreItem 
                  key={chore.id} 
                  chore={chore} 
                  onEdit={handleEditClick} 
                  // Assuming chore.status maps to 'complete' for these items
                  status={chore.status} 
                  showActions={true} 
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modals (FULLY RESTORED) */}
      <AddChoreModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        householdId={household.id}
        members={members}
        rooms={rooms}
      />
      <EditChoreModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEdit}
        chore={selectedChore}
        members={members}
        rooms={rooms}
      />
    </div>
  )
}