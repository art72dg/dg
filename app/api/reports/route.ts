// app/api/reports/route.ts
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { generateReport } from '@/lib/ai/claude-client'
import { buildSystemPrompt, buildReportSections, LEGAL_DISCLAIMER } from '@/lib/ai/report-prompts'
import type { ScoringResult } from '@/types/scoring'
import type { CompanyProfile } from '@/types/company'
import type { FinancialData, YoYTrend, AgingSchedule, TreasuryData, AssetSaleData } from '@/types/financial'

const GenerateReportSchema = z.object({
  analysisId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  let analysisId: string | null = null

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = GenerateReportSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    analysisId = parsed.data.analysisId

    // Carregar análise + dados
    const { data: analysis } = await supabase
      .from('analyses')
      .select('*, companies(*)')
      .eq('id', analysisId)
      .eq('user_id', user.id)
      .single()

    if (!analysis) {
      return NextResponse.json({ error: 'Análise não encontrada' }, { status: 404 })
    }

    const { data: scoringData } = await supabase
      .from('scoring_results')
      .select('*')
      .eq('analysis_id', analysisId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!scoringData) {
      return NextResponse.json(
        { error: 'Score não calculado. Execute o scoring primeiro.' },
        { status: 400 }
      )
    }

    const { data: financialData } = await supabase
      .from('financial_data')
      .select('*')
      .eq('analysis_id', analysisId)
      .single()

    if (!financialData) {
      return NextResponse.json(
        { error: 'Dados financeiros não encontrados.' },
        { status: 400 }
      )
    }

    // Marcar como a gerar
    await supabase
      .from('analyses')
      .update({ status: 'generating' })
      .eq('id', analysisId)

    const trend = scoringData.trend as YoYTrend | undefined
    const aging = financialData.aging_data as AgingSchedule | undefined
    const treasury = financialData.treasury_data as TreasuryData | undefined
    const assetSale = financialData.asset_sale_data as AssetSaleData | undefined

    const scoring: ScoringResult = {
      id: scoringData.id,
      analysisId,
      score: scoringData.score,
      riskLevel: scoringData.risk_level,
      blocks: scoringData.blocks,
      flags: scoringData.flags,
      dataCompleteness: scoringData.data_completeness,
      calculatedAt: scoringData.calculated_at,
      version: scoringData.algorithm_version,
      trend,
    }

    const company = analysis.companies as unknown as CompanyProfile
    const financial = {
      period: financialData.period,
      currency: financialData.currency,
      unit: financialData.unit,
      balanceSheet: {
        totalAssets: financialData.total_assets,
        currentAssets: financialData.current_assets,
        cash: financialData.cash,
        accountsReceivable: financialData.accounts_receivable,
        inventory: financialData.inventory,
        totalLiabilities: financialData.total_liabilities,
        currentLiabilities: financialData.current_liabilities,
        longTermDebt: financialData.long_term_debt,
        shortTermDebt: financialData.short_term_debt,
        accountsPayable: financialData.accounts_payable,
        equity: financialData.equity,
      },
      incomeStatement: {
        revenue: financialData.revenue,
        ebitda: financialData.ebitda,
        ebit: financialData.ebit,
        interestExpense: financialData.interest_expense,
        netIncome: financialData.net_income,
      },
    } as FinancialData

    // Gerar relatório com Haiku (rápido, < 15s)
    const systemPrompt = buildSystemPrompt(company, scoring, trend, aging, treasury, assetSale)
    const sections = buildReportSections(scoring, financial, trend, aging, treasury, assetSale)
    const generatedSections = await generateReport(systemPrompt, sections)

    const reportSections = [
      ...sections.map(s => ({
        key: s.key,
        title: sectionTitle(s.key),
        content: generatedSections[s.key] || '',
        generatedAt: new Date().toISOString(),
      })),
      {
        key: 'disclaimer',
        title: 'Aviso Legal',
        content: LEGAL_DISCLAIMER,
        generatedAt: new Date().toISOString(),
      },
    ]

    const wordCount = reportSections.reduce(
      (sum, s) => sum + s.content.split(/\s+/).length, 0
    )

    const { data: report, error: reportError } = await supabase
      .from('analysis_reports')
      .insert({
        analysis_id: analysisId,
        user_id: user.id,
        sections: reportSections,
        status: 'complete',
        model_version: 'claude-haiku-4-5-20251001',
        word_count: wordCount,
      })
      .select()
      .single()

    if (reportError) throw reportError

    await supabase
      .from('analyses')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', analysisId)

    return NextResponse.json({ data: report }, { status: 201 })

  } catch (error) {
    console.error('[POST /api/reports]', error)
    // Repor status para 'error' para permitir nova tentativa
    if (analysisId) {
      try {
        const supabaseErr = await createClient()
        await supabaseErr
          .from('analyses')
          .update({ status: 'error' })
          .eq('id', analysisId)
      } catch { /* best effort */ }
    }
    return NextResponse.json({ error: 'Erro ao gerar relatório' }, { status: 500 })
  }
}

function sectionTitle(key: string): string {
  const titles: Record<string, string> = {
    executive_summary:      'Sumário Executivo',
    liquidity_analysis:     'Análise de Liquidez',
    profitability_analysis: 'Análise de Rentabilidade',
    financial_structure:    'Estrutura Financeira',
    operational_quality:    'Qualidade Operacional',
    risk_signals:           'Sinais de Alerta',
    trend_analysis:         'Análise de Tendência (YoY)',
    aging_analysis:         'Antiguidade de Saldos',
    treasury_analysis:      'Tesouraria e Liquidez',
    asset_monetization:     'Monetização de Activos',
    scenarios:              'Cenários e Projecções',
    recommendations:        'Recomendações',
    disclaimer:             'Aviso Legal',
  }
  return titles[key] ?? key
}
