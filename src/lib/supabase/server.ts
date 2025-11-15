// src/lib/supabase/server.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

export function createSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
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
            // This is fine and expected, as Server Components are read-only.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            // The `remove` method should be implemented by setting an empty value
            // with an expiration date in the past.
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` (or `set` in this case) method can throw an error
            // if called from a Server Component. This is fine and expected.
          }
        },
      },
    }
  )
}