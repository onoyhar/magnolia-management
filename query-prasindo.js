#!/usr/bin/env node
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  try {
    console.log('\n========== QUERY PRASINDO DATA ==========\n');

    // 1. Get Prasindo pembayaran data
    console.log('1️⃣  FETCH: pembayaran_warga WHERE nama LIKE Prasindo AND tahun=2026');
    const { data: wargaData, error: wargaErr } = await supabase
      .from('pembayaran_warga')
      .select('*')
      .like('nama', '%Prasindo%')
      .eq('tahun', 2026);

    if (wargaErr) throw wargaErr;
    if (!wargaData || wargaData.length === 0) {
      console.log('❌ Warga Prasindo tidak ditemukan!');
      return;
    }

    const warga = wargaData[0];
    console.log('✅ Found:', {
      id: warga.id,
      nama: warga.nama,
      blok: warga.blok,
      property_type: warga.property_type,
      tahun: warga.tahun,
    });

    // 2. Get cost configs
    console.log('\n2️⃣  FETCH: warga_cost_config WHERE warga_id=' + warga.id + ' AND tahun=2026');
    const { data: configs, error: configErr } = await supabase
      .from('warga_cost_config')
      .select('*')
      .eq('warga_id', warga.id)
      .eq('tahun', 2026)
      .order('start_month', { ascending: true });

    if (configErr) throw configErr;
    if (!configs || configs.length === 0) {
      console.log('⚠️  NO COST CONFIGS FOUND!');
    } else {
      console.log(`✅ Found ${configs.length} configs:`);
      configs.forEach(c => {
        console.log(`   - Start Month ${c.start_month}: IPL=${c.has_ipl}, Sampah=${c.has_sampah}, PropertyType=${c.property_type}`);
      });
    }

    // 3. Get global settings
    console.log('\n3️⃣  FETCH: ipl_settings (Global Cost Settings)');
    const { data: settings, error: settingErr } = await supabase
      .from('ipl_settings')
      .select('*')
      .order('setting_key');

    if (settingErr) throw settingErr;
    const costSettings = {};
    if (settings && settings.length > 0) {
      settings.forEach(s => {
        costSettings[s.setting_key] = s.amount;
        console.log(`   - ${s.setting_key}: ${s.amount}`);
      });
    } else {
      console.log('⚠️  NO GLOBAL SETTINGS FOUND!');
    }

    // 4. Manual calculation
    console.log('\n4️⃣  CALCULATE TOTAL TAGIHAN');
    const months = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agt', 'sep', 'okt', 'nov', 'des'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

    let calculatedTotal = 0;
    console.log('\n   Monthly Breakdown:');

    months.forEach((month, idx) => {
      const monthNum = idx + 1;
      const status = warga[month];
      let monthlyCost = 0;

      if (String(status) === '0') {
        // Find applicable config for this month
        const applicableConfigs = configs
          .filter(c => c.start_month <= monthNum)
          .sort((a, b) => b.start_month - a.start_month);

        if (applicableConfigs.length > 0) {
          const config = applicableConfigs[0];
          let cost = 0;

          if (config.has_ipl) {
            const iplKey = config.property_type === 'ruko' ? 'ipl_ruko' : 'ipl_rumah';
            cost += costSettings[iplKey] || (config.property_type === 'ruko' ? 120000 : 100000);
          }
          if (config.has_sampah) {
            const sampahKey = config.property_type === 'ruko' ? 'sampah_ruko' : 'sampah_rumah';
            cost += costSettings[sampahKey] || (config.property_type === 'ruko' ? 50000 : 30000);
          }

          monthlyCost = cost;
          console.log(`   [${monthNames[idx]}] Status: 0 (unpaid) → Cost: Rp${cost.toLocaleString('id-ID')} ✓`);
        } else {
          console.log(`   [${monthNames[idx]}] Status: 0 (unpaid) → ⚠️  NO CONFIG FOR THIS MONTH!`);
        }
      } else {
        console.log(`   [${monthNames[idx]}] Status: ${status} (sudah bayar/N/A)`);
      }

      calculatedTotal += monthlyCost;
    });

    console.log(`\n   📊 Total Tagihan (yang seharusnya): Rp${calculatedTotal.toLocaleString('id-ID')}`);

    // 5. Summary
    console.log('\n5️⃣  SUMMARY');
    console.log('━'.repeat(60));
    console.log(`Nama             : ${warga.nama}`);
    console.log(`Property Type    : ${warga.property_type || 'undefined'} ⚠️ ${!warga.property_type ? '(MISSING!)' : ''}`);
    console.log(`Cost Configs     : ${configs?.length || 0} config(s)`);
    console.log(`Global Settings  : ${Object.keys(costSettings).length} setting(s)`);
    console.log(`Total Tagihan    : Rp${calculatedTotal.toLocaleString('id-ID')}`);
    console.log('━'.repeat(60));

    // 6. Possible Issues
    console.log('\n⚙️  DIAGNOSTIK:');
    if (!warga.property_type) {
      console.log('❌ ISSUE 1: property_type NULL/undefined - biaya tidak bisa dihitung!');
    }
    if (!configs || configs.length === 0) {
      console.log('❌ ISSUE 2: Tidak ada cost configs - akan pakai fallback 100k/bulan');
    }
    if (Object.keys(costSettings).length === 0) {
      console.log('❌ ISSUE 3: Global settings kosong - akan pakai DEFAULT_COSTS');
    }
    if (warga.property_type && configs && configs.length > 0 && Object.keys(costSettings).length > 0) {
      console.log('✅ Semua data lengkap! Perhitungan seharusnya akurat.');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
