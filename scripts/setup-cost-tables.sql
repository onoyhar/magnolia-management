-- Create table untuk cost settings (base amounts)
CREATE TABLE IF NOT EXISTS ipl_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(50) UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default values
INSERT INTO ipl_settings (setting_key, amount, description) VALUES
  ('ipl_rumah', 100000, 'IPL Rumah'),
  ('sampah_rumah', 30000, 'Sampah Rumah'),
  ('ipl_ruko', 120000, 'IPL Ruko'),
  ('sampah_ruko', 50000, 'Sampah Ruko')
ON CONFLICT (setting_key) DO NOTHING;

-- Create table untuk cost schedule per warga
-- Tracks when IPL/Sampah status changes for each warga+tahun
CREATE TABLE IF NOT EXISTS warga_cost_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warga_id UUID NOT NULL REFERENCES pembayaran_warga(id) ON DELETE CASCADE,
  tahun INTEGER NOT NULL,
  start_month INTEGER NOT NULL,
  has_ipl BOOLEAN DEFAULT true,
  has_sampah BOOLEAN DEFAULT false,
  property_type VARCHAR(20) DEFAULT 'rumah',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(warga_id, tahun, start_month)
);

CREATE INDEX IF NOT EXISTS idx_warga_cost_config_warga_tahun ON warga_cost_config(warga_id, tahun);
