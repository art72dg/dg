// lib/scoring/blocks/financial-structure.ts
import { FinancialData } from '@/types/financial'
import { ScoringBlock, ScoringMetric } from '@/types/scoring'
import { safeDiv, clamp } from '@/lib/utils'

/**
 * Bloco 3: Estrutura Financeira (peso 20%)
 *
 * Métricas:
 * - Debt-to-Equity Ratio (30%)
 * - Interest Coverage Ratio (30%)
 * - Debt-to-EBITDA (25%)
 * - Solvabilidade (15%)
 */
export function calculateFinancialStructure(data: FinancialData): ScoringBlock {
  const { balanceSheet, incomeStatement } = data
  const { totalLiabilities, equity, longTermDebt = 0, shortTermDebt = 0 } = balanceSheet
  const { ebitda, ebit, interestExpense } = incomeStatement

  const totalDebt = longTermDebt + shortTermDebt
  const metrics: ScoringMetric[] = []

  // 1. D/E Ratio = Total Passivo / Capital Próprio
  const deRatio = equity > 0 ? safeDiv(totalLiabilities, equity) : null
  const deScore = deRatio !== null
    ? clamp(
        deRatio <= 0.5 ? 100 :
        deRatio <= 1.0 ? 85 :
        deRatio <= 2.0 ? 70 :
        deRatio <= 3.0 ? 50 :
        deRatio <= 5.0 ? 25 : 0,
        0, 100
      )
    : equity <= 0 ? 0 : 50

  metrics.push({
    name: 'Debt-to-Equity',
    value: deRatio,
    benchmark: 1.0,
    score: deScore,
    weight: 0.30,
    flag: equity <= 0 ? 'critical' : deRatio !== null && deRatio > 3 ? 'warning' : undefined,
  })

  // 2. Interest Coverage = EBIT / Juros
  const ebitValue = ebit ?? (ebitda * 0.85) // estimativa se EBIT não disponível
  const icr = safeDiv(ebitValue, interestExpense)
  const icrScore = icr !== null
    ? clamp(
        icr >= 5.0 ? 100 :
        icr >= 3.0 ? 85 :
        icr >= 2.0 ? 70 :
        icr >= 1.5 ? 55 :
        icr >= 1.0 ? 35 :
        icr >= 0.5 ? 15 : 0,
        0, 100
      )
    : 50

  metrics.push({
    name: 'Interest Coverage',
    value: icr,
    benchmark: 2.5,
    score: icrScore,
    weight: 0.30,
    flag: icr !== null && icr < 1.0 ? 'critical' : icr !== null && icr < 2.0 ? 'warning' : undefined,
  })

  // 3. Debt/EBITDA
  const debtEbitda = ebitda > 0 ? safeDiv(totalDebt, ebitda) : null
  const debtEbitdaScore = debtEbitda !== null
    ? clamp(
        debtEbitda <= 1.0 ? 100 :
        debtEbitda <= 2.0 ? 85 :
        debtEbitda <= 3.0 ? 70 :
        debtEbitda <= 4.0 ? 50 :
        debtEbitda <= 6.0 ? 25 : 0,
        0, 100
      )
    : ebitda <= 0 ? 10 : 50

  metrics.push({
    name: 'Debt / EBITDA',
    value: debtEbitda,
    benchmark: 3.0,
    score: debtEbitdaScore,
    weight: 0.25,
    flag: debtEbitda !== null && debtEbitda > 5 ? 'critical' : undefined,
  })

  // 4. Solvabilidade = Capital Próprio / Total Activo
  const totalAssets = totalLiabilities + equity
  const solvency = safeDiv(equity, totalAssets)
  const solvencyPct = solvency !== null ? solvency * 100 : null
  const solvencyScore = solvencyPct !== null
    ? clamp(
        solvencyPct >= 40 ? 100 :
        solvencyPct >= 25 ? 80 :
        solvencyPct >= 15 ? 60 :
        solvencyPct >= 5  ? 35 :
        solvencyPct >= 0  ? 15 : 0,
        0, 100
      )
    : 0

  metrics.push({
    name: 'Solvabilidade',
    value: solvencyPct,
    benchmark: 25,
    score: solvencyScore,
    weight: 0.15,
    flag: solvencyPct !== null && solvencyPct < 0 ? 'critical' : undefined,
  })

  const rawScore = metrics.reduce((sum, m) => sum + m.score * m.weight, 0)

  const interpretation = rawScore >= 75
    ? 'Estrutura financeira sólida — endividamento controlado e cobertura de juros confortável.'
    : rawScore >= 50
    ? 'Estrutura financeira aceitável — alavancagem moderada, cobertura de juros a monitorizar.'
    : rawScore >= 25
    ? 'Estrutura financeira frágil — endividamento elevado com capacidade de serviço de dívida limitada.'
    : 'Estrutura financeira insustentável — risco de incumprimento elevado, necessidade de reestruturação.'

  return {
    name: 'financial_structure',
    label: 'Estrutura Financeira',
    weight: 0.20,
    rawScore,
    weightedScore: rawScore * 0.20,
    metrics,
    interpretation,
  }
}
