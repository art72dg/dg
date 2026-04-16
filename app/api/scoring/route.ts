// app/api/scoring/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { calculateScore } from '@/lib/scoring/engine'
import type { FinancialData, QualitativeData } from '@/types/financial'

const ScoringRequestSchema = z.object({
  analysisId: z.string().uuid(),
  financialData: z.object({
    period: z.string(),
    currency: z.string().default('EUR'),
    unit: z.enum(['units', 'thousands', 'millions']).default('units'),
    balanceSheet: z.object({
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
    }),
    incomeStatement: z.object({
      revenue: z.number(),
      grossProfit: z.number().optional(),
      ebitda: z.number(),
      ebit: z.number().optional(),
      interestExpense: z.number(),
      netIncome: z.number(),
      depreciation: z.number().optional(),
    }),
    cashFlow: z.object({
      operatingCashFlow: z.number().optional(),
      capitalExpenditure: z.number().optional(),
      freeCashFlow: z.number().optional(),
    }).optional(),
  }),
  qualitativeData: z.object({
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
  }),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = ScoringRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { analysisId, financialData, qualitativeData } = parsed.data

    // Verificar que a análise pertence ao utilizador
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('id, status')
      .eq('id', analysisId)
      .eq('user_id', user.id)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json({ error: 'Análise não encontrada' }, { status: 404 })
    }

    // Actualizar status
    await supabase
      .from('analyses')
      .update({ status: 'scoring' })
      .eq('id', analysisId)

    // Calcular score
    const scoringResult = calculateScore({
      analysisId,
      financialData: financialData as FinancialData,
      qualitativeData: qualitativeData as QualitativeData,
    })

    // Guardar resultado
    const { data: savedResult, error: saveError } = await supabase
      .from('scoring_results')
      .insert({
        analysis_id: analysisId,
        user_id: user.id,
        score: scoringResult.score,
        risk_level: scoringResult.riskLevel,
        blocks: scoringResult.blocks,
        flags: scoringResult.flags,
        data_completeness: scoringResult.dataCompleteness,
        algorithm_version: scoringResult.version,
      })
      .select()
      .single()

    if (saveError) throw saveError

    // Actualizar status para 'draft' após score calculado com sucesso
    await supabase
      .from('analyses')
      .update({ status: 'draft' })
      .eq('id', analysisId)

    return NextResponse.json({ data: scoringResult }, { status: 200 })
  } catch (error) {
    console.error('[POST /api/scoring]', error)
    return NextResponse.json(
      { error: 'Erro ao calcular score' },
      { status: 500 }
    )
  }
}
