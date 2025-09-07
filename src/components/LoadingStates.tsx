/* eslint-disable react-native/sort-styles */
import React, { memo, useMemo } from 'react';
import { DimensionValue, Dimensions, StyleSheet, View, ViewStyle } from 'react-native';
import { ActivityIndicator, Card, Text } from 'react-native-paper';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../utils/theme';
import { DURATIONS, EASING } from '../utils/animations';

const { width: screenWidth } = Dimensions.get('window');

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = memo(({
  size = 'large',
  color = theme.colors.primary,
  message,
}) => {
  const textStyle = useMemo(() => [styles.loadingText, { color }], [color]);
  
  return (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator size={size} color={color} />
      {message && (
        <Text style={textStyle}>{message}</Text>
      )}
    </View>
  );
});

interface FullScreenLoadingProps {
  message?: string;
}

export const FullScreenLoading: React.FC<FullScreenLoadingProps> = memo(({
  message = 'Loading...',
}) => {
  return (
    <View style={styles.fullScreenContainer}>
      <LoadingSpinner message={message} />
    </View>
  );
});

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = memo(({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const shimmerTranslate = useSharedValue(-screenWidth);
  const pulseOpacity = useSharedValue(0.3);

  React.useEffect(() => {
    // Optimized shimmer effect - smooth left to right animation
    shimmerTranslate.value = withRepeat(
      withSequence(
        withTiming(screenWidth, { duration: 1500, easing: EASING }),
        withDelay(500, withTiming(-screenWidth, { duration: 0 })),
      ),
      -1,
      false,
    );

    // Optimized subtle pulse effect
    pulseOpacity.value = withRepeat(
      withTiming(0.6, { duration: 1200, easing: EASING }),
      -1,
      true,
    );
  }, [shimmerTranslate, pulseOpacity]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslate.value }],
  }), []);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }), []);

  const containerStyle = useMemo(() => [
    {
      width,
      height,
      borderRadius,
      backgroundColor: theme.colors.surfaceVariant,
      overflow: 'hidden' as const,
    },
    style,
  ], [width, height, borderRadius, style]);

  return (
    <View style={containerStyle}>
      <Animated.View style={[styles.skeletonBase, pulseStyle]} />
      <Animated.View style={[styles.shimmerOverlay, shimmerStyle]} />
    </View>
  );
});

export const TaskCardSkeleton: React.FC = memo(() => {
  const fadeIn = useSharedValue(0);

  React.useEffect(() => {
    fadeIn.value = withTiming(1, {
      duration: DURATIONS.normal,
      easing: EASING,
    });
  }, [fadeIn]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: interpolate(fadeIn.value, [0, 1], [20, 0]) }],
  }), []);

  const cardStyle = useMemo(() => [styles.skeletonCard, theme.shadows.sm], []);

  return (
    <Animated.View style={animatedStyle}>
      <Card style={cardStyle}>
        <Card.Content style={styles.skeletonCardContent}>
          <View style={styles.skeletonHeader}>
            <Skeleton width={28} height={28} borderRadius={14} />
            <View style={styles.skeletonHeaderText}>
              <Skeleton width="75%" height={18} borderRadius={4} />
              <Skeleton
                width="45%"
                height={14}
                borderRadius={3}
                style={styles.skeletonHeaderSubtext}
              />
            </View>
          </View>

          <View style={styles.skeletonBody}>
            <Skeleton width="95%" height={16} borderRadius={4} />
            <Skeleton
              width="80%"
              height={16}
              borderRadius={4}
              style={styles.skeletonBodyLine}
            />
            <Skeleton
              width="65%"
              height={16}
              borderRadius={4}
              style={styles.skeletonBodyLine}
            />
          </View>

          <View style={styles.skeletonFooter}>
            <Skeleton width={70} height={14} borderRadius={7} />
            <Skeleton width={90} height={28} borderRadius={14} />
          </View>
        </Card.Content>
      </Card>
    </Animated.View>
  );
});

