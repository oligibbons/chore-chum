// app/layout.tsx
import type { Metadata } from 'next'
import { Inter, Lexend } from 'next/font/google'
import './global.css' // Using your project's global.css

// Setup fonts defined in tailwind.config.ts
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})
const lexend = Lexend({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lexend',
})

export const metadata: Metadata = {
  title: 'ChoreChum',
  description: 'Stop arguing. Start organising.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${lexend.variable}`}>
      {/* THIS IS THE FIX: 
        We apply the background and text colors directly here as utility classes.
        This avoids the CSS build-order error with @apply or theme() in global.css.
      */}
      <body className="bg-brand-white text-support-dark">
        {children}
      </body>
    </html>
  )
}