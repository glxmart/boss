#!/usr/bin/env bash
set -euo pipefail

# Deployment script for {{PROJECT_NAME}}
# Usage: ./scripts/deploy.sh [web|admin|all]

APP="${1:-all}"

echo "🚀 Deploying {{PROJECT_NAME}}..."

# Build and deploy based on argument
case "$APP" in
  web)
    echo "📦 Building and deploying web app..."
    kamal build --builder web -f docker/Dockerfile.web
    kamal deploy --version latest --service web
    ;;
  admin)
    echo "📦 Building and deploying admin app..."
    kamal build --builder admin -f docker/Dockerfile.admin
    kamal deploy --version latest --service admin
    ;;
  all)
    echo "📦 Building and deploying all apps..."
    kamal build --builder web -f docker/Dockerfile.web
    kamal build --builder admin -f docker/Dockerfile.admin
    kamal deploy --version latest
    ;;
  *)
    echo "❌ Invalid argument: $APP"
    echo "Usage: ./scripts/deploy.sh [web|admin|all]"
    exit 1
    ;;
esac

echo "✅ Deployment complete!"
echo "🌐 Web: https://{{DOMAIN}}"
echo "🔧 Admin: https://admin.{{DOMAIN}}"
