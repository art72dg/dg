// lib/ai/report-prompts.ts
import { ScoringResult, RISK_LEVEL_LABELS } from '@/types/scoring'
import { CompanyProfile } from '@/types/company'
import { FinancialData, YoYTrend, AgingSchedule, TreasuryData, AssetSaleData } from '@/types/financial'

function formatTrendValue(value: number | null, suffix: string, decimals = 1): string {
  if (value === null) return 'n/d'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}${suffix}`
}

function buildAgingSection(aging: AgingSchedule): string {
  const totalReceivables =
    (aging.receivablesUnder30 ?? 0) +
    (aging.receivables30to60 ?? 0) +
    (aging.receivables60to90 ?? 0) +
    aging.receivablesOver90
  const overdueRatio = totalReceivables > 0
    ? ((aging.receivablesOver90 / totalReceivables) * 100).toFixed(1)
    : 'n/d'
  return `
## Antiguidade de Saldos — Clientes
- < 30 dias: ${aging.receivablesUnder30}
- 30–60 dias: ${aging.receivables30to60 ?? 'n/d'}
- 60–90 dias: ${aging.receivables60to90 ?? 'n/d'}
- > 90 dias: ${aging.receivablesOver90} (${overdueRatio}% do total)
${aging.receivablesDisputed !== undefined ? `- Em litígio: ${aging.receivablesDisputed}` : ''}

## Antiguidade de Saldos — Fornecedores
- < 30 dias: ${aging.payablesUnder30 ?? 'n/d'}
- 30–60 dias: ${aging.payables30to60 ?? 'n/d'}
- 60–90 dias: ${aging.payables60to90 ?? 'n/d'}
- > 90 dias: ${aging.payablesOver90 ?? 'n/d'}
`
}

function buildTreasurySection(treasury: TreasuryData): string {
  const netPosition30 = treasury.projectedInflows30d !== undefined && treasury.projectedOutflows30d !== undefined
    ? (treasury.projectedInflows30d - treasury.projectedOutflows30d).toFixed(0)
    : 'n/d'
  return `
## Disponibilidade de Tesouraria
- Linhas de crédito disponíveis: ${treasury.availableCreditLines ?? 'n/d'}
- Facilidades comprometidas: ${treasury.committedFacilities ?? 'n/d'}
${treasury.daysUntilCashOut !== undefined ? `- Cash runway estimado: ${treasury.daysUntilCashOut} dias` : ''}

### Projecções de Caixa
- Entradas a 30 dias: ${treasury.projectedInflows30d ?? 'n/d'}
- Saídas a 30 dias: ${treasury.projectedOutflows30d ?? 'n/d'}
- Posição líquida a 30 dias: ${netPosition30}
- Entradas a 90 dias: ${treasury.projectedInflows90d ?? 'n/d'}
- Saídas a 90 dias: ${treasury.projectedOutflows90d ?? 'n/d'}
`
}

function buildAssetSection(assets: AssetSaleData): string {
  const items: string[] = []
  if (assets.hasNonCoreRealEstate) items.push(`- Imóveis não estratégicos: ${assets.realEstateRealizableValue ?? 'valor não indicado'}`)
  if (assets.hasEquipmentForSale) items.push(`- Equipamento / maquinaria: ${assets.equipmentRealizableValue ?? 'valor não indicado'}`)
  if (assets.hasSubsidiariesForDivestiture) items.push(`- Participações / subsidiárias: ${assets.subsidiariesRealizableValue ?? 'valor não indicado'}`)
  if (assets.hasInvestmentsForSale) items.push(`- Investimentos financeiros: ${assets.investmentsRealizableValue ?? 'valor não indicado'}`)
  return `
## Potencial de Venda de Activos
${items.join('\n')}
${assets.totalEstimatedRealizableValue !== undefined ? `- **Total estimado realizável:** ${assets.totalEstimatedRealizableValue}` : ''}
${assets.timelineMonths !== undefined ? `- Prazo estimado de realização: ${assets.timelineMonths} meses` : ''}
`
}

function buildTrendSection(trend: YoYTrend): string {
  return `
