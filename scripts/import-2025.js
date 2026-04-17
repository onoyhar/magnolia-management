const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');

const filePath = path.join(process.cwd(), 'data-2025');
const raw = fs.readFileSync(filePath, 'utf8');

const cleanText = (value) =>
  String(value || '')
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    .trim();

const normalizeAmount = (value) => {
  const text = cleanText(value).toUpperCase();
  if (!text || text === 'N/A') return 'N/A';

  const digits = text.replace(/[^0-9]/g, '');
  if (!digits) return 'N/A';

  return String(Number(digits));
};

const lines = raw
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const rows = lines.map((line, index) => {
  const cols = line.split(/\t+/).map(cleanText);
  const monthCols = cols.slice(5, 13);

  return {
    no: index + 1,
    nama: cols[0] || `Warga ${index + 1}`,
    blok: cols[3] || '-',
    no_hp: (cols[4] || '').replace(/[^0-9]/g, ''),
    tahun: 2025,
    jan: normalizeAmount(monthCols[0]),
    feb: normalizeAmount(monthCols[1]),
    mar: normalizeAmount(monthCols[2]),
    apr: normalizeAmount(monthCols[3]),
    mei: normalizeAmount(monthCols[4]),
    jun: normalizeAmount(monthCols[5]),
    jul: normalizeAmount(monthCols[6]),
    agt: normalizeAmount(monthCols[7]),
    sep: 'N/A',
    okt: 'N/A',
    nov: 'N/A',
    des: 'N/A',
  };
});

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const key = serviceRoleKey || anonKey;

if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY belum terisi.');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('Import butuh SUPABASE_SERVICE_ROLE_KEY karena insert anon key diblokir oleh RLS.');
  process.exit(1);
}

const supabase = createClient(url, key);

(async () => {
  const { count: existingCount, error: existingError } = await supabase
    .from('pembayaran_warga')
    .select('*', { count: 'exact', head: true })
    .eq('tahun', 2025);

  if (existingError) {
    console.error('Gagal cek data existing:', existingError.message);
    process.exit(1);
  }

  if ((existingCount ?? 0) > 0) {
    console.error(`Import dibatalkan: data tahun 2025 sudah ada (${existingCount} baris).`);
    process.exit(1);
  }

  const { error: insertError } = await supabase.from('pembayaran_warga').insert(rows);
  if (insertError) {
    console.error('Gagal insert:', insertError.message);
    process.exit(1);
  }

  const { count: finalCount, error: finalError } = await supabase
    .from('pembayaran_warga')
    .select('*', { count: 'exact', head: true })
    .eq('tahun', 2025);

  if (finalError) {
    console.error('Gagal validasi akhir:', finalError.message);
    process.exit(1);
  }

  console.log(`Import sukses: ${rows.length} baris diproses.`);
  console.log(`Data tahun 2025 di DB saat ini: ${finalCount}.`);
})();
