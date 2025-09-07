import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import crashlytics from '@react-native-firebase/crashlytics';
import { 
  getCurrentEnvironment, 
  getFirebaseConfig as getEnvFirebaseConfig,
  getFirebaseProjectConfig,
  shouldEnableCrashlytics,
  shouldEnablePerformanceMonitoring,
  validateEnvironmentConfig,
} from '../config/environment';
import { logger } from '../utils/logger';

// Validate environment configuration on startup
const validateFirebaseEnvironment = () => {
  const validation = validateEnvironmentConfig();
  const environment = getCurrentEnvironment();
  const projectConfig = getFirebaseProjectConfig();

  if (!validation.isValid) {
    const errorMessage = `Firebase configuration validation failed for ${environment} environment:\n${validation.errors.join('\n')}`;
    
    if (environment === 'production') {
      // In production, throw error to prevent app from starting with invalid config
      throw new Error(errorMessage);
    } else {
      // In development/staging, log warning but continue
      logger.warn('Firebase Configuration Warning', { 
        environment, 
        errors: validation.errors,
        projectId: projectConfig.projectId, 
      });
    }
  }

  logger.info('Firebase Environment Configuration', {
    environment,
    projectId: projectConfig.projectId,
    rulesFile: projectConfig.rulesFile,
    features: projectConfig.features,
    security: projectConfig.security,
    limits: projectConfig.limits,
  });

  return projectConfig;
};

// Get Firebase configuration from environment variables with platform-specific handling
const getFirebaseConfig = () => {
  // First validate the environment
  validateFirebaseEnvironment();
  
  const projectId =
    Constants.expoConfig?.extra?.firebaseProjectId ||
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey =
    Platform.OS === 'ios'
      ? Constants.expoConfig?.extra?.firebaseApiKeyIOS ||
        process.env.EXPO_PUBLIC_FIREBASE_API_KEY_IOS
      : Constants.expoConfig?.extra?.firebaseApiKey ||
        process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  const authDomain =
    Constants.expoConfig?.extra?.firebaseAuthDomain ||
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const storageBucket =
    Constants.expoConfig?.extra?.firebaseStorageBucket ||
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId =
    Constants.expoConfig?.extra?.firebaseMessagingSenderId ||
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId =
    Platform.OS === 'ios'
      ? Constants.expoConfig?.extra?.firebaseAppIdIOS ||
        process.env.EXPO_PUBLIC_FIREBASE_APP_ID_IOS
      : Constants.expoConfig?.extra?.firebaseAppIdAndroid ||
        process.env.EXPO_PUBLIC_FIREBASE_APP_ID_ANDROID;
  const measurementId = 
    Constants.expoConfig?.extra?.firebaseMeasurementId ||
    process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID;

  // Validate required configuration
  if (
    !projectId ||
    !apiKey ||
    !authDomain ||
    !storageBucket ||
    !messagingSenderId ||
    !appId
  ) {
    const missingFields = [];
    if (!projectId) missingFields.push('projectId');
    if (!apiKey) missingFields.push('apiKey');
    if (!authDomain) missingFields.push('authDomain');
    if (!storageBucket) missingFields.push('storageBucket');
    if (!messagingSenderId) missingFields.push('messagingSenderId');
    if (!appId) missingFields.push('appId');
    
    throw new Error(
      `Missing required Firebase configuration fields: ${missingFields.join(', ')}. Please check your environment variables for ${getCurrentEnvironment()} environment.`,
    );
  }

  // Validate project ID matches environment expectations
  const envConfig = getEnvFirebaseConfig();
  if (projectId !== envConfig.projectId) {
    logger.warn('Firebase project ID mismatch', { 
      expected: envConfig.projectId, 
      actual: projectId, 
    });
  }

  const config = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    ...(measurementId && { measurementId }),
  };

  logger.info('Firebase Config Loaded', {
    projectId,
    environment: getCurrentEnvironment(),
    platform: Platform.OS,
    hasAnalytics: !!measurementId,
  });

  return config;
};

// Firebase configuration from environment variables
const firebaseConfig = getFirebaseConfig();

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
// Firebase v9+ automatically handles persistence in React Native environments
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Firebase services based on environment
const initializeFirebaseServices = () => {
  const environment = getCurrentEnvironment();
  const projectConfig = getFirebaseProjectConfig();

  // Initialize Crashlytics
  if (shouldEnableCrashlytics()) {
    crashlytics().setCrashlyticsCollectionEnabled(true);
    
    // Set environment context for crash reports
    crashlytics().setAttributes({
      environment,
      projectId: projectConfig.projectId,
      platform: Platform.OS,
      appVersion: Constants.expoConfig?.version || '1.0.0',
    });
    
    logger.info('Firebase Crashlytics initialized', { environment });
  } else {
    crashlytics().setCrashlyticsCollectionEnabled(false);
    logger.info('Firebase Crashlytics disabled', { environment });
  }

  // Log environment-specific initialization
  logger.info('Firebase Services Initialized', {
    environment,
    crashlytics: shouldEnableCrashlytics(),
    performance: shouldEnablePerformanceMonitoring(),
    rulesFile: projectConfig.rulesFile,
    securityEnforced: projectConfig.security.enforceRules,
  });

  // Validate production environment setup
  if (environment === 'production') {
    if (!projectConfig.features.crashlytics) {
      logger.warn('Crashlytics should be enabled in production', { environment });
    }
    
    if (!projectConfig.security.enforceRules) {
      logger.warn('Security rules should be enforced in production', { environment });
    }
    
    if (projectConfig.rulesFile !== 'firestore.production.rules') {
      logger.warn('Production should use firestore.production.rules', { 
        environment, 
        currentRulesFile: projectConfig.rulesFile, 
      });
    }
  }
};

// Initialize Firebase services
initializeFirebaseServices();

// Export environment configuration utilities
export const getEnvironmentInfo = () => {
  return getFirebaseProjectConfig();
};

export const validateFirebaseSetup = () => {
  return validateEnvironmentConfig();
};

// Export Crashlytics instance
export { crashlytics };

export default app;
