#!/usr/bin/env bash
# Start script for Render deployment

echo "🚀 Starting application..."

# Navigate to backend directory (in case we're at root)
cd "$(dirname "$0")" || exit 1

echo "▶️ Starting server..."
node dist/index.js
