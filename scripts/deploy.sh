#!/bin/bash
# MailForge - Vercel Deployment Script
# Usage: VERCEL_TOKEN=your_token ./scripts/deploy.sh

set -e

if [ -z "$VERCEL_TOKEN" ]; then
  echo "Error: VERCEL_TOKEN is required"
  echo "Get your token at: https://vercel.com/account/tokens"
  echo "Usage: VERCEL_TOKEN=your_token ./scripts/deploy.sh"
  exit 1
fi

echo "🚀 Deploying MailForge to Vercel..."

# Link project (creates .vercel directory)
vercel link --yes --token="$VERCEL_TOKEN"

# Set environment variables
echo "📦 Setting environment variables..."
vercel env add NEXT_PUBLIC_SUPABASE_URL production --token="$VERCEL_TOKEN" < /dev/null 2>/dev/null || true
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --token="$VERCEL_TOKEN" < /dev/null 2>/dev/null || true
vercel env add SUPABASE_SERVICE_ROLE_KEY production --token="$VERCEL_TOKEN" < /dev/null 2>/dev/null || true
vercel env add RESEND_API_KEY production --token="$VERCEL_TOKEN" < /dev/null 2>/dev/null || true

# Deploy to production
echo "🏗️  Building and deploying..."
vercel deploy --prod --token="$VERCEL_TOKEN"

echo "✅ Deployment complete!"
