#!/usr/bin/env node
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  try {
    console.log('\n========== DETAILED COST CALCULATION ==========\n');

    // Get Prasindo
    const { data: prasindo } = await supabase
      .from('pembayaran_warga')
      .select('*')
      .like('nama', '%Prasindo%')
      .eq('tahun', 2026)
      .single();

    console.log(`📍 Nama: ${prasindo.nama}`);
    console.log(`📍 Tipe: ${prasindo.property_type}`);
    console.log('');

    // Get cost config
    const { data: configs } = await supabase
      .from('warga_cost_config')
      .select('*')
      .eq('warga_id', prasindo.id)
      .eq('tahun', 2026);

    console.log('💰 Cost Config:');
    if (configs && configs.length > 0) {
      const cfg = configs[0];
      console.log(`   Start Month: ${cfg.start_month} (Jan)`);
      console.log(`   Has IPL: ${cfg.has_ipl}`);
      console.log(`   Has Sampah: ${cfg.has_sampah}`);
      console.log(`   Property Type: ${cfg.property_type}`);
    }
    console.log('');

    // Get global settings
    const { data: settings } = await supabase
      .from('ipl_settings')
      .select('*')
      .order('setting_key');

    const costs = {};
    settings.forEach(s => {
      costs[s.setting_key] = s.amount;
    });

    console.log('⚙️  Global Cost Settings:');
    console.log(`   ipl_rumah: Rp${costs.ipl_rumah?.toLocaleString('id-ID')}`);
    console.log(`   sampah_rumah: Rp${costs.sampah_rumah?.toLocaleString('id-ID')}`);
    console.log(`   ipl_ruko: Rp${costs.ipl_ruko?.toLocaleString('id-ID')}`);
    console.log(`   sampah_ruko: Rp${costs.sampah_ruko?.toLocaleString('id-ID')}`);
    console.log('');

    // Calculate
    console.log('📊 Monthly Calculation:');
    const cfg = configs[0];
    let monthlyCost = 0;
    let breakdown = [];

    if (cfg.has_ipl) {
      const key = cfg.property_type === 'ruko' ? 'ipl_ruko' : 'ipl_rumah';
      const amount = costs[key];
      monthlyCost += amount;
      breakdown.push(`IPL (${cfg.property_type}): Rp${amount?.toLocaleString('id-ID')}`);
    }

    if (cfg.has_sampah) {
      const key = cfg.property_type === 'ruko' ? 'sampah_ruko' : 'sampah_rumah';
      const amount = costs[key];
      monthlyCost += amount;
      breakdown.push(`Sampah (${cfg.property_type}): Rp${amount?.toLocaleString('id-ID')}`);
    }

    breakdown.forEach(line => console.log(`   + ${line}`));
    console.log(`   ───────────────────`);
    console.log(`   = Rp${monthlyCost.toLocaleString('id-ID')} / bulan`);
    console.log('');

    // Check unpaid months
    const months = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agt', 'sep', 'okt', 'nov', 'des'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

    console.log('📅 Pembayaran Status:');
    let totalTagihan = 0;
    let unpaidCount = 0;

    months.forEach((m, idx) => {
      const status = prasindo[m];
      if (String(status) === '0') {
        console.log(`   ${monthNames[idx]}: ❌ UNPAID (Status: 0) → +Rp${monthlyCost.toLocaleString('id-ID')}`);
        totalTagihan += monthlyCost;
        unpaidCount++;
      } else {
        console.log(`   ${monthNames[idx]}: ✅ ${status}`);
      }
    });

    console.log('');
    console.log('💵 TOTAL:');
    console.log(`   ${unpaidCount} bulan × Rp${monthlyCost.toLocaleString('id-ID')} = Rp${totalTagihan.toLocaleString('id-ID')}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

main();
