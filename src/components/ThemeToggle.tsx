// src/components/ThemeToggle.tsx
'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun, Laptop } from 'lucide-react'
import { useGameFeel } from '@/hooks/use-game-feel'

type Theme = 'light' | 'dark' | 'system'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')
  const { interact } = useGameFeel()

  // 1. Initialize Theme on Mount
  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored) {
      setTheme(stored)
      applyTheme(stored)
    } else {
      setTheme('system')
      applyTheme('system')
    }
  }, [])

  // 2. Handle System Changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') applyTheme('system')
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement
    const isDark =
      newTheme === 'dark' ||
      (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  const handleSelect = (newTheme: Theme) => {
    interact('neutral')
    setTheme(newTheme)
    if (newTheme === 'system') {
      localStorage.removeItem('theme')
    } else {
      localStorage.setItem('theme', newTheme)
    }
    applyTheme(newTheme)
  }

  return (
    <div className="flex bg-muted p-1 rounded-xl border border-border">
      <button
        onClick={() => handleSelect('light')}
        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
          theme === 'light'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Sun className="h-4 w-4" />
        <span className="hidden sm:inline">Light</span>
      </button>
      <button
        onClick={() => handleSelect('dark')}
        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
          theme === 'dark'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Moon className="h-4 w-4" />
        <span className="hidden sm:inline">Dark</span>
      </button>
      <button
        onClick={() => handleSelect('system')}
        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${
          theme === 'system'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Laptop className="h-4 w-4" />
        <span className="hidden sm:inline">System</span>
      </button>
    </div>
  )
}