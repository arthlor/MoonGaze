/* eslint-disable react-native/sort-styles */
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import {
  Button,
  Chip,
  IconButton,
  ProgressBar,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  useConflictResolution,
  useSync,
  useSyncStatus,
} from '../hooks/useSync';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { DURATIONS, EASING } from '../utils/animations';
import { theme } from '../utils';

// ============================================================================
// TYPES
// ============================================================================

interface SyncStatusProps {
  style?: ViewStyle;
  compact?: boolean;
  showActions?: boolean;
}

interface SyncStatusBannerProps {
  visible?: boolean;
  onDismiss?: () => void;
  style?: ViewStyle;
}

interface ConflictResolutionProps {
  visible: boolean;
  onDismiss: () => void;
}

// ============================================================================
// MAIN SYNC STATUS COMPONENT
// ============================================================================

export const SyncStatus: React.FC<SyncStatusProps> = ({
  style,
  compact = false,
  showActions = true,
}) => {
  const theme = useTheme();
  const { statusText, statusColor, showProgress } = useSyncStatus();
  const {
    isSyncing,
    syncProgress,
    pendingActions,
    syncErrors,
    conflicts,
    sync,
    forceSync,
    retryFailed,
    clearErrors,
  } = useSync();
  const { isOnline } = useNetworkStatus();

  // Enhanced animations
  const indicatorScale = useSharedValue(1);
  const indicatorOpacity = useSharedValue(1);
  const containerScale = useSharedValue(1);

  // Animate sync indicator when syncing
  React.useEffect(() => {
    if (isSyncing) {
      indicatorScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: DURATIONS.fast }),
          withTiming(1, { duration: DURATIONS.fast }),
        ),
        -1,
        true,
      );
      indicatorOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: DURATIONS.fast }),
          withTiming(1, { duration: DURATIONS.fast }),
        ),
        -1,
        true,
      );
    } else {
      indicatorScale.value = withTiming(1, { duration: DURATIONS.fast });
      indicatorOpacity.value = withTiming(1, { duration: DURATIONS.fast });
    }
  }, [indicatorOpacity, indicatorScale, isSyncing]);

  // Animate container on status changes
  React.useEffect(() => {
    containerScale.value = withSequence(
      withTiming(1.02, { duration: DURATIONS.fast }),
      withTiming(1, { duration: DURATIONS.fast }),
    );
  }, [conflicts.length, containerScale, statusColor, syncErrors.length]);

  const indicatorAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: indicatorScale.value }],
    opacity: indicatorOpacity.value,
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale.value }],
  }));

  const getStatusColor = () => {
    switch (statusColor) {
      case 'success':
        return theme.colors.tertiary;
      case 'warning':
        return theme.colors.secondary;
      case 'error':
        return theme.colors.error;
      case 'info':
        return theme.colors.primary;
      default:
        return theme.colors.outline;
    }
  };

  // const getStatusIcon = () => {
  //   if (isSyncing) return 'sync';
  //   switch (statusColor) {
  //     case 'success': return 'check-circle';
  //     case 'warning': return 'alert-circle';
  //     case 'error': return 'close-circle';
  //     case 'info': return 'information';
  //     default: return 'circle-outline';
  //   }
  // };

  const handleSyncAction = async () => {
    if (syncErrors.length > 0) {
      await retryFailed();
    } else if (pendingActions > 0) {
      await sync();
    } else {
      await forceSync();
    }
  };

  if (compact) {
    return (
      <Animated.View
        style={[styles.compactContainer, containerAnimatedStyle, style]}
      >
        <Animated.View
          style={[
            styles.compactIndicator,
            { backgroundColor: getStatusColor() },
            indicatorAnimatedStyle,
          ]}
        />
        <Text
          variant="bodySmall"
          style={[styles.compactText, { color: getStatusColor() }]}
        >
          {statusText}
        </Text>
        {showProgress && (
          <View style={styles.compactProgress}>
            <ProgressBar
              progress={syncProgress / 100}
              color={getStatusColor()}
              style={styles.progressBar}
            />
          </View>
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={containerAnimatedStyle}>
      <Surface style={[styles.container, style]} elevation={2}>
        <View style={styles.content}>
          <View style={styles.statusSection}>
            <View style={styles.statusHeader}>
              <Animated.View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: getStatusColor() },
                  indicatorAnimatedStyle,
                ]}
              />
              <Text
                variant="bodyMedium"
                style={[styles.statusText, { color: getStatusColor() }]}
              >
                {statusText}
              </Text>
              {!isOnline && (
                <Chip
                  mode="outlined"
                  compact
                  style={[
                    styles.offlineChip,
                    { borderColor: theme.colors.error },
                  ]}
                  textStyle={[
                    styles.offlineChipText,
                    { color: theme.colors.error },
                  ]}
                >
                  Offline
                </Chip>
              )}
            </View>

            {showProgress && (
              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={syncProgress / 100}
                  color={getStatusColor()}
                  style={styles.progressBar}
                />
                <Text
                  variant="bodySmall"
                  style={[styles.progressText, { color: getStatusColor() }]}
                >
                  {Math.round(syncProgress)}%
                </Text>
              </View>
            )}

            {(syncErrors.length > 0 || conflicts.length > 0) && (
              <View style={styles.issuesContainer}>
                {syncErrors.length > 0 && (
                  <View style={styles.issueItem}>
                    <Text
                      variant="bodySmall"
                      style={[styles.errorText, { color: theme.colors.error }]}
                    >
                      {syncErrors.length} sync error
                      {syncErrors.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
                {conflicts.length > 0 && (
                  <View style={styles.issueItem}>
                    <Text
                      variant="bodySmall"
                      style={[
                        styles.conflictText,
                        { color: theme.colors.secondary },
                      ]}
                    >
                      {conflicts.length} conflict
                      {conflicts.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {showActions &&
            isOnline &&
            (pendingActions > 0 || syncErrors.length > 0) && (
              <View style={styles.actionsSection}>
                <Button
                  mode="contained"
                  compact
                  onPress={handleSyncAction}
                  disabled={isSyncing}
                  style={[
                    styles.syncButton,
                    { backgroundColor: getStatusColor() },
                  ]}
                  labelStyle={styles.syncButtonLabel}
                >
                  {syncErrors.length > 0 ? 'Retry' : 'Sync Now'}
                </Button>

                {syncErrors.length > 0 && (
                  <IconButton
                    icon="close"
                    size={18}
                    iconColor={theme.colors.error}
                    onPress={clearErrors}
                    style={styles.clearButton}
                  />
                )}
              </View>
            )}
        </View>
      </Surface>
    </Animated.View>
  );
};

// ============================================================================
// SYNC STATUS BANNER
// ============================================================================

export const SyncStatusBanner: React.FC<SyncStatusBannerProps> = ({
  visible,
  onDismiss,
  style,
}) => {
  const theme = useTheme();
  const { statusText, statusColor } = useSyncStatus();
  const { pendingActions, syncErrors, conflicts, isSyncing } = useSync();

  // Enhanced animations
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-50);
  const scale = useSharedValue(0.95);

  const shouldShow =
    visible !== undefined
      ? visible
      : pendingActions > 0 || syncErrors.length > 0 || conflicts.length > 0;

  React.useEffect(() => {
    if (shouldShow) {
      opacity.value = withTiming(1, {
        duration: DURATIONS.normal,
        easing: EASING,
      });
      translateY.value = withTiming(0, {
        duration: DURATIONS.normal,
        easing: EASING,
      });
      scale.value = withSequence(
        withTiming(1.02, { duration: DURATIONS.fast }),
        withTiming(1, { duration: DURATIONS.fast }),
      );
    } else {
      opacity.value = withTiming(0, {
        duration: DURATIONS.normal,
        easing: EASING,
      });
      translateY.value = withTiming(-50, {
        duration: DURATIONS.normal,
        easing: EASING,
      });
      scale.value = withTiming(0.95, {
        duration: DURATIONS.normal,
        easing: EASING,
      });
    }
  }, [opacity, scale, shouldShow, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  if (!shouldShow) {
    return null;
  }

  const getBackgroundColor = () => {
    switch (statusColor) {
      case 'error':
        return theme.colors.errorContainer;
      case 'warning':
        return theme.colors.secondaryContainer;
      case 'info':
        return theme.colors.primaryContainer;
      case 'success':
        return theme.colors.tertiaryContainer;
      default:
        return theme.colors.primaryContainer;
    }
  };

  const getTextColor = () => {
    switch (statusColor) {
      case 'error':
        return theme.colors.onErrorContainer;
      case 'warning':
        return theme.colors.onSecondaryContainer;
      case 'info':
        return theme.colors.onPrimaryContainer;
      case 'success':
        return theme.colors.onTertiaryContainer;
      default:
        return theme.colors.onPrimaryContainer;
    }
  };

  const getStatusIcon = () => {
    if (isSyncing) return 'sync';
    switch (statusColor) {
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'alert';
      case 'success':
        return 'check-circle';
      default:
        return 'information';
    }
  };

  return (
    <Animated.View style={animatedStyle}>
      <Surface
        style={[
          styles.banner,
          { backgroundColor: getBackgroundColor() },
          style,
        ]}
        elevation={2}
      >
        <View style={styles.bannerContent}>
          <View style={styles.bannerLeft}>
            <View style={styles.bannerIconContainer}>
              <Text style={[styles.bannerIcon, { color: getTextColor() }]}>
                {getStatusIcon() === 'sync'
                  ? '⟳'
                  : getStatusIcon() === 'check-circle'
                    ? '✓'
                    : getStatusIcon() === 'alert-circle'
                      ? '⚠'
                      : 'ℹ'}
              </Text>
            </View>
            <View style={styles.bannerTextContainer}>
              <Text
                variant="bodyMedium"
                style={[styles.bannerText, { color: getTextColor() }]}
              >
                {statusText}
              </Text>
              {(syncErrors.length > 0 || conflicts.length > 0) && (
                <Text
                  variant="bodySmall"
                  style={[styles.bannerSubtext, { color: getTextColor() }]}
                >
                  Tap to resolve{' '}
                  {syncErrors.length > 0 ? 'errors' : 'conflicts'}
                </Text>
              )}
            </View>
          </View>

          {onDismiss && (
            <IconButton
              icon="close"
              size={20}
              iconColor={getTextColor()}
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
// CONFLICT RESOLUTION MODAL
// ============================================================================

export const ConflictResolutionModal: React.FC<ConflictResolutionProps> = ({
  visible,
  onDismiss,
}) => {
  const theme = useTheme();
  const { conflicts, resolveConflict, resolveAllConflicts } =
    useConflictResolution();

  if (!visible || conflicts.length === 0) {
    return null;
  }

  return (
    <View style={styles.modalOverlay}>
      <Animated.View style={styles.modalBackdrop} />
      <Surface
        style={[
          styles.conflictModal,
          { backgroundColor: theme.colors.surface },
        ]}
        elevation={0}
        accessible={true}
        accessibilityRole="none"
        accessibilityLabel="Sync conflicts resolution"
        accessibilityViewIsModal={true}
      >
        <View style={styles.conflictHeader}>
          <Text variant="headlineSmall" style={styles.conflictTitle}>
            Sync Conflicts ({conflicts.length})
          </Text>
          <IconButton
            icon="close"
            onPress={onDismiss}
            style={styles.conflictCloseButton}
            accessibilityLabel="Close conflicts dialog"
            accessibilityHint="Dismisses the sync conflicts resolution dialog"
          />
        </View>

        <View style={styles.conflictList}>
          {conflicts.map((conflict) => (
            <Surface
              key={conflict.actionId}
              style={styles.conflictItem}
              elevation={1}
            >
              <View style={styles.conflictItemContent}>
                <Text variant="bodyMedium" style={styles.conflictItemTitle}>
                  {conflict.conflictType} conflict
                </Text>
                <Text variant="bodySmall" style={styles.conflictItemDetails}>
                  {conflict.details}
                </Text>
                <Text variant="bodySmall" style={styles.conflictItemResolution}>
                  Resolution: {conflict.resolution}
                </Text>
              </View>

              <View style={styles.conflictItemActions}>
                <Button
                  mode="outlined"
                  compact
                  onPress={() => resolveConflict(conflict.actionId, 'accept')}
                  style={styles.conflictActionButton}
                  accessibilityLabel={`Accept conflict resolution for ${conflict.conflictType}`}
                >
                  Accept
                </Button>
                <Button
                  mode="outlined"
                  compact
                  onPress={() => resolveConflict(conflict.actionId, 'reject')}
                  style={styles.conflictActionButton}
                  accessibilityLabel={`Reject conflict resolution for ${conflict.conflictType}`}
                >
                  Reject
                </Button>
              </View>
            </Surface>
          ))}
        </View>

        <View style={styles.conflictFooter}>
          <Button
            mode="contained"
            onPress={() => resolveAllConflicts('accept')}
            style={styles.conflictFooterButton}
            accessibilityLabel="Accept all conflict resolutions"
            accessibilityHint="Accepts all pending sync conflicts"
          >
            Accept All
          </Button>
          <Button
            mode="outlined"
            onPress={() => resolveAllConflicts('reject')}
            style={styles.conflictFooterButton}
            accessibilityLabel="Reject all conflict resolutions"
            accessibilityHint="Rejects all pending sync conflicts"
          >
            Reject All
          </Button>
        </View>
      </Surface>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Enhanced main component styles
  container: {
    borderRadius: 12,
    marginVertical: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  offlineChip: {
    borderWidth: 1,
    height: 26,
  },
  offlineChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 4,
  },
  statusIndicator: {
    borderRadius: 5,
    elevation: 2,
    height: 10,
    marginRight: 10,
    shadowColor: theme.colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    width: 10,
  },
  progressContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 6,
  },
  statusSection: {
    flex: 1,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  progressBar: {
    borderRadius: 2,
    flex: 1,
    height: 4,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 8,
    minWidth: 30,
  },
  issuesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  issueItem: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  conflictText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsSection: {
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: 8,
  },
  syncButton: {
    borderRadius: 8,
    marginRight: 4,
  },
  syncButtonLabel: {
    color: theme.colors.surface,
  },
  clearButton: {
    margin: 0,
  },

  // Compact styles
  compactContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  compactProgress: {
    marginLeft: 8,
    width: 40,
  },

  // Enhanced banner styles
  banner: {
    borderRadius: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bannerContent: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bannerLeft: {
    alignItems: 'flex-start',
    flex: 1,
    flexDirection: 'row',
  },
  bannerIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  bannerIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  bannerSubtext: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    opacity: 0.85,
  },
  bannerCloseButton: {
    margin: 0,
    marginTop: -4,
  },

  // Enhanced modal styles
  modalOverlay: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    paddingHorizontal: 20,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  modalBackdrop: {
    backgroundColor: theme.colors.backdrop,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  conflictModal: {
    borderRadius: 16,
    elevation: 8,
    maxHeight: 500,
    maxWidth: 400,
    padding: 20,
    shadowColor: theme.colors.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    width: '100%',
  },
  conflictHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  conflictTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  conflictCloseButton: {
    margin: 0,
  },
  conflictList: {
    maxHeight: 300,
  },
  conflictItem: {
    borderColor: theme.colors.outline,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  conflictItemContent: {
    marginBottom: 12,
  },
  conflictItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  conflictItemDetails: {
    lineHeight: 20,
    marginBottom: 4,
    opacity: 0.8,
  },
  conflictItemResolution: {
    fontSize: 12,
    opacity: 0.6,
  },
  conflictItemActions: {
    flexDirection: 'row',
    gap: 10,
  },
  conflictActionButton: {
    borderRadius: 8,
    flex: 1,
  },
  conflictFooter: {
    borderTopColor: theme.colors.outline,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingTop: 16,
  },
  conflictFooterButton: {
    borderRadius: 10,
    flex: 1,
  },
});

export default SyncStatus;
