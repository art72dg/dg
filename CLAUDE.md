# Turnaround AI — CLAUDE.md

## Produto
Plataforma de diagnóstico premium para empresas em dificuldade. Orientada a decisões de investimento, reestruturação, financiamento e aquisição. Produz dossiers de análise com scoring estruturado e recomendações estratégicas baseadas em IA.

## Stack Técnica
- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes + Server Actions
- **DB/Auth/Storage:** Supabase (PostgreSQL + Row Level Security + Storage)
- **IA:** Anthropic Claude (claude-sonnet-4-20250514 para análise, claude-haiku-4-5-20251001 para tarefas auxiliares)
- **Validação:** Zod
- **Forms:** React Hook Form + Zod resolvers
- **Icons:** Lucide React

## Estrutura de Pastas
```
turnaround-ai/
├── app/
│   ├── (auth)/login/         # Autenticação
│   ├── (auth)/register/
│   ├── dashboard/            # Dashboard principal
│   ├── analysis/[id]/        # Dossier completo
│   └── api/
│       ├── analysis/         # CRUD análises
│       ├── scoring/          # Motor de scoring
│       └── reports/          # Geração de relatórios
├── components/
│   ├── ui/                   # Componentes base
│   ├── analysis/             # Componentes de análise
│   ├── scoring/              # Scoring e risk
│   └── charts/               # Visualizações
├── lib/
│   ├── supabase/             # Cliente Supabase (server + client)
│   ├── scoring/              # Motor de scoring (5 blocos)
│   ├── ai/                   # Prompts e chamadas Claude
│   └── utils/                # Utilitários gerais
├── types/                    # TypeScript types centrais
├── .claude/
│   ├── agents/               # Agentes especializados
│   └── skills/               # Skills reutilizáveis
└── supabase/migrations/      # Migrações SQL
```

## Modelo de Scoring
5 blocos de análise:
1. **Liquidez e Tesouraria** (25%) — Current ratio, Quick ratio, FCF, burn rate
2. **Rentabilidade e Margens** (20%) — EBITDA, margem líquida, ROE, ROA
3. **Estrutura Financeira** (20%) — D/E ratio, cobertura de juros, alavancagem
4. **Qualidade Operacional** (20%) — Rotação stocks, PMR, PMP, eficiência
5. **Sinais Críticos** (15%) — Alertas qualitativos (litígios, perda de clientes, etc.)

**Escala 0–100 → 4 níveis:**
- 75–100: Verde (Risco Baixo)
- 50–74: Amarelo (Atenção)
- 25–49: Laranja (Risco Elevado)
- 0–24: Vermelho (Crítico)

## Regras de Negócio Críticas
- RLS activado em todas as tabelas — nunca bypass com service_role em contexto de utilizador
- Score não é recomendação de investimento — sempre incluir disclaimer legal
- Análise gerada por IA deve ser claramente identificada como tal
- Dados de empresas são confidenciais — isolamento por user_id e organisation_id
- Auditoria completa em audit_log

## Convenções de Código
- Componentes: PascalCase, máx. 200 linhas
- Tipos: PascalCase (e.g. AnalysisResult, ScoringBlock)
- API routes: kebab-case
- Sempre usar zod para validar inputs de API
- Sem `any` — TypeScript estrito
- Tratamento de erros explícito

## Agentes (.claude/agents/)
- `scoring-engine.md` — Motor de cálculo de scores
- `report-writer.md` — Geração de dossiers narrativos
- `data-validator.md` — Validação de dados financeiros
- `risk-analyst.md` — Análise de risco e sinais críticos

## Skills (.claude/skills/)
- `generate-migration.md` — Migrações Supabase
- `create-api-route.md` — API route com validação Zod
- `create-component.md` — Componente React tipado
