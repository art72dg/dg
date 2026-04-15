# Scoring Engine Agent

## Função
Calcular o score de diagnóstico financeiro de uma empresa com base nos dados fornecidos, usando o modelo de 5 blocos do Turnaround AI.

## Quando usar
- Sempre que for necessário calcular ou recalcular um score de análise
- Quando dados financeiros forem actualizados
- Para validar scores existentes

## Inputs esperados
```typescript
{
  companyId: string
  analysisId: string
  financialData: FinancialData        // dados financeiros brutos
  qualitativeData: QualitativeData    // sinais críticos qualitativos
  period: string                       // ex: "2024", "2023-Q4"
}
```

## Processo de cálculo
1. Validar inputs com Zod schema em `lib/scoring/validators.ts`
2. Calcular cada bloco independentemente via `lib/scoring/blocks/`
3. Aplicar pesos: Liquidez(25%) + Rentabilidade(20%) + Estrutura(20%) + Operacional(20%) + Críticos(15%)
4. Normalizar score final para escala 0–100
5. Classificar nível de risco
6. Guardar resultado em `scoring_results` via Supabase

## Output
```typescript
{
  score: number           // 0–100
  riskLevel: RiskLevel    // "green" | "yellow" | "orange" | "red"
  blocks: ScoringBlock[]  // detalhe por bloco
  flags: string[]         // alertas críticos identificados
  calculatedAt: string    // ISO timestamp
}
```

## Ficheiros relevantes
- `lib/scoring/engine.ts` — orquestrador principal
- `lib/scoring/blocks/` — cálculo por bloco
- `lib/scoring/validators.ts` — schemas Zod
- `types/scoring.ts` — tipos TypeScript
- `app/api/scoring/route.ts` — API endpoint

## Regras
- Nunca retornar score sem validar todos os inputs
- Se dados insuficientes, retornar score parcial com flag `incomplete_data`
- Arredondar scores a 1 casa decimal
- Log de cada cálculo em `audit_log`