## Análise de Tendência — ${trend.previousPeriod} → Ano actual
- **Crescimento de Receita:** ${formatTrendValue(trend.revenueGrowthPct, '%')}
- **Variação Margem EBITDA:** ${formatTrendValue(trend.ebitdaMarginChangePp, ' pp')}
- **Variação Margem Líquida:** ${formatTrendValue(trend.netMarginChangePp, ' pp')}
- **Capital Próprio:** ${formatTrendValue(trend.equityChangePct, '%')}
- **Dívida Total:** ${formatTrendValue(trend.debtChangePct, '%')}
- **Tesouraria (Cash):** ${formatTrendValue(trend.cashChangePct, '%')}
- **Variação Current Ratio:** ${formatTrendValue(trend.currentRatioChange, 'x', 2)}
`
}

export const LEGAL_DISCLAIMER = `
---
**Aviso Legal**

Este dossier foi gerado automaticamente por um sistema de inteligência artificial (Turnaround AI) com base nos dados financeiros e qualitativos fornecidos pelo utilizador. Não constitui nem deve ser interpretado como conselho de investimento, conselho jurídico, conselho financeiro ou qualquer outra forma de aconselhamento profissional regulado.

As análises e recomendações têm carácter indicativo e informativo. Decisões de investimento, financiamento, reestruturação ou aquisição devem sempre ser tomadas com o apoio de profissionais qualificados e certificados.

Turnaround AI e os seus operadores não assumem qualquer responsabilidade por perdas ou danos resultantes do uso deste relatório.
`

export function buildSystemPrompt(
  company: CompanyProfile,
  scoring: ScoringResult,
  trend?: YoYTrend,
  aging?: AgingSchedule,
  treasury?: TreasuryData,
  assetSale?: AssetSaleData
): string {
  const riskLabel = RISK_LEVEL_LABELS[scoring.riskLevel]

  return `És um analista financeiro sénior especializado em empresas em dificuldade e processos de reestruturação. Tens 20 anos de experiência em due diligence financeira, reestruturação de dívida e diagnóstico de empresas.

## Empresa em análise
- **Nome:** ${company.name}
- **Sector:** ${company.sector}
- **Dimensão:** ${company.size}
- **País:** ${company.country}
${company.description ? `- **Descrição:** ${company.description}` : ''}

## Resultado do Scoring
- **Score Global:** ${scoring.score.toFixed(1)} / 100
- **Nível de Risco:** ${riskLabel}
- **Completude dos dados:** ${scoring.dataCompleteness.toFixed(0)}%

## Blocos de Scoring
${scoring.blocks.map(b => `- **${b.label}:** ${b.rawScore.toFixed(1)}/100 — ${b.interpretation}`).join('\n')}

## Flags de Risco
${scoring.flags.length > 0
  ? scoring.flags.map(f => `- [${f.severity.toUpperCase()}] ${f.label}: ${f.description}`).join('\n')
  : 'Sem flags críticos identificados.'
}

