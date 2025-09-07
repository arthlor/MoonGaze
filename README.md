# MoonGaze - Local Build Guide

A robust local build setup for the MoonGaze React Native app using Expo.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g @expo/cli`)
- **Xcode** (for iOS builds - macOS only)
- **Android Studio** (for Android builds)
- **Java Development Kit** (JDK 11 or higher)

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd MoonGaze
   npm install
   ```

2. **Configure environment:**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your Firebase configuration
   # See Environment Configuration section below
   ```

3. **Validate configuration:**
   ```bash
   npm run validate:env
   ```

4. **Run Expo doctor to check setup:**
   ```bash
   npm run build:local:check
   ```

## 🔧 Local Build Commands

### Basic Build Commands

```bash
# Build for iOS (Release)
npm run build:local:ios

# Build for Android (Release)
npm run build:local:android

# Build for iOS (Debug)
npm run build:local:ios:debug

# Build for Android (Debug)
npm run build:local:android:debug
```

### Simulator/Emulator Builds

```bash
# Build for iOS Simulator
npm run build:local:ios:simulator

# Build for Android Emulator
npm run build:local:android:emulator
```

### Maintenance Commands

```bash
# Clean build artifacts
npm run build:local:clean

# Reset and clean everything
npm run build:local:reset

# Prebuild only (no actual build)
npm run build:local:prebuild

# Prebuild for specific platform
npm run build:local:prebuild:ios
npm run build:local:prebuild:android
```

## 🛠️ Advanced Build Script

For more control and automation, use the comprehensive build script:

```bash
# Make script executable (first time only)
chmod +x scripts/build-local.sh

# Basic usage
./scripts/build-local.sh ios
./scripts/build-local.sh android
./scripts/build-local.sh both

# With options
./scripts/build-local.sh -c ios          # Clean and build iOS
./scripts/build-local.sh -d android      # Debug build for Android
./scripts/build-local.sh -s ios          # iOS simulator build
./scripts/build-local.sh -e android      # Android emulator build
./scripts/build-local.sh -f both         # Full clean and build both
./scripts/build-local.sh -p ios          # Prebuild iOS only
```

### Build Script Options

- `-c, --clean`: Clean build artifacts before building
- `-f, --full-clean`: Perform full clean (including node_modules)
- `-d, --debug`: Build in debug mode
- `-s, --simulator`: Build for iOS simulator
- `-e, --emulator`: Build for Android emulator
- `-p, --prebuild-only`: Only run prebuild, don't build
- `-h, --help`: Show help message

## 📱 Platform-Specific Setup

### iOS Setup (macOS only)

1. **Install Xcode** from the App Store
2. **Install iOS Simulator** (included with Xcode)
3. **Accept Xcode license:**
   ```bash
   sudo xcodebuild -license accept
   ```
4. **Install iOS Simulator:**
   ```bash
   xcrun simctl install booted
   ```

### Android Setup

1. **Install Android Studio**
2. **Install Android SDK** (API level 33 or higher)
3. **Set environment variables:**
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
   export ANDROID_HOME=$HOME/Android/Sdk          # Linux
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```
4. **Create Android Virtual Device (AVD):**
   ```bash
   # Open Android Studio → AVD Manager → Create Virtual Device
   ```

## 🔍 Troubleshooting

### Common Issues

#### 1. Metro Bundler Issues
```bash
# Clear Metro cache
npx expo start --clear

# Reset Metro cache
npm run build:local:reset
```

#### 2. iOS Build Issues
```bash
# Clean iOS build
cd ios && xcodebuild clean && cd ..

# Reset iOS simulator
xcrun simctl erase all

# Check Xcode installation
xcode-select --print-path
```

#### 3. Android Build Issues
```bash
# Clean Android build
cd android && ./gradlew clean && cd ..

# Check Android SDK
echo $ANDROID_HOME
ls $ANDROID_HOME/platforms

# Reset Android emulator
adb emu kill
```

#### 4. Dependency Issues
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Fix Expo dependencies
npx expo install --fix
```

#### 5. TypeScript Issues
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Reset TypeScript cache
rm -rf node_modules/.cache
```

## 🌍 Environment Configuration

MoonGaze supports multiple environments (development, staging, production) with automatic configuration management.

### Environment Setup

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Configure your Firebase project:**
   ```bash
   # Edit .env with your Firebase configuration
   nano .env  # or use your preferred editor
   ```

3. **Validate configuration:**
   ```bash
   npm run validate:env
   ```

### Environment Variables

#### Required Firebase Configuration
```bash
# Firebase Project Configuration
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key-android
EXPO_PUBLIC_FIREBASE_API_KEY_IOS=your-api-key-ios
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID_ANDROID=your-android-app-id
EXPO_PUBLIC_FIREBASE_APP_ID_IOS=your-ios-app-id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id  # Production only
```

#### Environment Control
```bash
# Environment Configuration
EXPO_PUBLIC_ENVIRONMENT=development  # development, staging, production
EXPO_PUBLIC_DEV_CLIENT=true         # For development builds
EAS_BUILD_PROFILE=development       # Set automatically by EAS
```

