// components/scoring/score-breakdown.tsx
import { cn } from '@/lib/utils'
import type { ScoringBlock } from '@/types/scoring'

interface ScoreBreakdownProps {
  blocks: ScoringBlock[]
  className?: string
}

function blockBarColor(score: number): string {
  if (score >= 75) return 'bg-emerald-500'
  if (score >= 50) return 'bg-yellow-500'
  if (score >= 25) return 'bg-orange-500'
  return 'bg-red-500'
}

function blockTextColor(score: number): string {
  if (score >= 75) return 'text-emerald-400'
  if (score >= 50) return 'text-yellow-400'
  if (score >= 25) return 'text-orange-400'
  return 'text-red-400'
}

export function ScoreBreakdown({ blocks, className }: ScoreBreakdownProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {blocks.map((block) => (
        <div key={block.name} className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-medium">{block.label}</span>
              <span className="text-slate-600 text-xs">
                {Math.round(block.weight * 100)}% peso
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('font-bold tabular-nums', blockTextColor(block.rawScore))}>
                {Math.round(block.rawScore)}
              </span>
              <span className="text-slate-600 text-xs">/100</span>
            </div>
          </div>
          {/* Bar */}
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700 ease-out',
                blockBarColor(block.rawScore)
              )}
              style={{ width: `${Math.min(100, Math.max(0, block.rawScore))}%` }}
              role="progressbar"
              aria-valuenow={Math.round(block.rawScore)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          {block.interpretation && (
            <p className="text-xs text-slate-500 leading-relaxed">{block.interpretation}</p>
          )}
        </div>
      ))}
    </div>
  )
}
