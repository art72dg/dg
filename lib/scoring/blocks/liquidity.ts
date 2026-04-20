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
  const { balanceSheet, cashFlow, agingData, treasuryData } = data
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
  const baseScore = metrics.reduce((sum, m) => sum + m.score * m.weight, 0)

  // ── Ajustes com dados estendidos (aging & treasury) ──────────
  // Só se aplicam quando há dados disponíveis; caso contrário, neutros.
  let adjustment = 0

  // 5. Runway (dias até cash-out) — treasury
  if (treasuryData?.daysUntilCashOut !== undefined) {
    const runway = treasuryData.daysUntilCashOut
    const runwayAdj =
      runway < 30  ? -15 :
      runway < 60  ? -8  :
      runway < 90  ? -4  :
      runway >= 180 ? 4  : 0
    adjustment += runwayAdj

    metrics.push({
      name: 'Runway (dias)',
      value: runway,
      benchmark: 90,
      score: clamp(100 + runwayAdj * 5, 0, 100),
      weight: 0, // metric informativa — score já reflectido via adjustment
      flag: runway < 30 ? 'critical' : runway < 90 ? 'warning' : undefined,
    })
  }

  // 6. Buffer de linhas de crédito disponíveis — treasury
  if (treasuryData?.availableCreditLines && currentLiabilities > 0) {
    const bufferRatio = treasuryData.availableCreditLines / currentLiabilities
    if (bufferRatio >= 0.2) adjustment += 5
    else if (bufferRatio >= 0.1) adjustment += 2

    metrics.push({
      name: 'Crédito disponível / Passivo corrente',
      value: bufferRatio,
      benchmark: 0.2,
      score: clamp(bufferRatio * 500, 0, 100),
      weight: 0,
    })
  }

  // 7. Incobrabilidade — aging (receivablesOver90 / total AR)
  if (agingData && accountsReceivable > 0) {
    const arTotal =
      (agingData.receivablesUnder30 ?? 0) +
      (agingData.receivables30to60 ?? 0) +
      (agingData.receivables60to90 ?? 0) +
      (agingData.receivablesOver90 ?? 0)
    const baseAR = arTotal > 0 ? arTotal : accountsReceivable
    const over90Ratio = agingData.receivablesOver90 / baseAR

    const agingAdj =
      over90Ratio > 0.50 ? -12 :
      over90Ratio > 0.30 ? -6  :
      over90Ratio > 0.15 ? -3  : 0
    adjustment += agingAdj

    metrics.push({
      name: 'Recebimentos > 90 dias (% AR)',
      value: over90Ratio * 100,
      benchmark: 15,
      score: clamp(100 - over90Ratio * 200, 0, 100),
      weight: 0,
      flag: over90Ratio > 0.30 ? 'warning' : undefined,
    })
  }

  const rawScore = clamp(baseScore + adjustment, 0, 100)

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
