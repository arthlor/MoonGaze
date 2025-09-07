import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { IconButton, Surface, Text, useTheme } from 'react-native-paper';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSequence, 
  withTiming,
} from 'react-native-reanimated';
import { DURATIONS, EASING } from '../utils/animations';

// ============================================================================
// TYPES
// ============================================================================

export interface SnackbarProps {
  visible: boolean;
  message: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss?: () => void;
  duration?: number;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  position?: 'top' | 'bottom';
  style?: ViewStyle;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const Snackbar: React.FC<SnackbarProps> = ({
  visible,
  message,
  action,
  onDismiss,
  duration = 4000,
  variant = 'default',
  position = 'bottom',
  style,
}) => {
  const theme = useTheme();
  
  // Animation values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(position === 'bottom' ? 100 : -100);
  const scale = useSharedValue(0.9);

  // Auto-dismiss timer
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Handle visibility changes
  React.useEffect(() => {
    if (visible) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Show animation
      opacity.value = withTiming(1, { duration: DURATIONS.normal, easing: EASING });
      translateY.value = withTiming(0, { duration: DURATIONS.normal, easing: EASING });
      scale.value = withSequence(
        withTiming(1.02, { duration: DURATIONS.fast }),
        withTiming(1, { duration: DURATIONS.fast }),
      );

      // Auto-dismiss after duration
      if (duration > 0 && onDismiss) {
        timeoutRef.current = setTimeout(() => {
          onDismiss();
        }, duration);
      }
    } else {
      // Hide animation
      opacity.value = withTiming(0, { duration: DURATIONS.normal, easing: EASING });
      translateY.value = withTiming(
        position === 'bottom' ? 100 : -100, 
        { duration: DURATIONS.normal, easing: EASING },
      );
      scale.value = withTiming(0.9, { duration: DURATIONS.normal, easing: EASING });
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [duration, onDismiss, opacity, position, scale, translateY, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const getVariantColors = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: theme.colors.tertiaryContainer,
          textColor: theme.colors.onTertiaryContainer,
          iconColor: theme.colors.tertiary,
        };
      case 'error':
        return {
          backgroundColor: theme.colors.errorContainer,
          textColor: theme.colors.onErrorContainer,
          iconColor: theme.colors.error,
        };
      case 'warning':
        return {
          backgroundColor: theme.colors.secondaryContainer,
          textColor: theme.colors.onSecondaryContainer,
          iconColor: theme.colors.secondary,
        };
      case 'info':
        return {
          backgroundColor: theme.colors.primaryContainer,
          textColor: theme.colors.onPrimaryContainer,
          iconColor: theme.colors.primary,
        };
      default:
        return {
          backgroundColor: theme.colors.inverseSurface,
          textColor: theme.colors.inverseOnSurface,
          iconColor: theme.colors.inverseOnSurface,
        };
    }
  };

  const getVariantIcon = () => {
    switch (variant) {
      case 'success': return 'check-circle';
      case 'error': return 'alert-circle';
      case 'warning': return 'alert';
      case 'info': return 'information';
      default: return null;
    }
  };

  if (!visible) {
    return null;
  }

  const colors = getVariantColors();
  const icon = getVariantIcon();

  return (
    <Animated.View 
      style={[
        styles.container,
        position === 'top' ? styles.containerTop : styles.containerBottom,
        animatedStyle,
        style,
      ]}
    >
      <Surface
        style={[
          styles.surface,
          { backgroundColor: colors.backgroundColor },
        ]}
        elevation={4}
      >
        <View style={styles.content}>
          {icon && (
            <View style={styles.iconContainer}>
              <Text style={[styles.iconText, { color: colors.iconColor }]}>
                {icon === 'check-circle' ? '✓' :
                 icon === 'alert-circle' ? '⚠' :
                 icon === 'alert' ? '⚠' : 'ℹ'}
              </Text>
            </View>
          )}
          
          <Text
            variant="bodyMedium"
            style={[
              styles.message,
              { color: colors.textColor },
              icon && styles.messageWithIcon,
            ]}
            numberOfLines={2}
          >
            {message}
          </Text>

          <View style={styles.actions}>
            {action && (
              <Text
                variant="bodyMedium"
                style={[
                  styles.actionText,
                  { color: theme.colors.primary },
                ]}
                onPress={action.onPress}
              >
                {action.label.toUpperCase()}
              </Text>
            )}
            
            {onDismiss && (
              <IconButton
                icon="close"
                size={20}
                iconColor={colors.iconColor}
                onPress={onDismiss}
                style={styles.closeButton}
              />
            )}
          </View>
        </View>
      </Surface>
    </Animated.View>
  );
};

// ============================================================================
// SNACKBAR PROVIDER CONTEXT
// ============================================================================

interface SnackbarContextType {
  showSnackbar: (props: Omit<SnackbarProps, 'visible'>) => void;
  hideSnackbar: () => void;
}

const SnackbarContext = React.createContext<SnackbarContextType | null>(null);

export const useSnackbar = () => {
  const context = React.useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};

interface SnackbarProviderProps {
  children: React.ReactNode;
}

export const SnackbarProvider: React.FC<SnackbarProviderProps> = ({ children }) => {
  const [snackbarProps, setSnackbarProps] = React.useState<SnackbarProps | null>(null);

  const showSnackbar = React.useCallback((props: Omit<SnackbarProps, 'visible'>) => {
    setSnackbarProps({ ...props, visible: true });
  }, []);

  const hideSnackbar = React.useCallback(() => {
    setSnackbarProps(prev => prev ? { ...prev, visible: false } : null);
    // Clear the snackbar after animation completes
    setTimeout(() => setSnackbarProps(null), DURATIONS.normal);
  }, []);

  const contextValue = React.useMemo(() => ({
    showSnackbar,
    hideSnackbar,
  }), [showSnackbar, hideSnackbar]);

  return (
    <SnackbarContext.Provider value={contextValue}>
      {children}
      {snackbarProps && (
        <Snackbar
          {...snackbarProps}
          onDismiss={hideSnackbar}
        />
      )}
    </SnackbarContext.Provider>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: 8,
  },
  closeButton: {
    margin: 0,
    marginLeft: 4,
  },
  container: {
    left: 16,
    position: 'absolute',
    right: 16,
    zIndex: 1000,
  },
  containerBottom: {
    bottom: 100, // Account for tab bar and safe area
  },
  containerTop: {
    top: 60, // Account for status bar and safe area
  },
  content: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    minHeight: 24,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 1,
  },
  iconText: {
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    flex: 1,
    fontWeight: '500',
    lineHeight: 20,
  },
  messageWithIcon: {
    marginTop: 1,
  },
  surface: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});

export default Snackbar;