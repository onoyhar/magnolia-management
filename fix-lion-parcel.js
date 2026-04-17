#!/usr/bin/env node
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  try {
    console.log('\n========== FIX: Nor Prasetya (Lion Parcel) ==========\n');

    // 1. Get Lion Parcel data
    const { data: wargaData, error: wargaErr } = await supabase
      .from('data_warga')
      .select('*')
      .like('nama', '%Lion Parcel%')
      .single();

    if (wargaErr) throw wargaErr;
    if (!wargaData) {
      console.log('❌ Warga tidak ditemukan!');
      return;
    }

    console.log('📍 Found:');
    console.log(`   Nama: ${wargaData.nama}`);
    console.log(`   Current Property Type: ${wargaData.property_type}`);
    console.log('');

    // 2. Update property_type to 'ruko'
    console.log('✏️  Updating property_type to "ruko"...');
    const { error: updateErr } = await supabase
      .from('data_warga')
      .update({ property_type: 'ruko' })
      .eq('id', wargaData.id);

    if (updateErr) throw updateErr;
    console.log('✅ Property type updated to RUKO');
    console.log('');

    // 3. Verify cost config is correct
    console.log('3️⃣  Verifying cost config for 2026...');
    const { data: configs, error: configErr } = await supabase
      .from('warga_cost_config')
      .select('*')
      .eq('warga_id', wargaData.id)
      .eq('tahun', 2026);

    if (configErr) throw configErr;

    if (configs && configs.length > 0) {
      const cfg = configs[0];
      console.log('✅ Cost config exists:');
      console.log(`   Has IPL: ${cfg.has_ipl}`);
      console.log(`   Has Sampah: ${cfg.has_sampah}`);
      console.log(`   Property Type: ${cfg.property_type}`);
      console.log('');

      if (cfg.property_type !== 'ruko') {
        console.log('⚠️  Updating cost config property_type to "ruko"...');
        const { error: cfgErr } = await supabase
          .from('warga_cost_config')
          .update({ property_type: 'ruko' })
          .eq('id', cfg.id);

        if (cfgErr) throw cfgErr;
        console.log('✅ Cost config property_type updated');
      }
    }

    console.log('\n========== DONE! ==========');
    console.log('✅ Lion Parcel is now set as RUKO (IPL only, no sampah)');
    console.log('   Biaya per bulan: Rp120.000 (IPL Ruko)');
    console.log('');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

main();
