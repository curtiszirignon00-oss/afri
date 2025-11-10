#!/usr/bin/env bash
# Build script for Render deployment

echo "🔧 Starting build process..."

# Navigate to backend directory (in case we're at root)
cd "$(dirname "$0")" || exit 1

echo "📦 Installing dependencies..."
npm install

echo "🔄 Generating Prisma client..."
npx prisma generate

echo "🏗️ Building TypeScript..."
npm run build

echo "✅ Build complete! Checking output..."
ls -la dist/

if [ -f "dist/index.js" ]; then
    echo "✅ dist/index.js created successfully!"
else
    echo "❌ ERROR: dist/index.js was not created!"
    exit 1
fi
