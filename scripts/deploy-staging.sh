#!/bin/bash

# MoonGaze Staging Deployment Script
# This script handles deployment to staging environment for testing

set -e  # Exit on any error

echo "🌙 MoonGaze Staging Deployment Starting..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm ci
    print_success "Dependencies installed"
}

# Deploy Firebase staging
deploy_firebase_staging() {
    print_status "Deploying to Firebase staging..."
    
    # Switch to staging project
    firebase use staging
    
    # Deploy Firestore rules and indexes
    firebase deploy --only firestore:rules,firestore:indexes
    
    # Deploy Cloud Functions
    cd functions
    npm ci
    npm run build
    cd ..
    firebase deploy --only functions
    
    print_success "Firebase staging deployed"
}

# Build staging app
build_staging_app() {
    print_status "Building staging app..."
    
    # Build preview version for internal testing
    eas build --platform all --profile preview --non-interactive
    
    print_success "Staging app built successfully"
}

# Main staging deployment
main() {
    echo "🧪 Starting staging deployment process..."
    
    install_dependencies
    deploy_firebase_staging
    build_staging_app
    
    print_success "🎉 Staging deployment completed!"
    echo ""
    echo "📱 Staging app is ready for testing"
    echo "   - Share with internal testers"
    echo "   - Test all features thoroughly"
    echo "   - Verify Firebase integration"
    echo "   - Check performance and stability"
}

# Run main function
main "$@"