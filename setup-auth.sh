#!/bin/bash

echo "🔐 Magnolia Authentication Setup"
echo "================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found"
  exit 1
fi

# Load environment variables
set -a
source .env
set +a

echo "1️⃣  Creating auth tables in Supabase..."
echo ""
echo "Please run the following SQL in Supabase Dashboard → SQL Editor:"
echo "> Copy the content from setup-auth.sql and execute it"
echo ""
read -p "Press Enter once you've completed the SQL setup in Supabase..."

echo ""
echo "2️⃣  Creating default admin user..."
node scripts/setup-admin.js

if [ $? -eq 0 ]; then
  echo ""
  echo "3️⃣  Setup Complete! ✅"
  echo ""
  echo "You can now login with:"
  echo "  Username: admin"
  echo "  Password: clustermagnoliaburaden2025"
  echo ""
  echo "Starting development server..."
  npm run dev
else
  echo ""
  echo "❌ Failed to create admin user"
  exit 1
fi
