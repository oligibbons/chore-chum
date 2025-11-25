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
    description: "Welcome to ChoreChum! Let's take a quick tour of your new household command center.",
    position: 'bottom',
    route: '/dashboard'
  },
  {
    target: 'chore-list',
    title: 'Your Task List',
    description: "This is your main feed. Tap the circle to complete a chore, or tap the card itself to edit details.",
    position: 'top',
    route: '/dashboard'
  },
  {
    target: 'zen-mode-btn',
    title: 'Zen Mode',
    description: "Feeling overwhelmed? Zen Mode hides everything except one task, helping you focus.",
    position: 'bottom',
    route: '/dashboard'
  },
  {
    target: 'streak-fire',
    title: 'Daily Streak',
    description: "Consistency is key. Complete at least one chore every day to keep your streak alive!",
    position: 'bottom',
    route: '/dashboard'
  },
  {
    target: 'leaderboard-card',
    title: 'Leaderboard',
    description: "See who's doing their part. Compete for the weekly bounty or just for glory.",
    position: 'top',
    route: '/dashboard'
  },
  {
    target: 'add-chore-fab',
    title: 'Create Chores',
    description: "Tap the + button to add new tasks. You can also save frequent chores as templates.",
    position: 'top',
    route: '/dashboard'
  },
  
  // --- ROOMS (Nav Highlight) ---
  {
    target: 'nav-rooms',
    title: 'Rooms View',
    description: "Filter your chores by room to clean systematically (e.g., 'Kitchen' only).",
    position: 'top',
    route: '/dashboard'
  },

  // --- CALENDAR ---
  {
    target: 'nav-calendar',
    title: 'Planning Ahead',
    description: "Let's look at the schedule. We'll take you to the Calendar view now.",
    position: 'top',
    route: '/dashboard' // Shows the nav item before moving
  },
  {
    target: 'calendar-view',
    title: 'Weekly Calendar',
    description: "See what's coming up this week. Good planning prevents the Sunday panic!",
    position: 'bottom',
    route: '/calendar' // Navigates user here
  },

  // --- FEED ---
  {
    target: 'nav-feed',
    title: 'Activity Feed',
    description: "Curious about what's been happening? Let's check the Feed.",
    position: 'top',
    route: '/calendar'
  },
  {
    target: 'feed-view',
    title: 'Household History',
    description: "A live log of everything: completed chores, new members, and nudges.",
    position: 'bottom',
    route: '/feed'
  },

  // --- PROFILE ---
  {
    target: 'nav-profile',
    title: 'You',
    description: "Finally, let's head to your Profile to set things up.",
    position: 'top',
    route: '/feed'
  },
  {
    target: 'profile-view',
    title: 'Your Profile',
    description: "Manage your notifications, theme, and household settings here.",
    position: 'bottom',
    route: '/profile'
  },
  {
    target: 'tour-restart-btn',
    title: 'All Set!',
    description: "You're ready to go. If you ever need this tour again, just tap this button.",
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

  // Auto-start for new users
  useEffect(() => {
    if (!hasCompletedTutorial) {
        const timer = setTimeout(() => setIsActive(true), 1500)
        return () => clearTimeout(timer)
    }
  }, [hasCompletedTutorial])

  // Navigation Logic
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