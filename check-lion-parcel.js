#!/usr/bin/env node
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  try {
    console.log('\n========== CHECK: Nor Prasetya (Lion Parcel) ==========\n');

    // 1. Get warga data
    console.log('1️⃣  FETCH: data_warga WHERE nama LIKE "Lion Parcel"');
    const { data: wargaData, error: wargaErr } = await supabase
      .from('data_warga')
      .select('*')
      .like('nama', '%Lion Parcel%');

    if (wargaErr) throw wargaErr;
    
    if (!wargaData || wargaData.length === 0) {
      console.log('❌ Warga Lion Parcel tidak ditemukan!');
      return;
    }

    console.log(`✅ Found ${wargaData.length} record(s):`);
    wargaData.forEach(w => {
      console.log(`   ID: ${w.id}`);
      console.log(`   Nama: ${w.nama}`);
      console.log(`   Blok: ${w.blok}`);
      console.log(`   No: ${w.no}`);
      console.log(`   Property Type: ${w.property_type}`);
      console.log(`   No HP: ${w.no_hp}`);
      console.log('');
    });

    // 2. Check pembayaran_ipl for each warga
    for (const warga of wargaData) {
      console.log(`2️⃣  FETCH: pembayaran_ipl untuk warga ID ${warga.id}`);
      const { data: payments, error: payErr } = await supabase
        .from('pembayaran_ipl')
        .select('*')
        .eq('warga_id', warga.id)
        .order('tahun', { ascending: true });

      if (payErr) throw payErr;

      if (payments && payments.length > 0) {
        console.log(`   Found ${payments.length} tahun(s):`);
        payments.forEach(p => {
          const unpaidMonths = [];
          const months = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agt', 'sep', 'okt', 'nov', 'des'];
          months.forEach(m => {
            if (String(p[m]) === '0') {
              unpaidMonths.push(m.toUpperCase());
            }
          });
          
          console.log(`   - Tahun ${p.tahun}:`);
          console.log(`     Unpaid months: ${unpaidMonths.length > 0 ? unpaidMonths.join(', ') : 'Semua lunas'}`);
          console.log(`     Data: ${JSON.stringify({jan: p.jan, feb: p.feb, mar: p.mar, apr: p.apr, mei: p.mei, jun: p.jun, jul: p.jul, agt: p.agt, sep: p.sep, okt: p.okt, nov: p.nov, des: p.des})}`);
        });
      } else {
        console.log('   ⚠️  Tidak ada data pembayaran');
      }
      console.log('');
    }

    // 3. Check cost configs
    console.log('3️⃣  FETCH: warga_cost_config');
    const allWargaIds = wargaData.map(w => w.id);
    const { data: configs, error: configErr } = await supabase
      .from('warga_cost_config')
      .select('*')
      .in('warga_id', allWargaIds)
      .order('tahun, start_month');

    if (configErr) throw configErr;

    if (configs && configs.length > 0) {
      console.log(`   Found ${configs.length} config(s):`);
      configs.forEach(c => {
        console.log(`   - Tahun ${c.tahun}, Start Month ${c.start_month}:`);
        console.log(`     IPL: ${c.has_ipl}, Sampah: ${c.has_sampah}, Type: ${c.property_type}`);
      });
    } else {
      console.log('   ⚠️  Tidak ada cost configs');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

main();
