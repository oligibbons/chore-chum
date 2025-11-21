import Link from 'next/link'
import { Map, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-center">
      
      <div className="space-y-6 max-w-md w-full">
        <div className="relative mx-auto w-32 h-32">
            <div className="absolute inset-0 bg-brand/10 rounded-full animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
                <Map className="h-16 w-16 text-brand opacity-50" />
            </div>
        </div>

        <div className="space-y-2">
            <h1 className="text-4xl font-heading font-bold text-foreground">404</h1>
            <h2 className="text-xl font-semibold text-text-primary">Lost in the house?</h2>
            <p className="text-text-secondary">
                We searched the Kitchen, the Living Room, and even behind the Sofa, but we couldn't find that page.
            </p>
        </div>

        <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-all active:scale-95 shadow-lg"
        >
            <ArrowLeft className="h-5 w-5" />
            Return to Dashboard
        </Link>
      </div>

    </div>
  )
}