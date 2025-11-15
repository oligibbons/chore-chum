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
    // This applies the CSS variables to the root
    <html lang="en" className={`${inter.variable} ${lexend.variable}`}>
      {/*
        This is the correct, final version.
        It applies the base styles to the body tag.
      */}
      <body className="bg-background text-text-secondary font-sans">
        {children}
      </body>
    </html>
  )
}