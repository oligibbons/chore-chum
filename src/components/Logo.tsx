// src/components/Logo.tsx
import AppIcon from './AppIcon'

export default function Logo({ 
  className = "", 
  showText = true, 
  iconClassName = "h-10 w-10" 
}: { 
  className?: string
  showText?: boolean
  iconClassName?: string
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${iconClassName} flex-shrink-0`}>
        <AppIcon className="w-full h-full" />
      </div>

      {showText && (
        <span className="font-heading font-bold text-xl tracking-tight text-foreground">
          Chore<span className="text-brand">Chum</span>
        </span>
      )}
    </div>
  )
}