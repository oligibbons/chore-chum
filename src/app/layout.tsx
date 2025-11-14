// app/layout.tsx

import type { Metadata } from 'next'
// Import the fonts from Google Fonts
import { Inter, Lexend } from 'next/font/google'
import './globals.css'

// Configure the 'Inter' font (for body/sans-serif text)
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter', // CSS variable name
  weight: ['300', '400', '500'], // Light, Regular, Medium
})

// Configure the 'Lexend' font (for heading text)
const lexend = Lexend({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lexend', // CSS variable name
  weight: ['600', '700', '800'], // Bold weights
})

// Metadata for your app (good for SEO and browser tabs)
export const metadata: Metadata = {
  title: 'ChoreChum - Your Household Chore Planner',
  description: 'Manage your household chores with ease. Join a household, assign tasks, and get things done together.',
}

// This is the RootLayout that wraps every page
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-GB">
      {/* This applies the font variables to the <html> tag,
        making them available for Tailwind's 'font-sans' and 'font-heading' classes.
      */}
      <body className={`${inter.variable} ${lexend.variable}`}>
        {children}
      </body>
    </html>
  )
}