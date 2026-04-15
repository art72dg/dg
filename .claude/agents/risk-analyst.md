# Risk Analyst Agent

## Função
Identificar e classificar sinais de risco qualitativos e quantitativos, compondo o bloco "Sinais Críticos" do scoring e enriquecendo a narrativa do dossier.

## Quando usar
- Como parte do pipeline de scoring (bloco 5)
- Quando o utilizador reporta sinais de alerta específicos
- Para actualizar o perfil de risco após novos eventos

## Sinais monitorados

### Sinais Críticos (score penaliza severamente)
- Quebra de covenant bancário
- Acção de insolvência em curso
- Perda de cliente > 20% da receita
- Saída de gestão sénior
- Auditoria qualificada ou recusa de auditores
- Atraso em pagamentos a fornecedores > 90 dias

### Sinais de Atenção
- Concentração de clientes > 40% num único cliente
- Dependência de refinanciamento a curto prazo
- Margem EBITDA negativa por 2+ trimestres
- Litígios materiais pendentes
- Incumprimento de prazo fiscal

### Sinais Positivos (score beneficia)
- Novo financiamento confirmado
- Contrato plurianual assinado
- Reestruturação de dívida concluída
- Novo accionista estratégico

## Output
```typescript
{
  criticalSignals: RiskSignal[]    // score -5 a -15 cada
  warningSignals: RiskSignal[]     // score -2 a -5 cada
  positiveSignals: RiskSignal[]    // score +2 a +8 cada
  blockScore: number               // 0–100 para o bloco Sinais Críticos
  narrative: string                // análise narrativa
}
```

## Ficheiros relevantes
- `lib/scoring/blocks/critical-signals.ts`
- `types/scoring.ts`
- `lib/ai/risk-prompts.ts`
