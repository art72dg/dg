// app/api/financial-data/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const BalanceSheetSchema = z.object({
  totalAssets: z.number(),
  currentAssets: z.number(),
  cash: z.number(),
  accountsReceivable: z.number().optional(),
  inventory: z.number().optional(),
  nonCurrentAssets: z.number().optional(),
  totalLiabilities: z.number(),
  currentLiabilities: z.number(),
  shortTermDebt: z.number().optional(),
  accountsPayable: z.number().optional(),
  nonCurrentLiabilities: z.number().optional(),
  longTermDebt: z.number().optional(),
  equity: z.number(),
  retainedEarnings: z.number().optional(),
})

const IncomeStatementSchema = z.object({
  revenue: z.number(),
  grossProfit: z.number().optional(),
  ebitda: z.number(),
  ebit: z.number().optional(),
  interestExpense: z.number(),
  netIncome: z.number(),
  depreciation: z.number().optional(),
})

const CashFlowSchema = z.object({
  operatingCashFlow: z.number().optional(),
  capitalExpenditure: z.number().optional(),
  freeCashFlow: z.number().optional(),
})

const QualitativeDataSchema = z.object({
  hasCovenantBreach: z.boolean().default(false),
  hasInsolvencyProceedings: z.boolean().default(false),
  hasMajorClientLoss: z.boolean().default(false),
  hasSeniorManagementDeparture: z.boolean().default(false),
  hasQualifiedAuditReport: z.boolean().default(false),
  hasSupplierPaymentDelay: z.boolean().default(false),
  clientConcentrationPct: z.number().min(0).max(100).optional(),
  hasRefinancingDependency: z.boolean().default(false),
  hasNegativeEbitdaStreak: z.boolean().default(false),
  hasMaterialLitigation: z.boolean().default(false),
  hasTaxComplianceIssues: z.boolean().default(false),
  hasNewFinancing: z.boolean().default(false),
  hasNewMultiyearContract: z.boolean().default(false),
  hasDebtRestructuringCompleted: z.boolean().default(false),
  hasNewStrategicShareholder: z.boolean().default(false),
  additionalContext: z.string().optional(),
})

const AgingSchema = z.object({
  receivablesUnder30: z.number(),
  receivables30to60: z.number().optional(),
  receivables60to90: z.number().optional(),
  receivablesOver90: z.number(),
  receivablesDisputed: z.number().optional(),
  payablesUnder30: z.number().optional(),
  payables30to60: z.number().optional(),
  payables60to90: z.number().optional(),
  payablesOver90: z.number().optional(),
})

const TreasurySchema = z.object({
  availableCreditLines: z.number().optional(),
  committedFacilities: z.number().optional(),
  projectedInflows30d: z.number().optional(),
  projectedOutflows30d: z.number().optional(),
  projectedInflows90d: z.number().optional(),
  projectedOutflows90d: z.number().optional(),
  daysUntilCashOut: z.number().optional(),
})

const AssetSaleSchema = z.object({
  hasNonCoreRealEstate: z.boolean(),
  realEstateRealizableValue: z.number().optional(),
  hasEquipmentForSale: z.boolean(),
  equipmentRealizableValue: z.number().optional(),
  hasSubsidiariesForDivestiture: z.boolean(),
  subsidiariesRealizableValue: z.number().optional(),
  hasInvestmentsForSale: z.boolean(),
  investmentsRealizableValue: z.number().optional(),
  totalEstimatedRealizableValue: z.number().optional(),
  timelineMonths: z.number().optional(),
})

const SaveFinancialDataSchema = z.object({
  analysisId: z.string().uuid(),
  period: z.string().min(1).max(20),
  currency: z.string().min(3).max(3).default('EUR'),
  unit: z.enum(['units', 'thousands', 'millions']).default('units'),
  balanceSheet: BalanceSheetSchema,
  incomeStatement: IncomeStatementSchema,
  cashFlow: CashFlowSchema.optional(),
  agingData: AgingSchema.optional(),
  treasuryData: TreasurySchema.optional(),
  assetSaleData: AssetSaleSchema.optional(),
  qualitativeData: QualitativeDataSchema.optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = SaveFinancialDataSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { analysisId, period, currency, unit, balanceSheet, incomeStatement, cashFlow, agingData, treasuryData, assetSaleData, qualitativeData } = parsed.data

    // Verificar que a análise pertence ao utilizador
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('id')
      .eq('id', analysisId)
      .eq('user_id', user.id)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json({ error: 'Análise não encontrada' }, { status: 404 })
    }

    // Upsert: se já existir financial_data para esta análise, substituir
    const { data: existing } = await supabase
      .from('financial_data')
      .select('id')
      .eq('analysis_id', analysisId)
      .maybeSingle()

    const financialRow = {
      analysis_id: analysisId,
      user_id: user.id,
      period,
      currency,
      unit,
      // Balance sheet
      total_assets: balanceSheet.totalAssets,
      current_assets: balanceSheet.currentAssets,
      cash: balanceSheet.cash,
      accounts_receivable: balanceSheet.accountsReceivable ?? null,
      inventory: balanceSheet.inventory ?? null,
      non_current_assets: balanceSheet.nonCurrentAssets ?? null,
      total_liabilities: balanceSheet.totalLiabilities,
      current_liabilities: balanceSheet.currentLiabilities,
      short_term_debt: balanceSheet.shortTermDebt ?? null,
      accounts_payable: balanceSheet.accountsPayable ?? null,
      non_current_liabilities: balanceSheet.nonCurrentLiabilities ?? null,
      long_term_debt: balanceSheet.longTermDebt ?? null,
      equity: balanceSheet.equity,
      retained_earnings: balanceSheet.retainedEarnings ?? null,
      // Income statement
      revenue: incomeStatement.revenue,
      gross_profit: incomeStatement.grossProfit ?? null,
      ebitda: incomeStatement.ebitda,
      ebit: incomeStatement.ebit ?? null,
      interest_expense: incomeStatement.interestExpense,
      net_income: incomeStatement.netIncome,
      depreciation: incomeStatement.depreciation ?? null,
      // Cash flow
      operating_cash_flow: cashFlow?.operatingCashFlow ?? null,
      capital_expenditure: cashFlow?.capitalExpenditure ?? null,
      free_cash_flow: cashFlow?.freeCashFlow ?? null,
      // Extended financial data as JSONB
      aging_data: agingData ?? null,
      treasury_data: treasuryData ?? null,
      asset_sale_data: assetSaleData ?? null,
      // Qualitative data as JSONB
      qualitative_data: qualitativeData ?? null,
    }

    let result
    if (existing) {
      const { data, error } = await supabase
        .from('financial_data')
        .update(financialRow)
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      result = data
    } else {
      const { data, error } = await supabase
        .from('financial_data')
        .insert(financialRow)
        .select()
        .single()
      if (error) throw error
      result = data
    }

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/financial-data]', error)
    return NextResponse.json({ error: 'Erro ao guardar dados financeiros' }, { status: 500 })
  }
}
