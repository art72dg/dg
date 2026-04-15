// lib/scoring/blocks/operational-quality.ts
import { FinancialData } from '@/types/financial'
import { ScoringBlock, ScoringMetric } from '@/types/scoring'
import { safeDiv, clamp } from '@/lib/utils'

/**
 * Bloco 4: Qualidade Operacional (peso 20%)
 *
 * Métricas:
 * - Prazo Médio de Recebimento — PMR (30%)
 * - Prazo Médio de Pagamento — PMP (25%)
 * - Rotação de Stocks (25%)
 * - Asset Turnover (20%)
 */
export function calculateOperationalQuality(data: FinancialData): ScoringBlock {
  const { balanceSheet, incomeStatement } = data
  const {
    accountsReceivable = 0, accountsPayable = 0,
    inventory = 0, totalAssets,
  } = balanceSheet
  const { revenue } = incomeStatement

  // Custo de Mercadorias Vendidas estimado (sem dados diretos, usar proxy)
  const cogs = revenue * 0.65 // proxy típico

  const metrics: ScoringMetric[] = []

  // 1. PMR = (Contas a Receber / Revenue) * 365
  const pmr = accountsReceivable > 0 && revenue > 0
    ? safeDiv(accountsReceivable * 365, revenue)
    : null

  const pmrScore = pmr !== null
    ? clamp(
        pmr <= 30  ? 100 :
        pmr <= 45  ? 85 :
        pmr <= 60  ? 70 :
        pmr <= 90  ? 50 :
        pmr <= 120 ? 25 : 0,
        0, 100
      )
    : 60 // sem dados → neutro-positivo

  metrics.push({
    name: 'Prazo Médio Recebimento (dias)',
    value: pmr,
    benchmark: 45,
    score: pmrScore,
    weight: 0.30,
    flag: pmr !== null && pmr > 120 ? 'warning' : undefined,
  })

  // 2. PMP = (Contas a Pagar / COGS) * 365
  const pmp = accountsPayable > 0 && cogs > 0
    ? safeDiv(accountsPayable * 365, cogs)
    : null

  // PMP mais alto = mais favorável (empresa financia-se nos fornecedores)
  // Mas muito alto = sinal de dificuldades de pagamento
  const pmpScore = pmp !== null
    ? clamp(
        pmp >= 60 && pmp <= 90  ? 100 :
        pmp >= 45 && pmp < 60   ? 90 :
        pmp >= 30 && pmp < 45   ? 75 :
        pmp > 90  && pmp <= 120 ? 60 :
        pmp > 120               ? 30 : 50,
        0, 100
      )
    : 60

  metrics.push({
    name: 'Prazo Médio Pagamento (dias)',
    value: pmp,
    benchmark: 60,
    score: pmpScore,
    weight: 0.25,
    flag: pmp !== null && pmp > 120 ? 'warning' : undefined,
  })

  // 3. Rotação de Stocks = COGS / Stocks médios (proxy: stocks actuais)
  const stockTurnover = inventory > 0 ? safeDiv(cogs, inventory) : null

  const stockScore = stockTurnover !== null
    ? clamp(
        stockTurnover >= 12 ? 100 :
        stockTurnover >= 8  ? 85 :
        stockTurnover >= 5  ? 70 :
        stockTurnover >= 3  ? 50 :
        stockTurnover >= 1  ? 25 : 0,
        0, 100
      )
    : 70 // sem stocks = sector serviços → bom sinal

  metrics.push({
    name: 'Rotação de Stocks (x/ano)',
    value: stockTurnover,
    benchmark: 6,
    score: stockScore,
    weight: 0.25,
  })

  // 4. Asset Turnover = Revenue / Total Activo
  const assetTurnover = safeDiv(revenue, totalAssets)

  const atScore = assetTurnover !== null
    ? clamp(
        assetTurnover >= 2.0 ? 100 :
        assetTurnover >= 1.5 ? 85 :
        assetTurnover >= 1.0 ? 70 :
        assetTurnover >= 0.7 ? 55 :
        assetTurnover >= 0.4 ? 35 : 15,
        0, 100
      )
    : 50

  metrics.push({
    name: 'Asset Turnover',
    value: assetTurnover,
    benchmark: 1.0,
    score: atScore,
    weight: 0.20,
  })

  const rawScore = metrics.reduce((sum, m) => sum + m.score * m.weight, 0)

  const interpretation = rawScore >= 75
    ? 'Operações eficientes — ciclo de tesouraria saudável e boa utilização de activos.'
    : rawScore >= 50
    ? 'Eficiência operacional razoável — algumas métricas de ciclo a melhorar.'
    : rawScore >= 25
    ? 'Ineficiências operacionais significativas — capital parado ou ciclos de pagamento desequilibrados.'
    : 'Operações muito ineficientes — ciclo de tesouraria negativo e activos sub-utilizados.'

  return {
    name: 'operational_quality',
    label: 'Qualidade Operacional',
    weight: 0.20,
    rawScore,
    weightedScore: rawScore * 0.20,
    metrics,
    interpretation,
  }
}
