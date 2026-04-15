# Skill: Generate Supabase Migration

## Usage
Gerar uma migração SQL para Supabase com boas práticas: RLS, índices, triggers de updated_at, e rollback.

## Template

```sql
-- Migration: [DESCRIPTION]
-- Created: [DATE]

-- ============================================================
-- UP
-- ============================================================

CREATE TABLE IF NOT EXISTS public.[table_name] (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- [columns]
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER [table_name]_updated_at
  BEFORE UPDATE ON public.[table_name]
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.[table_name] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "[table_name]_select_own"
  ON public.[table_name] FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "[table_name]_insert_own"
  ON public.[table_name] FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "[table_name]_update_own"
  ON public.[table_name] FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "[table_name]_delete_own"
  ON public.[table_name] FOR DELETE
  USING (auth.uid() = user_id);

-- Índices
CREATE INDEX [table_name]_user_id_idx ON public.[table_name](user_id);
CREATE INDEX [table_name]_created_at_idx ON public.[table_name](created_at DESC);

-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- DROP TABLE IF EXISTS public.[table_name];
```

## Regras
- Sempre incluir RLS
- Sempre incluir trigger updated_at
- Sempre incluir índice em user_id e created_at
- Comentar sempre o rollback no final
- Usar gen_random_uuid() para IDs
- Prefixo `public.` em todas as tabelas
