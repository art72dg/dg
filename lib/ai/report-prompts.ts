// lib/ai/report-prompts.ts
import { ScoringResult, RISK_LEVEL_LABELS } from '@/types/scoring'
import { CompanyProfile } from '@/types/company'
import { FinancialData, YoYTrend } from '@/types/financial'

function formatTrendValue(value: number | null, suffix: string, decimals = 1): string {
  if (value === null) return 'n/d'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}${suffix}`
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
  trend?: YoYTrend
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
## Instruções
- Escreve em Português Europeu, tom profissional mas acessível
- Usa markdown com headers, listas e negrito onde adequado
- Baseia-te APENAS nos dados fornecidos — não inventes números
- Quando os dados são insuficientes, indica-o explicitamente
- Identifica claramente que a análise é gerada por IA
${trend ? '- Incorpora a análise de tendência YoY nas secções relevantes' : ''}`
}

export function buildReportSections(
  scoring: ScoringResult,
  financial: FinancialData,
  trend?: YoYTrend
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
    {
      key: 'scenarios',
      prompt: `3 Cenários 12-18 meses (máx. 150 palavras): Base / Optimista / Pessimista — probabilidade e 2 indicadores cada.${trend ? ' Considera a trajectória YoY identificada.' : ''}`,
    },
    {
      key: 'recommendations',
      prompt: `Recomendações prioritárias (máx. 200 palavras): Urgente 0-30d / Curto Prazo 1-3m / Médio Prazo 3-12m — acção concreta e métrica de sucesso.`,
    },
  ]
}
