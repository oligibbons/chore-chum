// app/actions.ts
'use server' // Defines this as a Server Actions file

import { createSupabaseClient } from '@/lib/supabase/server' 
import { redirect } from 'next/navigation'

export async function signOut() {
  const supabase = await createSupabaseClient() 
  
  // Sign the user out
  await supabase.auth.signOut()
  
  // Redirect them back to the home page
  redirect('/')
}