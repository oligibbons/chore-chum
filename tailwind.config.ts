// tailwind.config.ts

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Setup the fonts we added in app/layout.tsx
      fontFamily: {
        sans: ['var(--font-inter)'], // Inter for body text
        heading: ['var(--font-lexend)'], // Lexend for headings
      },

      // Define our new, modern color palette
      colors: {
        // Main Brand Colors
        'brand-primary': '#ad8ae1', // Purple (Primary accent)
        'brand-secondary': '#b02e46', // Red (Destructive actions)
        'brand-white': '#ffffff', // Card backgrounds, text on dark
        
        // NEW: Background color for the main page body
        'background': '#f9fafb', // A very light, clean gray

        // Support Colors
        'support-dark': '#303030', // Main text color
        'support-light': '#e5e7eb', // Borders and dividers

        // Status Colors (for chores)
        'status-overdue': '#D92D20', // Red
        'status-due-soon': '#FDB022', // Amber
        'status-complete': '#079455', // Green
      },
    },
  },
  // Add the Tailwind forms plugin
  plugins: [require('@tailwindcss/forms')],
}
export default config