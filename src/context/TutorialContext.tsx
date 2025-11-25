// src/context/TutorialContext.tsx
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { completeTutorial } from '@/app/profile-actions'
import { useGameFeel } from '@/hooks/use-game-feel'

type TutorialStep = {
  target: string
  title: string
  description: string
  position?: 'top' | 'bottom' | 'center'
  route?: string
}

export const TOUR_STEPS: TutorialStep[] = [
  // --- DASHBOARD ---
  {
    target: 'welcome-header',
    title: 'Welcome Home',
    description: "Welcome to ChoreChum! Let's get you settled in.",
    position: 'bottom',
    route: '/dashboard'
  },
  {
    target: 'chore-list',
    title: 'Your Task List',
    description: "Here are your chores. Tap the circle to complete, or tap the card to edit.",
    position: 'top',
    route: '/dashboard'
  },
  {
    target: 'add-chore-fab',
    title: 'Add Anything',
    description: "Tap the + button to create new chores or save templates.",
    position: 'top', // Explicit top preference for bottom-right FAB
    route: '/dashboard'
  },
  {
    target: 'zen-mode-btn',
    title: 'Zen Mode',
    description: "Overwhelmed? Tap here to focus on just ONE task.",
    position: 'bottom',
    route: '/dashboard'
  },
  {
    target: 'streak-fire',
    title: 'Daily Streak',
    description: "Complete at least one chore daily to keep the fire burning!",
    position: 'bottom',
    route: '/dashboard'
  },
  {
    target: 'leaderboard-card',
    title: 'Leaderboard',
    description: "Compete for the weekly bounty or just for glory.",
    position: 'top',
    route: '/dashboard'
  },
  
  // --- ROOMS ---
  {
    target: 'nav-rooms',
    title: 'Rooms View',
    description: "Filter chores by room to clean systematically.",
    position: 'top',
    route: '/dashboard'
  },

  // --- CALENDAR ---
  {
    target: 'nav-calendar',
    title: 'Planning Ahead',
    description: "Let's check the schedule in the Calendar view.",
    position: 'top',
    route: '/dashboard'
  },
  {
    target: 'calendar-view',
    title: 'Weekly Calendar',
    description: "See what's coming up this week.",
    position: 'bottom',
    route: '/calendar'
  },

  // --- FEED ---
  {
    target: 'nav-feed',
    title: 'Activity Feed',
    description: "Now let's see what the household has been up to.",
    position: 'top',
    route: '/calendar'
  },
  {
    target: 'feed-view',
    title: 'Household History',
    description: "A live log of completions, nudges, and new members.",
    position: 'bottom',
    route: '/feed'
  },

  // --- PROFILE ---
  {
    target: 'nav-profile',
    title: 'You',
    description: "Finally, let's head to your Profile.",
    position: 'top',
    route: '/feed'
  },
  {
    target: 'profile-view',
    title: 'Your Settings',
    description: "Manage notifications, theme, and household settings here.",
    position: 'bottom',
    route: '/profile'
  },
  {
    target: 'tour-restart-btn',
    title: 'All Set!',
    description: "You're ready! Tap this button anytime to replay this tour.",
    position: 'top',
    route: '/profile'
  }
]

type TutorialContextType = {
  isActive: boolean
  currentStepIndex: number
  startTutorial: () => void
  endTutorial: () => void
  nextStep: () => void
  skipTutorial: () => void
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined)

export function TutorialProvider({ 
  children, 
  hasCompletedTutorial 
}: { 
  children: ReactNode
  hasCompletedTutorial: boolean 
}) {
  const [isActive, setIsActive] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const router = useRouter()
  const pathname = usePathname()
  const { interact } = useGameFeel()

  useEffect(() => {
    if (!hasCompletedTutorial) {
        const timer = setTimeout(() => setIsActive(true), 1500)
        return () => clearTimeout(timer)
    }
  }, [hasCompletedTutorial])

  useEffect(() => {
    if (!isActive) return
    const step = TOUR_STEPS[currentStepIndex]
    if (step.route && pathname !== step.route) {
        router.push(step.route)
    }
  }, [isActive, currentStepIndex, pathname, router])

  const startTutorial = () => {
    setCurrentStepIndex(0)
    setIsActive(true)
    if (pathname !== '/dashboard') router.push('/dashboard')
  }

  const endTutorial = async () => {
    setIsActive(false)
    interact('success')
    await completeTutorial()
  }

  const skipTutorial = async () => {
    setIsActive(false)
    interact('neutral')
    await completeTutorial()
  }

  const nextStep = () => {
    interact('neutral')
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
    } else {
      endTutorial()
    }
  }

  return (
    <TutorialContext.Provider value={{ isActive, currentStepIndex, startTutorial, endTutorial, nextStep, skipTutorial }}>
      {children}
    </TutorialContext.Provider>
  )
}

export function useTutorial() {
  const context = useContext(TutorialContext)
  if (!context) throw new Error('useTutorial must be used within a TutorialProvider')
  return context
}