export const TaskListSkeleton: React.FC<{ count?: number }> = memo(({
  count = 3,
}) => {
  const skeletonItems = useMemo(() => 
    Array.from({ length: count }).map((_, index) => (
      <View key={index} style={styles.skeletonListItem}>
        <TaskCardSkeleton />
      </View>
    )), [count],
  );

  return (
    <View style={styles.listContainer}>
      {skeletonItems}
    </View>
  );
});

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  children: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
  children,
}) => {
  const overlayOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.8);

  React.useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, {
        duration: DURATIONS.normal,
        easing: EASING,
      });
      contentScale.value = withTiming(1, {
        duration: DURATIONS.normal,
        easing: EASING,
      });
    } else {
      overlayOpacity.value = withTiming(0, {
        duration: DURATIONS.normal,
        easing: EASING,
      });
      contentScale.value = withTiming(0.8, {
        duration: DURATIONS.normal,
        easing: EASING,
      });
    }
  }, [visible, overlayOpacity, contentScale]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
  }));

  return (
    <View style={styles.overlayContainer}>
      {children}
      {visible && (
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <Animated.View style={[styles.overlayContent, contentStyle]}>
            <ActivityIndicator
              size="large"
              color={theme.colors.primary}
              style={styles.overlaySpinner}
            />
            {message && <Text style={styles.overlayText}>{message}</Text>}
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
};

interface PullToRefreshLoadingProps {
  refreshing: boolean;
}

export const PullToRefreshLoading: React.FC<PullToRefreshLoadingProps> = ({
  refreshing,
}) => {
  const spinnerScale = useSharedValue(0);
  const containerOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (refreshing) {
      containerOpacity.value = withTiming(1, {
        duration: DURATIONS.fast,
        easing: EASING,
      });
      spinnerScale.value = withSequence(
        withTiming(1.2, { duration: DURATIONS.fast, easing: EASING }),
        withTiming(1, { duration: DURATIONS.fast, easing: EASING }),
      );
    } else {
      containerOpacity.value = withTiming(0, {
        duration: DURATIONS.fast,
        easing: EASING,
      });
      spinnerScale.value = withTiming(0, {
        duration: DURATIONS.fast,
        easing: EASING,
      });
    }
  }, [refreshing, spinnerScale, containerOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: spinnerScale.value }],
  }));

  if (!refreshing) return null;

  return (
    <Animated.View style={[styles.pullToRefreshContainer, animatedStyle]}>
      <ActivityIndicator size="small" color={theme.colors.primary} />
      <Text style={styles.pullToRefreshText}>Refreshing...</Text>
    </Animated.View>
  );
};

interface ButtonLoadingProps {
  loading: boolean;
  children: React.ReactNode;
}

export const ButtonLoading: React.FC<ButtonLoadingProps> = ({
  loading,
  children,
}) => {
  const spinnerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(1);
  const spinnerScale = useSharedValue(0);

  React.useEffect(() => {
    if (loading) {
      spinnerOpacity.value = withTiming(1, {
        duration: DURATIONS.fast,
        easing: EASING,
      });
      contentOpacity.value = withTiming(0, {
        duration: DURATIONS.fast,
        easing: EASING,
      });
      spinnerScale.value = withSequence(
        withTiming(1.1, { duration: DURATIONS.fast, easing: EASING }),
        withTiming(1, { duration: DURATIONS.fast, easing: EASING }),
      );
    } else {
      spinnerOpacity.value = withTiming(0, {
        duration: DURATIONS.fast,
        easing: EASING,
      });
      contentOpacity.value = withTiming(1, {
        duration: DURATIONS.fast,
        easing: EASING,
      });
      spinnerScale.value = withTiming(0, {
        duration: DURATIONS.fast,
        easing: EASING,
      });
    }
  }, [loading, spinnerOpacity, contentOpacity, spinnerScale]);

  const spinnerStyle = useAnimatedStyle(() => ({
    opacity: spinnerOpacity.value,
    transform: [{ scale: spinnerScale.value }],
    position: 'absolute' as const,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <View style={styles.buttonLoadingContainer}>
      <Animated.View style={contentStyle}>{children}</Animated.View>
      <Animated.View style={spinnerStyle}>
        <ActivityIndicator size="small" color={theme.colors.onPrimary} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: theme.colors.onSurface,
    fontSize: theme.typography.fontSizes.base,
    fontWeight: '500',
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  shimmerOverlay: {
    backgroundColor: theme.colors.shimmer,
    bottom: 0,
    position: 'absolute',
    top: 0,
    transform: [{ skewX: '-20deg' }],
    width: 100,
  },
  skeletonBase: {
    backgroundColor: theme.colors.surfaceVariant,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  skeletonCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
  },
  skeletonBody: {
    marginBottom: theme.spacing.md,
  },
  skeletonCardContent: {
    padding: theme.spacing.md,
  },
  skeletonHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  skeletonHeaderSubtext: {
    marginTop: 6,
  },
  skeletonHeaderText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  skeletonListItem: {
    marginBottom: theme.spacing.sm,
  },
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  skeletonBodyLine: {
    marginTop: 8,
  },
  skeletonFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  listContainer: {
    flex: 1,
    paddingVertical: theme.spacing.xs,
  },

  // Enhanced overlay styles
  overlayContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: theme.colors.backdrop,
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  overlayContent: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    elevation: theme.shadows.lg.elevation,
    minWidth: 200,
    padding: theme.spacing.xl,
    shadowColor: theme.shadows.lg.shadowColor,
    shadowOffset: theme.shadows.lg.shadowOffset,
    shadowOpacity: theme.shadows.lg.shadowOpacity,
    shadowRadius: theme.shadows.lg.shadowRadius,
  },
  overlaySpinner: {
    marginBottom: theme.spacing.md,
  },
  overlayText: {
    color: theme.colors.onSurface,
    fontSize: theme.typography.fontSizes.base,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Enhanced pull to refresh styles
  pullToRefreshContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
  },
  pullToRefreshText: {
    color: theme.colors.onSurface,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: '500',
  },

  // Enhanced button loading styles
  buttonLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 20,
    position: 'relative',
  },
});