${trend ? buildTrendSection(trend) : ''}
${aging ? buildAgingSection(aging) : ''}
${treasury ? buildTreasurySection(treasury) : ''}
${assetSale && (assetSale.hasNonCoreRealEstate || assetSale.hasEquipmentForSale || assetSale.hasSubsidiariesForDivestiture || assetSale.hasInvestmentsForSale) ? buildAssetSection(assetSale) : ''}
## Instruções
- Escreve em Português Europeu, tom profissional mas acessível
- Usa markdown com headers, listas e negrito onde adequado
- Baseia-te APENAS nos dados fornecidos — não inventes números
- Quando os dados são insuficientes, indica-o explicitamente
- Identifica claramente que a análise é gerada por IA
${trend ? '- Incorpora a análise de tendência YoY nas secções relevantes' : ''}
${aging ? '- Analisa a antiguidade de saldos: créditos vencidos >90d e concentração de risco em clientes/fornecedores' : ''}
${treasury ? '- Analisa a liquidez disponível, o cash runway e o gap de tesouraria nos próximos 30-90 dias' : ''}
${assetSale ? '- Quantifica o potencial de monetização de activos e integra-o nas recomendações e cenários' : ''}`
}

export function buildReportSections(
  scoring: ScoringResult,
  financial: FinancialData,
  trend?: YoYTrend,
  aging?: AgingSchedule,
  treasury?: TreasuryData,
  assetSale?: AssetSaleData
): Array<{ key: string; prompt: string }> {
  const liq = scoring.blocks.find(b => b.name === 'liquidity')?.rawScore.toFixed(1)
  const prof = scoring.blocks.find(b => b.name === 'profitability')?.rawScore.toFixed(1)
  const struct = scoring.blocks.find(b => b.name === 'financial_structure')?.rawScore.toFixed(1)
  const ops = scoring.blocks.find(b => b.name === 'operational_quality')?.rawScore.toFixed(1)
  const criticals = scoring.flags.filter(f => f.severity === 'critical').length
  const warnings = scoring.flags.filter(f => f.severity === 'warning').length

  return [
    {
      key: 'executive_summary',
      prompt: `Sumário Executivo (máx. 150 palavras): diagnóstico global, pontos-chave e urgência da intervenção.`,
    },
    {
      key: 'liquidity_analysis',
      prompt: `Análise de Liquidez — score ${liq}/100 (máx. 120 palavras): rácios, tesouraria, obrigações curto prazo, 2 recomendações.`,
    },
    {
      key: 'profitability_analysis',
      prompt: `Análise de Rentabilidade — score ${prof}/100 (máx. 120 palavras): margens, eficiência, 2 recomendações.`,
    },
    {
      key: 'financial_structure',
      prompt: `Estrutura Financeira — score ${struct}/100 (máx. 120 palavras): endividamento, cobertura juros, sustentabilidade, 2 opções.`,
    },
    {
      key: 'operational_quality',
      prompt: `Qualidade Operacional — score ${ops}/100 (máx. 100 palavras): ciclo operacional, capital circulante, 2 melhorias.`,
    },
    {
      key: 'risk_signals',
      prompt: `Sinais de Alerta — ${criticals} críticos, ${warnings} avisos (máx. 150 palavras): risco, impacto e acção imediata para cada flag crítico.`,
    },
    ...(trend ? [{
      key: 'trend_analysis',
      prompt: `Análise de Tendência YoY — ${trend.previousPeriod} vs ano actual (máx. 150 palavras): interpreta as variações de receita (${formatTrendValue(trend.revenueGrowthPct, '%')}), margem EBITDA (${formatTrendValue(trend.ebitdaMarginChangePp, ' pp')}), capital próprio (${formatTrendValue(trend.equityChangePct, '%')}) e dívida (${formatTrendValue(trend.debtChangePct, '%')}). Identifica se a trajectória é de melhoria, deterioração ou estagnação.`,
    }] : []),
    ...(aging ? [{
      key: 'aging_analysis',
      prompt: `Análise de Antiguidade de Saldos (máx. 150 palavras): avalia a qualidade da carteira de clientes (% vencida >90d, créditos em litígio), o comportamento de pagamento a fornecedores e o impacto no ciclo de tesouraria. Identifica risco de incobrabilidade e necessidade de provisões.`,
    }] : []),
    ...(treasury ? [{
      key: 'treasury_analysis',
      prompt: `Análise de Tesouraria e Liquidez Disponível (máx. 150 palavras): avalia o cash runway${treasury.daysUntilCashOut !== undefined ? ` (${treasury.daysUntilCashOut} dias estimados)` : ''}, o gap de caixa a 30 e 90 dias, a disponibilidade de linhas de crédito e a sustentabilidade das obrigações de curto prazo. Indica a urgência de acções de tesouraria.`,
    }] : []),
    ...(assetSale && (assetSale.hasNonCoreRealEstate || assetSale.hasEquipmentForSale || assetSale.hasSubsidiariesForDivestiture || assetSale.hasInvestmentsForSale) ? [{
      key: 'asset_monetization',
      prompt: `Plano de Monetização de Activos (máx. 150 palavras): avalia o potencial e viabilidade de venda dos activos identificados, o impacto esperado na estrutura de capital e liquidez, e recomenda prioridades de desinvestimento${assetSale.timelineMonths !== undefined ? ` no prazo de ${assetSale.timelineMonths} meses` : ''}.`,
    }] : []),
    {
      key: 'scenarios',
      prompt: `3 Cenários 12-18 meses (máx. 150 palavras): Base / Optimista / Pessimista — probabilidade e 2 indicadores cada.${trend ? ' Considera a trajectória YoY identificada.' : ''}${assetSale ? ' Considera o potencial de monetização de activos no cenário optimista.' : ''}`,
    },
    {
      key: 'recommendations',
      prompt: `Recomendações prioritárias (máx. 200 palavras): Urgente 0-30d / Curto Prazo 1-3m / Médio Prazo 3-12m — acção concreta e métrica de sucesso.${treasury ? ' Inclui acções de gestão de tesouraria.' : ''}${assetSale ? ' Inclui desinvestimentos prioritários.' : ''}`,
    },
  ]
}