#### Feature Flags
```bash
# Analytics & Monitoring
EXPO_PUBLIC_ANALYTICS_ENABLED=true
EXPO_PUBLIC_LOG_LEVEL=debug         # debug, info, warn, error

# App Features
EXPO_PUBLIC_OFFLINE_MODE_ENABLED=true
EXPO_PUBLIC_PUSH_NOTIFICATIONS_ENABLED=true
EXPO_PUBLIC_CELEBRATION_ANIMATIONS_ENABLED=true
```

### Environment-Specific Behavior

#### Development Environment
- Uses `firestore.rules` (relaxed security)
- Crashlytics disabled
- Debug logging enabled
- Generous rate limits
- Performance monitoring disabled

#### Staging Environment  
- Uses `firestore.production.rules` (strict security)
- Crashlytics enabled
- Info-level logging
- Moderate rate limits
- Performance monitoring enabled

#### Production Environment
- Uses `firestore.production.rules` (strict security)
- Crashlytics enabled with user context
- Error-level logging only
- Strict rate limits
- Full monitoring enabled
- Configuration validation enforced

### Firebase Rules Deployment

Deploy environment-specific Firestore rules:

```bash
# Development rules
npm run deploy:firestore:dev

# Production rules  
npm run deploy:firestore:prod

# Manual deployment
firebase deploy --only firestore:rules,firestore:indexes --project your-project-id
```

### Environment Validation

The app automatically validates configuration on startup:

```bash
# Validate current environment
npm run validate:env

# Validate Firebase connection
npm run validate:firebase

# Check all configurations
npm run validate:env && npm run validate:firebase
```

### EAS Build Profiles

Environment variables are automatically set based on EAS build profiles:

```bash
# Development build
eas build --profile development
# Sets: EXPO_PUBLIC_ENVIRONMENT=development

# Staging build  
eas build --profile staging
# Sets: EXPO_PUBLIC_ENVIRONMENT=staging

# Production build
eas build --profile production  
# Sets: EXPO_PUBLIC_ENVIRONMENT=production
```

### Configuration Files

#### Firebase Configuration Files
- `firebase.json` - Development configuration
- `firebase.production.json` - Production configuration
- `firestore.rules` - Development security rules
- `firestore.production.rules` - Production security rules
- `firestore.indexes.json` - Database indexes (shared)

#### Environment Files
- `.env` - Local environment variables
- `.env.example` - Template with all available variables
- `src/config/environment.ts` - Environment configuration logic

### Security Considerations

#### Development
- Relaxed Firestore rules for easier testing
- Debug information exposed
- No rate limiting
- Local Firebase emulator support

#### Production
- Strict Firestore rules with validation
- Enhanced security rules enforcement
- Rate limiting enabled
- User data encryption
- Audit logging

### Troubleshooting Environment Issues

#### Configuration Validation Failed
```bash
# Check environment variables
npm run validate:env

# Verify Firebase project access
firebase projects:list

# Test Firebase connection
firebase firestore:indexes --project your-project-id
```

#### Wrong Environment Detected
```bash
# Check current environment detection
node -e "console.log(process.env.EXPO_PUBLIC_ENVIRONMENT)"

# Verify EAS build profile
echo $EAS_BUILD_PROFILE

# Check __DEV__ flag
node -e "console.log(__DEV__)"
```

#### Firebase Rules Deployment Issues
```bash
# Check Firebase CLI authentication
firebase login:list

# Verify project configuration
firebase use --project your-project-id

# Test rules syntax
firebase firestore:rules:validate firestore.production.rules
```

### Environment Variables Reference

See `.env.example` for a complete list of all available environment variables with descriptions and example values.

### Performance Optimization

1. **Enable Hermes Engine** (already configured in metro.config.js)
2. **Use Release builds** for performance testing
3. **Enable Flipper** for debugging (development only)
4. **Monitor bundle size:**
   ```bash
   npx expo export --dump-assetmap
   ```

## 📊 Build Monitoring

### Build Logs
- iOS builds log to Xcode console
- Android builds log to Android Studio console
- Metro bundler logs to terminal

### Performance Metrics
- Bundle size analysis
- Build time tracking
- Memory usage monitoring

## 🔐 Security Considerations

1. **Never commit sensitive data** (API keys, certificates)
2. **Use environment variables** for configuration
3. **Validate all inputs** in production builds
4. **Enable code signing** for distribution

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Build Documentation](https://docs.expo.dev/build/introduction/)
- [Metro Configuration](https://facebook.github.io/metro/docs/configuration)

## 🤝 Contributing

1. Follow the coding standards in the project
2. Test builds on both platforms
3. Update this README for any build process changes
4. Use conventional commits for changes

## 📞 Support

For build-related issues:
1. Check the troubleshooting section
2. Run `npm run build:local:check`
3. Check Expo documentation
4. Create an issue with detailed error logs
