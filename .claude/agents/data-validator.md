# Data Validator Agent

## Função
Validar, normalizar e enriquecer dados financeiros submetidos pelo utilizador antes de entrarem no motor de scoring.

## Quando usar
- Antes de qualquer cálculo de scoring
- Quando dados são importados (CSV, JSON, formulário)
- Para detectar inconsistências ou dados em falta

## Validações obrigatórias
1. **Completude** — campos mínimos obrigatórios presentes
2. **Coerência** — totais batem certo (Activo = Passivo + Capital Próprio)
3. **Plausibilidade** — valores dentro de intervalos realistas
4. **Temporalidade** — período claramente definido
5. **Moeda** — moeda identificada e consistente

## Campos mínimos obrigatórios
```typescript
// Balanço
{ totalAssets, totalLiabilities, equity, currentAssets, currentLiabilities }

// Demonstração de Resultados
{ revenue, ebitda, netIncome, interestExpense }

// Fluxos de Caixa (opcional mas recomendado)
{ operatingCashFlow, capitalExpenditure }
```

## Output de validação
```typescript
{
  isValid: boolean
  errors: ValidationError[]       // erros bloqueantes
  warnings: ValidationWarning[]   // alertas não bloqueantes
  normalizedData: FinancialData   // dados normalizados
  completenessScore: number       // 0–100% de completude
  missingFields: string[]
}
```

## Ficheiros relevantes
- `lib/scoring/validators.ts` — schemas Zod
- `lib/utils/financial-normalizer.ts` — normalização de moedas/unidades
- `types/financial.ts` — tipos de dados financeiros

## Regras
- Rejeitar dados com erros críticos de coerência
- Avisar mas não rejeitar por dados em falta (scoring parcial)
- Normalizar sempre para EUR
- Converter unidades: K, M, B → valor absoluto
