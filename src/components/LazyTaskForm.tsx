import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '../utils/theme';
import { createLazyComponent } from '../utils/performance';
import type { Task, TaskCategory, User } from '../types';

interface TaskFormData {
  title: string;
  description: string;
  category: TaskCategory;
  assignedTo?: string;
  dueDate?: Date;
}

interface TaskFormProps extends Record<string, unknown> {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  task?: Task;
  currentUser: User;
  partner?: User;
  isLoading?: boolean;
}

// Lazy loading fallback component
const TaskFormFallback: React.FC = () => (
  <View style={styles.fallbackContainer}>
    <ActivityIndicator size="large" color={theme.colors.primary} />
    <Text style={styles.fallbackText}>Loading form...</Text>
  </View>
);

// Lazy loaded TaskForm component
const LazyTaskForm = createLazyComponent<TaskFormProps>(
  () => import('./TaskForm'),
  TaskFormFallback,
);

const styles = StyleSheet.create({
  fallbackContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
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

export default LazyTaskForm;