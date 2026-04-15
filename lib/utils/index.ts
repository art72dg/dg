// lib/utils/index.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  value: number,
  currency = 'EUR',
  unit: 'units' | 'thousands' | 'millions' = 'units'
): string {
  const multiplier = unit === 'millions' ? 1_000_000 : unit === 'thousands' ? 1_000 : 1
  const absolute = value * multiplier

  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(absolute)
}

export function formatPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatScore(score: number): string {
  return score.toFixed(1)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function safeDiv(numerator: number, denominator: number): number | null {
  if (denominator === 0 || !isFinite(denominator)) return null
  return numerator / denominator
}

export function getRiskColor(riskLevel: 'green' | 'yellow' | 'orange' | 'red'): string {
  const colors = {
    green:  'text-emerald-600',
    yellow: 'text-yellow-600',
    orange: 'text-orange-600',
    red:    'text-red-600',
  }
  return colors[riskLevel]
}

export function getRiskBg(riskLevel: 'green' | 'yellow' | 'orange' | 'red'): string {
  const colors = {
    green:  'bg-emerald-50 border-emerald-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    orange: 'bg-orange-50 border-orange-200',
    red:    'bg-red-50 border-red-200',
  }
  return colors[riskLevel]
}
