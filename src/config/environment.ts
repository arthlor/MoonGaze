/**
 * Environment Configuration
 *
 * Manages different configurations for development, staging, and production environments.
 */

export type Environment = 'development' | 'staging' | 'production';

interface EnvironmentConfig {
  apiUrl: string;
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  enableAnalytics: boolean;
  enableCrashlytics: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxRetries: number;
  timeoutMs: number;
  // Environment-specific Firebase settings
  firebaseRulesFile: string;
  enablePerformanceMonitoring: boolean;
  enableRemoteConfig: boolean;
  // Security and validation settings
  enforceSecurityRules: boolean;
  enableRateLimiting: boolean;
  maxTasksPerUser: number;
  maxPartnershipsPerUser: number;
}

// Get environment variables with fallbacks
const getEnvVar = (key: string, fallback: string = ''): string => {
  return process.env[key] || fallback;
};

// Development Configuration
const developmentConfig: EnvironmentConfig = {
  apiUrl: getEnvVar('EXPO_PUBLIC_API_BASE_URL', ''),
  firebaseConfig: {
    apiKey: getEnvVar('EXPO_PUBLIC_FIREBASE_API_KEY', ''),
    authDomain: getEnvVar('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', ''),
    projectId: getEnvVar('EXPO_PUBLIC_FIREBASE_PROJECT_ID', ''),
    storageBucket: getEnvVar('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', ''),
    messagingSenderId: getEnvVar(
      'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      '',
    ),
    appId: getEnvVar('EXPO_PUBLIC_FIREBASE_APP_ID_ANDROID', ''),
  },
  enableAnalytics:
    getEnvVar('EXPO_PUBLIC_ANALYTICS_ENABLED', 'false') === 'true',
  enableCrashlytics: false,
  logLevel: getEnvVar('EXPO_PUBLIC_LOG_LEVEL', 'debug') as
    | 'debug'
    | 'info'
    | 'warn'
    | 'error',
  maxRetries: parseInt(getEnvVar('EXPO_PUBLIC_MAX_RETRIES', '3'), 10),
  timeoutMs: parseInt(getEnvVar('EXPO_PUBLIC_API_TIMEOUT', '10000'), 10),
  // Development-specific settings
  firebaseRulesFile: 'firestore.rules',
  enablePerformanceMonitoring: false,
  enableRemoteConfig: false,
  enforceSecurityRules: false,
  enableRateLimiting: false,
  maxTasksPerUser: 1000, // Generous limits for development
  maxPartnershipsPerUser: 10,
};

// Staging Configuration
const stagingConfig: EnvironmentConfig = {
  apiUrl: getEnvVar('EXPO_PUBLIC_API_BASE_URL', ''),
  firebaseConfig: {
    apiKey: getEnvVar('EXPO_PUBLIC_FIREBASE_API_KEY', ''),
    authDomain: getEnvVar('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', ''),
    projectId: getEnvVar('EXPO_PUBLIC_FIREBASE_PROJECT_ID', ''),
    storageBucket: getEnvVar('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', ''),
    messagingSenderId: getEnvVar(
      'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      '',
    ),
    appId: getEnvVar('EXPO_PUBLIC_FIREBASE_APP_ID_ANDROID', ''),
  },
  enableAnalytics:
    getEnvVar('EXPO_PUBLIC_ANALYTICS_ENABLED', 'true') === 'true',
  enableCrashlytics: true,
  logLevel: getEnvVar('EXPO_PUBLIC_LOG_LEVEL', 'info') as
    | 'debug'
    | 'info'
    | 'warn'
    | 'error',
  maxRetries: parseInt(getEnvVar('EXPO_PUBLIC_MAX_RETRIES', '5'), 10),
  timeoutMs: parseInt(getEnvVar('EXPO_PUBLIC_API_TIMEOUT', '15000'), 10),
  // Staging-specific settings
  firebaseRulesFile: 'firestore.production.rules', // Use production rules for staging
  enablePerformanceMonitoring: true,
  enableRemoteConfig: true,
  enforceSecurityRules: true,
  enableRateLimiting: true,
  maxTasksPerUser: 500, // Moderate limits for staging
  maxPartnershipsPerUser: 5,
};

