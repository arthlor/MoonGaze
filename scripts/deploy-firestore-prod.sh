#!/bin/bash

# Deploy Firestore rules and indexes for production environment
echo "🔥 Deploying Firestore configuration for PRODUCTION environment..."

# Use production Firebase configuration
export FIREBASE_CONFIG_FILE="firebase.production.json"

# Deploy using production rules
firebase deploy --only firestore:rules,firestore:indexes --project moongaze35 --config firebase.production.json

echo "✅ Production Firestore deployment complete!"