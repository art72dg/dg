-- Migration: 001 — Schema inicial Turnaround AI
-- Created: 2026-04-15

-- ============================================================
-- Função utilitária: updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- Tabela: companies
-- ============================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  nif                   TEXT,
  sector                TEXT NOT NULL DEFAULT 'other',
  size                  TEXT NOT NULL DEFAULT 'small',
  country               TEXT NOT NULL DEFAULT 'PT',
  founded_year          INTEGER,
  number_of_employees   INTEGER,
  website               TEXT,
  description           TEXT,
  -- Dados de perfil enriquecido
  main_products         TEXT[],
  competitive_position  TEXT,
  ownership_structure   TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies_select_own" ON public.companies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "companies_insert_own" ON public.companies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "companies_update_own" ON public.companies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "companies_delete_own" ON public.companies FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX companies_user_id_idx ON public.companies(user_id);
CREATE INDEX companies_created_at_idx ON public.companies(created_at DESC);


-- ============================================================
-- Tabela: analyses
-- ============================================================
CREATE TABLE IF NOT EXISTS public.analyses (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  period          TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','scoring','generating','completed','error')),
  error_message   TEXT,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER analyses_updated_at
  BEFORE UPDATE ON public.analyses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analyses_select_own" ON public.analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "analyses_insert_own" ON public.analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "analyses_update_own" ON public.analyses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "analyses_delete_own" ON public.analyses FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX analyses_user_id_idx ON public.analyses(user_id);
CREATE INDEX analyses_company_id_idx ON public.analyses(company_id);
CREATE INDEX analyses_status_idx ON public.analyses(status);
CREATE INDEX analyses_created_at_idx ON public.analyses(created_at DESC);


-- ============================================================
-- Tabela: financial_data
-- ============================================================
CREATE TABLE IF NOT EXISTS public.financial_data (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id     UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period          TEXT NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'EUR',
  unit            TEXT NOT NULL DEFAULT 'units'
                  CHECK (unit IN ('units','thousands','millions')),
  -- Balanço
  total_assets          NUMERIC,
  current_assets        NUMERIC,
  cash                  NUMERIC,
  accounts_receivable   NUMERIC,
  inventory             NUMERIC,
  non_current_assets    NUMERIC,
  total_liabilities     NUMERIC,
  current_liabilities   NUMERIC,
  short_term_debt       NUMERIC,
  accounts_payable      NUMERIC,
  non_current_liabilities NUMERIC,
  long_term_debt        NUMERIC,
  equity                NUMERIC,
  retained_earnings     NUMERIC,
  -- DRE
  revenue               NUMERIC,
  gross_profit          NUMERIC,
  ebitda                NUMERIC,
  ebit                  NUMERIC,
  interest_expense      NUMERIC,
  net_income            NUMERIC,
  depreciation          NUMERIC,
  -- Cash Flow
  operating_cash_flow   NUMERIC,
  capital_expenditure   NUMERIC,
  free_cash_flow        NUMERIC,
  -- Qualitative flags (JSONB)
  qualitative_data      JSONB,
  created_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER financial_data_updated_at
  BEFORE UPDATE ON public.financial_data
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.financial_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "financial_data_select_own" ON public.financial_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "financial_data_insert_own" ON public.financial_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "financial_data_update_own" ON public.financial_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "financial_data_delete_own" ON public.financial_data FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX financial_data_analysis_id_idx ON public.financial_data(analysis_id);
CREATE INDEX financial_data_user_id_idx ON public.financial_data(user_id);


-- ============================================================
-- Tabela: scoring_results
-- ============================================================
CREATE TABLE IF NOT EXISTS public.scoring_results (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id         UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score               NUMERIC(5,1) NOT NULL CHECK (score >= 0 AND score <= 100),
  risk_level          TEXT NOT NULL CHECK (risk_level IN ('green','yellow','orange','red')),
  blocks              JSONB NOT NULL,
  flags               JSONB NOT NULL DEFAULT '[]',
  data_completeness   NUMERIC(5,1),
  algorithm_version   TEXT NOT NULL DEFAULT '1.0.0',
  calculated_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.scoring_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scoring_select_own" ON public.scoring_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "scoring_insert_own" ON public.scoring_results FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX scoring_results_analysis_id_idx ON public.scoring_results(analysis_id);
CREATE INDEX scoring_results_user_id_idx ON public.scoring_results(user_id);
CREATE INDEX scoring_results_risk_level_idx ON public.scoring_results(risk_level);


-- ============================================================
-- Tabela: analysis_reports
-- ============================================================
CREATE TABLE IF NOT EXISTS public.analysis_reports (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id     UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sections        JSONB NOT NULL DEFAULT '[]',
  status          TEXT NOT NULL DEFAULT 'complete'
                  CHECK (status IN ('complete','partial','error')),
  model_version   TEXT,
  word_count      INTEGER,
  generated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.analysis_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_select_own" ON public.analysis_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reports_insert_own" ON public.analysis_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reports_update_own" ON public.analysis_reports FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX reports_analysis_id_idx ON public.analysis_reports(analysis_id);
CREATE INDEX reports_user_id_idx ON public.analysis_reports(user_id);


-- ============================================================
-- Tabela: audit_log
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  resource    TEXT NOT NULL,
  resource_id UUID,
  metadata    JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Utilizador só vê os seus próprios logs
CREATE POLICY "audit_log_select_own" ON public.audit_log FOR SELECT USING (auth.uid() = user_id);
-- Insert apenas por service role (via API server-side)
-- INSERT não permitido directamente pelo client

CREATE INDEX audit_log_user_id_idx ON public.audit_log(user_id);
CREATE INDEX audit_log_action_idx ON public.audit_log(action);
CREATE INDEX audit_log_created_at_idx ON public.audit_log(created_at DESC);


-- ============================================================
-- DOWN (rollback)
-- ============================================================
-- DROP TABLE IF EXISTS public.audit_log;
-- DROP TABLE IF EXISTS public.analysis_reports;
-- DROP TABLE IF EXISTS public.scoring_results;
-- DROP TABLE IF EXISTS public.financial_data;
-- DROP TABLE IF EXISTS public.analyses;
-- DROP TABLE IF EXISTS public.companies;
-- DROP FUNCTION IF EXISTS public.set_updated_at;