// Production Configuration
const productionConfig: EnvironmentConfig = {
  apiUrl: getEnvVar('EXPO_PUBLIC_API_BASE_URL', ''),
  firebaseConfig: {
    apiKey: getEnvVar('EXPO_PUBLIC_FIREBASE_API_KEY', ''),
    authDomain: getEnvVar('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', ''),
    projectId: getEnvVar('EXPO_PUBLIC_FIREBASE_PROJECT_ID', ''),
    storageBucket: getEnvVar('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', ''),
    messagingSenderId: getEnvVar(
      'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      '',
    ),
    appId: getEnvVar('EXPO_PUBLIC_FIREBASE_APP_ID_ANDROID', ''),
    measurementId: getEnvVar('EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID', ''),
  },
  enableAnalytics:
    getEnvVar('EXPO_PUBLIC_ANALYTICS_ENABLED', 'true') === 'true',
  enableCrashlytics: true,
  logLevel: getEnvVar('EXPO_PUBLIC_LOG_LEVEL', 'error') as
    | 'debug'
    | 'info'
    | 'warn'
    | 'error',
  maxRetries: parseInt(getEnvVar('EXPO_PUBLIC_MAX_RETRIES', '5'), 10),
  timeoutMs: parseInt(getEnvVar('EXPO_PUBLIC_API_TIMEOUT', '20000'), 10),
  // Production-specific settings
  firebaseRulesFile: 'firestore.production.rules',
  enablePerformanceMonitoring: true,
  enableRemoteConfig: true,
  enforceSecurityRules: true,
  enableRateLimiting: true,
  maxTasksPerUser: 200, // Strict limits for production
  maxPartnershipsPerUser: 3,
};

/**
 * Get current environment based on build configuration
 */
export const getCurrentEnvironment = (): Environment => {
  // Check explicit environment variable first
  const explicitEnv = getEnvVar('EXPO_PUBLIC_ENVIRONMENT', '');
  if (explicitEnv && ['development', 'staging', 'production'].includes(explicitEnv)) {
    return explicitEnv as Environment;
  }

  // Check for EAS build profile
  const easBuildProfile = getEnvVar('EAS_BUILD_PROFILE', '');
  if (easBuildProfile === 'production') {
    return 'production';
  }
  if (easBuildProfile === 'preview' || easBuildProfile === 'staging') {
    return 'staging';
  }

  // Check for development client
  if (__DEV__ || getEnvVar('EXPO_PUBLIC_DEV_CLIENT', 'false') === 'true') {
    return 'development';
  }

  // Check NODE_ENV as fallback
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  if (process.env.NODE_ENV === 'staging') {
    return 'staging';
  }

  // Default to development for safety
  return 'development';
};

/**
 * Get configuration for current environment
 */
export const getEnvironmentConfig = (): EnvironmentConfig => {
  const environment = getCurrentEnvironment();

  switch (environment) {
    case 'development':
      return developmentConfig;
    case 'staging':
      return stagingConfig;
    case 'production':
      return productionConfig;
    default:
      return developmentConfig;
  }
};

/**
 * Check if current environment is production
 */
export const isProduction = (): boolean => {
  return getCurrentEnvironment() === 'production';
};

/**
 * Check if current environment is development
 */
export const isDevelopment = (): boolean => {
  return getCurrentEnvironment() === 'development';
};

/**
 * Check if analytics should be enabled
 */
export const shouldEnableAnalytics = (): boolean => {
  return getEnvironmentConfig().enableAnalytics;
};

/**
 * Check if crashlytics should be enabled
 */
export const shouldEnableCrashlytics = (): boolean => {
  return getEnvironmentConfig().enableCrashlytics;
};

/**
 * Get API base URL for current environment
 */
