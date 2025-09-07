# MoonGaze Deployment Guide

## Prerequisites

### Development Environment
- Node.js 18+ installed
- Expo CLI installed globally: `npm install -g @expo/cli`
- EAS CLI installed globally: `npm install -g eas-cli`
- Git repository set up

### Accounts Required
- Expo account (free)
- Apple Developer Account ($99/year for iOS)
- Google Play Console Account ($25 one-time for Android)
- Firebase project set up

## Initial Setup

### 1. Install Dependencies
```bash
cd MoonGaze
npm install
```

### 2. Configure Firebase
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication with Email/Password
3. Create Firestore database
4. Enable Cloud Functions
5. Download configuration files:
   - `google-services.json` for Android
   - `GoogleService-Info.plist` for iOS
6. Place files in the project root

### 3. Configure EAS
```bash
# Login to Expo
eas login

# Configure the project
eas build:configure
```

### 4. Update Configuration
Update the following files with your project details:

#### `app.json`
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-actual-eas-project-id"
      }
    }
  }
}
```

#### `eas.json`
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./service-account-key.json"
      }
    }
  }
}
```

## Firebase Setup

### 1. Firestore Security Rules
Deploy the security rules:
```bash
cd MoonGaze
firebase deploy --only firestore:rules
```

### 2. Cloud Functions
Deploy the Cloud Functions:
```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

### 3. Firestore Indexes
Deploy the indexes:
```bash
firebase deploy --only firestore:indexes
```

## Building the App

### Development Build
```bash
# iOS Simulator
eas build --platform ios --profile development

# Android Emulator
eas build --platform android --profile development
```

### Preview Build
```bash
# iOS TestFlight
eas build --platform ios --profile preview

# Android Internal Testing
eas build --platform android --profile preview
```

### Production Build
```bash
# iOS App Store
eas build --platform ios --profile production

# Android Play Store
eas build --platform android --profile production
```

## App Store Submission

### iOS App Store

1. **Prepare Assets**
   - App icons (see `docs/app-store-assets.md`)
   - Screenshots for all device sizes
   - App Store description and keywords

2. **App Store Connect Setup**
   - Create app in App Store Connect
   - Fill in app information
   - Upload screenshots and metadata
   - Set pricing and availability

3. **Submit for Review**
   ```bash
   eas submit --platform ios --profile production
   ```

### Google Play Store

1. **Prepare Assets**
   - App icons and feature graphics
   - Screenshots for phones and tablets
   - Store listing details

2. **Play Console Setup**
   - Create app in Google Play Console
   - Complete store listing
   - Set up content rating
   - Configure pricing and distribution

3. **Submit for Review**
   ```bash
   eas submit --platform android --profile production
   ```

## Environment Management

### Development Environment
- Uses Firebase emulator for local development
- Debug builds with development client
- Hot reloading enabled

### Staging Environment
- Separate Firebase project for staging
- Preview builds for internal testing
- Production-like configuration

### Production Environment
- Production Firebase project
- Optimized builds
- Analytics and crash reporting enabled

## Monitoring and Maintenance

### Firebase Console
- Monitor authentication usage
- Check Firestore read/write usage
- Review Cloud Function logs
- Monitor performance metrics

### App Store Analytics
- Track downloads and user engagement
- Monitor crash reports
- Review user feedback and ratings

### Regular Maintenance
- Update dependencies monthly
- Monitor Firebase usage limits
- Review and respond to user feedback
- Plan feature updates based on analytics

## Troubleshooting

### Common Build Issues

**Firebase Configuration Missing**
```bash
# Ensure files are in correct location
ls -la google-services.json
ls -la GoogleService-Info.plist
```

**EAS Build Failures**
```bash
# Check build logs
eas build:list

# Clear cache and retry
eas build --clear-cache
```

**Expo CLI Issues**
```bash
# Update Expo CLI
npm install -g @expo/cli@latest

# Clear Expo cache
expo r -c
```

### Firebase Issues

**Quota Exceeded**
- Monitor usage in Firebase Console
- Optimize queries to reduce reads
- Consider upgrading to paid plan

**Security Rules Errors**
- Test rules in Firebase Console
- Check user authentication state
- Verify document structure matches rules

## Security Checklist

- [ ] Firebase security rules properly configured
- [ ] API keys restricted to specific domains/apps
- [ ] User data properly encrypted
- [ ] No sensitive data in client-side code
- [ ] Regular security updates applied
- [ ] Privacy policy updated and accessible

## Performance Optimization

### App Performance
- Use React Native performance profiler
- Optimize image sizes and formats
- Implement lazy loading for screens
- Monitor memory usage

### Firebase Performance
- Use composite indexes for complex queries
- Implement pagination for large datasets
- Cache frequently accessed data
- Monitor Firestore usage patterns

## Backup and Recovery

### Code Backup
- Regular Git commits and pushes
- Tagged releases for major versions
- Backup of configuration files

### Data Backup
- Firebase automatic backups (paid plans)
- Export user data regularly
- Document data recovery procedures

## Support and Documentation

### User Support
- In-app help documentation
- FAQ section on website
- Support email for user issues
- Community forum or Discord

### Developer Documentation
- API documentation for team members
- Deployment runbooks
- Troubleshooting guides
- Architecture decision records