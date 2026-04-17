# Database Setup Instructions

## ⚠️ REQUIRED: Run SQL in Supabase Dashboard

Kamu perlu jalankan SQL schema setup untuk membuat columns dan tables yang missing.

### Langkah-langkah:

1. **Buka Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select project Magnolia Iuran

2. **Buka SQL Editor**
   - Click "SQL Editor" di sidebar kiri
   - Click "+ New Query"

3. **Copy SQL dari file ini:**
   - File: `/Users/mekari/personal-saved/magnolia/setup-schema.sql`
   - Copy semua isi file

4. **Paste ke SQL Editor di Supabase**
   - Paste di editor
   - Click "Run" button (atau Cmd+Enter)

5. **Tunggu sampai selesai**
   - Harus muncul: "Successfully executed"

6. **Refresh aplikasi**
   - Browser: Refresh page (Cmd+R)
   - Terminal: Restart dev server jika perlu

### SQL yang akan dijalankan:

```sql
-- 1. Tambah property_type column
ALTER TABLE pembayaran_warga 
ADD COLUMN IF NOT EXISTS property_type VARCHAR(50) DEFAULT 'rumah';

-- 2. Buat ipl_settings table
CREATE TABLE IF NOT EXISTS ipl_settings (
  id BIGSERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  amount BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Buat warga_cost_config table
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

-- 4. Insert default global settings
INSERT INTO ipl_settings (setting_key, amount) VALUES
  ('ipl_rumah', 100000),
  ('sampah_rumah', 30000),
  ('ipl_ruko', 120000),
  ('sampah_ruko', 50000)
ON CONFLICT (setting_key) DO NOTHING;

-- 5. Enable RLS
ALTER TABLE ipl_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anyone to read ipl_settings" ON ipl_settings
  FOR SELECT USING (true);

ALTER TABLE warga_cost_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anyone to read warga_cost_config" ON warga_cost_config
  FOR SELECT USING (true);
```

### Setelah SQL selesai dijalankan:

1. Buka `http://localhost:3000/data-warga`
2. Cari Prasindo
3. Click "💰 Biaya" button
4. Set biaya yang sesuai (Rumah atau Ruko)
5. Save
6. Buka `http://localhost:3000/pembayaran`
7. Refresh button 🔄
8. Total Tagihan sekarang harus muncul dengan benar!

---

**Kalau masih error**, re-run query-prasindo.js untuk check status:
```bash
node query-prasindo.js
```
