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
        {/* Progress Card */}
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-card relative overflow-hidden group">
            <div className="flex flex-col z-10">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                    Daily Goal {percentage === 100 && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 animate-spin-slow" />}
                </span>
                <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-heading font-bold ${percentage === 100 ? 'text-green-600' : 'text-brand'}`}>
                        {completed}
                    </span>
                    <span className="text-lg text-text-secondary font-medium">/ {total}</span>
                </div>
                <p className="text-xs text-text-secondary mt-1 font-medium">
                    {percentage === 100 ? "All done! Relax." : `${total - completed} to go`}
                </p>
            </div>

            {/* Circular Progress */}
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
                        <CheckCircle2 className="w-8 h-8 text-green-500 animate-in zoom-in duration-300" />
                    ) : (
                        <span className="text-sm font-bold text-brand">{Math.round(progress)}%</span>
                    )}
                </div>
            </div>
            
            {/* Background Fill Effect on Completion */}
            <div 
                className={`absolute inset-0 bg-gradient-to-r from-green-50/80 to-emerald-50/80 transition-opacity duration-700 pointer-events-none ${percentage === 100 ? 'opacity-100' : 'opacity-0'}`} 
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
                            enterFrom="opacity-0 scale-90 translate-y-10"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-3xl bg-white p-0 text-center shadow-2xl transition-all relative border-4 border-brand/10">
                                
                                {/* Header Graphic */}
                                <div className="bg-gradient-to-br from-brand-light to-indigo-50 p-8 pb-12 relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-20 bg-[url('/noise.png')]" />
                                    <div className="relative z-10 mx-auto w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg animate-bounce-slow">
                                        <Trophy className="h-12 w-12 text-yellow-500 fill-yellow-500" />
                                    </div>
                                    <div className="absolute -bottom-6 left-0 right-0 h-12 bg-white rounded-t-[2rem]" />
                                </div>

                                <div className="px-8 pb-8 relative z-10 -mt-4">
                                    <Dialog.Title as="h3" className="text-2xl font-heading font-black text-gray-900 mb-2 tracking-tight">
                                        Goal Crushed!
                                    </Dialog.Title>
                                    
                                    <p className="text-text-secondary mb-8 font-medium leading-relaxed">
                                        {motivation}
                                    </p>

                                    {/* Streak Showcase */}
                                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-6 flex items-center justify-between">
                                        <div className="text-left">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Streak</p>
                                            <p className="font-bold text-gray-700">Keep it up!</p>
                                        </div>
                                        <div className="transform scale-110 origin-right">
                                            <StreakCampfire streak={streak} lastChoreDate={lastChoreDate} />
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setShowCelebration(false)}
                                        className="w-full rounded-xl bg-brand hover:bg-brand-dark text-white px-4 py-3.5 text-base font-bold shadow-lg shadow-brand/20 hover:scale-[1.02] transition-all active:scale-95"
                                    >
                                        Awesome
                                    </button>
                                </div>

                                <button 
                                    onClick={() => setShowCelebration(false)}
                                    className="absolute top-4 right-4 p-2 rounded-full bg-white/50 hover:bg-white text-gray-500 transition-colors"
                                >
                                    <X className="h-5 w-5" />
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