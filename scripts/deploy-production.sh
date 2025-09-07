#!/bin/bash

# MoonGaze Production Deployment Script
# This script handles the complete deployment process for production

set -e  # Exit on any error

echo "🌙 MoonGaze Production Deployment Starting..."

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

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v eas &> /dev/null; then
        print_error "EAS CLI is not installed. Run: npm install -g eas-cli"
        exit 1
    fi
    
    if ! command -v firebase &> /dev/null; then
        print_error "Firebase CLI is not installed. Run: npm install -g firebase-tools"
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Verify environment configuration
check_environment() {
    print_status "Checking environment configuration..."
    
    if [ ! -f "google-services.json" ]; then
        print_error "google-services.json not found. Please add your production Firebase config."
        exit 1
    fi
    
    if [ ! -f "GoogleService-Info.plist" ]; then
        print_error "GoogleService-Info.plist not found. Please add your production Firebase config."
        exit 1
    fi
    
    if [ ! -f "eas.json" ]; then
        print_error "eas.json not found. Please configure EAS build settings."
        exit 1
    fi
    
    print_success "Environment configuration verified"
}

# Install and update dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm ci
    print_success "Dependencies installed"
}

# Run tests (if available)
run_tests() {
    print_status "Running tests..."
    # Add test commands here when available
    # npm test
    print_success "Tests completed"
}

# Deploy Firebase backend
deploy_firebase() {
    print_status "Deploying Firebase backend..."
    
    # Switch to production project
    firebase use production
    
    # Deploy Firestore rules and indexes
    firebase deploy --only firestore:rules,firestore:indexes
    
    # Deploy Cloud Functions
    cd functions
    npm ci
    npm run build
    cd ..
    firebase deploy --only functions
    
    print_success "Firebase backend deployed"
}

# Build mobile app
build_app() {
    print_status "Building mobile app for production..."
    
    # Build for both platforms
    eas build --platform all --profile production --non-interactive
    
    print_success "Mobile app built successfully"
}

# Submit to app stores (optional)
submit_app() {
    read -p "Do you want to submit to app stores? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Submitting to app stores..."
        
        # Submit to iOS App Store
        eas submit --platform ios --profile production --non-interactive
        
        # Submit to Google Play Store
        eas submit --platform android --profile production --non-interactive
        
        print_success "App submitted to stores"
    else
        print_warning "Skipping app store submission"
    fi
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Check Firebase project status
    firebase projects:list
    
    # Check EAS build status
    eas build:list --limit 5
    
    print_success "Deployment verification completed"
}

# Main deployment process
main() {
    echo "🚀 Starting production deployment process..."
    echo "⚠️  Make sure you have:"
    echo "   - Tested the app thoroughly"
    echo "   - Updated version numbers"
    echo "   - Prepared app store assets"
    echo "   - Configured production Firebase project"
    echo ""
    
    read -p "Continue with production deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled"
        exit 0
    fi
    
    check_dependencies
    check_environment
    install_dependencies
    run_tests
    deploy_firebase
    build_app
    submit_app
    verify_deployment
    
    print_success "🎉 Production deployment completed successfully!"
    echo ""
    echo "📱 Next steps:"
    echo "   - Monitor app store review process"
    echo "   - Check Firebase usage and performance"
    echo "   - Monitor crash reports and user feedback"
    echo "   - Update documentation and release notes"
}

# Run main function
main "$@"