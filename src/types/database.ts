// src/types/database.ts

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from './supabase'

// --- Supabase Helpers ---
export type TypedSupabaseClient = SupabaseClient<Database>

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// --- Application Specific Types ---

// EXTENDED DbChore with new manual fields until you regenerate types
export type DbChore = Tables<'chores'> & {
  time_of_day?: 'morning' | 'afternoon' | 'evening' | 'any' | null
  exact_time?: string | null
  custom_recurrence?: { type: 'interval'; days: number } | { type: 'specific'; days: number[] } | null
}

// EXTENDED DbProfile for Streaks
export type DbProfile = Tables<'profiles'> & {
  current_streak?: number
  longest_streak?: number
  last_chore_date?: string | null
}

export type DbRoom = Tables<'rooms'>
export type DbHousehold = Tables<'households'>
export type DbActivityLog = Tables<'activity_logs'>

// Combined type: Chore + Profile + Room
export type ChoreWithDetails = DbChore & {
  profiles: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'> | null
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