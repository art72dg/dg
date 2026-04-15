// components/ui/badge.tsx
import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'default'
  | 'emerald'
  | 'yellow'
  | 'orange'
  | 'red'
  | 'slate'

interface BadgeProps {
  variant?: BadgeVariant
  className?: string
  children: React.ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  default:  'bg-slate-700 text-slate-200 border-slate-600',
  emerald:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  yellow:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  orange:   'bg-orange-500/10 text-orange-400 border-orange-500/30',
  red:      'bg-red-500/10 text-red-400 border-red-500/30',
  slate:    'bg-slate-800 text-slate-400 border-slate-700',
}

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
