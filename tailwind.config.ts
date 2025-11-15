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
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        heading: ['var(--font-lexend)', 'sans-serif'],
      },
      colors: {
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
  },
  plugins: [require('@tailwindcss/forms')],
}
export default config