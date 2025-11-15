// src/app/auth/callback/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export const dynamic = 'force-dynamic' // Ensure it's not statically built



export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  // Create a response object to redirect to the dashboard
  const response = NextResponse.redirect(new URL('/dashboard', request.url))

  if (code) {
    // Create the Supabase client, passing in the request's cookies
    // and the new response object to set cookies on.
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