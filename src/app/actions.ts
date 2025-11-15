// app/actions.ts
'use server' // Defines this as a Server Actions file

import { createSupabaseClient } from '@/lib/supabase/server' // <-- THE FIX
import { redirect } from 'next/navigation'

export async function signOut() {
  const supabase = createSupabaseClient() // <-- THE FIX
  
  // Sign the user out
  await supabase.auth.signOut()
  
  // Redirect them back to the home page
  redirect('/')
}