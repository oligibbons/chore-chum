// src/lib/supabase/server.ts

export async function createSupabaseClient() {
  const cookieStore = await cookies()

  // Use SUPABASE_URL and SUPABASE_ANON_KEY, which are correctly picked up by the Cloudflare Worker runtime
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  // For Cloudflare compatibility, we use the non-NEXT_PUBLIC_ variables, 
  // falling back to the NEXT_PUBLIC_ for local dev convenience if the others are missing.
  
  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
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