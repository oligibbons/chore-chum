// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Use the same Vercel-safe logic for env vars
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
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
          response.cookies.set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.delete(name)
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.delete({ name, ...options })
        },
      },
    }
  )

  // Refresh the session
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  const { pathname } = request.nextUrl

  // --- NEW AUTH REDIRECT LOGIC ---

  // 1. If user is not logged in and tries to access protected app routes
  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/rooms'))) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 2. If user is logged in and tries to access the homepage
  if (user && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // --- END NEW LOGIC ---

  // All good, continue to the requested page
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     * - /auth/callback (CRITICAL: must exclude this)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.png$|.*\\.jpg$).*)',
  ],
}