#!/usr/bin/env node
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

async function main() {
  try {
    console.log('\n========== FIX PRASINDO DATA ==========\n');

    // Step 1: Check all records dengan property_type NULL
    console.log('1️⃣  Checking for records with NULL property_type...');
    const { data: nullRecords, error: err1 } = await supabase
      .from('pembayaran_warga')
      .select('id, no, nama, blok, tahun, property_type')
      .is('property_type', null);

    if (err1) throw err1;
    
    if (nullRecords && nullRecords.length > 0) {
      console.log(`⚠️  Found ${nullRecords.length} records dengan property_type NULL:`);
      console.log('');
      nullRecords.forEach((r, idx) => {
        console.log(`   [${idx + 1}] ${r.nama} (${r.blok}) - Tahun ${r.tahun}`);
      });
      console.log('');
    } else {
      console.log('✅ Semua records sudah punya property_type!');
    }

    // Step 2: Focus on Prasindo
    console.log('2️⃣  Prasindo data:');
    const { data: prasindo } = await supabase
      .from('pembayaran_warga')
      .select('*')
      .like('nama', '%Prasindo%')
      .eq('tahun', 2026)
      .single();

    console.log(`   Nama: ${prasindo.nama}`);
    console.log(`   Blok: ${prasindo.blok}`);
    console.log(`   Property Type: ${prasindo.property_type || 'NULL'}`);
    console.log(`   ID: ${prasindo.id}`);
    console.log('');

    // Step 3: Ask user to select property type
    console.log('3️⃣  Set property_type for Prasindo:');
    console.log('   [1] Rumah (Biaya: IPL 100k + Sampah 30k = 130k/bulan)');
    console.log('   [2] Ruko (Biaya: IPL 120k + Sampah 50k = 170k/bulan)');
    console.log('');

    const choice = await ask('   Pilih [1/2]: ');
    const propertyType = choice === '2' ? 'ruko' : 'rumah';
    const expectedCost = propertyType === 'ruko' ? 170000 : 130000;

    console.log(`\n   Selected: ${propertyType.toUpperCase()} (Expected cost: Rp${expectedCost.toLocaleString('id-ID')}/bulan)`);

    // Step 4: Update property_type
    console.log('\n4️⃣  Updating property_type in database...');
    const { error: updateErr } = await supabase
      .from('pembayaran_warga')
      .update({ property_type: propertyType })
      .eq('id', prasindo.id);

    if (updateErr) throw updateErr;
    console.log('✅ property_type updated successfully!');

    // Step 5: Create cost config
    console.log('\n5️⃣  Creating cost config for all 12 months...');
    const configsToInsert = [{
      warga_id: prasindo.id,
      tahun: 2026,
      start_month: 1,
      has_ipl: true,
      has_sampah: true,
      property_type: propertyType
    }];

    const { data: insertedConfigs, error: insertErr } = await supabase
      .from('warga_cost_config')
      .insert(configsToInsert)
      .select();

    if (insertErr) throw insertErr;
    console.log('✅ Cost config created!');
    console.log(`   Config: IPL + Sampah, Property Type: ${propertyType}`);

    // Step 6: Recheck calculation
    console.log('\n6️⃣  Recalculating total...');
    const { data: updated, error: err2 } = await supabase
      .from('pembayaran_warga')
      .select('*')
      .eq('id', prasindo.id)
      .single();

    if (err2) throw err2;

    let total = 0;
    const months = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agt', 'sep', 'okt', 'nov', 'des'];
    months.forEach(month => {
      if (String(updated[month]) === '0') {
        total += expectedCost;
      }
    });

    console.log(`   Total Rp${total.toLocaleString('id-ID')}`);

    console.log('\n========== DONE! ==========');
    console.log('✅ Silakan refresh pembayaran page untuk lihat perubahan.');
    console.log('');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
