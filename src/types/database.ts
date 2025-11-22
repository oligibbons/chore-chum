// src/types/database.ts

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from './supabase'

// --- Supabase Helpers ---
export type TypedSupabaseClient = SupabaseClient<Database>

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// --- Application Specific Types ---

// EXTENDED DbChore:
// Represents the application view of a chore, including parsed/computed fields.
export type DbChore = Omit<Tables<'chores'>, 'assigned_to'> & {
  assigned_to: string[] | null // Application handles this as an array
  time_of_day?: 'morning' | 'afternoon' | 'evening' | 'any' | null
  exact_time?: string | null
  // Recurrence is now stored as a string in DB: 'daily', 'weekly', or 'custom:freq:interval'
  recurrence_type: string
  parent_chore_id?: number | null // For future subtask support
}

// EXTENDED DbRoom:
export type DbRoom = Tables<'rooms'> & {
  keywords?: string[] 
}

// EXTENDED DbProfile:
export type DbProfile = Tables<'profiles'> & {
  current_streak?: number
  longest_streak?: number
  last_chore_date?: string | null
}

export type DbHousehold = Tables<'households'>
export type DbActivityLog = Tables<'activity_logs'>

// Combined Types for UI
export type ChoreWithDetails = DbChore & {
  assignees: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'>[] | null
  rooms: Pick<DbRoom, 'id' | 'name'> | null
}

export type HouseholdData = {
  household: Pick<DbHousehold, 'id' | 'name' | 'invite_code'>
  members: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url' | 'current_streak'>[]
  rooms: DbRoom[]
  chores: ChoreWithDetails[]
}

export type RoomWithChoreCount = DbRoom & {
  chore_count: number
  overdue_count?: number // Added for "Room Rot" logic
}

export type ActivityLogWithUser = DbActivityLog & {
  profiles: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'> | null
}