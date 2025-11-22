// src/app/loading.tsx
import AppIcon from '@/components/AppIcon'

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="relative">
        {/* Pulse Effect */}
        <div className="absolute inset-0 animate-ping rounded-full bg-brand/20 opacity-75 duration-1000" />
        
        {/* Icon */}
        <div className="relative z-10 animate-bounce-slow">
            <AppIcon className="h-16 w-16 text-brand" withContainer={false} />
        </div>
      </div>
      
      <p className="mt-4 font-heading text-lg font-medium text-brand animate-pulse">
        Tidying up...
      </p>
    </div>
  )
}