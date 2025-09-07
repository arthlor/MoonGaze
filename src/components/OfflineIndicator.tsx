/* eslint-disable react-native/sort-styles */
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { IconButton, Surface, Text, useTheme } from 'react-native-paper';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSequence,
  withTiming, 
} from 'react-native-reanimated';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { DURATIONS, EASING } from '../utils/animations';
import { theme } from '../utils';

// ============================================================================
// TYPES
// ============================================================================

interface OfflineIndicatorProps {
  style?: ViewStyle;
  showWhenOnline?: boolean;
  onlineMessage?: string;
  offlineMessage?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  style,
  showWhenOnline = false,
  onlineMessage = 'Back online',
  offlineMessage = 'No internet connection',
}) => {
  const theme = useTheme();
  const { isOnline, connectionType } = useNetworkStatus();
  
  // Enhanced animations with reanimated
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-50);
  const scale = useSharedValue(0.9);

  // Animate indicator visibility with enhanced timing
  React.useEffect(() => {
    const shouldShow = !isOnline || (showWhenOnline && isOnline);
    
    if (shouldShow) {
      opacity.value = withTiming(1, { duration: DURATIONS.normal, easing: EASING });
      translateY.value = withTiming(0, { duration: DURATIONS.normal, easing: EASING });
      scale.value = withSequence(
        withTiming(1.05, { duration: DURATIONS.fast }),
        withTiming(1, { duration: DURATIONS.fast }),
      );
    } else {
      opacity.value = withTiming(0, { duration: DURATIONS.normal, easing: EASING });
      translateY.value = withTiming(-50, { duration: DURATIONS.normal, easing: EASING });
      scale.value = withTiming(0.9, { duration: DURATIONS.normal, easing: EASING });
    }
  }, [isOnline, opacity, scale, showWhenOnline, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Don't render if online and not showing online status
  if (isOnline && !showWhenOnline) {
    return null;
  }

  const backgroundColor = isOnline 
    ? theme.colors.tertiary 
    : theme.colors.error;

  const textColor = isOnline 
    ? theme.colors.onTertiary 
    : theme.colors.onError;

  const message = isOnline ? onlineMessage : offlineMessage;
  const connectionInfo = connectionType ? ` (${connectionType})` : '';

  return (
    <Animated.View style={[styles.container, animatedStyle, style]}>
      <Surface
        style={[
          styles.surface,
          { backgroundColor },
        ]}
        elevation={3}
      >
        <View style={styles.content}>
          <View style={[
            styles.indicator, 
            { backgroundColor: textColor },
            isOnline && styles.onlineIndicator,
          ]} />
          <Text
            variant="bodySmall"
            style={[styles.text, { color: textColor }]}
          >
            {message}{connectionInfo}
          </Text>
        </View>
      </Surface>
    </Animated.View>
  );
};

// ============================================================================
// COMPACT VERSION
// ============================================================================

interface CompactOfflineIndicatorProps {
  style?: ViewStyle;
}

export const CompactOfflineIndicator: React.FC<CompactOfflineIndicatorProps> = ({ style }) => {
  const theme = useTheme();
  const { isOnline } = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <View style={[styles.compactContainer, style]}>
      <View style={[styles.compactIndicator, { backgroundColor: theme.colors.error }]} />
      <Text variant="bodySmall" style={[styles.compactText, { color: theme.colors.error }]}>
        Offline
      </Text>
    </View>
  );
};

// ============================================================================
// BANNER VERSION
// ============================================================================

interface OfflineBannerProps {
  visible?: boolean;
  onDismiss?: () => void;
  style?: ViewStyle;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  visible,
  onDismiss,
  style,
}) => {
  const theme = useTheme();
  const { isOnline, isConnected, connectionType } = useNetworkStatus();
  
  // Enhanced animations
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-60);
  const scale = useSharedValue(0.95);

  const shouldShow = visible !== undefined ? visible : !isOnline;

  React.useEffect(() => {
    if (shouldShow) {
      opacity.value = withTiming(1, { duration: DURATIONS.normal, easing: EASING });
      translateY.value = withTiming(0, { duration: DURATIONS.normal, easing: EASING });
      scale.value = withSequence(
        withTiming(1.02, { duration: DURATIONS.fast }),
        withTiming(1, { duration: DURATIONS.fast }),
      );
    } else {
      opacity.value = withTiming(0, { duration: DURATIONS.normal, easing: EASING });
      translateY.value = withTiming(-60, { duration: DURATIONS.normal, easing: EASING });
      scale.value = withTiming(0.95, { duration: DURATIONS.normal, easing: EASING });
    }
  }, [opacity, scale, shouldShow, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (!shouldShow) {
    return null;
  }

  const getStatusMessage = () => {
    if (!isConnected) {
      return 'Check your network settings and try again';
    }
    if (connectionType) {
      return `Connected to ${connectionType} but no internet access`;
    }
    return 'Your changes will sync when connection is restored';
  };

  // const getStatusIcon = () => {
  //   if (!isConnected) {
  //     return 'wifi-off';
  //   }
  //   return 'cloud-off-outline';
  // };

  return (
    <Animated.View style={animatedStyle}>
      <Surface
        style={[
          styles.banner,
          { backgroundColor: theme.colors.errorContainer },
          style,
        ]}
        elevation={2}
      >
        <View style={styles.bannerContent}>
          <View style={styles.bannerLeft}>
            <View style={[styles.bannerIndicator, { backgroundColor: theme.colors.error }]} />
            <View style={styles.bannerTextContainer}>
              <View style={styles.bannerTitleRow}>
                <Text
                  variant="bodyMedium"
                  style={[styles.bannerTitle, { color: theme.colors.onErrorContainer }]}
                >
                  You&apos;re offline
                </Text>
              </View>
              <Text
                variant="bodySmall"
                style={[styles.bannerSubtitle, { color: theme.colors.onErrorContainer }]}
              >
                {getStatusMessage()}
              </Text>
            </View>
          </View>
          {onDismiss && (
            <IconButton
              icon="close"
              size={20}
              iconColor={theme.colors.onErrorContainer}
              onPress={onDismiss}
              style={styles.bannerCloseButton}
            />
          )}
        </View>
      </Surface>
    </Animated.View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  indicator: {
    borderRadius: 4,
    height: 8,
    marginRight: 8,
    width: 8,
  },
  onlineIndicator: {
    elevation: 2,
    shadowColor: theme.colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  // Compact styles
  compactContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  surface: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
  compactIndicator: {
    borderRadius: 3,
    height: 6,
    marginRight: 6,
    width: 6,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Enhanced banner styles
  banner: {
    borderRadius: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  bannerContent: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bannerLeft: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flex: 1,
  },
  bannerIndicator: {
    borderRadius: 4,
    height: 8,
    marginRight: 12,
    marginTop: 4,
    width: 8,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  bannerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.85,
  },
  bannerCloseButton: {
    margin: 0,
    marginTop: -4,
  },
});

export default OfflineIndicator;