// app/actions.ts
'use server' // Defines this as a Server Actions file

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Database } from '@/types/supabase' // <-- 1. IMPORT YOUR TYPES

// This creates a Supabase client for Server Actions
const createSupabaseServerActionClient = () => {
  const cookieStore = cookies()
  return createServerActionClient<Database>({ // <-- 2. ADD THE <Database> GENERIC
    cookies: () => cookieStore,
  })
}

export async function signOut() {
  const supabase = createSupabaseServerActionClient()
  
  // Sign the user out
  await supabase.auth.signOut()
  
  // Redirect them back to the home page
  redirect('/')
}