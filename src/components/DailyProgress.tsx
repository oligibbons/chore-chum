// src/components/DailyProgress.tsx
'use client'

import { useEffect, useState, Fragment } from 'react'
import { CheckCircle2, X, Trophy, Star, Sparkles } from 'lucide-react'
import { Dialog, Transition } from '@headlessui/react'
import confetti from 'canvas-confetti'
import StreakCampfire from './StreakCampfire'

type Props = {
  total: number
  completed: number
  streak: number
  lastChoreDate: string | null
}

const MESSAGES = [
    "You're absolutely crushing it!",
    "Household Hero Status: Unlocked.",
    "Nothing can stop you now.",
    "Relax, you've earned it.",
    "Clean home, clear mind.",
    "Look at that productivity!",
    "Daily goals? Smashed."
]

export default function DailyProgress({ total, completed, streak, lastChoreDate }: Props) {
  const [progress, setProgress] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const [motivation, setMotivation] = useState('')
  
  const percentage = total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100))
  
  useEffect(() => {
    // Only trigger if we moved TO 100% from a lower number
    if (percentage === 100 && progress < 100 && total > 0) {
      setShowCelebration(true)
      setMotivation(MESSAGES[Math.floor(Math.random() * MESSAGES.length)])
      
      // Big Confetti Blast
      const duration = 3000;
      const end = Date.now() + duration;

      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#a78bfa', '#34d399', '#fbbf24']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#a78bfa', '#34d399', '#fbbf24']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }
    
    const timer = setTimeout(() => setProgress(percentage), 300) // slight delay for visual effect
    return () => clearTimeout(timer)
  }, [percentage, total, progress])

  // SVG Params
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  if (total === 0) return null

  return (
    <>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-card relative overflow-hidden">
            <div className="flex flex-col z-10">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Daily Goal</span>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-heading font-bold text-brand">{completed}</span>
                    <span className="text-lg text-text-secondary font-medium">/ {total}</span>
                </div>
                <p className="text-xs text-text-secondary mt-1">
                    {percentage === 100 ? "All done! Relax." : `${total - completed} to go`}
                </p>
            </div>

            <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                <svg className="transform -rotate-90 w-full h-full">
                    <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-100"
                    />
                    <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className={`transition-all duration-1000 ease-out ${percentage === 100 ? 'text-green-500' : 'text-brand'}`}
                    />
                </svg>
                
                <div className="absolute inset-0 flex items-center justify-center">
                    {percentage === 100 ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500 animate-in zoom-in" />
                    ) : (
                        <span className="text-xs font-bold text-brand">{Math.round(progress)}%</span>
                    )}
                </div>
            </div>
            
            <div 
                className={`absolute inset-0 bg-green-50 transition-opacity duration-500 pointer-events-none ${percentage === 100 ? 'opacity-100' : 'opacity-0'}`} 
            />
        </div>

        {/* CELEBRATION MODAL */}
        <Transition appear show={showCelebration} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={() => setShowCelebration(false)}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-500"
                            enterFrom="opacity-0 scale-50 translate-y-20"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-8 text-center shadow-2xl transition-all relative">
                                
                                <button 
                                    onClick={() => setShowCelebration(false)}
                                    className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>

                                <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                                    <Trophy className="h-12 w-12 text-yellow-500" />
                                </div>

                                <Dialog.Title as="h3" className="text-3xl font-heading font-bold text-gray-900 mb-2">
                                    Goal Complete!
                                </Dialog.Title>
                                
                                <p className="text-lg text-gray-600 mb-8 font-medium">
                                    {motivation}
                                </p>

                                {/* Streak Showcase */}
                                <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-2xl p-6 border border-violet-100 mb-8">
                                    <p className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-4">Current Streak</p>
                                    
                                    <div className="flex justify-center transform scale-125">
                                        <StreakCampfire streak={streak} lastChoreDate={lastChoreDate} />
                                    </div>
                                    
                                    {streak > 3 ? (
                                        <div className="mt-4 flex items-center justify-center gap-2 text-violet-700 font-bold text-sm">
                                            <Sparkles className="h-4 w-4" />
                                            <span>Keep the fire burning!</span>
                                        </div>
                                    ) : (
                                        <div className="mt-4 flex items-center justify-center gap-2 text-violet-600 font-medium text-sm">
                                            <span>Great start! Come back tomorrow.</span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setShowCelebration(false)}
                                    className="w-full rounded-xl bg-gray-900 px-4 py-3.5 text-base font-bold text-white shadow-lg hover:bg-gray-800 hover:scale-[1.02] transition-all active:scale-95"
                                >
                                    Awesome, close this
                                </button>

                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    </>
  )
}