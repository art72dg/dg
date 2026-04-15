// lib/ai/report-prompts.ts
import { ScoringResult, RISK_LEVEL_LABELS } from '@/types/scoring'
import { CompanyProfile } from '@/types/company'
import { FinancialData } from '@/types/financial'

export const LEGAL_DISCLAIMER = `
---
**Aviso Legal**

Este dossier foi gerado automaticamente por um sistema de inteligência artificial (Turnaround AI) com base nos dados financeiros e qualitativos fornecidos pelo utilizador. Não constitui nem deve ser interpretado como conselho de investimento, conselho jurídico, conselho financeiro ou qualquer outra forma de aconselhamento profissional regulado.

As análises e recomendações têm carácter indicativo e informativo. Decisões de investimento, financiamento, reestruturação ou aquisição devem sempre ser tomadas com o apoio de profissionais qualificados e certificados.

Turnaround AI e os seus operadores não assumem qualquer responsabilidade por perdas ou danos resultantes do uso deste relatório.
`

export function buildSystemPrompt(
  company: CompanyProfile,
  scoring: ScoringResult
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

## Instruções
- Escreve em Português Europeu, tom profissional mas acessível
- Usa markdown com headers, listas e negrito onde adequado
- Baseia-te APENAS nos dados fornecidos — não inventes números
- Quando os dados são insuficientes, indica-o explicitamente
- Identifica claramente que a análise é gerada por IA`
}

export function buildReportSections(
  scoring: ScoringResult,
  financial: FinancialData
): Array<{ key: string; prompt: string }> {
  return [
    {
      key: 'executive_summary',
      prompt: `Escreve o Sumário Executivo desta análise. Deve ter 3 parágrafos:
1. Diagnóstico global (situação actual, score, nível de risco)
2. Principais pontos fortes e fracos identificados
3. Urgência e natureza da intervenção necessária

Máximo 300 palavras.`,
    },
    {
      key: 'liquidity_analysis',
      prompt: `Com base no bloco de Liquidez (score: ${scoring.blocks.find(b => b.name === 'liquidity')?.rawScore.toFixed(1)}/100), escreve a secção de Análise de Liquidez.
Inclui: interpretação dos rácios, posição de tesouraria, capacidade de cumprir obrigações de curto prazo, e recomendações específicas.
Máximo 250 palavras.`,
    },
    {
      key: 'profitability_analysis',
      prompt: `Com base no bloco de Rentabilidade (score: ${scoring.blocks.find(b => b.name === 'profitability')?.rawScore.toFixed(1)}/100), escreve a secção de Análise de Rentabilidade.
Inclui: análise de margens, evolução implícita, eficiência na geração de retornos, e recomendações.
Máximo 250 palavras.`,
    },
    {
      key: 'financial_structure',
      prompt: `Com base no bloco de Estrutura Financeira (score: ${scoring.blocks.find(b => b.name === 'financial_structure')?.rawScore.toFixed(1)}/100), escreve a secção de Estrutura Financeira.
Inclui: análise de endividamento, cobertura de juros, sustentabilidade da dívida, e opções de reestruturação.
Máximo 250 palavras.`,
    },
    {
      key: 'operational_quality',
      prompt: `Com base no bloco Operacional (score: ${scoring.blocks.find(b => b.name === 'operational_quality')?.rawScore.toFixed(1)}/100), escreve a secção de Qualidade Operacional.
Inclui: eficiência do ciclo operacional, gestão de capital circulante, e recomendações de melhoria.
Máximo 200 palavras.`,
    },
    {
      key: 'risk_signals',
      prompt: `Com base nos Sinais Críticos identificados (${scoring.flags.filter(f => f.severity === 'critical').length} críticos, ${scoring.flags.filter(f => f.severity === 'warning').length} avisos), escreve a secção de Sinais de Alerta.
Para cada flag crítico, indica: descrição do risco, impacto potencial, e acção imediata recomendada.
Máximo 300 palavras.`,
    },
    {
      key: 'scenarios',
      prompt: `Com base em toda a análise, escreve 3 cenários para a empresa nos próximos 12-18 meses:
1. **Cenário Base** — se mantiver o curso actual
2. **Cenário Optimista** — se executar as principais recomendações com sucesso
3. **Cenário Pessimista** — se a situação se deteriorar sem intervenção

Para cada cenário, indica probabilidade estimada e principais indicadores de monitorização.
Máximo 300 palavras.`,
    },
    {
      key: 'recommendations',
      prompt: `Com base em toda a análise, escreve as Recomendações prioritárias.
Organiza por horizonte temporal:
- **Urgente (0-30 dias):** acções críticas imediatas
- **Curto Prazo (1-3 meses):** estabilização
- **Médio Prazo (3-12 meses):** transformação

Para cada recomendação: acção concreta, responsável sugerido, e métrica de sucesso.
Máximo 400 palavras.`,
    },
  ]
}
