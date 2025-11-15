// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export async function middleware(request: NextRequest) {
  // Create a response object that we can modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Get Vercel-safe env vars
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        // This is the new, correct cookie handling pattern for middleware
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Use getUser() to read the session. This will also refresh the session cookie.
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // --- CONSOLIDATED AUTH REDIRECT LOGIC ---
  const isAppRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/rooms')
  const isHomeRoute = pathname === '/'

  if (!user && isAppRoute) {
    // If user is not logged in and tries to access app, redirect to home.
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (user && isHomeRoute) {
    // If user is logged in and tries to access home/login page, redirect to dashboard.
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // All checks passed, return the response (which now has the refreshed cookie)
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /auth/callback (CRITICAL: must exclude this)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.png$|.*\\.jpg$).*)',
  ],
}