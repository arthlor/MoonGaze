/* eslint-disable react-native/sort-styles */
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  IconButton,
  Paragraph,
  Snackbar,
  Title,
} from 'react-native-paper';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../utils/theme';
import { ErrorInfo } from '../utils/errorHandling';
import { DURATIONS, EASING } from '../utils/animations';

interface ErrorDisplayProps {
  error: ErrorInfo | Error | string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetry?: boolean;
  showDismiss?: boolean;
  variant?: 'card' | 'inline' | 'banner' | 'modal' | 'toast';
  title?: string;
  visible?: boolean;
  autoHide?: boolean;
  duration?: number;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  showRetry = true,
  showDismiss = false,
  variant = 'card',
  title = 'Something went wrong',
  visible = true,
  autoHide = false,
  duration = 4000,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(variant === 'banner' ? -50 : 20);
  const scale = useSharedValue(0.9);
  // Enhanced error analysis with severity classification
  const getErrorMessage = (error: ErrorInfo | Error | string): string => {
    if (typeof error === 'string') {
      return error;
    }

    if ('userMessage' in error) {
      return error.userMessage;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'An unexpected error occurred';
  };

  const getErrorCode = (
    error: ErrorInfo | Error | string,
  ): string | undefined => {
    if (typeof error === 'string' || error instanceof Error) {
      return undefined;
    }

    return error.code;
  };

  const isRetryable = (error: ErrorInfo | Error | string): boolean => {
    if (typeof error === 'string' || error instanceof Error) {
      return true; // Default to retryable for generic errors
    }

    return error.isRetryable;
  };

  const getErrorSeverity = (
    error: ErrorInfo | Error | string,
  ): 'low' | 'medium' | 'high' | 'critical' => {
    if (typeof error === 'string') return 'medium';

    if ('code' in error && error.code) {
      // Critical errors
      if (
        error.code.includes('permission-denied') ||
        error.code.includes('data-loss')
      ) {
        return 'critical';
      }
      // High severity errors
      if (
        error.code.includes('auth/') ||
        error.code.includes('failed-precondition')
      ) {
        return 'high';
      }
      // Low severity errors
      if (
        error.code.includes('not-found') ||
        error.code.includes('already-exists')
      ) {
        return 'low';
      }
    }

    return 'medium';
  };

  const errorMessage = getErrorMessage(error);
  const errorCode = getErrorCode(error);
  const canRetry = isRetryable(error) && showRetry && onRetry;
  const severity = getErrorSeverity(error);

  // Auto-hide functionality for toast variant
  useEffect(() => {
    if (visible) {
      // Entrance animation
      opacity.value = withTiming(1, {
        duration: DURATIONS.normal,
        easing: EASING,
      });
      translateY.value = withTiming(0, {
        duration: DURATIONS.normal,
        easing: EASING,
      });
      scale.value = withTiming(1, {
        duration: DURATIONS.normal,
        easing: EASING,
      });

      // Auto-hide for toast variant
      if (variant === 'toast' && autoHide && onDismiss) {
        const timer = setTimeout(() => {
          runOnJS(onDismiss)();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      // Exit animation
      opacity.value = withTiming(0, {
        duration: DURATIONS.fast,
        easing: EASING,
      });
      translateY.value = withTiming(variant === 'banner' ? -50 : 20, {
        duration: DURATIONS.fast,
        easing: EASING,
      });
    }
  }, [
    autoHide,
    duration,
    onDismiss,
    opacity,
    scale,
    translateY,
    variant,
    visible,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  if (!visible) return null;

  // Toast variant using Snackbar
  if (variant === 'toast') {
    return (
      <Snackbar
        visible={visible}
        onDismiss={onDismiss || (() => {})}
        duration={autoHide ? duration : 0}
        style={[
          styles.toast,
          severity === 'critical' && styles.toastCritical,
          severity === 'high' && styles.toastHigh,
        ]}
        action={
          canRetry
            ? {
                label: 'Retry',
                onPress: onRetry,
                textColor: theme.colors.onError,
              }
            : undefined
        }
      >
        {errorMessage}
      </Snackbar>
    );
  }

  // Inline variant with enhanced styling
  if (variant === 'inline') {
    return (
      <Animated.View style={[styles.inlineContainer, animatedStyle]}>
        <View style={styles.inlineContent}>
          <IconButton
            icon={severity === 'critical' ? 'alert-circle' : 'alert'}
            size={16}
            iconColor={theme.colors.error}
            style={styles.inlineIcon}
          />
          <Paragraph style={styles.inlineText}>{errorMessage}</Paragraph>
        </View>
        {canRetry && (
          <Button
            mode="text"
            onPress={onRetry}
            compact
            textColor={theme.colors.error}
          >
            Retry
          </Button>
        )}
      </Animated.View>
    );
  }

  // Banner variant with enhanced animations
  if (variant === 'banner') {
    return (
      <Animated.View
        style={[
          styles.bannerContainer,
          severity === 'critical' && styles.bannerCritical,
          severity === 'high' && styles.bannerHigh,
          animatedStyle,
        ]}
      >
        <View style={styles.bannerContent}>
          <View style={styles.bannerTextContainer}>
            <IconButton
              icon={severity === 'critical' ? 'alert-circle' : 'information'}
              size={20}
              iconColor={theme.colors.onError}
              style={styles.bannerIcon}
            />
            <Paragraph style={styles.bannerText}>{errorMessage}</Paragraph>
          </View>
          <View style={styles.bannerActions}>
            {canRetry && (
              <Button
                mode="text"
                onPress={onRetry}
                compact
                textColor={theme.colors.onError}
                style={styles.bannerButton}
              >
                Retry
              </Button>
            )}
            {showDismiss && onDismiss && (
              <IconButton
                icon="close"
                size={20}
                onPress={onDismiss}
                iconColor={theme.colors.onError}
              />
            )}
          </View>
        </View>
      </Animated.View>
    );
  }

  // Modal variant with backdrop
  if (variant === 'modal') {
    return (
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.modalContainer, animatedStyle]}>
          <Card style={styles.modalCard}>
            <Card.Content>
              <View style={styles.modalHeader}>
                <IconButton
                  icon={severity === 'critical' ? 'alert-circle' : 'alert'}
                  size={32}
                  iconColor={theme.colors.error}
                />
                <Title style={styles.modalTitle}>{title}</Title>
              </View>
              <Paragraph style={styles.modalMessage}>{errorMessage}</Paragraph>

              {__DEV__ && errorCode && (
                <Paragraph style={styles.errorCode}>
                  Error Code: {errorCode}
                </Paragraph>
              )}
            </Card.Content>

            <Card.Actions style={styles.modalActions}>
              {showDismiss && onDismiss && (
                <Button mode="text" onPress={onDismiss}>
                  Dismiss
                </Button>
              )}
              {canRetry && (
                <Button mode="contained" onPress={onRetry}>
                  Try Again
                </Button>
              )}
            </Card.Actions>
          </Card>
        </Animated.View>
      </View>
    );
  }

  // Default card variant with enhanced styling
  return (
    <Animated.View style={animatedStyle}>
      <Card
        style={[
          styles.errorCard,
          severity === 'critical' && styles.errorCardCritical,
          severity === 'high' && styles.errorCardHigh,
        ]}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <IconButton
              icon={severity === 'critical' ? 'alert-circle' : 'alert'}
              size={24}
              iconColor={theme.colors.error}
              style={styles.cardIcon}
            />
            <Title style={styles.errorTitle}>{title}</Title>
          </View>
          <Paragraph style={styles.errorMessage}>{errorMessage}</Paragraph>

          {__DEV__ && errorCode && (
            <Paragraph style={styles.errorCode}>
              Error Code: {errorCode}
            </Paragraph>
          )}
        </Card.Content>

        {(canRetry || (showDismiss && onDismiss)) && (
          <Card.Actions>
            {showDismiss && onDismiss && (
              <Button mode="text" onPress={onDismiss}>
                Dismiss
              </Button>
            )}
            {canRetry && (
              <Button mode="contained" onPress={onRetry}>
                Try Again
              </Button>
            )}
          </Card.Actions>
        )}
      </Card>
    </Animated.View>
  );
};

interface NetworkErrorProps {
  onRetry?: () => void;
  isRetrying?: boolean;
  variant?: 'card' | 'inline' | 'banner' | 'modal' | 'toast';
  visible?: boolean;
  onDismiss?: () => void;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({
  onRetry,
  isRetrying = false,
  variant = 'card',
  visible = true,
  onDismiss,
}) => {
  const networkError: ErrorInfo = {
    message: 'Network request failed',
    code: 'network-error',
    isRetryable: true,
    userMessage: isRetrying
      ? 'Reconnecting...'
      : 'No internet connection. Please check your network and try again.',
  };

  return (
    <ErrorDisplay
      error={networkError}
      title="Connection Error"
      onRetry={onRetry}
      onDismiss={onDismiss}
      showRetry={!isRetrying}
      variant={variant}
      visible={visible}
      autoHide={variant === 'toast'}
    />
  );
};

interface EmptyStateProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
  variant?: 'default' | 'compact' | 'illustration';
  visible?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Nothing here yet',
  message,
  actionLabel,
  onAction,
  icon = 'inbox-outline',
  variant = 'default',
  visible = true,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, {
        duration: DURATIONS.normal,
        easing: EASING,
      });
      translateY.value = withTiming(0, {
        duration: DURATIONS.normal,
        easing: EASING,
      });
      scale.value = withSequence(
        withTiming(1.05, { duration: DURATIONS.fast, easing: EASING }),
        withTiming(1, { duration: DURATIONS.fast, easing: EASING }),
      );
    }
  }, [opacity, scale, translateY, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  if (!visible) return null;

  if (variant === 'compact') {
    return (
      <Animated.View style={[styles.emptyStateCompact, animatedStyle]}>
        <IconButton icon={icon} size={32} iconColor={theme.colors.outline} />
        <Paragraph style={styles.emptyStateCompactText}>{message}</Paragraph>
        {actionLabel && onAction && (
          <Button mode="text" onPress={onAction} compact>
            {actionLabel}
          </Button>
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.emptyStateContainer, animatedStyle]}>
      <Card style={styles.emptyStateCard}>
        <Card.Content style={styles.emptyStateContent}>
          <View style={styles.emptyStateIconContainer}>
            <IconButton
              icon={icon}
              size={variant === 'illustration' ? 64 : 48}
              iconColor={theme.colors.outline}
              style={styles.emptyStateIcon}
            />
          </View>
          <Title style={styles.emptyStateTitle}>{title}</Title>
          <Paragraph style={styles.emptyStateMessage}>{message}</Paragraph>

          {actionLabel && onAction && (
            <Button
              mode="contained"
              onPress={onAction}
              style={styles.emptyStateAction}
            >
              {actionLabel}
            </Button>
          )}
        </Card.Content>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Enhanced Error Card Styles
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  cardIcon: {
    margin: 0,
    marginRight: theme.spacing.sm,
  },
  errorCard: {
    backgroundColor: theme.colors.errorContainer,
    elevation: theme.shadows.md.elevation,
    margin: theme.spacing.md,
    shadowColor: theme.shadows.md.shadowColor,
    shadowOffset: theme.shadows.md.shadowOffset,
    shadowOpacity: theme.shadows.md.shadowOpacity,
    shadowRadius: theme.shadows.md.shadowRadius,
  },
  errorCardCritical: {
    backgroundColor: theme.colorPalette.error[100],
    borderColor: theme.colors.error,
    borderWidth: 2,
  },
  errorCardHigh: {
    backgroundColor: theme.colorPalette.error[50],
    borderLeftColor: theme.colors.error,
    borderLeftWidth: 4,
  },
  errorMessage: {
    color: theme.colors.onErrorContainer,
    lineHeight:
      theme.typography.lineHeights.normal * theme.typography.fontSizes.base,
    marginBottom: theme.spacing.sm,
  },
  errorCode: {
    color: theme.colors.onErrorContainer,
    fontFamily: theme.typography.fontFamilies.monospace,
    fontSize: theme.typography.fontSizes.xs,
    marginTop: theme.spacing.sm,
    opacity: 0.7,
  },
  errorTitle: {
    color: theme.colors.onErrorContainer,
    flex: 1,
  },

  // Enhanced Inline Styles
  inlineContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.errorContainer,
    borderRadius: theme.borderRadius.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  inlineContent: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  inlineIcon: {
    margin: 0,
    marginRight: theme.spacing.xs,
  },
  inlineText: {
    color: theme.colors.onErrorContainer,
    flex: 1,
    fontSize: theme.typography.fontSizes.sm,
  },

  // Enhanced Banner Styles
  bannerContainer: {
    backgroundColor: theme.colors.error,
    elevation: theme.shadows.sm.elevation,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    shadowColor: theme.shadows.sm.shadowColor,
    shadowOffset: theme.shadows.sm.shadowOffset,
    shadowOpacity: theme.shadows.sm.shadowOpacity,
    shadowRadius: theme.shadows.sm.shadowRadius,
  },
  bannerHigh: {
    backgroundColor: theme.colorPalette.error[600],
  },
  bannerCritical: {
    backgroundColor: theme.colorPalette.error[700],
  },
  bannerContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bannerTextContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  bannerIcon: {
    margin: 0,
    marginRight: theme.spacing.sm,
  },
  bannerText: {
    color: theme.colors.onError,
    flex: 1,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: '500' as const,
  },
  bannerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: theme.spacing.sm,
  },
  bannerButton: {
    marginRight: theme.spacing.xs,
  },

  // Modal Styles
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: theme.colorPalette.surface.overlay,
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  modalContainer: {
    maxWidth: 400,
    width: '90%',
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    elevation: theme.shadows.xl.elevation,
    shadowColor: theme.shadows.xl.shadowColor,
    shadowOffset: theme.shadows.xl.shadowOffset,
    shadowOpacity: theme.shadows.xl.shadowOpacity,
    shadowRadius: theme.shadows.xl.shadowRadius,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    color: theme.colors.onSurface,
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  modalMessage: {
    color: theme.colors.onSurface,
    lineHeight:
      theme.typography.lineHeights.relaxed * theme.typography.fontSizes.base,
  },
  modalActions: {
    justifyContent: 'flex-end',
  },

  // Toast Styles
  toast: {
    backgroundColor: theme.colors.error,
  },
  toastHigh: {
    backgroundColor: theme.colorPalette.error[600],
  },
  toastCritical: {
    backgroundColor: theme.colorPalette.error[700],
  },

  // Enhanced Empty State Styles
  emptyStateContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  emptyStateCard: {
    backgroundColor: theme.colors.surface,
    elevation: theme.shadows.sm.elevation,
    maxWidth: 400,
    shadowColor: theme.shadows.sm.shadowColor,
    shadowOffset: theme.shadows.sm.shadowOffset,
    shadowOpacity: theme.shadows.sm.shadowOpacity,
    shadowRadius: theme.shadows.sm.shadowRadius,
    width: '100%',
  },
  emptyStateContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyStateIconContainer: {
    backgroundColor: theme.colorPalette.neutral[50],
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  emptyStateIcon: {
    margin: 0,
  },
  emptyStateTitle: {
    color: theme.colors.onSurface,
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: '600' as const,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyStateMessage: {
    color: theme.colors.onSurfaceVariant,
    lineHeight:
      theme.typography.lineHeights.relaxed * theme.typography.fontSizes.base,
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    textAlign: 'center',
  },
  emptyStateAction: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },

  // Compact Empty State
  emptyStateCompact: {
    alignItems: 'center',
    backgroundColor: theme.colorPalette.neutral[50],
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  emptyStateCompactText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.typography.fontSizes.sm,
    marginHorizontal: theme.spacing.sm,
  },
});
