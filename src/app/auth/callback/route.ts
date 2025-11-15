// src/app/auth/callback/route.ts

// ... imports ...
export async function GET(request: NextRequest) {
    // ...
    if (code) {
      // VERCEL FIX: Use original NEXT_PUBLIC_ variables directly.
      const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set(name, value, options)
          },
          remove(name: string, options: CookieOptions) {
            // Combine name and options into a single object
            response.cookies.delete({ name, ...options })
          },
        },
      }
    )
    
    // Exchange the code for a session, which will be
    // automatically set on the response object.
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Return the response object (with the new auth cookie)
  // to the browser.
  return response
}