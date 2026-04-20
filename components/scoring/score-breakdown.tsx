// components/scoring/score-breakdown.tsx
import { cn } from '@/lib/utils'
import type { ScoringBlock, ScoringMetric } from '@/types/scoring'

interface ScoreBreakdownProps {
  blocks: ScoringBlock[]
  className?: string
  /** Mostra a lista de métricas por baixo de cada bloco. Default: true. */
  showMetrics?: boolean
}

function formatMetricValue(metric: ScoringMetric): string {
  if (metric.value === null || metric.value === undefined) return 'n/d'
  const abs = Math.abs(metric.value)
  const decimals = abs >= 100 ? 0 : abs >= 10 ? 1 : 2
  return metric.value.toLocaleString('pt-PT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function metricFlagClasses(flag: ScoringMetric['flag']): string {
  switch (flag) {
    case 'critical': return 'text-red-400'
    case 'warning':  return 'text-orange-400'
    case 'positive': return 'text-emerald-400'
    default:         return 'text-slate-400'
  }
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

export function ScoreBreakdown({ blocks, className, showMetrics = true }: ScoreBreakdownProps) {
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
          {showMetrics && block.metrics.length > 0 && (
            <details className="mt-1.5 group">
              <summary className="cursor-pointer select-none text-xs text-slate-500 hover:text-slate-300 transition-colors list-none flex items-center gap-1">
                <span className="inline-block transition-transform group-open:rotate-90">›</span>
                Ver métricas ({block.metrics.length})
              </summary>
              <ul className="mt-2 space-y-1 pl-4 border-l border-slate-800">
                {block.metrics.map((metric, idx) => (
                  <li
                    key={`${block.name}-${metric.name}-${idx}`}
                    className="flex items-center justify-between gap-3 text-xs py-0.5"
                  >
                    <span className="text-slate-400 truncate">
                      {metric.name}
                      {metric.benchmark !== undefined && (
                        <span className="text-slate-600 ml-1.5">
                          (ref: {metric.benchmark})
                        </span>
                      )}
                    </span>
                    <span className={cn('font-mono tabular-nums', metricFlagClasses(metric.flag))}>
                      {formatMetricValue(metric)}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      ))}
    </div>
  )
}
