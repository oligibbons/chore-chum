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
// The DB stores 'assigned_to' as a raw string (JSON/CSV), but the app uses string[].
// We override this field for type safety within the application layer.
export type DbChore = Omit<Tables<'chores'>, 'assigned_to'> & {
  assigned_to: string[] | null
  time_of_day?: 'morning' | 'afternoon' | 'evening' | 'any' | null
  exact_time?: string | null
  // Phase 2: Complex Recurrence Support
  custom_recurrence?: { type: 'interval'; days: number; unit?: string } | null
}

// EXTENDED DbRoom:
// Phase 2: 'Implicit Room Detection' requires keywords, which are not in the DB yet.
// We extend the type here to support passing this data in the UI/Parser.
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

// Combined Types
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
}

export type ActivityLogWithUser = DbActivityLog & {
  profiles: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'> | null
}