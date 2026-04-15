// components/scoring/score-ring.tsx
import { cn } from '@/lib/utils'
import type { RiskLevel } from '@/types/scoring'

interface ScoreRingProps {
  score: number
  riskLevel: RiskLevel
  size?: number
}

const ringColors: Record<RiskLevel, { stroke: string; text: string }> = {
  green:  { stroke: '#10b981', text: 'text-emerald-400' },
  yellow: { stroke: '#eab308', text: 'text-yellow-400' },
  orange: { stroke: '#f97316', text: 'text-orange-400' },
  red:    { stroke: '#ef4444', text: 'text-red-400' },
}

export function ScoreRing({ score, riskLevel, size = 120 }: ScoreRingProps) {
  const clampedScore = Math.min(100, Math.max(0, score))
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference
  const { stroke, text } = ringColors[riskLevel]
  const center = size / 2

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-label={`Score: ${clampedScore}`}
      >
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={8}
        />
        {/* Progress */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Score label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-bold leading-none', text, size >= 100 ? 'text-3xl' : 'text-xl')}>
          {Math.round(clampedScore)}
        </span>
        <span className="text-xs text-slate-500 mt-0.5">/ 100</span>
      </div>
    </div>
  )
}
