// src/types/database.ts

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from './supabase'

// --- Supabase Helpers ---

// Use this type in your server actions and client components
// instead of just 'SupabaseClient' to ensure type safety without casting.
// We explicitly default to the 'public' schema.
export type TypedSupabaseClient = SupabaseClient<Database, 'public', Database['public']>

// Shortcuts for Table Row, Insert, and Update types
// Usage: type Chore = Tables<'chores'>
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// --- Application Specific Types ---

export type DbChore = Tables<'chores'>
export type DbProfile = Tables<'profiles'>
export type DbRoom = Tables<'rooms'>
export type DbHousehold = Tables<'households'>
export type DbActivityLog = Tables<'activity_logs'>

// Combined type: Chore + Profile + Room
export type ChoreWithDetails = DbChore & {
  profiles: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'> | null
  rooms: Pick<DbRoom, 'id' | 'name'> | null
}

// Combined type: Household Data Package
export type HouseholdData = {
  household: Pick<DbHousehold, 'id' | 'name' | 'invite_code'>
  members: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'>[]
  rooms: DbRoom[]
  chores: ChoreWithDetails[]
}

// Combined type: Room with counts
export type RoomWithChoreCount = DbRoom & {
  chore_count: number
}

// Combined type: Activity Log with User info
export type ActivityLogWithUser = DbActivityLog & {
  profiles: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'> | null
}