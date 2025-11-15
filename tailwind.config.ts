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
        sans: ['var(--font-inter)', 'sans-serif'], // Inter for body text
        heading: ['var(--font-lexend)', 'sans-serif'], // Lexend for headings
      },

      // --- THE NEW "CHARMING" COLOR PALETTE ---
      colors: {
        // Backgrounds
        background: 'hsl(210, 40%, 98%)', // A very light, clean blue-ish gray (almost white)
        card: 'hsl(0, 0%, 100%)', // Pure white for cards
        
        // Primary Brand (Playful but Modern Violet)
        brand: {
          light: 'hsl(252, 92%, 95%)',  // Light violet bg for pills
          DEFAULT: 'hsl(252, 75%, 60%)', // Main purple
          dark: 'hsl(252, 75%, 50%)',   // Hover
        },

        // Text Colors
        text: {
          primary: 'hsl(224, 20%, 13%)', // Near-black for headings
          secondary: 'hsl(215, 10%, 45%)', // Gray for body text
        },

        // Borders
        border: 'hsl(214, 32%, 91%)', // Soft, modern borders

        // Status Colors (Vibrant)
        status: {
          overdue: 'hsl(350, 78%, 60%)', // Red
          due: 'hsl(38, 92%, 50%)',     // Amber
          complete: 'hsl(145, 63%, 42%)', // Green
        },
      },
      // Soft, modern shadows
      boxShadow: {
        'card': '0 4px 12px 0 hsla(216, 28%, 7%, 0.05)',
        'card-hover': '0 6px 16px 0 hsla(216, 28%, 7%, 0.07)',
      },
      // Smooth transitions
      transitionProperty: {
        'shadow': 'box-shadow',
      },
    },
  },
  // Add the Tailwind forms plugin
  plugins: [require('@tailwindcss/forms')],
}
export default config