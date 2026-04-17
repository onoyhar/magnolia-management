-- ========================================
-- SETUP DATABASE SCHEMA FOR IPL COST SYSTEM
-- ========================================
-- Run this in Supabase Dashboard → SQL Editor
-- ========================================

-- 1. Add property_type column to pembayaran_warga
ALTER TABLE pembayaran_warga 
ADD COLUMN IF NOT EXISTS property_type VARCHAR(50) DEFAULT 'rumah';

-- 2. Create ipl_settings table
CREATE TABLE IF NOT EXISTS ipl_settings (
  id BIGSERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  amount BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create warga_cost_config table
CREATE TABLE IF NOT EXISTS warga_cost_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warga_id UUID NOT NULL REFERENCES pembayaran_warga(id) ON DELETE CASCADE,
  tahun INT NOT NULL,
  start_month INT NOT NULL,
  has_ipl BOOLEAN NOT NULL DEFAULT true,
  has_sampah BOOLEAN NOT NULL DEFAULT true,
  property_type VARCHAR(50) NOT NULL DEFAULT 'rumah',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(warga_id, tahun, start_month)
);

-- 4. Insert default global settings (if not already exists)
INSERT INTO ipl_settings (setting_key, amount) VALUES
  ('ipl_rumah', 100000),
  ('sampah_rumah', 30000),
  ('ipl_ruko', 120000),
  ('sampah_ruko', 50000)
ON CONFLICT (setting_key) DO NOTHING;

-- 5. Enable RLS on ipl_settings
ALTER TABLE ipl_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anyone to read ipl_settings" ON ipl_settings;
CREATE POLICY "Allow anyone to read ipl_settings" ON ipl_settings
  FOR SELECT USING (true);

-- 6. Enable RLS on warga_cost_config
ALTER TABLE warga_cost_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anyone to read warga_cost_config" ON warga_cost_config;
CREATE POLICY "Allow anyone to read warga_cost_config" ON warga_cost_config
  FOR SELECT USING (true);

-- DONE! Now refresh the page to reload database schema cache.
