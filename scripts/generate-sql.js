const fs = require('fs');
const raw = fs.readFileSync('data-2025', 'utf8');

const cleanText = (v) =>
  String(v || '')
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    .trim();

const normalize = (v) => {
  const t = cleanText(v).toUpperCase();
  if (!t || t === 'N/A') return 'N/A';
  const d = t.replace(/[^0-9]/g, '');
  return d ? String(Number(d)) : 'N/A';
};

const escape = (s) => (s || '').replace(/'/g, "''");

const lines = raw
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean);

const rows = lines.map((line, i) => {
  const cols = line.split(/\t+/).map(cleanText);
  const m = cols.slice(5, 13);

  return {
    no: i + 1,
    nama: escape(cols[0] || `Warga ${i + 1}`),
    blok: escape(cols[3] || '-'),
    no_hp: (cols[4] || '').replace(/[^0-9]/g, ''),
    jan: normalize(m[0]),
    feb: normalize(m[1]),
    mar: normalize(m[2]),
    apr: normalize(m[3]),
    mei: normalize(m[4]),
    jun: normalize(m[5]),
    jul: normalize(m[6]),
    agt: normalize(m[7]),
  };
});

const sql =
  'INSERT INTO pembayaran_warga (no, nama, blok, no_hp, tahun, jan, feb, mar, apr, mei, jun, jul, agt, sep, okt, nov, des) VALUES ' +
  rows
    .map(
      (r) =>
        `(${r.no}, '${r.nama}', '${r.blok}', '${r.no_hp}', 2025, '${r.jan}', '${r.feb}', '${r.mar}', '${r.apr}', '${r.mei}', '${r.jun}', '${r.jul}', '${r.agt}', 'N/A', 'N/A', 'N/A', 'N/A')`
    )
    .join(',\n  ') +
  ';';

console.log(sql);
