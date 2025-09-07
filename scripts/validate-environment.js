#!/usr/bin/env node

/**
 * Environment Configuration Validation Script
 * 
 * This script validates the Firebase and environment configuration
 * for the MoonGaze app across different environments.
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found. Please copy .env.example to .env and configure it.');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return envVars;
}

// Validate Firebase configuration
function validateFirebaseConfig(env) {
  const requiredFields = [
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID_ANDROID',
    'EXPO_PUBLIC_FIREBASE_APP_ID_IOS',
  ];

  const errors = [];
  const warnings = [];

  requiredFields.forEach(field => {
    if (!env[field] || env[field].trim() === '') {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Validate project ID format
  const projectId = env['EXPO_PUBLIC_FIREBASE_PROJECT_ID'];
  if (projectId && !projectId.match(/^[a-z0-9-]+$/)) {
    errors.push('Firebase project ID must contain only lowercase letters, numbers, and hyphens');
  }

  // Check environment-specific requirements
  const environment = env['EXPO_PUBLIC_ENVIRONMENT'] || 'development';
  
  if (environment === 'production') {
    if (!env['EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID']) {
      warnings.push('Production environment should have EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID for analytics');
    }
    
    if (env['EXPO_PUBLIC_LOG_LEVEL'] === 'debug') {
      warnings.push('Production environment should not use debug log level');
    }
  }

  return { errors, warnings };
}

// Validate file existence
function validateFiles() {
  const requiredFiles = [
    'firestore.rules',
    'firestore.production.rules',
    'firestore.indexes.json',
    'firebase.json',
    'firebase.production.json',
  ];

  const errors = [];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) {
      errors.push(`Missing required file: ${file}`);
    }
  });

  return errors;
}

// Main validation function
function validateEnvironment() {
  console.log('🔍 Validating MoonGaze environment configuration...\n');

  const env = loadEnvFile();
  const environment = env['EXPO_PUBLIC_ENVIRONMENT'] || 'development';
  
  console.log(`📍 Current environment: ${environment}\n`);

  // Validate Firebase configuration
  const { errors: firebaseErrors, warnings: firebaseWarnings } = validateFirebaseConfig(env);
  
  // Validate required files
  const fileErrors = validateFiles();
  
  // Combine all errors
  const allErrors = [...firebaseErrors, ...fileErrors];
  
  // Display results
  if (allErrors.length > 0) {
    console.log('❌ Configuration Errors:');
    allErrors.forEach(error => console.log(`   • ${error}`));
    console.log('');
  }
  
  if (firebaseWarnings.length > 0) {
    console.log('⚠️  Configuration Warnings:');
    firebaseWarnings.forEach(warning => console.log(`   • ${warning}`));
    console.log('');
  }
  
  if (allErrors.length === 0) {
    console.log('✅ Environment configuration is valid!');
    
    if (firebaseWarnings.length === 0) {
      console.log('✅ No warnings found.');
    }
    
    console.log('\n📋 Configuration Summary:');
    console.log(`   • Environment: ${environment}`);
    console.log(`   • Project ID: ${env['EXPO_PUBLIC_FIREBASE_PROJECT_ID']}`);
    console.log(`   • Analytics: ${env['EXPO_PUBLIC_ANALYTICS_ENABLED'] === 'true' ? 'Enabled' : 'Disabled'}`);
    console.log(`   • Log Level: ${env['EXPO_PUBLIC_LOG_LEVEL'] || 'info'}`);
    
    process.exit(0);
  } else {
    console.log(`\n❌ Found ${allErrors.length} error(s) that must be fixed before deployment.`);
    
    if (environment === 'production') {
      console.log('\n🚨 Production deployment will fail with these errors!');
    }
    
    process.exit(1);
  }
}

// Run validation
validateEnvironment();