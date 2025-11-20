import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        heading: ['var(--font-lexend)', 'sans-serif'],
      },
      colors: {
        background: 'hsl(210, 40%, 98%)',
        foreground: 'hsl(224, 20%, 13%)',
        card: 'hsl(0, 0%, 100%)',
        brand: {
          light: 'hsl(252, 92%, 96%)',
          DEFAULT: 'hsl(252, 75%, 60%)',
          dark: 'hsl(252, 75%, 50%)',
        },
        text: {
          primary: 'hsl(224, 20%, 13%)',
          secondary: 'hsl(215, 16%, 47%)',
        },
        border: 'hsl(214, 32%, 91%)',
        status: {
          overdue: 'hsl(350, 78%, 60%)',
          due: 'hsl(38, 92%, 50%)',
          complete: 'hsl(145, 63%, 42%)',
        },
      },
      boxShadow: {
        'card': '0 2px 8px 0 hsla(216, 28%, 7%, 0.04), 0 1px 2px 0 hsla(216, 28%, 7%, 0.02)',
        'card-hover': '0 8px 24px 0 hsla(216, 28%, 7%, 0.08), 0 4px 8px 0 hsla(216, 28%, 7%, 0.04)',
      },
      // ANIMATION CONFIGURATION
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'zoom-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'zoom-in': 'zoom-in 0.3s ease-out',
      },
    },
  },
  plugins: [
    forms,
    // This simple plugin adds the utility classes needed if you don't use tailwindcss-animate
    function({ addUtilities }: { addUtilities: any }) {
      addUtilities({
        '.animate-in': {
          'animation-duration': '150ms',
          '--tw-enter-opacity': 'initial',
          '--tw-enter-scale': 'initial',
          '--tw-enter-rotate': 'initial',
          '--tw-enter-translate-x': 'initial',
          '--tw-enter-translate-y': 'initial',
        },
        '.fade-in': {
          animationName: 'fade-in',
          opacity: '1',
        },
        '.zoom-in': {
          animationName: 'zoom-in',
        }
      })
    }
  ],
}
export default config