-- ========================================
-- SETUP AUTHENTICATION SCHEMA
-- ========================================
-- Run this in Supabase Dashboard → SQL Editor
-- ========================================

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create auth_sessions table
CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anyone to read users" ON users;
CREATE POLICY "Allow anyone to read users" ON users
  FOR SELECT USING (true);

-- 4. Enable RLS on auth_sessions table
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anyone to read auth_sessions" ON auth_sessions;
CREATE POLICY "Allow anyone to read auth_sessions" ON auth_sessions
  FOR SELECT USING (true);

-- DONE! Users table is ready. Insert default admin user via the setup script.
