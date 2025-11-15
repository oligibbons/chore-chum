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
  description: 'The simplest way to manage your household tasks, assign tasks, and get things done together.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // Apply font variables to HTML tag
    <html lang="en" className={`${inter.variable} ${lexend.variable}`}>
      {/*
        FIX: Apply background and text colors here.
        This fixes the "Cannot apply unknown utility class" error.
      */}
      <body className="bg-background text-text-secondary">
        {children}
      </body>
    </html>
  )
}