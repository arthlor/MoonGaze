import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Text,
} from 'react-native-paper';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import { AuthStackParamList } from '../../types';
import { theme } from '../../utils/theme';
import { EnhancedButton, EnhancedCard, EnhancedIconButton, EnhancedTextInput } from '../../components';
import { DURATIONS, EASING } from '../../utils/animations';
import { useAccessibility } from '../../utils/accessibility';

type ForgotPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const { resetPassword, clearError } = useAuth();
  const { reduceMotionEnabled } = useAccessibility();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    if (!reduceMotionEnabled) {
      headerOpacity.value = withTiming(1, { duration: DURATIONS.normal, easing: EASING });
      titleOpacity.value = withDelay(50, withTiming(1, { duration: DURATIONS.normal, easing: EASING }));
      cardOpacity.value = withDelay(100, withTiming(1, { duration: DURATIONS.normal, easing: EASING }));
    } else {
      headerOpacity.value = 1;
      titleOpacity.value = 1;
      cardOpacity.value = 1;
    }
  }, [cardOpacity, headerOpacity, reduceMotionEnabled, titleOpacity]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
  }));

  // Validation function
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

  const handleEmailChange = (value: string) => {
    setEmail(value);
    
    // Clear field error when user starts typing
    if (emailError) {
      setEmailError(undefined);
    }
    
    // Clear auth error when user starts typing
    clearError();
    
    // Reset email sent state when user changes email
    if (emailSent) {
      setEmailSent(false);
    }
  };

  const handleResetPassword = async () => {
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }

    setIsLoading(true);
    setEmailError(undefined);

    try {
      const result = await resetPassword(email.trim());

      if (result.success) {
        setEmailSent(true);
        Alert.alert(
          'Reset Email Sent',
          'Please check your email for password reset instructions.',
          [{ text: 'OK' }],
        );
      } else if (result.error) {
        Alert.alert('Reset Failed', result.error);
      }
    } catch (err) {
      Alert.alert('Reset Failed', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = () => {
    setEmailSent(false);
    handleResetPassword();
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  const goBack = () => {
    navigation.goBack();
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
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <EnhancedIconButton
            icon="arrow-left"
            size="md"
            onPress={goBack}
            variant="ghost"
            style={styles.backButton}
            accessibilityLabel="Go back to login"
          />
        </Animated.View>

        <View style={styles.content}>
          <Animated.View style={titleAnimatedStyle}>
            <Text variant="headlineMedium" style={styles.title}>
              Reset Password
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              {emailSent
                ? 'We\'ve sent password reset instructions to your email address.'
                : 'Enter your email address and we\'ll send you instructions to reset your password.'
              }
            </Text>
          </Animated.View>

          <Animated.View style={cardAnimatedStyle}>
            <EnhancedCard variant="elevated" padding="lg" style={styles.card}>
            {!emailSent ? (
              <>
                <EnhancedTextInput
                  label="Email"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  errorText={emailError}
                  disabled={isLoading}
                  style={styles.input}
                  accessibilityLabel="Email address"
                  accessibilityHint="Enter your email to receive password reset instructions"
                  required
                />

                <EnhancedButton
                  variant="primary"
                  size="lg"
                  onPress={handleResetPassword}
                  loading={isLoading}
                  disabled={isLoading || !email.trim()}
                  fullWidth
                  style={styles.resetButton}
                  accessibilityLabel="Send password reset instructions"
                >
                  Send Reset Instructions
                </EnhancedButton>
              </>
            ) : (
              <View style={styles.successContainer}>
                <Text variant="bodyMedium" style={styles.successText}>
                  If an account with this email exists, you&apos;ll receive reset instructions shortly.
                </Text>
                
                <Text variant="bodyMedium" style={styles.checkSpamText}>
                  Don&apos;t see the email? Check your spam folder or try again.
                </Text>

                <EnhancedButton
                  variant="secondary"
                  size="md"
                  onPress={handleResendEmail}
                  disabled={isLoading}
                  style={styles.resendButton}
                  accessibilityLabel="Resend password reset email"
                >
                  Resend Email
                </EnhancedButton>
              </View>
            )}

            <EnhancedButton
              variant="ghost"
              size="md"
              onPress={navigateToLogin}
              disabled={isLoading}
              style={styles.backToLoginButton}
              accessibilityLabel="Return to sign in screen"
            >
              Back to Sign In
            </EnhancedButton>
            </EnhancedCard>
          </Animated.View>

          {emailSent && (
            <View style={styles.helpContainer}>
              <Text variant="bodySmall" style={styles.helpText}>
                Still having trouble? Contact support for assistance.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  backButton: {
    margin: 0,
  },
  backToLoginButton: {
    marginTop: theme.spacing.md,
  },
  card: {
    backgroundColor: `${theme.colors.surface  }FA`, // Subtle surface tint
    borderColor: `${theme.colors.outline  }15`, // Very subtle border
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    marginBottom: theme.spacing.lg,
  },
  checkSpamText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.typography.fontSizes.sm,
    lineHeight: theme.typography.fontSizes.sm * theme.typography.lineHeights.normal,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
    textShadowColor: theme.colors.textShadowTransparent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  helpContainer: {
    alignItems: 'center',
  },
  helpText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.typography.fontSizes.sm,
    fontStyle: 'italic',
    textAlign: 'center',
    textShadowColor: theme.colors.textShadowTransparent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  input: {
    marginBottom: theme.spacing.sm,
  },
  resendButton: {
    marginBottom: theme.spacing.lg,
  },
  resetButton: {
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: theme.spacing.lg,
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.typography.fontSizes.lg,
    lineHeight: theme.typography.fontSizes.lg * theme.typography.lineHeights.relaxed,
    marginBottom: theme.spacing['2xl'],
    textAlign: 'center',
    textShadowColor: theme.colors.textShadowTransparent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  successContainer: {
    alignItems: 'center',
  },
  successText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.typography.fontSizes.base,
    lineHeight: theme.typography.fontSizes.base * theme.typography.lineHeights.normal,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
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