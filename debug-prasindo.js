const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugPrasindo() {
  try {
    // Get Prasindo warga data
    const waargaResult = await supabase
      .from('pembayaran_warga')
      .select('id,no,nama,blok,tahun,property_type,jan,feb,mar,apr,mei,jun,jul,agt,sep,okt,nov,des')
      .like('nama', '%Prasindo%')
      .eq('tahun', 2026);
    
    if (waargaResult.error) throw waargaResult.error;
    
    const warga = waargaResult.data[0];
    if (!warga) {
      console.log('Warga Prasindo tidak ditemukan');
      return;
    }
    
    console.log('=== WARGA DATA ===');
    console.log(JSON.stringify(warga, null, 2));
    
    // Get cost configs for this warga
    const configsResult = await supabase
      .from('warga_cost_config')
      .select('*')
      .eq('warga_id', warga.id)
      .eq('tahun', 2026)
      .order('start_month');
    
    console.log('\n=== COST CONFIGS ===');
    console.log(JSON.stringify(configsResult.data || [], null, 2));
    
    // Get global cost settings
    const settingsResult = await supabase
      .from('ipl_settings')
      .select('*')
      .order('setting_key');
    
    console.log('\n=== GLOBAL SETTINGS ===');
    console.log(JSON.stringify(settingsResult.data || [], null, 2));
    
    // Calculate what total should be
    console.log('\n=== CALCULATION ===');
    const monthsKey = ['jan','feb','mar','apr','mei','jun','jul','agt','sep','okt','nov','des'];
    let calculatedTotal = 0;
    const configs = configsResult.data || [];
    const settings = settingsResult.data || [];
    const costSettings = {};
    settings.forEach(s => {
      costSettings[s.setting_key] = s.amount;
    });
    
    monthsKey.forEach((month, idx) => {
      const value = warga[month];
      if (String(value) === '0') {
        // Find applicable config
        const applicableConfigs = configs
          .filter(c => c.start_month <= (idx + 1))
          .sort((a, b) => b.start_month - a.start_month);
        
        if (applicableConfigs.length > 0) {
          const config = applicableConfigs[0];
          let monthlyCost = 0;
          
          if (config.has_ipl) {
            const iplKey = config.property_type === 'ruko' ? 'ipl_ruko' : 'ipl_rumah';
            monthlyCost += costSettings[iplKey] || (config.property_type === 'ruko' ? 120000 : 100000);
          }
          
          if (config.has_sampah) {
            const sampahKey = config.property_type === 'ruko' ? 'sampah_ruko' : 'sampah_rumah';
            monthlyCost += costSettings[sampahKey] || (config.property_type === 'ruko' ? 50000 : 30000);
          }
          
          console.log(`${month.toUpperCase()}: 0 (unpaid) -> Config: ${JSON.stringify(config)} -> Cost: ${monthlyCost}`);
          calculatedTotal += monthlyCost;
        } else {
          console.log(`${month.toUpperCase()}: 0 (unpaid) -> NO CONFIG FOUND`);
        }
      } else {
        console.log(`${month.toUpperCase()}: ${value} (paid)`);
      }
    });
    
    console.log(`\nTotal yang seharusnya: ${calculatedTotal}`);
    
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
}

debugPrasindo();
