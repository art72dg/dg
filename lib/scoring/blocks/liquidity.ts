// lib/scoring/blocks/liquidity.ts
import { FinancialData } from '@/types/financial'
import { ScoringBlock, ScoringMetric } from '@/types/scoring'
import { safeDiv, clamp } from '@/lib/utils'

/**
 * Bloco 1: Liquidez e Tesouraria (peso 25%)
 *
 * Métricas:
 * - Current Ratio (40%)
 * - Quick Ratio (30%)
 * - Cash Ratio (20%)
 * - Free Cash Flow positivo (10%)
 */
export function calculateLiquidity(data: FinancialData): ScoringBlock {
  const { balanceSheet, cashFlow } = data
  const {
    currentAssets, currentLiabilities, cash,
    inventory = 0, accountsReceivable = 0,
  } = balanceSheet

  const metrics: ScoringMetric[] = []

  // 1. Current Ratio = Activo Corrente / Passivo Corrente
  const currentRatio = safeDiv(currentAssets, currentLiabilities)
  const currentRatioScore = currentRatio !== null
    ? clamp(
        currentRatio >= 2.0 ? 100 :
        currentRatio >= 1.5 ? 80 :
        currentRatio >= 1.0 ? 60 :
        currentRatio >= 0.8 ? 40 :
        currentRatio >= 0.5 ? 20 : 0,
        0, 100
      )
    : 0

  metrics.push({
    name: 'Current Ratio',
    value: currentRatio,
    benchmark: 1.5,
    score: currentRatioScore,
    weight: 0.40,
    flag: currentRatio !== null && currentRatio < 1.0 ? 'warning' : undefined,
  })

  // 2. Quick Ratio = (Activo Corrente - Stocks) / Passivo Corrente
  const quickAssets = currentAssets - inventory
  const quickRatio = safeDiv(quickAssets, currentLiabilities)
  const quickRatioScore = quickRatio !== null
    ? clamp(
        quickRatio >= 1.5 ? 100 :
        quickRatio >= 1.0 ? 80 :
        quickRatio >= 0.8 ? 60 :
        quickRatio >= 0.5 ? 40 :
        quickRatio >= 0.3 ? 20 : 0,
        0, 100
      )
    : 0

  metrics.push({
    name: 'Quick Ratio',
    value: quickRatio,
    benchmark: 1.0,
    score: quickRatioScore,
    weight: 0.30,
    flag: quickRatio !== null && quickRatio < 0.5 ? 'critical' : undefined,
  })

  // 3. Cash Ratio = Caixa / Passivo Corrente
  const cashRatio = safeDiv(cash, currentLiabilities)
  const cashRatioScore = cashRatio !== null
    ? clamp(
        cashRatio >= 0.5 ? 100 :
        cashRatio >= 0.3 ? 80 :
        cashRatio >= 0.2 ? 60 :
        cashRatio >= 0.1 ? 40 :
        cashRatio >= 0.05 ? 20 : 0,
        0, 100
      )
    : 0

  metrics.push({
    name: 'Cash Ratio',
    value: cashRatio,
    benchmark: 0.2,
    score: cashRatioScore,
    weight: 0.20,
  })

  // 4. FCF positivo
  const fcf = cashFlow?.freeCashFlow ?? cashFlow?.operatingCashFlow ?? null
  const fcfScore = fcf !== null
    ? fcf > 0 ? 100 : fcf > -currentLiabilities * 0.1 ? 50 : 0
    : 50 // sem dados → neutro

  metrics.push({
    name: 'Free Cash Flow',
    value: fcf,
    score: fcfScore,
    weight: 0.10,
    flag: fcf !== null && fcf < 0 ? 'warning' : undefined,
  })

  // Score do bloco (média ponderada das métricas)
  const rawScore = metrics.reduce((sum, m) => sum + m.score * m.weight, 0)

  const interpretation = rawScore >= 75
    ? 'Posição de liquidez sólida — empresa consegue cumprir obrigações de curto prazo com folga.'
    : rawScore >= 50
    ? 'Liquidez adequada mas com margem limitada — monitorização recomendada.'
    : rawScore >= 25
    ? 'Pressão de liquidez significativa — risco de dificuldades de pagamento a curto prazo.'
    : 'Liquidez crítica — incapacidade provável de cumprir obrigações imediatas sem intervenção.'

  return {
    name: 'liquidity',
    label: 'Liquidez e Tesouraria',
    weight: 0.25,
    rawScore,
    weightedScore: rawScore * 0.25,
    metrics,
    interpretation,
  }
}
