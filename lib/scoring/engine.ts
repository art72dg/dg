// lib/scoring/engine.ts
// Motor de scoring principal — orquestra os 5 blocos

import { FinancialData, QualitativeData } from '@/types/financial'
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
  const { analysisId, financialData, qualitativeData } = input

  // Calcular cada bloco
  const liquidityBlock   = calculateLiquidity(financialData)
  const profitBlock      = calculateProfitability(financialData)
  const structureBlock   = calculateFinancialStructure(financialData)
  const operationalBlock = calculateOperationalQuality(financialData)
  const signalsResult    = calculateCriticalSignals({ qualitative: qualitativeData })

  const blocks = [liquidityBlock, profitBlock, structureBlock, operationalBlock, signalsResult]

  // Score final = soma dos scores ponderados
  const rawScore = blocks.reduce((sum, b) => sum + b.weightedScore, 0)
  const score = clamp(Math.round(rawScore * 10) / 10, 0, 100)

  const riskLevel = getRiskLevel(score)
  const dataCompleteness = calcDataCompleteness(financialData)

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
  }
}
