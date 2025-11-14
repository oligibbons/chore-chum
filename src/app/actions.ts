// app/actions.ts
'use server' // Defines this as a Server Actions file

import { createSupabaseServerActionClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signOut() {
  const supabase = createSupabaseServerActionClient()
  
  // Sign the user out
  await supabase.auth.signOut()
  
  // Redirect them back to the home page
  redirect('/')
}