#!/usr/bin/env node
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  try {
    console.log('\n========== CREATE COST CONFIG FOR PRASINDO ==========\n');

    // Get Prasindo
    const { data: prasindo } = await supabase
      .from('pembayaran_warga')
      .select('*')
      .like('nama', '%Prasindo%')
      .eq('tahun', 2026)
      .single();

    if (!prasindo) {
      console.log('❌ Prasindo not found!');
      return;
    }

    console.log(`✅ Found: ${prasindo.nama} (${prasindo.blok})`);
    console.log(`   Property Type: ${prasindo.property_type}`);
    console.log(`   ID: ${prasindo.id}`);
    console.log('');

    // Create cost config
    console.log('Creating cost config...');
    const { data: configs, error: err } = await supabase
      .from('warga_cost_config')
      .insert([{
        warga_id: prasindo.id,
        tahun: 2026,
        start_month: 1,
        has_ipl: true,
        has_sampah: true,
        property_type: prasindo.property_type
      }])
      .select();

    if (err) throw err;

    console.log(`✅ Cost config created!`);
    console.log(`   Start Month: 1 (Januari)`);
    console.log(`   Has IPL: true`);
    console.log(`   Has Sampah: true`);
    console.log(`   Property Type: ${prasindo.property_type}`);
    console.log('');

    // Recalculate
    console.log('Recalculating total tagihan...');
    const costRumah = 100000 + 30000; // 130000
    const costRuko = 120000 + 50000;  // 170000
    const expectedCost = prasindo.property_type === 'ruko' ? costRuko : costRumah;

    let totalUnpaid = 0;
    const months = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agt', 'sep', 'okt', 'nov', 'des'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    
    console.log('   Unpaid months:');
    months.forEach((month, idx) => {
      const status = prasindo[month];
      if (String(status) === '0') {
        totalUnpaid++;
        console.log(`     - ${monthNames[idx]}: Status 0 → Rp${expectedCost.toLocaleString('id-ID')}`);
      }
    });

    const totalTagihan = totalUnpaid * expectedCost;
    console.log(`\n   📊 Total Tagihan: Rp${totalTagihan.toLocaleString('id-ID')}`);
    console.log(`      (${totalUnpaid} bulan × Rp${expectedCost.toLocaleString('id-ID')})`);

    console.log('\n✅ DONE!');
    console.log('   Silakan refresh pembayaran page untuk lihat perubahan.');
    console.log('');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

main();
