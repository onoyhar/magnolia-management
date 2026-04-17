# Database Refactoring - Split Tables

## 📋 Tujuan
Memisahkan `pembayaran_warga` table menjadi:
- **`data_warga`** - Master data warga (stabil, tidak berubah per tahun)
- **`pembayaran_ipl`** - Data pembayaran bulanan per tahun

## ✅ Step 1: Run SQL Migration

1. **Buka Supabase Dashboard** → SQL Editor
2. **Buat NEW QUERY**
3. **Copy SQL dari file**: `migration-split-tables.sql`
4. **Jalankan** (Run / Cmd+Enter)
5. **Tunggu sampai selesai**

## 📊 Expected Result

### Sebelum:
```
pembayaran_warga table:
├─ id, no, nama, blok, no_hp, property_type, tahun
├─ jan, feb, mar, ... des
├─ 200+ rows (berbeda per tahun)
└─ INEFFICIENT: data warga di-duplikasi per tahun
```

### Sesudah:
```
data_warga table (20 rows, master):
├─ id, no, nama, blok, property_type, no_hp
├─ created_at, updated_at
└─ UNIQUE per warga

pembayaran_ipl table (200+ rows, payments):
├─ id, warga_id (FK), tahun
├─ jan, feb, mar, ... des
├─ created_at, updated_at
└─ UNIQUE per warga per tahun
```

## 🔄 Step 2: Update Application Code

After SQL migration succeeds, update these files:

### `/app/lib/costUtils.js`
- No changes needed (calculate functions remain the same)

### `/app/data-warga/page.jsx`
- Change select from `pembayaran_warga` to `data_warga`
- Join dengan `pembayaran_ipl` untuk payment data

### `/app/pembayaran/page.jsx`
- Change select from `pembayaran_warga` to `pembayaran_ipl`
- Join dengan `data_warga` untuk master info (nama, blok)

### API Routes
- Update `/api/bulk-add-year` - insert ke `pembayaran_ipl`
- Update `/api/update-pembayaran` - update `pembayaran_ipl`
- No changes ke `/api/update-cost-settings` dan `/api/update-warga-cost-config`

## ⚠️ Important: Handle warga_cost_config FK

The `warga_cost_config` table currently has FK to `pembayaran_warga(id)`.

After migration, if you get FK error, run this:

```sql
ALTER TABLE warga_cost_config 
  DROP CONSTRAINT warga_cost_config_warga_id_fkey,
  ADD CONSTRAINT warga_cost_config_warga_id_fkey 
  FOREIGN KEY (warga_id) REFERENCES data_warga(id) ON DELETE CASCADE;
```

## 🗑️ Step 3: Cleanup (Optional)

After everything working, dapat hapus `pembayaran_warga`:

```sql
DROP TABLE IF EXISTS pembayaran_warga;
```

## 📝 Checklist

- [ ] Backup data (optional tapi recommended)
- [ ] Run migration SQL di Supabase
- [ ] Verify data di new tables (query data_warga dan pembayaran_ipl)
- [ ] Update `/app/data-warga/page.jsx`
- [ ] Update `/app/pembayaran/page.jsx`
- [ ] Update API routes
- [ ] Test aplikasi
- [ ] Optional: Drop pembayaran_warga table

## 🔍 Verify After Migration

```bash
# Query data_warga
curl -X POST "https://{SUPABASE_URL}/rest/v1/data_warga" \
  -H "Authorization: Bearer {ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"select": "*"}'

# Query pembayaran_ipl
curl -X POST "https://{SUPABASE_URL}/rest/v1/pembayaran_ipl" \
  -H "Authorization: Bearer {ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"select": "*"}'
```

## Questions?

Hubungi developer jika ada FK errors atau data tidak ter-copy dengan baik.
