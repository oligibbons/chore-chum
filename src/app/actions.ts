// app/actions.ts
'use server' // Defines this as a Server Actions file

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// This creates a Supabase client for Server Actions
const createSupabaseServerActionClient = () => {
  const cookieStore = cookies()
  return createServerActionClient({
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