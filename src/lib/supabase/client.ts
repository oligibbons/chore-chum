// src/lib/supabase/client.ts

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'
import { TypedSupabaseClient } from '@/types/database'

export function createSupabaseBrowserClient(): TypedSupabaseClient {
  // FIX: Use 'as any' intermediate cast to bypass library version mismatches
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as any as TypedSupabaseClient
}