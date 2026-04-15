// lib/scoring/blocks/profitability.ts
import { FinancialData } from '@/types/financial'
import { ScoringBlock, ScoringMetric } from '@/types/scoring'
import { safeDiv, clamp } from '@/lib/utils'

/**
 * Bloco 2: Rentabilidade e Margens (peso 20%)
 *
 * Métricas:
 * - Margem EBITDA (35%)
 * - Margem Líquida (25%)
 * - ROA (20%)
 * - ROE (20%)
 */
export function calculateProfitability(data: FinancialData): ScoringBlock {
  const { balanceSheet, incomeStatement } = data
  const { revenue, ebitda, netIncome } = incomeStatement
  const { totalAssets, equity } = balanceSheet

  const metrics: ScoringMetric[] = []

  // 1. Margem EBITDA = EBITDA / Revenue
  const ebitdaMargin = safeDiv(ebitda, revenue)
  const ebitdaMarginPct = ebitdaMargin !== null ? ebitdaMargin * 100 : null
  const ebitdaScore = ebitdaMarginPct !== null
    ? clamp(
        ebitdaMarginPct >= 20 ? 100 :
        ebitdaMarginPct >= 15 ? 85 :
        ebitdaMarginPct >= 10 ? 70 :
        ebitdaMarginPct >= 5  ? 55 :
        ebitdaMarginPct >= 0  ? 35 :
        ebitdaMarginPct >= -5 ? 15 : 0,
        0, 100
      )
    : 0

  metrics.push({
    name: 'Margem EBITDA',
    value: ebitdaMarginPct,
    benchmark: 10,
    score: ebitdaScore,
    weight: 0.35,
    flag: ebitdaMarginPct !== null && ebitdaMarginPct < 0 ? 'critical' : undefined,
  })

  // 2. Margem Líquida = Resultado Líquido / Revenue
  const netMargin = safeDiv(netIncome, revenue)
  const netMarginPct = netMargin !== null ? netMargin * 100 : null
  const netMarginScore = netMarginPct !== null
    ? clamp(
        netMarginPct >= 10 ? 100 :
        netMarginPct >= 5  ? 80 :
        netMarginPct >= 2  ? 65 :
        netMarginPct >= 0  ? 45 :
        netMarginPct >= -5 ? 20 : 0,
        0, 100
      )
    : 0

  metrics.push({
    name: 'Margem Líquida',
    value: netMarginPct,
    benchmark: 5,
    score: netMarginScore,
    weight: 0.25,
    flag: netMarginPct !== null && netMarginPct < 0 ? 'warning' : undefined,
  })

  // 3. ROA = Resultado Líquido / Total Activo
  const roa = safeDiv(netIncome, totalAssets)
  const roaPct = roa !== null ? roa * 100 : null
  const roaScore = roaPct !== null
    ? clamp(
        roaPct >= 8  ? 100 :
        roaPct >= 5  ? 80 :
        roaPct >= 3  ? 65 :
        roaPct >= 0  ? 45 :
        roaPct >= -3 ? 20 : 0,
        0, 100
      )
    : 0

  metrics.push({
    name: 'ROA',
    value: roaPct,
    benchmark: 5,
    score: roaScore,
    weight: 0.20,
  })

  // 4. ROE = Resultado Líquido / Capital Próprio
  const roe = equity > 0 ? safeDiv(netIncome, equity) : null
  const roePct = roe !== null ? roe * 100 : null
  const roeScore = roePct !== null
    ? clamp(
        roePct >= 15 ? 100 :
        roePct >= 10 ? 80 :
        roePct >= 5  ? 65 :
        roePct >= 0  ? 45 :
        roePct >= -10 ? 15 : 0,
        0, 100
      )
    : equity <= 0 ? 0 : 50

  metrics.push({
    name: 'ROE',
    value: roePct,
    benchmark: 10,
    score: roeScore,
    weight: 0.20,
    flag: equity <= 0 ? 'critical' : undefined,
  })

  const rawScore = metrics.reduce((sum, m) => sum + m.score * m.weight, 0)

  const interpretation = rawScore >= 75
    ? 'Rentabilidade robusta — empresa gera retornos saudáveis sobre activos e capital.'
    : rawScore >= 50
    ? 'Rentabilidade moderada — margens sob pressão mas operacionalmente viável.'
    : rawScore >= 25
    ? 'Rentabilidade fraca — empresa não consegue gerar retornos adequados.'
    : 'Empresa em situação de perda operacional ou estrutural — intervenção urgente necessária.'

  return {
    name: 'profitability',
    label: 'Rentabilidade e Margens',
    weight: 0.20,
    rawScore,
    weightedScore: rawScore * 0.20,
    metrics,
    interpretation,
  }
}
