// tailwind.config.ts

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Your chosen brand palette
        'brand-primary': '#b02e46', // Bold Red
        'brand-secondary': '#ad8ae1', // Purple
        'support-light': '#cccecf', // Light Grey
        'support-dark': '#303030', // Dark Grey / Text
        'brand-white': '#FFFFFF', // Clean White

        // Status colours (for later)
        'status-overdue': '#D92D20', // A strong red for overdue
        'status-due-soon': '#FDB022', // An amber for warning
        'status-complete': '#079455', // A nice green for success
      },
      fontFamily: {
        // sans: ['Inter', 'sans-serif'], // This will be our body font
        // heading: ['Lexend', 'sans-serif'], // This will be our heading font
        
        // We register them properly via the layout file,
        // but this shows how you could do it.
        // For simplicity, we'll use CSS variables set in layout.js
        sans: ['var(--font-inter)'],
        heading: ['var(--font-lexend)'],
      },
      animation: {
        // Example animation for later (e.g., successful completion)
        'confetti-burst': 'confetti 0.8s ease-out forwards',
      },
      keyframes: {
        // Example keyframes for that animation
        confetti: {
          '0%': { transform: 'scale(0.5) translateY(0)', opacity: '1' },
          '100%': { transform: 'scale(1.2) translateY(-100px)', opacity: '0' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // A useful plugin for styling forms nicely
  ],
}
export default config