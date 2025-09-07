import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Checkbox, Text } from 'react-native-paper';
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
import { DURATIONS, EASING } from '../../utils/animations';
import { useAccessibility } from '../../utils/accessibility';

type SignUpScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'SignUp'
>;

interface FormData {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  displayName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<SignUpScreenNavigationProp>();
  const { signUp, isLoading, error, clearError } = useAuth();
  const { reduceMotionEnabled } = useAccessibility();

  const [formData, setFormData] = useState<FormData>({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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
  const validateDisplayName = (name: string): string | undefined => {
    if (!name.trim()) {
      return 'Display name is required';
    }
    if (name.trim().length < 2) {
      return 'Display name must be at least 2 characters';
    }
    if (name.trim().length > 50) {
      return 'Display name must be less than 50 characters';
    }
    return undefined;
  };

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
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return undefined;
  };

  const validateConfirmPassword = (
    confirmPassword: string,
    password: string,
  ): string | undefined => {
    if (!confirmPassword) {
      return 'Please confirm your password';
    }
    if (confirmPassword !== password) {
      return 'Passwords do not match';
    }
    return undefined;
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    errors.displayName = validateDisplayName(formData.displayName);
    errors.email = validateEmail(formData.email);
    errors.password = validatePassword(formData.password);
    errors.confirmPassword = validateConfirmPassword(
      formData.confirmPassword,
      formData.password,
    );

    setFormErrors(errors);
    return (
      !errors.displayName &&
      !errors.email &&
      !errors.password &&
      !errors.confirmPassword
    );
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

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    if (!acceptedTerms) {
      Alert.alert(
        'Terms Required',
        'Please accept the terms and conditions to continue.',
      );
      return;
    }

    try {
      const result = await signUp({
        email: formData.email.trim(),
        password: formData.password,
        displayName: formData.displayName.trim(),
      });

      if (result.success) {
        // Navigation will be handled by the auth state change
        // Sign up successful - no action needed as auth state will handle navigation
      } else if (result.error) {
        Alert.alert('Sign Up Failed', result.error);
      }
    } catch (err) {
      Alert.alert(
        'Sign Up Failed',
        'An unexpected error occurred. Please try again.',
      );
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
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
              Create Account
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Join MoonGaze and start sharing tasks with your partner
            </Text>
          </Animated.View>

          <Animated.View style={cardAnimatedStyle}>
            <EnhancedCard variant="elevated" padding="lg" style={styles.card}>
              <EnhancedTextInput
                label="Display Name"
                value={formData.displayName}
                onChangeText={(value) =>
                  handleInputChange('displayName', value)
                }
                autoCapitalize="words"
                errorText={formErrors.displayName}
                disabled={isLoading}
                style={styles.input}
                accessibilityLabel="Display name"
                accessibilityHint="Enter your display name for your profile"
                required
              />

              <EnhancedTextInput
                label="Email"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                errorText={formErrors.email}
                disabled={isLoading}
                style={styles.input}
                accessibilityLabel="Email address"
                accessibilityHint="Enter your email address for your account"
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
                disabled={isLoading}
                style={styles.input}
                accessibilityLabel="Password"
                accessibilityHint="Create a secure password for your account"
                required
              />

              <EnhancedTextInput
                label="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={(value) =>
                  handleInputChange('confirmPassword', value)
                }
                secureTextEntry={!showConfirmPassword}
                errorText={formErrors.confirmPassword}
                rightIcon={showConfirmPassword ? 'eye-off' : 'eye'}
                onIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
                style={styles.input}
                accessibilityLabel="Confirm password"
                accessibilityHint="Re-enter your password to confirm"
                required
              />

              <View style={styles.termsContainer}>
                <Checkbox
                  status={acceptedTerms ? 'checked' : 'unchecked'}
                  onPress={() => setAcceptedTerms(!acceptedTerms)}
                  disabled={isLoading}
                />
                <Text variant="bodyMedium" style={styles.termsText}>
                  I accept the Terms and Conditions and Privacy Policy
                </Text>
              </View>

              {error && (
                <ErrorDisplay
                  error={error}
                  variant="inline"
                  showRetry={false}
                  showDismiss={false}
                />
              )}

              <EnhancedButton
                variant="primary"
                size="lg"
                onPress={handleSignUp}
                loading={isLoading}
                disabled={isLoading || !acceptedTerms}
                fullWidth
                style={styles.signUpButton}
                accessibilityLabel="Create your account"
              >
                Create Account
              </EnhancedButton>
            </EnhancedCard>
          </Animated.View>

          <Animated.View style={footerAnimatedStyle}>
            <View style={styles.loginContainer}>
              <Text variant="bodyMedium" style={styles.loginText}>
                Already have an account?{' '}
              </Text>
              <EnhancedButton
                variant="ghost"
                size="sm"
                onPress={navigateToLogin}
                disabled={isLoading}
                accessibilityLabel="Sign in to existing account"
              >
                Sign In
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
    backgroundColor: `${theme.colors.surface  }FA`, // Subtle surface tint
    borderColor: `${theme.colors.outline  }15`, // Very subtle border
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    marginBottom: theme.spacing.lg,
  },
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    marginBottom: theme.spacing.sm,
  },
  loginContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
  },
  loginText: {
    color: theme.colors.onSurfaceVariant,
    textShadowColor: theme.colors.textShadowTransparent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  signUpButton: {
    marginTop: theme.spacing.lg,
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.typography.fontSizes.lg,
    lineHeight:
      theme.typography.fontSizes.lg * theme.typography.lineHeights.relaxed,
    marginBottom: theme.spacing['2xl'],
    textAlign: 'center',
    textShadowColor: theme.colors.textShadowTransparent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  termsContainer: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xs,
  },
  termsText: {
    color: theme.colors.onSurfaceVariant,
    flex: 1,
    fontSize: theme.typography.fontSizes.sm,
    lineHeight:
      theme.typography.fontSizes.sm * theme.typography.lineHeights.normal,
    marginLeft: theme.spacing.sm,
    textShadowColor: theme.colors.textShadowTransparent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  title: {
    color: theme.colors.onBackground,
    fontSize: theme.typography.fontSizes['3xl'],
    fontWeight: theme.typography.fontWeights.semibold,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
    textShadowColor: theme.colors.textShadowTransparent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
});
