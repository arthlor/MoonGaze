import React, { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  IconButton,
  Text,
} from 'react-native-paper';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { doc, onSnapshot } from 'firebase/firestore';

import { theme } from '../../utils/theme';
import { createNewLinkingCode } from '../../services/linkingService';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useDeepLinking } from '../../hooks/useDeepLinking';
import EnhancedButton from '../../components/EnhancedButton';
import EnhancedCard from '../../components/EnhancedCard';

interface CodeGeneratorProps {
  onBack: () => void;
  onSuccess: (partnerName?: string) => void;
}

export const CodeGenerator: React.FC<CodeGeneratorProps> = ({
  onBack,
  onSuccess,
}) => {
  const { refreshUser } = useAuth();
  const { sharePartnerInvite } = useDeepLinking();
  const [code, setCode] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isLinking, setIsLinking] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);

  useEffect(() => {
    generateCode();
  }, []);

  // Listen for code usage in real-time
  useEffect(() => {
    if (!code) return;

    const unsubscribe = onSnapshot(
      doc(db, 'linkingCodes', code),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (data.isUsed) {
            // Code was used, show linking state and refresh user data
            setIsLinking(true);
            refreshUser().then(() => {
              onSuccess('Partner'); // TODO: Get actual partner name
            }).catch(() => {
              setIsLinking(false);
              Alert.alert('Success!', 'You have been linked with your partner!', [
                { text: 'Continue', onPress: () => onSuccess('Partner') },
              ]);
            });
          }
        }
      },
      () => {
        // Error listening to code updates - silently handle
        // The component will continue to function normally
      },
    );

    return () => unsubscribe();
  }, [code, onSuccess, refreshUser]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timeLeft]);

  const generateCode = async () => {
    setIsGenerating(true);
    setIsExpired(false);
    
    try {
      const result = await createNewLinkingCode();
      setCode(result.code);
      
      // Calculate time left based on expiration date
      const now = new Date();
      const timeLeftMs = result.expiresAt.getTime() - now.getTime();
      const timeLeftSeconds = Math.max(0, Math.floor(timeLeftMs / 1000));
      setTimeLeft(timeLeftSeconds);
      
      if (timeLeftSeconds <= 0) {
        setIsExpired(true);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate code. Please try again.';
      Alert.alert('Error', errorMessage);
      
    } finally {
      setIsGenerating(false);
    }
  };



  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleRegenerateCode = () => {
    generateCode();
  };

  const handleShareCode = async () => {
    if (!code) return;
    
    setIsSharing(true);
    try {
      const shared = await sharePartnerInvite(code);
      if (shared) {
        Alert.alert('Shared!', 'Invitation sent to your partner.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share invitation. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const getTimeColor = (): string => {
    if (timeLeft > 300) return theme.colors.primary; // > 5 minutes
    if (timeLeft > 60) return theme.colors.warning; // > 1 minute (amber)
    return theme.colors.error; // < 1 minute (red)
  };

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
          Share This Code
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(200).delay(50)}>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Share this code with your partner. It expires in 15 minutes.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(200).delay(100)}>
        <EnhancedCard 
          variant="flat" 
          padding="lg" 
          style={styles.codeCard}
        >
          {isGenerating ? (
            <Animated.View 
              style={styles.loadingContainer}
              entering={FadeInDown.duration(200)}
            >
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text variant="bodyMedium" style={styles.loadingText}>
                Generating code...
              </Text>
            </Animated.View>
          ) : isLinking ? (
            <Animated.View 
              style={styles.loadingContainer}
              entering={FadeInDown.duration(200)}
            >
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text variant="bodyMedium" style={styles.loadingText}>
                Linking with partner...
              </Text>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.duration(200)}>
              <Animated.View entering={FadeInDown.duration(200).delay(50)}>
                <Text variant="displaySmall" style={styles.code}>
                  {code}
                </Text>
              </Animated.View>
              
              <Animated.View 
                style={styles.timerContainer}
                entering={FadeInDown.duration(200).delay(100)}
              >
                <Text 
                  variant="titleMedium" 
                  style={[styles.timer, { color: getTimeColor() }]}
                >
                  {isExpired ? 'Expired' : formatTime(timeLeft)}
                </Text>
                {!isExpired && (
                  <Text variant="bodySmall" style={styles.timerLabel}>
                    Time remaining
                  </Text>
                )}
              </Animated.View>

              {isExpired && (
                <Animated.View entering={FadeInDown.duration(200)}>
                  <Text variant="bodyMedium" style={styles.expiredText}>
                    This code has expired. Generate a new one to continue.
                  </Text>
                </Animated.View>
              )}
            </Animated.View>
          )}
        </EnhancedCard>
      </Animated.View>

      <Animated.View 
        style={styles.actionContainer}
        entering={FadeInDown.duration(200).delay(150)}
      >
        {isExpired || !code ? (
          <EnhancedButton
            variant="primary"
            size="md"
            onPress={handleRegenerateCode}
            disabled={isGenerating || isLinking}
            loading={isGenerating}
            style={styles.actionButton}
          >
            {code ? 'Generate New Code' : 'Retry'}
          </EnhancedButton>
        ) : (
          <>
            <EnhancedButton
              variant="primary"
              size="md"
              onPress={handleShareCode}
              disabled={isGenerating || isLinking || isSharing}
              loading={isSharing}
              style={StyleSheet.flatten([styles.actionButton, styles.shareButton])}
            >
              Share Invitation
            </EnhancedButton>
            <EnhancedButton
              variant="secondary"
              size="md"
              onPress={handleRegenerateCode}
              disabled={isGenerating || isLinking || isSharing}
              style={styles.actionButton}
            >
              Generate New Code
            </EnhancedButton>
          </>
        )}
      </Animated.View>

      <Animated.View 
        entering={FadeInDown.duration(200).delay(200)}
      >
        <EnhancedCard 
          variant="flat" 
          padding="md" 
          style={styles.instructionsContainer}
        >
          <Text variant="titleSmall" style={styles.instructionsTitle}>
            How to share:
          </Text>
          <Text variant="bodyMedium" style={styles.instructionText}>
            • Tell your partner the code: {code}
          </Text>
          <Text variant="bodyMedium" style={styles.instructionText}>
            • They should select &ldquo;I have a code&rdquo; in their app
          </Text>
          <Text variant="bodyMedium" style={styles.instructionText}>
            • Once they enter it, you&rsquo;ll both be linked!
          </Text>
        </EnhancedCard>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    marginBottom: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
  },
  actionContainer: {
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    marginRight: theme.spacing.sm,
  },
  code: {
    color: theme.colors.primary,
    fontFamily: 'monospace',
    fontSize: theme.typography.sizes.xl,
    fontWeight: '600' as const,
    letterSpacing: 2,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  codeCard: {
    alignItems: 'center',
    borderColor: theme.colors.border,
    borderWidth: 1,
    marginBottom: theme.spacing.lg,
  },
  container: {
    flex: 1,
  },
  expiredText: {
    color: theme.colors.error,
    fontSize: theme.typography.sizes.base,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  instructionText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.typography.sizes.base,
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.base,
    marginBottom: theme.spacing.sm,
  },
  instructionsContainer: {
    borderColor: theme.colors.border,
    borderWidth: 1,
    marginHorizontal: theme.spacing.xs,
  },
  instructionsTitle: {
    color: theme.colors.onSurface,
    fontSize: theme.typography.sizes.base,
    fontWeight: '600' as const,
    marginBottom: theme.spacing.sm,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  loadingText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.typography.sizes.base,
    marginTop: theme.spacing.md,
  },
  shareButton: {
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.typography.sizes.lg,
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.lg,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  timer: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: '600' as const,
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerLabel: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.typography.sizes.sm,
    marginTop: theme.spacing.xs,
  },
  title: {
    color: theme.colors.onBackground,
    flex: 1,
    fontSize: theme.typography.sizes.lg,
    fontWeight: '600' as const,
  },
});