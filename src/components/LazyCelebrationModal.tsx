import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '../utils/theme';
import { createLazyComponent } from '../utils/performance';
import type { Task } from '../types';

interface CelebrationModalProps extends Record<string, unknown> {
  visible: boolean;
  onDismiss: () => void;
  task?: Task;
  pointsEarned?: number;
  completedBy?: string;
  currentUserId?: string;
}

// Lazy loading fallback component
const CelebrationModalFallback: React.FC = () => (
  <View style={styles.fallbackContainer}>
    <ActivityIndicator size="large" color={theme.colors.primary} />
    <Text style={styles.fallbackText}>Loading celebration...</Text>
  </View>
);

// Lazy loaded CelebrationModal component
const LazyCelebrationModal = createLazyComponent<CelebrationModalProps>(
  () => import('./CelebrationModal'),
  CelebrationModalFallback,
);

const styles = StyleSheet.create({
  fallbackContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.backdrop,
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  fallbackText: {
    color: theme.colors.onSurface,
    fontSize: theme.typography.fontSizes.base,
    marginTop: theme.spacing.md,
  },
});

export default LazyCelebrationModal;
