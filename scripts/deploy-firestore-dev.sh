#!/bin/bash

# Deploy Firestore rules and indexes for development environment
echo "🔥 Deploying Firestore configuration for DEVELOPMENT environment..."

# Use development Firebase configuration
export FIREBASE_CONFIG_FILE="firebase.json"

# Deploy using development rules
firebase deploy --only firestore:rules,firestore:indexes --project moongaze35

echo "✅ Development Firestore deployment complete!"