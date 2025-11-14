// components/ChoreDisplay.tsx

'use client'

import { useState, useEffect } from 'react'
import { HouseholdData, ChoreWithDetails } from '@/types/database'
import { Plus } from 'lucide-react'
import AddChoreModal from './AddChoreModal'
import EditChoreModal from './EditChoreModal'
import ChoreItem from './ChoreItem' // <-- Import the new component
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

// --- Main Display Component ---
export default function ChoreDisplay({ data }: { data: HouseholdData }) {
  const { household, members, rooms, chores } = data
  const router = useRouter()
  
  // State for the modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedChore, setSelectedChore] = useState<ChoreWithDetails | null>(null)

  // --- SUPABASE REALTIME HOOK ---
  useEffect(() => {
    // Create a Supabase client for the browser
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

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
  
  // --- Modal Handlers ---
  
  const handleEditClick = (chore: ChoreWithDetails) => {
    setSelectedChore(chore)
    setIsEditModalOpen(true)
  }

  const handleCloseEdit = () => {
    setIsEditModalOpen(false)
    setSelectedChore(null)
  }

  // Sort chores
  const sortedChores = [...chores].sort((a, b) => {
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
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div>
          <h2 className="font-heading text-3xl font-bold text-support-dark">
            {household.name}
          </h2>
          <p className="mt-1 text-lg text-support-dark/80">
            Invite Code: <span className="font-mono font-bold text-brand-secondary">{household.invite_code}</span>
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-5 py-3 font-heading text-base font-semibold text-brand-white shadow-sm transition-all hover:bg-brand-primary/90 sm:w-auto"
        >
          <Plus className="h-5 w-5" />
          Add Chore
        </button>
      </div>

      {/* Chore List */}
      <div className="space-y-6">
        {/* Incomplete Chores */}
        <div>
          <h3 className="mb-3 font-heading text-xl font-semibold text-support-dark">
            To Do
          </h3>
          {incompleteChores.length > 0 ? (
            <ul className="space-y-3">
              {incompleteChores.map((chore) => (
                <ChoreItem key={chore.id} chore={chore} onEdit={handleEditClick} />
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed border-support-light p-6 text-center text-support-dark/80">
              Nothing to do. Relax for a bit!
            </p>
          )}
        </div>

        {/* Complete Chores */}
        {completeChores.length > 0 && (
          <div>
            <h3 className="mb-3 font-heading text-xl font-semibold text-support-dark">
              Complete
            </h3>
            <ul className="space-y-3 opacity-70">
              {completeChores.map((chore) => (
                <ChoreItem key={chore.id} chore={chore} onEdit={handleEditClick} />
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Modals */}
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