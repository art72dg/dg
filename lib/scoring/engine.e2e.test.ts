// lib/scoring/engine.e2e.test.ts
// Teste end-to-end do motor de scoring com dados estendidos.
// Simula 3 perfis realistas de empresas e valida o fluxo completo:
// - os 5 blocos
// - ajustes de aging/treasury/assetSale
// - flags derivados
// - risk level final
// - YoY trend

import { describe, expect, it } from 'vitest'
import { calculateScore } from './engine'
import type { FinancialData, QualitativeData } from '@/types/financial'

// ── Fixtures realistas ──────────────────────────────────────────────────────

/** Empresa saudável — PME rentável com boa estrutura */
const healthyCompany: FinancialData = {
  period: '2025',
  currency: 'EUR',
  unit: 'thousands',
  balanceSheet: {
    totalAssets: 5000, currentAssets: 2500, cash: 800,
    accountsReceivable: 1000, inventory: 700,
    totalLiabilities: 2000, currentLiabilities: 1200,
    accountsPayable: 600, longTermDebt: 800,
    equity: 3000,
  },
  incomeStatement: {
    revenue: 8000, ebitda: 1200, ebit: 900,
    interestExpense: 50, netIncome: 600,
  },
  cashFlow: { operatingCashFlow: 900, freeCashFlow: 700 },
  treasuryData: {
    availableCreditLines: 500,   // 42% do passivo corrente → buffer sólido
    daysUntilCashOut: 240,        // > 180 → +4
  },
  agingData: {
    receivablesUnder30: 800,
    receivablesOver90: 50,        // 5% → no-op
  },
}

/** Empresa em stress — liquidez apertada e aging fraco */
const stressedCompany: FinancialData = {
  period: '2025',
  currency: 'EUR',
  unit: 'thousands',
  balanceSheet: {
    totalAssets: 3000, currentAssets: 900, cash: 50,
    accountsReceivable: 500, inventory: 300,
    totalLiabilities: 2400, currentLiabilities: 1500,
    accountsPayable: 800, longTermDebt: 900,
    equity: 600,
  },
  incomeStatement: {
    revenue: 4000, ebitda: 80, ebit: -40,
    interestExpense: 180, netIncome: -200,
  },
  cashFlow: { operatingCashFlow: -50, freeCashFlow: -200 },
  treasuryData: {
    availableCreditLines: 20,     // < 10% → no-op
    daysUntilCashOut: 45,          // < 60 → -8
  },
  agingData: {
    receivablesUnder30: 100,
    receivablesOver90: 400,        // 80% → -12
    payablesUnder30: 200,
    payablesOver90: 600,           // 75% → -10 critical
  },
  assetSaleData: {
    hasNonCoreRealEstate: true,
    realEstateRealizableValue: 400,
    hasEquipmentForSale: false,
    hasSubsidiariesForDivestiture: false,
    hasInvestmentsForSale: false,
  },
}

/** Empresa crítica — insolvência iminente */
const criticalCompany: FinancialData = {
  period: '2025',
  currency: 'EUR',
  unit: 'thousands',
  balanceSheet: {
    totalAssets: 2000, currentAssets: 500, cash: 10,
    accountsReceivable: 200, inventory: 200,
    totalLiabilities: 2500, currentLiabilities: 1800,
    accountsPayable: 900, longTermDebt: 700,
    equity: -500,
  },
  incomeStatement: {
    revenue: 2000, ebitda: -300, ebit: -500,
    interestExpense: 250, netIncome: -800,
  },
  cashFlow: { operatingCashFlow: -400, freeCashFlow: -500 },
  treasuryData: { daysUntilCashOut: 15 }, // crítico
}

const cleanQual = (): QualitativeData => ({
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
})

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Engine E2E — healthy company', () => {
  const result = calculateScore({
    analysisId: 'e2e-healthy',
    financialData: healthyCompany,
    qualitativeData: cleanQual(),
  })

  it('scores in green band (>= 75)', () => {
    expect(result.score).toBeGreaterThanOrEqual(75)
    expect(result.riskLevel).toBe('green')
  })

  it('has all 5 blocks', () => {
    expect(result.blocks).toHaveLength(5)
    expect(result.blocks.map(b => b.name).sort()).toEqual(
      ['critical_signals', 'financial_structure', 'liquidity', 'operational_quality', 'profitability']
    )
  })

  it('liquidity block exposes runway and buffer metrics', () => {
    const liq = result.blocks.find(b => b.name === 'liquidity')!
    expect(liq.metrics.find(m => m.name === 'Runway (dias)')).toBeDefined()
    expect(liq.metrics.find(m => m.name === 'Crédito disponível / Passivo corrente')).toBeDefined()
  })

  it('data completeness >= 90%', () => {
    expect(result.dataCompleteness).toBeGreaterThanOrEqual(90)
  })
})

