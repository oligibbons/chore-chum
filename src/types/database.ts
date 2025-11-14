// types/database.ts

import { Database } from './supabase'

// These are the individual types from your Supabase schema
export type DbChore = Database['public']['Tables']['chores']['Row']
export type DbProfile = Database['public']['Tables']['profiles']['Row']
export type DbRoom = Database['public']['Tables']['rooms']['Row']
export type DbHousehold = Database['public']['Tables']['households']['Row']

// This is our new, "combined" type.
// It's a Chore, but we also include the full 'profiles' object
// and the full 'rooms' object it's linked to.
export type ChoreWithDetails = DbChore & {
  // profiles can be null (if not assigned)
  profiles: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'> | null
  // rooms can be null (if not specified)
  rooms: Pick<DbRoom, 'id' | 'name'> | null
}

// This will be the full data package for the household dashboard
export type HouseholdData = {
  household: Pick<DbHousehold, 'id' | 'name' | 'invite_code'>
  members: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'>[]
  rooms: DbRoom[]
  chores: ChoreWithDetails[]
}