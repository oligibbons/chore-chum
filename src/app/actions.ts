// src/app/actions.ts

'use server'

import { createSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signOut() {
  const supabase = await createSupabaseClient()
  await supabase.auth.signOut()
  redirect('/')
}