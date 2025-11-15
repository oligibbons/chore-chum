// src/app/layout.tsx

import type { Metadata } from 'next'
import { Inter, Lexend } from 'next/font/google'
import './global.css'

// Define custom fonts using Next.js font optimization
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
})


export const metadata: Metadata = {
  title: 'ChoreChum | Home Organization Simplified',
  description: 'The simplest way to manage your household chores, assign tasks, and get things done together.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // Apply font variables to HTML tag for global use in Tailwind
    <html lang="en" className={`${inter.variable} ${lexend.variable}`}>
      <body>
        {children}
      </body>
    </html>
  )
}