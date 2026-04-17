const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  const { data } = await supabase
    .from('pembayaran_ipl')
    .select('id, tahun, jan, feb, mar, apr, mei, jun, jul, agt, sep, okt, nov, des, data_warga(nama, blok, no_hp)')
    .limit(50);
  
  const months = ['jan', 'feb', 'mar', 'apr', 'mei', 'jun', 'jul', 'agt', 'sep', 'okt', 'nov', 'des'];
  let foundUnpaid = false;
  
  data.forEach((row) => {
    const hasUnpaid = months.some(m => String(row[m]) === '0');
    
    if (hasUnpaid) {
      foundUnpaid = true;
      console.log(`\n✓ UNPAID FOUND: ${row.data_warga?.nama} (${row.data_warga?.blok})`);
      console.log(`  Phone: ${row.data_warga?.no_hp}`);
      const unpaidMonths = months.filter(m => String(row[m]) === '0');
      console.log(`  Unpaid months: ${unpaidMonths.join(', ')}`);
    }
  });
  
  if (!foundUnpaid) {
    console.log('❌ No unpaid records found (all are N/A or paid)');
    console.log('\nFirst record with details:');
    if (data[0]) {
      console.log(`${data[0].data_warga?.nama}: ${months.map(m => `${m}=${data[0][m]}`).join(', ')}`);
    }
  }
})();
