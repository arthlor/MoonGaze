#!/bin/bash

echo "🔧 Starting comprehensive iOS build fix..."

# Navigate to project directory
cd "$(dirname "$0")/.."

echo "📱 Step 1: Cleaning React Native caches..."
npx react-native clean-project-auto

echo "🧹 Step 2: Cleaning npm/yarn caches..."
npm cache clean --force
rm -rf node_modules
rm -f package-lock.json

echo "🍎 Step 3: Cleaning iOS build artifacts..."
cd ios
rm -rf build
rm -rf Pods
rm -f Podfile.lock
rm -rf ~/Library/Developer/Xcode/DerivedData/*
cd ..

echo "📦 Step 4: Reinstalling dependencies..."
npm install

echo "🔨 Step 5: Reinstalling iOS pods..."
cd ios
pod deintegrate
pod cache clean --all
pod install --repo-update
cd ..

echo "🏗️ Step 6: Rebuilding iOS project..."
npx expo run:ios --clear

echo "✅ iOS build fix complete!"