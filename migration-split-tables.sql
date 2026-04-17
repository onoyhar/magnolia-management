-- ========================================
-- MIGRATION: Separate data_warga and pembayaran_ipl
-- ========================================
-- Run this in Supabase Dashboard → SQL Editor
-- ========================================

-- 1. Create data_warga table (master data warga)
CREATE TABLE IF NOT EXISTS data_warga (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  no BIGINT NOT NULL UNIQUE,
  nama VARCHAR(255) NOT NULL,
  blok VARCHAR(50) NOT NULL,
  property_type VARCHAR(50) DEFAULT 'rumah',
  no_hp VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(nama, blok)
);

-- 2. Create pembayaran_ipl table (payment data per warga per tahun)
CREATE TABLE IF NOT EXISTS pembayaran_ipl (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warga_id UUID NOT NULL REFERENCES data_warga(id) ON DELETE CASCADE,
  tahun INT NOT NULL,
  jan VARCHAR(50) DEFAULT 'N/A',
  feb VARCHAR(50) DEFAULT 'N/A',
  mar VARCHAR(50) DEFAULT 'N/A',
  apr VARCHAR(50) DEFAULT 'N/A',
  mei VARCHAR(50) DEFAULT 'N/A',
  jun VARCHAR(50) DEFAULT 'N/A',
  jul VARCHAR(50) DEFAULT 'N/A',
  agt VARCHAR(50) DEFAULT 'N/A',
  sep VARCHAR(50) DEFAULT 'N/A',
  okt VARCHAR(50) DEFAULT 'N/A',
  nov VARCHAR(50) DEFAULT 'N/A',
  des VARCHAR(50) DEFAULT 'N/A',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(warga_id, tahun)
);

-- 3. Enable RLS
ALTER TABLE data_warga ENABLE ROW LEVEL SECURITY;
ALTER TABLE pembayaran_ipl ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
DROP POLICY IF EXISTS "Allow anyone to read data_warga" ON data_warga;
CREATE POLICY "Allow anyone to read data_warga" ON data_warga
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anyone to read pembayaran_ipl" ON pembayaran_ipl;
CREATE POLICY "Allow anyone to read pembayaran_ipl" ON pembayaran_ipl
  FOR SELECT USING (true);

-- 5. MIGRATION: Copy data dari pembayaran_warga ke data_warga dan pembayaran_ipl
-- First, get distinct warga masters from pembayaran_warga (DISTINCT ON keeps first row per nama+blok)
INSERT INTO data_warga (id, no, nama, blok, property_type, no_hp)
SELECT DISTINCT ON (nama, blok)
  id,
  no,
  nama,
  blok,
  COALESCE(property_type, 'rumah') as property_type,
  no_hp
FROM pembayaran_warga
ORDER BY nama, blok, id;

-- Then, copy payment data from pembayaran_warga to pembayaran_ipl
-- Join by nama+blok to get the correct warga_id from data_warga
INSERT INTO pembayaran_ipl (warga_id, tahun, jan, feb, mar, apr, mei, jun, jul, agt, sep, okt, nov, des)
SELECT
  dw.id,
  pw.tahun,
  pw.jan, pw.feb, pw.mar, pw.apr, pw.mei, pw.jun,
  pw.jul, pw.agt, pw.sep, pw.okt, pw.nov, pw.des
FROM pembayaran_warga pw
JOIN data_warga dw ON pw.nama = dw.nama AND pw.blok = dw.blok
ON CONFLICT (warga_id, tahun) DO NOTHING;

-- 6. Done! pembayaran_warga dapat di-drop atau disable
-- DROP TABLE IF EXISTS pembayaran_warga;

-- ========================================
-- IMPORTANT: Update warga_cost_config FK
-- ========================================
-- jika ada error FK, jalankan yang ini:
-- ALTER TABLE warga_cost_config 
--   DROP CONSTRAINT warga_cost_config_warga_id_fkey,
--   ADD CONSTRAINT warga_cost_config_warga_id_fkey 
--   FOREIGN KEY (warga_id) REFERENCES data_warga(id) ON DELETE CASCADE;
