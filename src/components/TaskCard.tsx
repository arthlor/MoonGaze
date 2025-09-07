import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Avatar, Card, IconButton, Menu, Text } from 'react-native-paper';
import { Task, TaskStatus } from '../types';
import { taskCategoryColors, theme } from '../utils/theme';
import {
  createButtonAccessibility,
  createTaskCardAccessibility,
} from '../utils/accessibility';
import { quickAccessibilityCheck } from '../utils/accessibilityAudit';

interface TaskCardProps {
  task: Task;
  currentUserId: string;
  partnerName?: string;
  partnerId?: string;
  onPress?: () => void;
  onComplete?: () => void;
  onClaim?: () => void;
  onAssign?: (assignedTo: string) => void;
  onDelete?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = React.memo(
  ({
    task,
    currentUserId,
    partnerName,
    partnerId,
    onPress,
    onComplete,
    onClaim,
    onAssign,
    onDelete,
  }) => {
    const [assignMenuVisible, setAssignMenuVisible] = useState(false);
    const scale = useSharedValue(1);

    const categoryColor = taskCategoryColors[task.category];

    // Create accessibility props for the task card
    const assignedToName =
      task.assignedTo === currentUserId
        ? 'You'
        : task.assignedTo === partnerId
          ? partnerName || 'Partner'
          : 'Unassigned';

    const taskAccessibility = createTaskCardAccessibility(
      task.title,
      task.status,
      assignedToName,
      task.category,
      task.dueDate,
    );

    // Accessibility audit in development
    React.useEffect(() => {
      quickAccessibilityCheck('TaskCard', {
        type: 'card',
        accessibilityLabel: taskAccessibility.accessibilityLabel,
        accessibilityHint: taskAccessibility.accessibilityHint,
        accessibilityRole: taskAccessibility.accessibilityRole,
        touchTargetSize: { width: 300, height: 120 },
        textContent: task.title + (task.description || ''),
        hasKeyboardNavigation: true,
        hasProperFocus: true,
      });
    }, [task.title, task.description, taskAccessibility]);

    // Simple press animation
    const animatedStyle = useAnimatedStyle(
      () => ({
        transform: [{ scale: scale.value }],
      }),
      [],
    );

    const handlePress = useCallback(() => {
      if (onPress) {
        // Subtle press feedback
        scale.value = withTiming(0.98, { duration: 150 });
        setTimeout(() => {
          scale.value = withTiming(1, { duration: 150 });
        }, 150);
        onPress();
      }
    }, [onPress, scale]);
    // Memoized computed values for performance
    const taskState = useMemo(() => {
      const isAssignedToCurrentUser = task.assignedTo === currentUserId;
      const isAssignedToPartner = task.assignedTo === partnerId;
      const isUnassigned = !task.assignedTo;

      return {
        isAssignedToCurrentUser,
        isAssignedToPartner,
        isUnassigned,
        canComplete: isAssignedToCurrentUser && task.status !== 'done',
        canClaim: isUnassigned && task.status === 'todo',
        canReassign:
          (task.createdBy === currentUserId || isAssignedToCurrentUser) &&
          task.status !== 'done',
        canDelete: task.createdBy === currentUserId,
      };
    }, [
      task.assignedTo,
      task.createdBy,
      task.status,
      currentUserId,
      partnerId,
    ]);

    const getStatusColor = useCallback((status: TaskStatus): string => {
      switch (status) {
        case 'todo':
          return theme.colors.outline;
        case 'in_progress':
          return theme.colors.primary;
        case 'done':
          return theme.colors.tertiary;
        default:
          return theme.colors.outline;
      }
    }, []);

    const getStatusText = useCallback((status: TaskStatus): string => {
      switch (status) {
        case 'todo':
          return 'To-Do';
        case 'in_progress':
          return 'In Progress';
        case 'done':
          return 'Done';
        default:
          return 'Unknown';
      }
    }, []);

    const assigneeText = useMemo((): string => {
      if (taskState.isUnassigned) return 'Unassigned';
      if (taskState.isAssignedToCurrentUser) return 'You';
      return partnerName || 'Partner';
    }, [
      taskState.isUnassigned,
      taskState.isAssignedToCurrentUser,
      partnerName,
    ]);

    const dueDateText = useMemo((): string => {
      if (!task.dueDate) return '';
      const now = new Date();
      const diffTime = task.dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) return 'Overdue';
      if (diffDays === 0) return 'Due today';
      if (diffDays === 1) return 'Due tomorrow';
      return `Due in ${diffDays} days`;
    }, [task.dueDate]);

    return (
      <Animated.View style={animatedStyle}>
        <Card style={styles.card} mode="outlined">
          <TouchableOpacity
            onPress={handlePress}
            activeOpacity={1}
            {...taskAccessibility}
          >
            <Card.Content style={styles.content}>
              {/* Category indicator */}
              <View
                style={[
                  styles.categoryIndicator,
                  { backgroundColor: categoryColor },
                ]}
              />

              {/* Header with title and status */}
              <View style={styles.header}>
                <View style={styles.titleContainer}>
                  <Text
                    variant="titleMedium"
                    style={styles.title}
                    numberOfLines={2}
                  >
                    {task.title}
                  </Text>
                  <View
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: `${getStatusColor(task.status)  }15` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(task.status) },
                      ]}
                    >
                      {getStatusText(task.status)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Description */}
              {task.description && (
                <Text
                  variant="bodyMedium"
                  style={styles.description}
                  numberOfLines={2}
                >
                  {task.description}
                </Text>
              )}

              {/* Footer with assignee, due date, and actions */}
              <View style={styles.footer}>
                <View style={styles.assigneeContainer}>
                  <Avatar.Text
                    size={28}
                    label={assigneeText.charAt(0)}
                    style={[
                      styles.avatar,
                      {
                        backgroundColor: taskState.isUnassigned
                          ? theme.colors.surfaceVariant
                          : taskState.isAssignedToCurrentUser
                            ? theme.colors.primary
                            : theme.colors.secondary,
                      },
                    ]}
                    labelStyle={[
                      styles.avatarLabel,
                      {
                        color: taskState.isUnassigned
                          ? theme.colors.onSurfaceVariant
                          : theme.colors.onPrimary,
                      },
                    ]}
                  />
                  <Text variant="bodyMedium" style={styles.assigneeText}>
                    {assigneeText}
                  </Text>
                </View>

                {task.dueDate && (
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.dueDate,
                      {
                        color:
                          task.dueDate < new Date()
                            ? theme.colors.error
                            : theme.colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {dueDateText}
                  </Text>
                )}

                <View style={styles.actions}>
                  {taskState.canClaim && (
                    <IconButton
                      icon="hand-back-right"
                      size={20}
                      iconColor={theme.colors.primary}
                      onPress={onClaim}
                      style={styles.actionButton}
                      {...createButtonAccessibility(
                        'Claim task',
                        `Claim ${task.title} and assign it to yourself`,
                      )}
                    />
                  )}
                  {taskState.canComplete && (
                    <IconButton
                      icon="check-circle"
                      size={20}
                      iconColor={theme.colors.tertiary}
                      onPress={onComplete}
                      style={styles.actionButton}
                      {...createButtonAccessibility(
                        'Complete task',
                        `Mark ${task.title} as completed`,
                      )}
                    />
                  )}
                  {taskState.canReassign && onAssign && partnerId && (
                    <Menu
                      visible={assignMenuVisible}
                      onDismiss={() => setAssignMenuVisible(false)}
                      anchor={
                        <IconButton
                          icon="account-switch"
                          size={20}
                          iconColor={theme.colors.primary}
                          onPress={() => setAssignMenuVisible(true)}
                          style={styles.actionButton}
                          {...createButtonAccessibility(
                            'Reassign task',
                            `Reassign ${task.title} to yourself or your partner`,
                          )}
                        />
                      }
                    >
                      <Menu.Item
                        onPress={() => {
                          onAssign(currentUserId);
                          setAssignMenuVisible(false);
                        }}
                        title="Assign to me"
                        leadingIcon="account"
                        disabled={taskState.isAssignedToCurrentUser}
                      />
                      <Menu.Item
                        onPress={() => {
                          onAssign(partnerId);
                          setAssignMenuVisible(false);
                        }}
                        title={`Assign to ${partnerName || 'Partner'}`}
                        leadingIcon="account-outline"
                        disabled={taskState.isAssignedToPartner}
                      />
                      <Menu.Item
                        onPress={() => {
                          onAssign('');
                          setAssignMenuVisible(false);
                        }}
                        title="Unassign"
                        leadingIcon="account-remove"
                        disabled={taskState.isUnassigned}
                      />
                    </Menu>
                  )}
                  {taskState.canDelete && onDelete && (
                    <IconButton
                      icon="delete"
                      size={20}
                      iconColor={theme.colors.error}
                      onPress={onDelete}
                      style={styles.actionButton}
                      {...createButtonAccessibility(
                        'Delete task',
                        `Delete ${task.title} permanently`,
                      )}
                    />
                  )}
                </View>
              </View>
            </Card.Content>
          </TouchableOpacity>
        </Card>
      </Animated.View>
    );
  },
);

const styles = StyleSheet.create({
  actionButton: {
    margin: 0,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  assigneeContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  assigneeText: {
    color: theme.colors.onSurface,
    fontSize: theme.typography.sizes.sm,
    fontWeight: '500',
  },
  avatar: {
    marginRight: theme.spacing.sm,
  },
  avatarLabel: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '600',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    ...theme.shadows.subtle,
  },
  categoryIndicator: {
    borderBottomLeftRadius: theme.borderRadius.md,
    borderTopLeftRadius: theme.borderRadius.md,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 3,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    position: 'relative',
  },
  description: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.typography.sizes.sm,
    lineHeight: theme.typography.sizes.sm * theme.typography.lineHeights.normal,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  dueDate: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '500',
    marginHorizontal: theme.spacing.sm,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  header: {
    marginLeft: theme.spacing.sm,
  },
  statusIndicator: {
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
    minWidth: 70,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: '500',
  },
  title: {
    color: theme.colors.onSurface,
    flex: 1,
    fontSize: theme.typography.sizes.base,
    fontWeight: '600',
    lineHeight:
      theme.typography.sizes.base * theme.typography.lineHeights.normal,
    marginRight: theme.spacing.sm,
  },
  titleContainer: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
});

export default TaskCard;
