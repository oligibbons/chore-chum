// tailwind.config.ts

import type { Config } from 'tailwindcss'
// FIX 1: Import plugins as modules
import forms from '@tailwindcss/forms'

const config: Config = {
  // FIX 2: 'content' key is removed in Tailwind v4.
  // Tailwind automatically scans your project.
  
  // FIX 3: 'theme.extend' is removed.
  // All customizations go directly under 'theme'.
  theme: {
    fontFamily: {
      sans: ['var(--font-inter)', 'sans-serif'],
      heading: ['var(--font-lexend)', 'sans-serif'],
    },
    colors: {
      // Your custom colors are now the *base* colors.
      // Tailwind v4 automatically adds default colors if you need them.
      background: 'hsl(210, 40%, 98%)',
      card: 'hsl(0, 0%, 100%)',
      brand: {
        light: 'hsl(252, 92%, 95%)',
        DEFAULT: 'hsl(252, 75%, 60%)',
        dark: 'hsl(252, 75%, 50%)',
      },
      text: {
        primary: 'hsl(224, 20%, 13%)',
        secondary: 'hsl(215, 10%, 45%)',
      },
      border: 'hsl(214, 32%, 91%)',
      status: {
        overdue: 'hsl(350, 78%, 60%)',
        due: 'hsl(38, 92%, 50%)',
        complete: 'hsl(145, 63%, 42%)',
      },
    },
    boxShadow: {
      'card': '0 4px 12px 0 hsla(216, 28%, 7%, 0.05)',
      'card-hover': '0 6px 16px 0 hsla(216, 28%, 7%, 0.07)',
    },
  },
  // FIX 4: Plugins are now passed as module references
  plugins: [
    forms
  ],
}
export default config