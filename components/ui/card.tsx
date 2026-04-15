// components/ui/card.tsx
import { cn } from '@/lib/utils'

interface CardProps {
  className?: string
  children: React.ReactNode
}

export function Card({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-700 bg-slate-900',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        'flex flex-col space-y-1.5 px-6 py-5 border-b border-slate-800',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardContent({ className, children }: CardProps) {
  return (
    <div className={cn('px-6 py-5', className)}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        'flex items-center px-6 py-4 border-t border-slate-800',
        className
      )}
    >
      {children}
    </div>
  )
}