export const getApiUrl = (): string => {
  return getEnvironmentConfig().apiUrl;
};

/**
 * Get Firebase configuration for current environment
 */
export const getFirebaseConfig = () => {
  return getEnvironmentConfig().firebaseConfig;
};

/**
 * Validate environment configuration
 */
export const validateEnvironmentConfig = (): { isValid: boolean; errors: string[] } => {
  const config = getEnvironmentConfig();
  const errors: string[] = [];

  // Validate Firebase configuration
  const requiredFirebaseFields = [
    'apiKey', 'authDomain', 'projectId', 'storageBucket', 
    'messagingSenderId', 'appId',
  ];

  requiredFirebaseFields.forEach(field => {
    if (!config.firebaseConfig[field as keyof typeof config.firebaseConfig]) {
      errors.push(`Missing Firebase configuration: ${field}`);
    }
  });

  // Validate project ID format
  if (config.firebaseConfig.projectId && !config.firebaseConfig.projectId.match(/^[a-z0-9-]+$/)) {
    errors.push('Invalid Firebase project ID format');
  }

  // Validate environment-specific requirements
  const environment = getCurrentEnvironment();
  
  if (environment === 'production') {
    // Production-specific validations
    if (!config.firebaseConfig.measurementId) {
      errors.push('Production environment requires measurementId for analytics');
    }
    
    if (!config.enableCrashlytics) {
      errors.push('Production environment should have crashlytics enabled');
    }
    
    if (config.logLevel === 'debug') {
      errors.push('Production environment should not use debug log level');
    }
  }

  // Validate numeric values
  if (config.maxRetries < 1 || config.maxRetries > 10) {
    errors.push('maxRetries should be between 1 and 10');
  }

  if (config.timeoutMs < 1000 || config.timeoutMs > 60000) {
    errors.push('timeoutMs should be between 1000 and 60000');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get Firebase rules file for current environment
 */
export const getFirebaseRulesFile = (): string => {
  return getEnvironmentConfig().firebaseRulesFile;
};

/**
 * Check if performance monitoring should be enabled
 */
export const shouldEnablePerformanceMonitoring = (): boolean => {
  return getEnvironmentConfig().enablePerformanceMonitoring;
};

/**
 * Check if remote config should be enabled
 */
export const shouldEnableRemoteConfig = (): boolean => {
  return getEnvironmentConfig().enableRemoteConfig;
};

/**
 * Check if security rules should be strictly enforced
 */
export const shouldEnforceSecurityRules = (): boolean => {
  return getEnvironmentConfig().enforceSecurityRules;
};

/**
 * Check if rate limiting should be enabled
 */
export const shouldEnableRateLimiting = (): boolean => {
  return getEnvironmentConfig().enableRateLimiting;
};

/**
 * Get maximum tasks per user for current environment
 */
export const getMaxTasksPerUser = (): number => {
  return getEnvironmentConfig().maxTasksPerUser;
};

/**
 * Get maximum partnerships per user for current environment
 */
export const getMaxPartnershipsPerUser = (): number => {
  return getEnvironmentConfig().maxPartnershipsPerUser;
};

/**
 * Get environment-specific Firebase project configuration
 */
export const getFirebaseProjectConfig = () => {
  const environment = getCurrentEnvironment();
  const config = getEnvironmentConfig();
  
  return {
    environment,
    projectId: config.firebaseConfig.projectId,
    rulesFile: config.firebaseRulesFile,
    features: {
      analytics: config.enableAnalytics,
      crashlytics: config.enableCrashlytics,
      performance: config.enablePerformanceMonitoring,
      remoteConfig: config.enableRemoteConfig,
    },
    security: {
      enforceRules: config.enforceSecurityRules,
      rateLimiting: config.enableRateLimiting,
    },
    limits: {
      maxTasksPerUser: config.maxTasksPerUser,
      maxPartnershipsPerUser: config.maxPartnershipsPerUser,
    },
  };
};

// Export current environment config for easy access
export const config = getEnvironmentConfig();
