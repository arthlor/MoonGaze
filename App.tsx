import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components';
import { SnackbarProvider } from './src/components/Snackbar';

import { theme } from './src/utils/theme';
import { quickValidationCheck } from './src/utils/accessibilityValidation';
import { logError, validateEnvironmentSetup } from './src/utils/errorHandling';
import { getCurrentEnvironment } from './src/config/environment';

export default function App() {
  const [isEnvironmentValid, setIsEnvironmentValid] = useState<boolean | null>(null);
  const [environmentError, setEnvironmentError] = useState<string | null>(null);

  useEffect(() => {
    const validateEnvironment = async () => {
      try {
        const isValid = await validateEnvironmentSetup();
        setIsEnvironmentValid(isValid);
        
        if (!isValid && getCurrentEnvironment() === 'production') {
          setEnvironmentError('Critical configuration error detected. Please contact support.');
        }
        
        // Run accessibility validation in development
        if (__DEV__) {
          quickValidationCheck();
        }
      } catch (error) {
        logError(error as Error, 'App Environment Validation');
        setIsEnvironmentValid(false);
        setEnvironmentError('Failed to validate app configuration.');
      }
    };

    validateEnvironment();
  }, []);

  const handleError = (error: Error, _errorInfo: React.ErrorInfo) => {
    logError(error, 'App');
    // In production, you might want to send this to a crash reporting service
    logError(error, 'App Error Handler');
  };

  // Show error screen if environment validation failed in production
  if (isEnvironmentValid === false && getCurrentEnvironment() === 'production') {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <View style={[styles.container, styles.errorContainer]}>
            <Text style={styles.errorTitle}>Configuration Error</Text>
            <Text style={styles.errorMessage}>
              {environmentError || 'The app configuration is invalid. Please contact support.'}
            </Text>
          </View>
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  // Show loading screen while validating environment
  if (isEnvironmentValid === null) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <View style={[styles.container, styles.loadingContainer]}>
            <Text style={styles.loadingText}>Initializing...</Text>
          </View>
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <ErrorBoundary onError={handleError}>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <PaperProvider theme={theme}>
            <SnackbarProvider>
              <AuthProvider>
                <RootNavigator />
                <StatusBar style="auto" />
              </AuthProvider>
            </SnackbarProvider>
          </PaperProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.errorBackground,
    justifyContent: 'center',
    padding: 20,
  },
  errorMessage: {
    color: theme.colors.errorText,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  errorTitle: {
    color: theme.colors.errorTitle,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.loadingBackground,
    justifyContent: 'center',
  },
  loadingText: {
    color: theme.colors.loadingText,
    fontSize: 18,
    fontWeight: '500',
  },
});
