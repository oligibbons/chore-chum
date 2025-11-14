// lib/supabase/server.ts

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase' // <-- 1. IMPORT YOUR TYPES

// This creates a Supabase client for Server Components
export const createSupabaseServerClient = () => {
  // We pass the 'cookies' function itself to the client.
  // The Supabase client will call this function when it needs
  // to access the cookies.
  return createServerComponentClient<Database>({ // <-- 2. ADD THE <Database> GENERIC
    cookies: cookies,
  })
}