describe('Engine E2E — stressed company', () => {
  const qual = cleanQual()
  qual.hasMajorClientLoss = true
  qual.hasRefinancingDependency = true

  const result = calculateScore({
    analysisId: 'e2e-stressed',
    financialData: stressedCompany,
    qualitativeData: qual,
  })

  it('scores in orange or red band (< 50)', () => {
    expect(result.score).toBeLessThan(50)
    expect(['orange', 'red']).toContain(result.riskLevel)
  })

  it('raises payables_over_90 flag (critical)', () => {
    const flag = result.flags.find(f => f.code === 'payables_over_90')
    expect(flag).toBeDefined()
    expect(flag!.severity).toBe('critical')
  })

  it('raises asset_sale_plan flag (info bonus)', () => {
    const flag = result.flags.find(f => f.code === 'asset_sale_plan')
    expect(flag).toBeDefined()
    expect(flag!.impact).toBe(4)
  })

  it('liquidity is materially penalised by aging + short runway', () => {
    const liq = result.blocks.find(b => b.name === 'liquidity')!
    // Adjustments expected: -12 (aging > 50%) + -8 (runway < 60)
    // Buffer < 10% → no-op
    expect(liq.rawScore).toBeLessThan(40)
    const runway = liq.metrics.find(m => m.name === 'Runway (dias)')
    expect(runway?.flag).toBe('warning')
  })

  it('critical_signals block includes qualitative + derived flags', () => {
    const codes = result.flags.map(f => f.code)
    expect(codes).toContain('major_client_loss')
    expect(codes).toContain('refinancing_dependency')
    expect(codes).toContain('payables_over_90')
  })
})

describe('Engine E2E — critical company with YoY degradation', () => {
  const qual = cleanQual()
  qual.hasCovenantBreach = true
  qual.hasInsolvencyProceedings = true
  qual.hasQualifiedAuditReport = true
  qual.hasNegativeEbitdaStreak = true

  // Ano anterior — pior, para provar que YoY capta deterioração
  const previousYear: FinancialData = {
    ...criticalCompany,
    period: '2024',
    incomeStatement: { ...criticalCompany.incomeStatement, revenue: 3500, ebitda: 100, netIncome: 50 },
    balanceSheet:    { ...criticalCompany.balanceSheet,    cash: 100, equity: 300, totalLiabilities: 2000 },
  }

  const result = calculateScore({
    analysisId: 'e2e-critical',
    financialData: criticalCompany,
    qualitativeData: qual,
    previousYearData: previousYear,
  })

  it('scores red band', () => {
    expect(result.score).toBeLessThan(25)
    expect(result.riskLevel).toBe('red')
  })

  it('has >= 3 critical flags', () => {
    const criticals = result.flags.filter(f => f.severity === 'critical')
    expect(criticals.length).toBeGreaterThanOrEqual(3)
  })

  it('computes YoY trend showing deterioration', () => {
    expect(result.trend).toBeDefined()
    expect(result.trend!.revenueGrowthPct).toBeLessThan(0)
    expect(result.trend!.cashChangePct).toBeLessThan(0)
    expect(result.trend!.equityChangePct).toBeLessThan(0)
  })

  it('liquidity runway metric flagged as critical (< 30d)', () => {
    const liq = result.blocks.find(b => b.name === 'liquidity')!
    const runway = liq.metrics.find(m => m.name === 'Runway (dias)')
    expect(runway?.flag).toBe('critical')
  })
})

describe('Engine E2E — deterministic output structure', () => {
  it('result has all required fields', () => {
    const result = calculateScore({
      analysisId: 'e2e-structure',
      financialData: healthyCompany,
      qualitativeData: cleanQual(),
    })
    expect(result).toMatchObject({
      analysisId: 'e2e-structure',
      score: expect.any(Number),
      riskLevel: expect.stringMatching(/^(green|yellow|orange|red)$/),
      blocks: expect.any(Array),
      flags: expect.any(Array),
      dataCompleteness: expect.any(Number),
      version: expect.any(String),
      calculatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    })
    expect(result.id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('weighted scores sum to final score within rounding', () => {
    const result = calculateScore({
      analysisId: 'e2e-math',
      financialData: healthyCompany,
      qualitativeData: cleanQual(),
    })
    const sumWeighted = result.blocks.reduce((s, b) => s + b.weightedScore, 0)
    expect(Math.abs(sumWeighted - result.score)).toBeLessThan(1.5)
  })
})
