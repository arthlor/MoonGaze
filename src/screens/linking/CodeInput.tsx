import React, { useState } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  IconButton,
  Text,
} from 'react-native-paper';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { theme } from '../../utils/theme';
import { linkWithPartner } from '../../services/linkingService';
import { useAuth } from '../../contexts/AuthContext';
import EnhancedButton from '../../components/EnhancedButton';
import EnhancedCard from '../../components/EnhancedCard';
import EnhancedTextInput from '../../components/EnhancedTextInput';

interface CodeInputProps {
  onBack: () => void;
  onSuccess: (partnerName?: string) => void;
  prefillCode?: string;
}

const formatCode = (input: string): string => {
  // Remove any non-alphanumeric characters and convert to uppercase
  const cleaned = input.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  
  // Add hyphen after 3 characters
  if (cleaned.length > 3) {
    return `${cleaned.slice(0, 3)  }-${  cleaned.slice(3, 6)}`;
  }
  return cleaned;
};

export const CodeInput: React.FC<CodeInputProps> = ({
  onBack,
  onSuccess,
  prefillCode,
}) => {
  const { refreshUser } = useAuth();
  const [code, setCode] = useState<string>(prefillCode ? formatCode(prefillCode) : '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const validateCode = (code: string): string | undefined => {
    if (!code.trim()) {
      return 'Please enter a code';
    }
    
    // Remove hyphen for validation
    const cleanCode = code.replace('-', '');
    
    if (cleanCode.length !== 6) {
      return 'Code must be 6 characters long';
    }
    
    if (!/^[A-Z0-9]{6}$/i.test(cleanCode)) {
      return 'Code can only contain letters and numbers';
    }
    
    return undefined;
  };

  const handleCodeChange = (input: string) => {
    const formatted = formatCode(input);
    setCode(formatted);
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async () => {
    const validationError = validateCode(code);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await linkWithPartner(code);
      
      // Refresh user data to get updated partner information
      await refreshUser();
      
      // Navigate to success screen
      onSuccess('Partner'); // TODO: Get actual partner name from user data
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to link with partner. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };



  const isCodeComplete = code.replace('-', '').length === 6;

  return (
    <View style={styles.container}>
      <Animated.View 
        style={styles.header}
        entering={FadeInDown.duration(200)}
      >
        <IconButton
          icon="arrow-left"
          onPress={onBack}
          style={styles.backButton}
        />
        <Text variant="headlineSmall" style={styles.title}>
          Enter Partner Code
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(200).delay(50)}>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Enter the 6-character code your partner shared with you.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(200).delay(100)}>
        <EnhancedCard 
          variant="flat" 
          padding="lg" 
          style={styles.inputCard}
        >
          <EnhancedTextInput
            label="Partner Code"
            value={code}
            onChangeText={handleCodeChange}
            size="lg"
            placeholder="ABC-123"
            autoCapitalize="characters"
            helperText={error ? undefined : 'Format: ABC-123 (letters and numbers)'}
            errorText={error}
            disabled={isSubmitting}
            style={styles.codeInput}
            inputStyle={styles.codeInputText}
            accessibilityLabel="Partner code input"
            accessibilityHint="Enter the 6-character code from your partner"
          />

          {isSubmitting && (
            <Animated.View 
              style={styles.submittingContainer}
              entering={FadeInDown.duration(200)}
            >
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text variant="bodySmall" style={styles.submittingText}>
                Validating code...
              </Text>
            </Animated.View>
          )}
        </EnhancedCard>
      </Animated.View>

      <Animated.View 
        style={styles.actionContainer}
        entering={FadeInDown.duration(200).delay(150)}
      >
        <EnhancedButton
          variant="primary"
          size="md"
          onPress={handleSubmit}
          disabled={!isCodeComplete || isSubmitting}
          loading={isSubmitting}
          style={styles.submitButton}
          fullWidth={true}
        >
          Link with Partner
        </EnhancedButton>
      </Animated.View>

      <Animated.View 
        entering={FadeInDown.duration(200).delay(200)}
      >
        <EnhancedCard 
          variant="flat" 
          padding="md" 
          style={styles.helpContainer}
        >
          <Text variant="titleSmall" style={styles.helpTitle}>
            Need help?
          </Text>
          <Text variant="bodyMedium" style={styles.helpText}>
            • Make sure your partner has generated a code
          </Text>
          <Text variant="bodyMedium" style={styles.helpText}>
            • Codes expire after 15 minutes
          </Text>
          <Text variant="bodyMedium" style={styles.helpText}>
            • Check that you&rsquo;ve entered all 6 characters correctly
          </Text>
          <Text variant="bodyMedium" style={styles.helpText}>
            • Ask your partner to generate a new code if needed
          </Text>
        </EnhancedCard>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  actionContainer: {
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  backButton: {
    marginRight: theme.spacing.sm,
  },
  codeInput: {
    marginBottom: theme.spacing.sm,
  },
  codeInputText: {
    fontFamily: 'monospace',
    fontSize: theme.typography.sizes.xl,
    letterSpacing: 4,
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  helpContainer: {
    borderColor: theme.colors.border,
    borderWidth: 1,
    marginHorizontal: theme.spacing.xs,
  },
  helpText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.typography.sizes.base,
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.base,
    marginBottom: theme.spacing.sm,
  },
  helpTitle: {
    color: theme.colors.onSurface,
    fontSize: theme.typography.sizes.base,
    fontWeight: '600' as const,
    marginBottom: theme.spacing.sm,
  },
  inputCard: {
    borderColor: theme.colors.border,
    borderWidth: 1,
    marginBottom: theme.spacing.lg,
  },
  submitButton: {
    // fullWidth handled by component prop
  },
  submittingContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  submittingText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.typography.sizes.sm,
    marginLeft: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.typography.sizes.lg,
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.lg,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  title: {
    color: theme.colors.onBackground,
    flex: 1,
    fontSize: theme.typography.sizes.lg,
    fontWeight: '600' as const,
  },
});