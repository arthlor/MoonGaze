import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import { AuthStackParamList } from '../../types';
import { theme } from '../../utils/theme';
import {
  EnhancedButton,
  EnhancedCard,
  EnhancedTextInput,
  ErrorDisplay,
} from '../../components';
import { useFormSubmission } from '../../hooks/useErrorHandler';
import { DURATIONS, EASING } from '../../utils/animations';
import { useAccessibility } from '../../utils/accessibility';

type LoginScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'Login'
>;

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login } = useAuth();
  const { submitting, error, hasError, submit, clearError } =
    useFormSubmission();
  const { reduceMotionEnabled } = useAccessibility();

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  // Animation values
  const titleOpacity = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const footerOpacity = useSharedValue(0);

  useEffect(() => {
    if (!reduceMotionEnabled) {
      titleOpacity.value = withTiming(1, {
        duration: DURATIONS.normal,
        easing: EASING,
      });
      cardOpacity.value = withDelay(
        100,
        withTiming(1, {
          duration: DURATIONS.normal,
          easing: EASING,
        }),
      );
      footerOpacity.value = withDelay(
        200,
        withTiming(1, {
          duration: DURATIONS.normal,
          easing: EASING,
        }),
      );
    } else {
      titleOpacity.value = 1;
      cardOpacity.value = 1;
      footerOpacity.value = 1;
    }
  }, [cardOpacity, footerOpacity, reduceMotionEnabled, titleOpacity]);

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
  }));

  const footerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
  }));

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    errors.email = validateEmail(formData.email);
    errors.password = validatePassword(formData.password);

    setFormErrors(errors);
    return !errors.email && !errors.password;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    // Clear auth error when user starts typing
    if (error) {
      clearError();
    }
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    const result = await submit(async () => {
      const loginResult = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (!loginResult.success) {
        throw new Error(loginResult.error || 'Login failed');
      }

      return loginResult;
    }, 'login');

    if (result.success) {
      // Navigation will be handled by the auth state change
      // Login successful - no action needed as auth state will handle navigation
    }
  };

  const navigateToSignUp = () => {
    navigation.navigate('SignUp');
  };

  const navigateToForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Animated.View style={titleAnimatedStyle}>
            <Text variant="headlineMedium" style={styles.title}>
              Welcome Back
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Sign in to your MoonGaze account
            </Text>
          </Animated.View>

          <Animated.View style={cardAnimatedStyle}>
            <EnhancedCard
              variant="elevated"
              padding="lg"
              style={styles.card}
            >
              <EnhancedTextInput
                label="Email"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                errorText={formErrors.email}
                disabled={submitting}
                style={styles.input}
                accessibilityLabel="Email address"
                accessibilityHint="Enter your email address to sign in"
                required
              />

              <EnhancedTextInput
                label="Password"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                secureTextEntry={!showPassword}
                errorText={formErrors.password}
                rightIcon={showPassword ? 'eye-off' : 'eye'}
                onIconPress={() => setShowPassword(!showPassword)}
                disabled={submitting}
                style={styles.input}
                accessibilityLabel="Password"
                accessibilityHint="Enter your password to sign in"
                required
              />

              {hasError && error && (
                <ErrorDisplay
                  error={error}
                  variant="inline"
                  showRetry={false}
                  onDismiss={clearError}
                  showDismiss={true}
                />
              )}

              <EnhancedButton
                variant="primary"
                size="lg"
                onPress={handleLogin}
                loading={submitting}
                disabled={submitting}
                fullWidth
                style={styles.loginButton}
                accessibilityLabel="Sign in to your account"
              >
                Sign In
              </EnhancedButton>

              <EnhancedButton
                variant="ghost"
                size="md"
                onPress={navigateToForgotPassword}
                disabled={submitting}
                style={styles.forgotButton}
                accessibilityLabel="Reset your password"
              >
                Forgot Password?
              </EnhancedButton>
            </EnhancedCard>
          </Animated.View>

          <Animated.View style={footerAnimatedStyle}>
            <View style={styles.signUpContainer}>
              <Text variant="bodyMedium" style={styles.signUpText}>
                Don&apos;t have an account?{' '}
              </Text>
              <EnhancedButton
                variant="ghost"
                size="sm"
                onPress={navigateToSignUp}
                disabled={submitting}
                accessibilityLabel="Create a new account"
              >
                Sign Up
              </EnhancedButton>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: `${theme.colors.outline  }10`, // More subtle border
    borderRadius: theme.borderRadius.xl, // Larger radius for modern look
    borderWidth: 1,
    marginBottom: theme.spacing.xl,
  },
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  forgotButton: {
    marginTop: theme.spacing.md, // Increased spacing
  },
  input: {
    marginBottom: theme.spacing.md, // Increased spacing between inputs
  },
  loginButton: {
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.xl, // Increased spacing before login button
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  signUpContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
  },
  signUpText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.typography.fontSizes.base,
    lineHeight:
      theme.typography.fontSizes.base * theme.typography.lineHeights.normal,
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.typography.fontSizes.lg,
    letterSpacing: 0.1,
    lineHeight:
      theme.typography.fontSizes.lg * theme.typography.lineHeights.normal,
    marginBottom: theme.spacing['2xl'],
    textAlign: 'center', // Subtle letter spacing for body text
  },
  title: {
    color: theme.colors.onBackground,
    fontSize: theme.typography.fontSizes['3xl'],
    fontWeight: theme.typography.fontWeights.semibold as '600',
    letterSpacing: -0.5,
    lineHeight:
      theme.typography.fontSizes['3xl'] * theme.typography.lineHeights.tight,
    marginBottom: theme.spacing.sm,
    textAlign: 'center', // Refined letter spacing for better readability
  },
});
