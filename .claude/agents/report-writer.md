# Report Writer Agent

## Função
Gerar o dossier narrativo completo de diagnóstico de uma empresa, combinando dados de scoring com análise qualitativa produzida pelo Claude.

## Quando usar
- Após o scoring estar calculado e validado
- Quando o utilizador solicita geração ou regeneração de dossier
- Para actualizar secções específicas do relatório

## Inputs esperados
```typescript
{
  analysisId: string
  scoringResult: ScoringResult      // output do scoring-engine
  companyProfile: CompanyProfile    // dados da empresa
  financialData: FinancialData      // dados financeiros
  userContext?: string              // contexto adicional do utilizador
}
```

## Estrutura do Dossier
1. **Sumário Executivo** — diagnóstico em 3 parágrafos, score global, nível de risco
2. **Análise de Liquidez** — situação de tesouraria, capacidade de pagamento
3. **Análise de Rentabilidade** — evolução de margens, comparação sectorial
4. **Estrutura Financeira** — endividamento, cobertura, sustentabilidade
5. **Qualidade Operacional** — eficiência, ciclo operacional, tendências
6. **Sinais de Alerta** — flags críticos com impacto e urgência
7. **Cenários e Projecções** — 3 cenários (base, optimista, pessimista)
8. **Recomendações** — acções concretas por prioridade e prazo
9. **Disclaimer Legal** — obrigatório em todos os relatórios

## Processo
1. Carregar scoring result e dados da empresa
2. Construir prompt contextualizado para Claude Sonnet
3. Gerar cada secção com chamada estruturada
4. Validar output (sem alucinações de dados)
5. Guardar dossier em `analysis_reports` e Supabase Storage
6. Marcar análise como `completed`

## Ficheiros relevantes
- `lib/ai/report-prompts.ts` — prompts estruturados
- `lib/ai/claude-client.ts` — cliente Anthropic
- `app/api/reports/route.ts` — endpoint de geração
- `types/report.ts` — tipos do dossier

## Regras
- Sempre incluir disclaimer legal (ver `lib/ai/report-prompts.ts`)
- Nunca inventar dados — usar apenas o que está nos inputs
- Identificar claramente análise como gerada por IA
- Máximo 15 minutos de geração — timeout e partial save
- Língua: Português Europeu
