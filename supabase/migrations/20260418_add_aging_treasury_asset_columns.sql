-- Add extended financial data columns to financial_data table
ALTER TABLE financial_data
  ADD COLUMN IF NOT EXISTS aging_data JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS treasury_data JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS asset_sale_data JSONB DEFAULT NULL;
