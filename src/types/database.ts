// src/types/database.ts

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from './supabase'

// --- Supabase Helpers ---
export type TypedSupabaseClient = SupabaseClient<Database>

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// --- Application Specific Types ---

export type DbChore = Omit<Tables<'chores'>, 'assigned_to'> & {
  assigned_to: string[] | null // Application handles this as an array of UUIDs
  time_of_day?: 'morning' | 'afternoon' | 'evening' | 'any' | null
  exact_time?: string | null
  // 'daily', 'weekly', 'monthly', or 'custom:freq:interval:until'
  recurrence_type: string
  parent_chore_id?: number | null 
}

export type DbRoom = Tables<'rooms'> & {
  keywords?: string[] 
}

export type DbProfile = Tables<'profiles'> & {
  current_streak?: number
  longest_streak?: number
  last_chore_date?: string | null
}

export type DbHousehold = Tables<'households'>

export type DbActivityLog = Tables<'activity_logs'> & {
  details?: {
    days?: number
    completed_by?: string
    [key: string]: any
  } | null
}

// New Types for Features
export type DbBounty = {
  id: number
  created_at: string
  household_id: string
  created_by: string | null
  description: string
  is_active: boolean
}

export type DbTemplate = {
  id: number
  created_at: string
  household_id: string
  name: string
  subtasks: string[] // JSONB array stored as string[]
  icon?: string
  created_by: string | null
}

// Combined Types for UI
export type ChoreWithDetails = DbChore & {
  assignees: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'>[] | null
  rooms: Pick<DbRoom, 'id' | 'name'> | null
  // Added subtasks for recursive UI handling
  subtasks?: ChoreWithDetails[]
}

export type HouseholdData = {
  household: Pick<DbHousehold, 'id' | 'name' | 'invite_code'>
  members: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url' | 'current_streak'>[]
  rooms: DbRoom[]
  chores: ChoreWithDetails[]
}

export type RoomWithChoreCount = DbRoom & {
  chore_count: number
  overdue_count?: number // For "Room Rot" visualization
}

export type ActivityLogWithUser = DbActivityLog & {
  profiles: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'> | null
}