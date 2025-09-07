#!/bin/bash

# Deploy Firestore Security Rules and Indexes
# This script deploys the Firestore configuration to Firebase

echo "🚀 Deploying Firestore configuration..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please login first:"
    echo "firebase login"
    exit 1
fi

# Deploy Firestore rules and indexes
echo "📋 Deploying Firestore security rules..."
firebase deploy --only firestore:rules

echo "🔍 Deploying Firestore indexes..."
firebase deploy --only firestore:indexes

echo "✅ Firestore configuration deployed successfully!"
echo ""
echo "📊 You can view your Firestore database at:"
echo "https://console.firebase.google.com/project/$(firebase use --current)/firestore"