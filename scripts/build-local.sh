#!/bin/bash

# MoonGaze Local Build Script
# This script provides a robust local build process for iOS and Android

set -e  # Exit on any error

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -f "app.json" ]; then
        print_error "Must be run from the MoonGaze project root directory"
        exit 1
    fi
    
    # Check Node.js
    if ! command_exists node; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command_exists npm; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check Expo CLI
    if ! command_exists npx; then
        print_error "npx is not available"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if [ ! -d "node_modules" ]; then
        npm install
        print_success "Dependencies installed"
    else
        print_status "Dependencies already installed, checking for updates..."
        npm install
        print_success "Dependencies updated"
    fi
}

# Function to run Expo doctor
run_expo_doctor() {
    print_status "Running Expo doctor..."
    npx expo doctor
    print_success "Expo doctor completed"
}

# Function to clean build artifacts
clean_build() {
    print_status "Cleaning build artifacts..."
    
    # Clean Expo cache
    npx expo run:clean
    
    # Clean npm cache if needed
    if [ "$1" = "--full" ]; then
        print_status "Performing full clean..."
        npm cache clean --force
        rm -rf node_modules
        npm install
    fi
    
    print_success "Clean completed"
}

# Function to prebuild the project
prebuild_project() {
    local platform=$1
    
    print_status "Prebuilding for $platform..."
    
    if [ "$platform" = "ios" ]; then
        npx expo prebuild --platform ios --clean
    elif [ "$platform" = "android" ]; then
        npx expo prebuild --platform android --clean
    else
        npx expo prebuild --clean
    fi
    
    print_success "Prebuild completed for $platform"
}

# Function to build iOS
build_ios() {
    local configuration=${1:-Release}
    local simulator=${2:-false}
    
    print_status "Building iOS ($configuration)..."
    
    # Check if we're on macOS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        print_error "iOS builds can only be performed on macOS"
        exit 1
    fi
    
    # Check for Xcode
    if ! command_exists xcodebuild; then
        print_error "Xcode is not installed or not in PATH"
        exit 1
    fi
    
    # Check for iOS Simulator
    if [ "$simulator" = "true" ]; then
        if ! command_exists xcrun; then
            print_error "iOS Simulator is not available"
            exit 1
        fi
    fi
    
    # Prebuild for iOS
    prebuild_project "ios"
    
    # Build command
    if [ "$simulator" = "true" ]; then
        npx expo run:ios --simulator --configuration "$configuration"
    else
        npx expo run:ios --configuration "$configuration"
    fi
    
    print_success "iOS build completed ($configuration)"
}

# Function to build Android
build_android() {
    local variant=${1:-release}
    local emulator=${2:-false}
    
    print_status "Building Android ($variant)..."
    
    # Check for Android SDK
    if [ -z "$ANDROID_HOME" ]; then
        print_warning "ANDROID_HOME is not set, trying to detect Android SDK..."
        export ANDROID_HOME="$HOME/Library/Android/sdk"  # macOS default
        if [ ! -d "$ANDROID_HOME" ]; then
            export ANDROID_HOME="$HOME/Android/Sdk"  # Linux default
        fi
    fi
    
    if [ ! -d "$ANDROID_HOME" ]; then
        print_error "Android SDK not found. Please set ANDROID_HOME environment variable"
        exit 1
    fi
    
    # Check for Java
    if ! command_exists java; then
        print_error "Java is not installed"
        exit 1
    fi
    
    # Prebuild for Android
    prebuild_project "android"
    
    # Build command
    if [ "$emulator" = "true" ]; then
        npx expo run:android --emulator --variant "$variant"
    else
        npx expo run:android --variant "$variant"
    fi
    
    print_success "Android build completed ($variant)"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS] [PLATFORM]"
    echo ""
    echo "OPTIONS:"
    echo "  -h, --help              Show this help message"
    echo "  -c, --clean             Clean build artifacts before building"
    echo "  -f, --full-clean        Perform full clean (including node_modules)"
    echo "  -d, --debug             Build in debug mode"
    echo "  -s, --simulator         Build for iOS simulator"
    echo "  -e, --emulator          Build for Android emulator"
    echo "  -p, --prebuild-only     Only run prebuild, don't build"
    echo ""
    echo "PLATFORM:"
    echo "  ios                     Build for iOS"
    echo "  android                 Build for Android"
    echo "  both                    Build for both platforms"
    echo ""
    echo "EXAMPLES:"
    echo "  $0 ios                  Build iOS release"
    echo "  $0 android              Build Android release"
    echo "  $0 -d ios               Build iOS debug"
    echo "  $0 -s ios               Build iOS for simulator"
    echo "  $0 -e android           Build Android for emulator"
    echo "  $0 -c both              Clean and build both platforms"
    echo "  $0 -p ios               Prebuild iOS only"
}

# Main script logic
main() {
    local platform=""
    local clean=false
    local full_clean=false
    local debug=false
    local simulator=false
    local emulator=false
    local prebuild_only=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -c|--clean)
                clean=true
                shift
                ;;
            -f|--full-clean)
                full_clean=true
                shift
                ;;
            -d|--debug)
                debug=true
                shift
                ;;
            -s|--simulator)
                simulator=true
                shift
                ;;
            -e|--emulator)
                emulator=true
                shift
                ;;
            -p|--prebuild-only)
                prebuild_only=true
                shift
                ;;
            ios|android|both)
                platform="$1"
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Default to both platforms if none specified
    if [ -z "$platform" ]; then
        platform="both"
    fi
    
    print_status "Starting MoonGaze local build process..."
    print_status "Platform: $platform"
    print_status "Debug: $debug"
    print_status "Clean: $clean"
    print_status "Full clean: $full_clean"
    
    # Check prerequisites
    check_prerequisites
    
    # Install dependencies
    install_dependencies
    
    # Run Expo doctor
    run_expo_doctor
    
    # Clean if requested
    if [ "$clean" = true ] || [ "$full_clean" = true ]; then
        clean_build "$([ "$full_clean" = true ] && echo "--full")"
    fi
    
    # Determine build configuration
    local ios_config="Release"
    local android_variant="release"
    
    if [ "$debug" = true ]; then
        ios_config="Debug"
        android_variant="debug"
    fi
    
    # Build based on platform
    case $platform in
        ios)
            if [ "$prebuild_only" = true ]; then
                prebuild_project "ios"
            else
                build_ios "$ios_config" "$simulator"
            fi
            ;;
        android)
            if [ "$prebuild_only" = true ]; then
                prebuild_project "android"
            else
                build_android "$android_variant" "$emulator"
            fi
            ;;
        both)
            if [ "$prebuild_only" = true ]; then
                prebuild_project "ios"
                prebuild_project "android"
            else
                build_ios "$ios_config" "$simulator"
                build_android "$android_variant" "$emulator"
            fi
            ;;
    esac
    
    print_success "Build process completed successfully!"
}

# Run main function with all arguments
main "$@"
