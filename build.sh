#!/bin/bash
set -e

echo "📦 Installing frontend dependencies..."
cd frontend
npm install --include=dev

echo "🏗️ Building frontend..."
npx vite build

echo "📦 Installing backend dependencies..."
cd ../backend
npm install

echo "✅ Build completed successfully!"
