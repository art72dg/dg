// lib/scoring/engine.ts
// Motor de scoring principal — orquestra os 5 blocos

import { FinancialData, QualitativeData, YoYTrend } from '@/types/financial'
import { ScoringResult, RiskLevel, RISK_LEVEL_THRESHOLDS } from '@/types/scoring'
import { calculateLiquidity } from './blocks/liquidity'
import { calculateProfitability } from './blocks/profitability'
import { calculateFinancialStructure } from './blocks/financial-structure'
import { calculateOperationalQuality } from './blocks/operational-quality'
import { calculateCriticalSignals } from './blocks/critical-signals'
import { clamp } from '@/lib/utils'

interface ScoringInput {
  analysisId: string
  financialData: FinancialData
  qualitativeData: QualitativeData
  previousYearData?: FinancialData   // opcional — activa análise YoY
}

function calculateYoYTrend(current: FinancialData, previous: FinancialData): YoYTrend {
  const { incomeStatement: ci, balanceSheet: cb } = current
  const { incomeStatement: pi, balanceSheet: pb } = previous

  const pctChange = (curr: number, prev: number): number | null =>
    prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : null

  const currentEbitdaMargin = ci.revenue !== 0 ? (ci.ebitda / ci.revenue) * 100 : null
  const prevEbitdaMargin    = pi.revenue !== 0 ? (pi.ebitda / pi.revenue) * 100 : null
  const currentNetMargin    = ci.revenue !== 0 ? (ci.netIncome / ci.revenue) * 100 : null
  const prevNetMargin       = pi.revenue !== 0 ? (pi.netIncome / pi.revenue) * 100 : null
  const currentRatio = cb.currentLiabilities !== 0 ? cb.currentAssets / cb.currentLiabilities : null
  const prevRatio    = pb.currentLiabilities !== 0 ? pb.currentAssets / pb.currentLiabilities : null

  return {
    previousPeriod: previous.period,
    revenueGrowthPct: pctChange(ci.revenue, pi.revenue),
    ebitdaMarginChangePp:
      currentEbitdaMargin !== null && prevEbitdaMargin !== null
        ? currentEbitdaMargin - prevEbitdaMargin : null,
    netMarginChangePp:
      currentNetMargin !== null && prevNetMargin !== null
        ? currentNetMargin - prevNetMargin : null,
    equityChangePct: pctChange(cb.equity, pb.equity),
    debtChangePct:   pctChange(cb.totalLiabilities, pb.totalLiabilities),
    cashChangePct:   pctChange(cb.cash, pb.cash),
    currentRatioChange:
      currentRatio !== null && prevRatio !== null
        ? currentRatio - prevRatio : null,
  }
}

export function getRiskLevel(score: number): RiskLevel {
  for (const [level, [min, max]] of Object.entries(RISK_LEVEL_THRESHOLDS)) {
    if (score >= min && score <= max) return level as RiskLevel
  }
  return 'red'
}

function calcDataCompleteness(data: FinancialData): number {
  const fields = [
    data.balanceSheet.totalAssets,
    data.balanceSheet.totalLiabilities,
    data.balanceSheet.equity,
    data.balanceSheet.currentAssets,
    data.balanceSheet.currentLiabilities,
    data.balanceSheet.cash,
    data.incomeStatement.revenue,
    data.incomeStatement.ebitda,
    data.incomeStatement.netIncome,
    data.incomeStatement.interestExpense,
  ]

  const optional = [
    data.balanceSheet.accountsReceivable,
    data.balanceSheet.accountsPayable,
    data.balanceSheet.inventory,
    data.balanceSheet.longTermDebt,
    data.cashFlow?.operatingCashFlow,
    data.cashFlow?.freeCashFlow,
    data.incomeStatement.ebit,
  ]

  const requiredScore = fields.filter(f => f !== undefined && f !== null).length / fields.length
  const optionalScore = optional.filter(f => f !== undefined && f !== null).length / optional.length

  return clamp((requiredScore * 0.7 + optionalScore * 0.3) * 100, 0, 100)
}

export function calculateScore(input: ScoringInput): ScoringResult {
  const { analysisId, financialData, qualitativeData, previousYearData } = input

  // Calcular cada bloco
  const liquidityBlock   = calculateLiquidity(financialData)
  const profitBlock      = calculateProfitability(financialData)
  const structureBlock   = calculateFinancialStructure(financialData)
  const operationalBlock = calculateOperationalQuality(financialData)
  const signalsResult    = calculateCriticalSignals({
    qualitative: qualitativeData,
    aging: financialData.agingData,
    assetSale: financialData.assetSaleData,
  })

  const blocks = [liquidityBlock, profitBlock, structureBlock, operationalBlock, signalsResult]

  // Score final = soma dos scores ponderados
  const rawScore = blocks.reduce((sum, b) => sum + b.weightedScore, 0)
  const score = clamp(Math.round(rawScore * 10) / 10, 0, 100)

  const riskLevel = getRiskLevel(score)
  const dataCompleteness = calcDataCompleteness(financialData)
  const trend = previousYearData ? calculateYoYTrend(financialData, previousYearData) : undefined

  return {
    id: crypto.randomUUID(),
    analysisId,
    score,
    riskLevel,
    blocks,
    flags: signalsResult.flags,
    dataCompleteness,
    calculatedAt: new Date().toISOString(),
    version: '1.0.0',
    trend,
  }
}
