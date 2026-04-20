// lib/scoring/blocks/extended-data.test.ts
// Testes dos ajustes de scoring introduzidos pelos blocos de dados estendidos:
// - liquidity: Runway, buffer de crédito, incobrabilidade
// - critical-signals: payables_over_90, asset_sale_plan

import { describe, expect, it } from 'vitest'
import type { FinancialData, QualitativeData } from '@/types/financial'
import { calculateLiquidity } from './liquidity'
import { calculateCriticalSignals } from './critical-signals'

// ── Helpers ──────────────────────────────────────────────────────────────────
function baseFinancial(overrides: Partial<FinancialData> = {}): FinancialData {
  return {
    period: '2024',
    currency: 'EUR',
    unit: 'thousands',
    balanceSheet: {
      totalAssets: 1000,
      currentAssets: 400,
      cash: 100,
      accountsReceivable: 200,
      inventory: 100,
      totalLiabilities: 600,
      currentLiabilities: 300,
      accountsPayable: 150,
      longTermDebt: 300,
      equity: 400,
    },
    incomeStatement: {
      revenue: 2000,
      ebitda: 200,
      interestExpense: 30,
      netIncome: 100,
    },
    ...overrides,
  }
}

function baseQualitative(): QualitativeData {
  return {
    hasCovenantBreach: false,
    hasInsolvencyProceedings: false,
    hasMajorClientLoss: false,
    hasSeniorManagementDeparture: false,
    hasQualifiedAuditReport: false,
    hasSupplierPaymentDelay: false,
    hasRefinancingDependency: false,
    hasNegativeEbitdaStreak: false,
    hasMaterialLitigation: false,
    hasTaxComplianceIssues: false,
    hasNewFinancing: false,
    hasNewMultiyearContract: false,
    hasDebtRestructuringCompleted: false,
    hasNewStrategicShareholder: false,
  }
}

// ── Liquidity: runway (treasury.daysUntilCashOut) ────────────────────────────
describe('calculateLiquidity — runway adjustment', () => {
  it('no-op when treasuryData is absent', () => {
    const base = calculateLiquidity(baseFinancial())
    const withEmpty = calculateLiquidity(baseFinancial({ treasuryData: {} }))
    expect(withEmpty.rawScore).toBeCloseTo(base.rawScore, 5)
  })

  it('runway < 30 days penalises 15 pts and flags critical', () => {
    const base = calculateLiquidity(baseFinancial())
    const withShort = calculateLiquidity(
      baseFinancial({ treasuryData: { daysUntilCashOut: 20 } })
    )
    expect(withShort.rawScore).toBeCloseTo(Math.max(0, base.rawScore - 15), 5)
    const runwayMetric = withShort.metrics.find(m => m.name === 'Runway (dias)')
    expect(runwayMetric?.flag).toBe('critical')
  })

  it('runway >= 180 days adds a small bonus', () => {
    const base = calculateLiquidity(baseFinancial())
    const withLong = calculateLiquidity(
      baseFinancial({ treasuryData: { daysUntilCashOut: 200 } })
    )
    expect(withLong.rawScore).toBeCloseTo(Math.min(100, base.rawScore + 4), 5)
  })
})

// ── Liquidity: credit line buffer ────────────────────────────────────────────
describe('calculateLiquidity — credit line buffer', () => {
  it('adds +5 when available credit >= 20% of current liabilities', () => {
    const base = calculateLiquidity(baseFinancial())
    const withBuffer = calculateLiquidity(
      baseFinancial({
        // currentLiabilities = 300 → 20% = 60
        treasuryData: { availableCreditLines: 70 },
      })
    )
    expect(withBuffer.rawScore).toBeCloseTo(Math.min(100, base.rawScore + 5), 5)
  })

  it('no adjustment when availableCreditLines < 10% of current liabilities', () => {
    const base = calculateLiquidity(baseFinancial())
    const withTiny = calculateLiquidity(
      baseFinancial({ treasuryData: { availableCreditLines: 10 } })
    )
    expect(withTiny.rawScore).toBeCloseTo(base.rawScore, 5)
  })
})

// ── Liquidity: aging over-90 receivables ─────────────────────────────────────
describe('calculateLiquidity — bad-debt exposure from aging', () => {
  it('penalises 12 pts when >50% of AR is over 90 days', () => {
    const base = calculateLiquidity(baseFinancial())
    const withBadAging = calculateLiquidity(
      baseFinancial({
        agingData: {
          receivablesUnder30: 10,
          receivablesOver90: 90,
        },
      })
    )
    expect(withBadAging.rawScore).toBeCloseTo(Math.max(0, base.rawScore - 12), 5)
  })

  it('no-op when over-90 ratio <= 15%', () => {
    const base = calculateLiquidity(baseFinancial())
    const withHealthyAging = calculateLiquidity(
      baseFinancial({
        agingData: {
          receivablesUnder30: 90,
          receivablesOver90: 10,
        },
      })
    )
    expect(withHealthyAging.rawScore).toBeCloseTo(base.rawScore, 5)
  })
})

// ── Critical-signals: payables over 90 ───────────────────────────────────────
describe('calculateCriticalSignals — payables_over_90', () => {
  it('no flag when over-90 ratio <= 20%', () => {
    const result = calculateCriticalSignals({
      qualitative: baseQualitative(),
      aging: {
        receivablesUnder30: 0,
        receivablesOver90: 0,
        payablesUnder30: 80,
        payablesOver90: 20,
      },
    })
    expect(result.flags.find(f => f.code === 'payables_over_90')).toBeUndefined()
  })

  it('raises critical flag with -10 pts when ratio > 40%', () => {
    const result = calculateCriticalSignals({
      qualitative: baseQualitative(),
      aging: {
        receivablesUnder30: 0,
        receivablesOver90: 0,
        payablesUnder30: 40,
        payablesOver90: 60,
      },
    })
    const flag = result.flags.find(f => f.code === 'payables_over_90')
    expect(flag).toBeDefined()
    expect(flag!.severity).toBe('critical')
    expect(flag!.impact).toBe(-10)
  })
})

// ── Critical-signals: asset_sale_plan bonus ──────────────────────────────────
describe('calculateCriticalSignals — asset_sale_plan', () => {
  it('no flag when no divestiture plan', () => {
    const result = calculateCriticalSignals({
      qualitative: baseQualitative(),
      assetSale: {
        hasNonCoreRealEstate: false,
        hasEquipmentForSale: false,
        hasSubsidiariesForDivestiture: false,
        hasInvestmentsForSale: false,
      },
    })
    expect(result.flags.find(f => f.code === 'asset_sale_plan')).toBeUndefined()
  })

  it('adds info flag with +4 when there is a plan with realizable value', () => {
    const result = calculateCriticalSignals({
      qualitative: baseQualitative(),
      assetSale: {
        hasNonCoreRealEstate: true,
        realEstateRealizableValue: 500,
        hasEquipmentForSale: false,
        hasSubsidiariesForDivestiture: false,
        hasInvestmentsForSale: false,
      },
    })
    const flag = result.flags.find(f => f.code === 'asset_sale_plan')
    expect(flag).toBeDefined()
    expect(flag!.severity).toBe('info')
    expect(flag!.impact).toBe(4)
  })
})
