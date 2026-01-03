#!/usr/bin/env bash
set -euo pipefail

# Database setup script for production deployment
# This script should be run after Kamal deployment to initialize the database

echo "🚀 Setting up database for {{PROJECT_NAME}}..."

# Check if DATABASE_URL is set
if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

# Run Prisma migrations
echo "📦 Running database migrations..."
pnpm --filter database prisma migrate deploy

# Generate Prisma client
echo "🔧 Generating Prisma client..."
pnpm --filter database prisma generate

# Optional: Seed database
if [ -f "packages/database/prisma/seed.ts" ]; then
  echo "🌱 Seeding database..."
  pnpm --filter database prisma db seed
fi

echo "✅ Database setup complete!"
