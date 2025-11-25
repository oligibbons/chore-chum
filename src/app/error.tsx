// src/app/error.tsx
'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
      <div className="w-full max-w-md text-center space-y-6">
        
        <div className="mx-auto w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
            <AlertTriangle className="h-12 w-12 text-red-500 dark:text-red-400" />
        </div>

        <div className="space-y-2">
            <h2 className="text-2xl font-heading font-bold text-foreground">
                Something went wrong!
            </h2>
            <p className="text-muted-foreground">
                We encountered an error while loading this page. It might be a network glitch.
            </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
                onClick={reset}
                className="flex items-center justify-center gap-2 bg-brand text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-dark transition-all active:scale-95"
            >
                <RefreshCw className="h-5 w-5" />
                Try Again
            </button>
            
            <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 bg-card border border-border text-muted-foreground px-6 py-3 rounded-xl font-bold hover:bg-muted hover:text-foreground transition-all active:scale-95"
            >
                <Home className="h-5 w-5" />
                Go Home
            </Link>
        </div>
        
        <div className="pt-8">
            <p className="text-xs text-muted-foreground/50 font-mono">
                Error Digest: {error.digest || 'Unknown'}
            </p>
        </div>
      </div>
    </div>
  )
}