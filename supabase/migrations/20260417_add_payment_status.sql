-- Adicionar campo payment_status à tabela analyses
-- free = score gratuito disponível
-- paid = dossier completo pago
ALTER TABLE analyses
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'free'
    CHECK (payment_status IN ('free', 'paid'));

-- Adicionar campo trend à tabela scoring_results (JSONB para YoYTrend)
ALTER TABLE scoring_results
  ADD COLUMN IF NOT EXISTS trend JSONB DEFAULT NULL;
