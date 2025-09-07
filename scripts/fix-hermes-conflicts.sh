#!/bin/bash

echo "🔧 Fixing React Native Hermes module conflicts..."

cd "$(dirname "$0")/.."

echo "📱 Step 1: Switching to JSC and cleaning Hermes artifacts..."
cd ios

# Remove all Hermes-related pods and artifacts
rm -rf Pods/hermes-engine*
rm -rf Pods/React-hermes*
rm -rf Pods/React-RuntimeHermes*
rm -rf Pods/Headers/Public/react_runtime*
rm -rf build/

echo "🧹 Step 2: Cleaning derived data and module cache..."
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf ~/Library/Caches/com.apple.dt.Xcode/*

echo "🔨 Step 3: Reinstalling pods with JSC..."
pod deintegrate
pod cache clean --all
pod install --repo-update --verbose

echo "✅ Hermes conflicts fix complete!"