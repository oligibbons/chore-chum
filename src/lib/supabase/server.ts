// src/lib/supabase/server.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers' // (Ensure this import is present)
import { Database } from '@/types/supabase'

export async function createSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    // VERCEL FIX: Use original NEXT_PUBLIC_ variables directly. Vercel knows these are secrets on the server.
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method can throw an error if called from a Server Component.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method can throw an error if called from a Server Component.
          }
        },
      },
    }
  )
}