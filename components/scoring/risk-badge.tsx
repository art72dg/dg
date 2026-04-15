// components/scoring/risk-badge.tsx
import { cn } from '@/lib/utils'
import { RISK_LEVEL_LABELS } from '@/types/scoring'
import type { RiskLevel } from '@/types/scoring'

interface RiskBadgeProps {
  riskLevel: RiskLevel
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const riskStyles: Record<RiskLevel, string> = {
  green:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  orange: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  red:    'bg-red-500/10 text-red-400 border-red-500/30',
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
}

export function RiskBadge({ riskLevel, className, size = 'md' }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        riskStyles[riskLevel],
        sizeClasses[size],
        className
      )}
    >
      {RISK_LEVEL_LABELS[riskLevel]}
    </span>
  )
}
