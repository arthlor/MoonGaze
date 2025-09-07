import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ListRenderItem, RefreshControl, StyleSheet, View } from 'react-native';
import { Appbar, Snackbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { Task, TaskStatus } from '../types';
import { announceForAccessibility } from '../utils/accessibility';
import { quickAccessibilityCheck } from '../utils/accessibilityAudit';
import { DURATIONS, EASING } from '../utils/animations';
import {
  ConfirmationDialog,
  EmptyState,
  ErrorDisplay,
  FloatingActionButton,
  OfflineBanner,
  SyncStatus,
  TaskCard,
  TaskFilters,
  TaskListSkeleton,
} from '../components';
import { TaskFormData } from '../components/TaskForm';
import LazyCelebrationModal from '../components/LazyCelebrationModal';
import LazyTaskForm from '../components/LazyTaskForm';
import { useAuth } from '../contexts/AuthContext';
import { useTask } from '../contexts/TaskContext';
import {
  useNotificationNavigation,
  useNotifications,
} from '../hooks/useNotifications';
import { usePartnership } from '../hooks/usePartnership';
import { analyticsService } from '../services/analyticsService';
import { theme } from '../utils/theme';
import { useOptimizedList, useOptimizedScroll } from '../utils/performance';

const TaskDashboard: React.FC = () => {
  const { user } = useAuth();
  const {
    tasks,
    isLoading,
    isRefreshing,
    error,
    stats,
    isOffline,
    refreshTasks,
    completeTask,
    claimTask,
    assignTask,
    createTask,
    updateTask,
    deleteTask,
    clearError,
  } = useTask();

  // Initialize notification hooks
  useNotifications();
  useNotificationNavigation();

  // Animation values for scroll-based effects
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(1);
  const fabScale = useSharedValue(1);

  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>(
    'all',
  );
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Task form state
  const [taskFormVisible, setTaskFormVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [taskFormLoading, setTaskFormLoading] = useState(false);

  // Delete confirmation state
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | undefined>(undefined);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Celebration state
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [celebratedTask, setCelebratedTask] = useState<Task | undefined>(
    undefined,
  );
  const [celebrationPoints, setCelebrationPoints] = useState(10);

  // Get partner data from partnership
  const { partnerUser: partner } = usePartnership();

  // Load tasks on component mount and track screen view
  useEffect(() => {
    // Track screen view
    analyticsService.trackScreenView('TaskDashboard');

    // Accessibility audit in development
    quickAccessibilityCheck('TaskDashboard', {
      type: 'list',
      accessibilityLabel: 'Task dashboard',
      hasKeyboardNavigation: true,
      hasProperFocus: true,
      textContent: 'Main task management screen',
    });

    if (user?.partnershipId) {
      refreshTasks();
    }

    // Preload heavy components for better UX
    import('../utils/bundleOptimization').then(({ preloadHeavyComponents }) => {
      preloadHeavyComponents();
    });
  }, [user?.partnershipId, refreshTasks]);

  // Filter tasks based on selected status
  const filteredTasks = useMemo(() => {
    if (selectedStatus === 'all') {
      return tasks;
    }
    return tasks.filter((task) => task.status === selectedStatus);
  }, [tasks, selectedStatus]);

  // Calculate task counts for filters
  const taskCounts = useMemo(
    () => ({
      all: tasks.length,
      todo: stats.todo,
      in_progress: stats.inProgress,
      done: stats.done,
    }),
    [tasks.length, stats],
  );

  // Handle task completion
  const handleCompleteTask = useCallback(
    async (taskId: string) => {
      if (!user?.id) return;

      // Find the task being completed for celebration
      const task = tasks.find((t) => t.id === taskId);

      try {
        const success = await completeTask(taskId, user.id);
        if (success && task) {
          // Announce completion for accessibility
          announceForAccessibility(
            `Task completed: ${task.title}. You earned 10 points!`,
          );

          // Show celebration modal
          setCelebratedTask(task);
          setCelebrationPoints(10);
          setCelebrationVisible(true);
        } else {
          setSnackbarMessage('Failed to complete task. Please try again.');
          setSnackbarVisible(true);
        }
      } catch (error) {
        setSnackbarMessage('Failed to complete task. Please try again.');
        setSnackbarVisible(true);
      }
    },
    [user?.id, tasks, completeTask],
  );

  // Handle task claiming
  const handleClaimTask = useCallback(
    async (taskId: string) => {
      if (!user?.id) return;

      const task = tasks.find((t) => t.id === taskId);

      try {
        const success = await claimTask(taskId, user.id);
        if (success) {
          setSnackbarMessage(`🙋‍♀️ Task claimed! "${task?.title}" is now yours.`);
          setSnackbarVisible(true);
        } else {
          setSnackbarMessage('Failed to claim task. Please try again.');
          setSnackbarVisible(true);
        }
      } catch (error) {
        setSnackbarMessage('Failed to claim task. Please try again.');
        setSnackbarVisible(true);
      }
    },
    [user?.id, tasks, claimTask],
  );

  // Handle task assignment
  const handleAssignTask = useCallback(
    async (taskId: string, assignedTo: string) => {
      if (!user?.id) return;

      const task = tasks.find((t) => t.id === taskId);

      try {
        const success = await assignTask(taskId, assignedTo, user.id);
        if (success) {
          let message = '';
          if (assignedTo === user.id) {
            message = `👤 You've taken on "${task?.title}"!`;
          } else if (assignedTo === partner?.id) {
            message = `👥 "${task?.title}" assigned to ${partner?.displayName || 'your partner'}!`;
          } else {
            message = `📋 "${task?.title}" is now unassigned and available for anyone to claim.`;
          }
          setSnackbarMessage(message);
          setSnackbarVisible(true);
        } else {
          setSnackbarMessage('Failed to assign task. Please try again.');
          setSnackbarVisible(true);
        }
      } catch (error) {
        setSnackbarMessage('Failed to assign task. Please try again.');
        setSnackbarVisible(true);
      }
    },
    [user?.id, partner, tasks, assignTask],
  );

  // Handle task creation
  const handleCreateTask = useCallback(() => {
    setEditingTask(undefined);
    setTaskFormVisible(true);
  }, []);

  // Handle task press (edit task)
  const handleTaskPress = useCallback(
    (task: Task) => {
      // Only allow editing if user is the creator
      if (task.createdBy === user?.id) {
        setEditingTask(task);
        setTaskFormVisible(true);
      } else {
        setSnackbarMessage('You can only edit tasks you created.');
        setSnackbarVisible(true);
      }
    },
    [user?.id],
  );

  // Handle task form submission
  const handleTaskFormSubmit = useCallback(
    async (data: TaskFormData) => {
      if (!user?.id) {
        setSnackbarMessage('User not found. Please log in again.');
        setSnackbarVisible(true);
        return;
      }

      if (!user?.partnershipId) {
        setSnackbarMessage(
          'Partnership not found. Please link with a partner first.',
        );
        setSnackbarVisible(true);
        return;
      }

      setTaskFormLoading(true);

      try {
        if (editingTask) {
          // Update existing task
          const success = await updateTask(
            editingTask.id,
            {
              title: data.title,
              description: data.description,
              category: data.category,
              dueDate: data.dueDate,
            },
            user.id,
          );

          if (success) {
            setSnackbarMessage(`✏️ "${data.title}" updated successfully!`);
            setTaskFormVisible(false);
          } else {
            setSnackbarMessage('Failed to update task. Please try again.');
          }
        } else {
          // Create new task
          const task = await createTask(data, user.id, user.partnershipId);

          if (task) {
            setSnackbarMessage(`✨ "${data.title}" created successfully!`);
            setTaskFormVisible(false);
          } else {
            setSnackbarMessage('Failed to create task. Please try again.');
          }
        }
        setSnackbarVisible(true);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'An error occurred. Please try again.';
        setSnackbarMessage(errorMessage);
        setSnackbarVisible(true);
      } finally {
        setTaskFormLoading(false);
      }
    },
    [user, editingTask, createTask, updateTask],
  );

  // Handle task deletion request
  const handleDeleteTaskRequest = useCallback((task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogVisible(true);
  }, []);

  // Handle task deletion confirmation
  const handleDeleteTaskConfirm = useCallback(async () => {
    if (!taskToDelete || !user?.id) return;

    setDeleteLoading(true);

    try {
      const success = await deleteTask(taskToDelete.id, user.id);

      if (success) {
        setSnackbarMessage(`🗑️ "${taskToDelete?.title}" deleted successfully!`);
        setDeleteDialogVisible(false);
        setTaskToDelete(undefined);
      } else {
        setSnackbarMessage('Failed to delete task. Please try again.');
      }
      setSnackbarVisible(true);
    } catch (error) {
      setSnackbarMessage('An error occurred. Please try again.');
      setSnackbarVisible(true);
    } finally {
      setDeleteLoading(false);
    }
  }, [taskToDelete, user?.id, deleteTask]);

  // Render individual task item
  const renderTaskItem: ListRenderItem<Task> = useCallback(
    ({ item: task }) => (
      <TaskCard
        task={task}
        currentUserId={user?.id || ''}
        partnerId={partner?.id}
        partnerName={partner?.displayName || 'Partner'}
        onPress={() => handleTaskPress(task)}
        onComplete={() => handleCompleteTask(task.id)}
        onClaim={() => handleClaimTask(task.id)}
        onAssign={(assignedTo) => handleAssignTask(task.id, assignedTo)}
        onDelete={() => handleDeleteTaskRequest(task)}
      />
    ),
    [
      user?.id,
      partner?.id,
      partner?.displayName,
      handleTaskPress,
      handleCompleteTask,
      handleClaimTask,
      handleAssignTask,
      handleDeleteTaskRequest,
    ],
  );

  // Performance optimization: use optimized list rendering
  const optimizedListProps = useOptimizedList(
    filteredTasks,
    (item: Task) => item.id,
    120, // Estimated height of TaskCard
  );

  // Performance optimization: use optimized scroll handling
  const optimizedScrollProps = useOptimizedScroll();

  // Optimized scroll handler for smooth animations
  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        scrollY.value = event.contentOffset.y;

        // Header fade effect - optimized
        const fadeThreshold = 50;
        headerOpacity.value = interpolate(
          scrollY.value,
          [0, fadeThreshold],
          [1, 0.8],
          'clamp',
        );

        // FAB scale effect on scroll - optimized
        const scaleThreshold = 100;
        const newScale = interpolate(
          scrollY.value,
          [0, scaleThreshold, scaleThreshold * 2],
          [1, 0.9, 1],
          'clamp',
        );
        fabScale.value = withTiming(newScale, {
          duration: DURATIONS.fast,
          easing: EASING,
        });
      },
    },
    [],
  );

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [
      {
        translateY: interpolate(scrollY.value, [0, 100], [0, -10], 'clamp'),
      },
    ],
  }));

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  // Render empty state
  const renderEmptyState = useCallback(
    () => (
      <EmptyState
        title={
          selectedStatus === 'all'
            ? 'No tasks yet'
            : `No ${selectedStatus.replace('_', ' ')} tasks`
        }
        message={
          selectedStatus === 'all'
            ? 'Create your first task to get started!'
            : 'Switch to another filter to see more tasks'
        }
        actionLabel={selectedStatus === 'all' ? 'Create Task' : undefined}
        onAction={selectedStatus === 'all' ? handleCreateTask : undefined}
        icon="clipboard-text-outline"
      />
    ),
    [selectedStatus, handleCreateTask],
  );

  // Render simplified team score header with clean design
  const renderHeader = useMemo(
    () => (
      <Animated.View style={headerAnimatedStyle}>
        <View style={styles.headerContainer}>
          {/* Simplified Score Display */}
          <View style={styles.scoreSection}>
            <Text style={styles.scoreIcon}>🏆</Text>
            <View style={styles.scoreContent}>
              <Text style={styles.scoreValue}>{stats.done * 10}</Text>
              <Text style={styles.scoreLabel}>points earned</Text>
            </View>
          </View>

          {/* Clean Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min((stats.done / Math.max(stats.done + stats.inProgress + stats.todo, 1)) * 100, 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {stats.done} of {stats.done + stats.inProgress + stats.todo}{' '}
              completed
            </Text>
          </View>

          {/* Simplified Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.done}</Text>
              <Text style={styles.statLabel}>Done</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.inProgress}</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.todo}</Text>
              <Text style={styles.statLabel}>To Do</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    ),
    [stats.done, stats.inProgress, stats.todo, headerAnimatedStyle],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.Content title="MoonGaze" titleStyle={styles.appbarTitle} />
        {isOffline && (
          <Text variant="bodySmall" style={styles.offlineIndicator}>
            Offline
          </Text>
        )}
      </Appbar.Header>

      {renderHeader}

      <OfflineBanner />

      <SyncStatus compact showActions={false} />

      <TaskFilters
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        taskCounts={taskCounts}
      />

      <View style={styles.content}>
        {isLoading && !isRefreshing ? (
          <TaskListSkeleton count={5} />
        ) : error ? (
          <ErrorDisplay
            error={error.userMessage || 'Failed to load tasks'}
            onRetry={refreshTasks}
            title="Failed to load tasks"
          />
        ) : (
          <Animated.FlatList
            {...optimizedListProps}
            {...optimizedScrollProps}
            renderItem={renderTaskItem}
            contentContainerStyle={[
              styles.listContent,
              filteredTasks.length === 0 && styles.emptyListContent,
            ]}
            onScroll={scrollHandler}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refreshTasks}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
                progressBackgroundColor={theme.colors.surface}
              />
            }
            ListEmptyComponent={renderEmptyState}
          />
        )}

        <Animated.View style={[styles.fabContainer, fabAnimatedStyle]}>
          <FloatingActionButton
            onPress={handleCreateTask}
            visible={!isLoading}
          />
        </Animated.View>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>

      <Snackbar
        visible={!!error}
        onDismiss={clearError}
        duration={5000}
        action={{
          label: 'Retry',
          onPress: refreshTasks,
        }}
        style={styles.errorSnackbar}
      >
        {error?.userMessage || 'An error occurred'}
      </Snackbar>

      {/* Lazy Loaded Task Form Modal */}
      {user && taskFormVisible && (
        <LazyTaskForm
          visible={taskFormVisible}
          onDismiss={() => setTaskFormVisible(false)}
          onSubmit={handleTaskFormSubmit}
          task={editingTask}
          currentUser={user}
          partner={partner || undefined}
          isLoading={taskFormLoading}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        visible={deleteDialogVisible}
        onDismiss={() => setDeleteDialogVisible(false)}
        onConfirm={handleDeleteTaskConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={deleteLoading}
      />

      {/* Lazy Loaded Celebration Modal */}
      {celebrationVisible && (
        <LazyCelebrationModal
          visible={celebrationVisible}
          onDismiss={() => setCelebrationVisible(false)}
          task={celebratedTask}
          pointsEarned={celebrationPoints}
          completedBy={user?.id}
          currentUserId={user?.id}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  appbar: {
    backgroundColor: theme.colors.surface,
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    elevation: 0,
  },
  appbarTitle: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.lg,
    fontWeight: '600',
  },
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
  },
  // Simplified Header Styles
  headerContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.md,
    padding: theme.spacing.lg,
    ...theme.shadows.subtle,
  },

  // Clean Progress
  progressBar: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.sm,
    height: 4,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  progressContainer: {
    marginBottom: theme.spacing.lg,
  },
  progressFill: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    height: '100%',
  },
  progressText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.typography.sizes.sm,
    textAlign: 'center',
  },

  // Clean Score Section
  scoreContent: {
    flex: 1,
  },
  scoreIcon: {
    fontSize: theme.typography.sizes.xl,
    marginRight: theme.spacing.md,
  },
  scoreLabel: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.typography.sizes.sm,
    marginTop: theme.spacing.xs,
  },
  scoreSection: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  scoreValue: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.xl,
    fontWeight: '600',
    lineHeight: theme.typography.sizes.xl * theme.typography.lineHeights.tight,
  },

  // Simplified Stats
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.typography.sizes.sm,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  // eslint-disable-next-line react-native/sort-styles
  statValue: {
    color: theme.colors.onSurface,
    fontSize: theme.typography.sizes.lg,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },

  // Content and Layout
  content: {
    flex: 1,
    position: 'relative',
  },
  listContent: {
    paddingBottom: 100, // Space for FAB
    paddingHorizontal: theme.spacing.sm,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  fabContainer: {
    bottom: 0,
    margin: theme.spacing.md,
    position: 'absolute',
    right: 0,
  },

  // Error and Loading States
  errorSnackbar: {
    backgroundColor: theme.colors.errorContainer,
  },
  offlineIndicator: {
    color: theme.colors.error,
    fontSize: theme.typography.sizes.sm,
    fontWeight: '500',
    marginRight: theme.spacing.md,
  },
});

export default React.memo(TaskDashboard);
