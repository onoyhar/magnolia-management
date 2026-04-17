#!/usr/bin/env node
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  try {
    console.log('\n========== SETUP DATABASE SCHEMA ==========\n');

    // Step 1: Check if ipl_settings table exists
    console.log('1️⃣  Checking ipl_settings table...');
    const { data: settingsCheck, error: settingsErr } = await supabase
      .from('ipl_settings')
      .select('count(*)', { count: 'exact', head: true });

    if (settingsErr) {
      console.log('⚠️  ipl_settings does not exist!');
      console.log('   Creating table...');
      // We need to run SQL directly
      const createSettingsSql = `
        CREATE TABLE IF NOT EXISTS ipl_settings (
          id BIGSERIAL PRIMARY KEY,
          setting_key VARCHAR(100) UNIQUE NOT NULL,
          amount BIGINT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      console.log('   ⚠️  Need to run SQL in Supabase Dashboard directly!');
    } else {
      console.log('✅ ipl_settings table exists');
    }

    // Step 2: Check if warga_cost_config table exists
    console.log('\n2️⃣  Checking warga_cost_config table...');
    const { data: configCheck, error: configErr } = await supabase
      .from('warga_cost_config')
      .select('count(*)', { count: 'exact', head: true });

    if (configErr) {
      console.log('⚠️  warga_cost_config does not exist!');
      console.log('   ⚠️  Need to run SQL in Supabase Dashboard directly!');
    } else {
      console.log('✅ warga_cost_config table exists');
    }

    // Step 3: Check if property_type column exists in pembayaran_warga
    console.log('\n3️⃣  Checking property_type column in pembayaran_warga...');
    const { data: wargaData, error: wargaErr } = await supabase
      .from('pembayaran_warga')
      .select('id, nama, property_type')
      .limit(1);

    if (wargaErr && wargaErr.message.includes('property_type')) {
      console.log('❌ property_type column does NOT exist!');
      console.log('\n📝 MANUAL STEPS REQUIRED:');
      console.log('   Go to Supabase Dashboard → SQL Editor');
      console.log('   Run this SQL:');
      console.log(`
ALTER TABLE pembayaran_warga ADD COLUMN property_type VARCHAR(50);
      `);
    } else if (wargaErr) {
      console.log('❌ Error checking table:', wargaErr.message);
    } else {
      console.log('✅ property_type column exists');
      
      // Check how many are NULL
      const { data: nullCount } = await supabase
        .from('pembayaran_warga')
        .select('id', { count: 'exact', head: true })
        .is('property_type', null);

      console.log(`   Found ${nullCount?.length || 0} records with NULL property_type`);
    }

    console.log('\n========== SUMMARY ==========');
    console.log('⚠️  Some tables/columns are missing!');
    console.log('\nPlease run this SQL in Supabase Dashboard (SQL Editor):');
    console.log(`
-- Add property_type column to pembayaran_warga if missing
ALTER TABLE pembayaran_warga ADD COLUMN IF NOT EXISTS property_type VARCHAR(50);

-- Create ipl_settings table if missing
CREATE TABLE IF NOT EXISTS ipl_settings (
  id BIGSERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  amount BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create warga_cost_config table if missing
CREATE TABLE IF NOT EXISTS warga_cost_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warga_id UUID NOT NULL REFERENCES pembayaran_warga(id) ON DELETE CASCADE,
  tahun INT NOT NULL,
  start_month INT NOT NULL,
  has_ipl BOOLEAN NOT NULL DEFAULT true,
  has_sampah BOOLEAN NOT NULL DEFAULT true,
  property_type VARCHAR(50) NOT NULL DEFAULT 'rumah',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(warga_id, tahun, start_month)
);

-- Insert default global settings if not exists
INSERT INTO ipl_settings (setting_key, amount) VALUES
  ('ipl_rumah', 100000),
  ('sampah_rumah', 30000),
  ('ipl_ruko', 120000),
  ('sampah_ruko', 50000)
ON CONFLICT (setting_key) DO NOTHING;
    `);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

main();
