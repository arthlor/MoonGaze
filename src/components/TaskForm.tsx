import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { 
  runOnJS, 
  useAnimatedStyle, 
  useSharedValue,

  withTiming,
} from 'react-native-reanimated';
import {
  Avatar,
  Divider,
  IconButton,
  Modal,
  Portal,
  Text,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Task, TaskCategory, User } from '../types';
import { taskCategoryColors, theme } from '../utils/theme';
import { 
  announceForAccessibility,
} from '../utils/accessibility';
import { quickAccessibilityCheck } from '../utils/accessibilityAudit';
import { DURATIONS, EASING } from '../utils/animations';
import EnhancedTextInput from './EnhancedTextInput';
import EnhancedChip from './EnhancedChip';
import EnhancedButton from './EnhancedButton';

// ============================================================================
// INTERFACES
// ============================================================================

export interface TaskFormData {
  title: string;
  description: string;
  category: TaskCategory;
  assignedTo?: string;
  dueDate?: Date;
}

interface TaskFormProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  task?: Task; // For editing existing tasks
  currentUser: User;
  partner?: User;
  isLoading?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TASK_CATEGORIES: TaskCategory[] = [
  'Household',
  'Errands', 
  'Financial',
  'Planning',
  'Wellness',
  'Misc',
];

const ASSIGNEE_OPTIONS = [
  { id: 'unassigned', label: 'Unassigned', icon: 'account-question' },
  { id: 'self', label: 'Me', icon: 'account' },
  { id: 'partner', label: 'Partner', icon: 'account-heart' },
];

// ============================================================================
// COMPONENT
// ============================================================================

const TaskForm: React.FC<TaskFormProps> = ({
  visible,
  onDismiss,
  onSubmit,
  task,
  currentUser,
  partner,
  isLoading = false,
}) => {
  // ============================================================================
  // STATE
  // ============================================================================

  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    category: 'Misc',
    assignedTo: undefined,
    dueDate: undefined,
  });

  const [errors, setErrors] = useState<{
    title?: string;
    category?: string;
  }>({});

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('unassigned');
  
  // Modal animation values
  const modalScale = useSharedValue(0.9);
  const modalOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(20);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Accessibility audit in development
  useEffect(() => {
    if (visible) {
      quickAccessibilityCheck('TaskForm', {
        type: 'modal',
        accessibilityLabel: task ? 'Edit task form' : 'Create new task form',
        hasKeyboardNavigation: true,
        hasProperFocus: true,
        textContent: 'Task creation and editing form',
      });
    }
  }, [visible, task]);

  // Initialize form data when task prop changes (for editing)
  useEffect(() => {
    if (visible) {
      // Animate modal entrance
      modalScale.value = withTiming(1, { duration: DURATIONS.normal, easing: EASING });
      modalOpacity.value = withTiming(1, { duration: DURATIONS.normal, easing: EASING });
      contentTranslateY.value = withTiming(0, { duration: DURATIONS.normal, easing: EASING });

      if (task) {
        setFormData({
          title: task.title,
          description: task.description || '',
          category: task.category,
          assignedTo: task.assignedTo,
          dueDate: task.dueDate,
        });

        // Set assignee selection
        if (!task.assignedTo) {
          setSelectedAssignee('unassigned');
        } else if (task.assignedTo === currentUser.id) {
          setSelectedAssignee('self');
        } else {
          setSelectedAssignee('partner');
        }
      } else {
        // Reset form for new task
        setFormData({
          title: '',
          description: '',
          category: 'Misc',
          assignedTo: undefined,
          dueDate: undefined,
        });
        setSelectedAssignee('unassigned');
      }
      setErrors({});
    } else {
      // Reset animation values when modal is hidden
      modalScale.value = 0.9;
      modalOpacity.value = 0;
      contentTranslateY.value = 20;
    }
  }, [visible, task, currentUser.id, modalScale, modalOpacity, contentTranslateY]);

  // Reset form when modal is dismissed
  useEffect(() => {
    if (!visible) {
      setErrors({});
      setShowDatePicker(false);
    }
  }, [visible]);

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Map assignee selection to user ID
    let assignedTo: string | undefined;
    switch (selectedAssignee) {
      case 'self':
        assignedTo = currentUser.id;
        break;
      case 'partner':
        assignedTo = partner?.id;
        break;
      case 'unassigned':
      default:
        assignedTo = undefined;
        break;
    }

    const submitData: TaskFormData = {
      ...formData,
      assignedTo,
    };

    await onSubmit(submitData);
  };

  const handleCategorySelect = (category: TaskCategory) => {
    setFormData(prev => ({ ...prev, category }));
    setErrors(prev => ({ ...prev, category: undefined }));
  };

  const handleAssigneeSelect = (assigneeId: string) => {
    setSelectedAssignee(assigneeId);
  };

  const handleDateChange = (_event: unknown, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, dueDate: selectedDate }));
      announceForAccessibility(`Due date set to ${selectedDate.toLocaleDateString()}`);
    }
  };

  const handleRemoveDate = () => {
    setFormData(prev => ({ ...prev, dueDate: undefined }));
    announceForAccessibility('Due date removed');
  };

  const handleTitleChange = (text: string) => {
    setFormData(prev => ({ ...prev, title: text }));
    if (errors.title) {
      setErrors(prev => ({ ...prev, title: undefined }));
    }
  };

  const handleDismissWithAnimation = () => {
    modalScale.value = withTiming(0.9, { duration: DURATIONS.normal, easing: EASING });
    modalOpacity.value = withTiming(0, { duration: DURATIONS.normal, easing: EASING });
    contentTranslateY.value = withTiming(20, { 
      duration: DURATIONS.normal, 
      easing: EASING, 
    }, () => {
      runOnJS(onDismiss)();
    });
  };

  // Modal animation styles
  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: modalScale.value },
      { translateY: contentTranslateY.value },
    ],
    opacity: modalOpacity.value,
  }));

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderCategorySelection = () => (
    <View style={styles.section}>
      <Text variant="titleSmall" style={styles.sectionTitle}>
        Category
      </Text>
      <View style={styles.categoryGrid}>
        {TASK_CATEGORIES.map((category) => (
          <EnhancedChip
            key={category}
            variant="filter"
            size="md"
            selected={formData.category === category}
            onPress={() => handleCategorySelect(category)}
            selectedColor={taskCategoryColors[category]}
            accessibilityLabel={`${category} category`}
            accessibilityHint={`Select ${category} as task category`}
            accessibilityRole="radio"
            style={styles.categoryChip}
          >
            {category}
          </EnhancedChip>
        ))}
      </View>
      {errors.category && (
        <Text style={styles.errorText}>
          {errors.category}
        </Text>
      )}
    </View>
  );

  const renderAssigneeSelection = () => (
    <View style={styles.section}>
      <Text variant="titleSmall" style={styles.sectionTitle}>
        Assign to
      </Text>
      <View style={styles.assigneeContainer}>
        {ASSIGNEE_OPTIONS.map((option) => {
          const isDisabled = option.id === 'partner' && !partner;
          const isSelected = selectedAssignee === option.id;
          
          return (
            <View key={option.id} style={styles.assigneeOption}>
              <EnhancedButton
                variant={isSelected ? 'primary' : 'secondary'}
                size="md"
                onPress={() => handleAssigneeSelect(option.id)}
                disabled={isDisabled}
                fullWidth
                accessibilityLabel={`Assign to ${option.id === 'partner' && partner ? partner.displayName || 'Partner' : option.label}`}
                accessibilityHint={`Select ${option.label} as task assignee`}
                style={styles.assigneeButton}
              >
                <View style={styles.assigneeButtonInner}>
                  <Avatar.Icon
                    size={20}
                    icon={option.icon}
                    style={[
                      styles.assigneeAvatar,
                      isSelected && { backgroundColor: theme.colors.surface },
                    ]}
                  />
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.assigneeLabel,
                      isSelected && { color: theme.colors.onPrimary },
                      isDisabled && { color: theme.colors.outline },
                    ]}
                  >
                    {option.id === 'partner' && partner
                      ? partner.displayName || 'Partner'
                      : option.label}
                  </Text>
                </View>
              </EnhancedButton>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderDueDateSelection = () => (
    <View style={styles.section}>
      <Text variant="titleSmall" style={styles.sectionTitle}>
        Due Date (Optional)
      </Text>
      <View style={styles.dueDateContainer}>
        {formData.dueDate ? (
          <View style={styles.selectedDateContainer}>
            <Text variant="bodyMedium" style={styles.selectedDateText}>
              {formData.dueDate.toLocaleDateString()}
            </Text>
            <IconButton
              icon="close"
              size={20}
              onPress={handleRemoveDate}
              style={styles.removeDateButton}
              accessibilityLabel="Remove due date"
              accessibilityHint="Remove the selected due date from this task"
            />
          </View>
        ) : (
          <EnhancedButton
            variant="secondary"
            size="md"
            onPress={() => setShowDatePicker(true)}
            fullWidth
            accessibilityLabel="Add due date"
            accessibilityHint="Select a due date for this task"
            style={styles.addDateButton}
          >
            📅 Add Due Date
          </EnhancedButton>
        )}
      </View>
    </View>
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismissWithAnimation}
        contentContainerStyle={styles.modalContainer}
      >
        <Animated.View 
          style={[styles.modal, modalAnimatedStyle]}
          accessible={true}
          accessibilityRole="none"
          accessibilityLabel={task ? 'Edit task form' : 'Create new task form'}
          accessibilityViewIsModal={true}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text variant="headlineSmall" style={styles.title}>
                {task ? 'Edit Task' : 'Create Task'}
              </Text>
              <IconButton
                icon="close"
                size={24}
                onPress={handleDismissWithAnimation}
                style={styles.closeButton}
                accessibilityLabel="Close task form"
                accessibilityHint="Close the task creation form"
              />
            </View>

            <Divider style={styles.divider} />

            {/* Form Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Title Input */}
              <View style={styles.section}>
                <EnhancedTextInput
                  size="md"
                  label="Task Title"
                  value={formData.title}
                  onChangeText={handleTitleChange}
                  errorText={errors.title}
                  required
                  accessibilityLabel="Task title"
                  accessibilityHint="Enter a descriptive title for your task"
                  style={styles.textInput}
                />
              </View>

              {/* Description Input */}
              <View style={styles.section}>
                <EnhancedTextInput
                  size="md"
                  label="Description (Optional)"
                  value={formData.description}
                  onChangeText={(text) =>
                    setFormData(prev => ({ ...prev, description: text }))
                  }
                  multiline
                  numberOfLines={3}
                  accessibilityLabel="Task description"
                  accessibilityHint="Add additional details about the task"
                  style={styles.textInput}
                />
              </View>

              {/* Category Selection */}
              {renderCategorySelection()}

              {/* Assignee Selection */}
              {renderAssigneeSelection()}

              {/* Due Date Selection */}
              {renderDueDateSelection()}
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.footer}>
              <EnhancedButton
                variant="secondary"
                size="md"
                onPress={handleDismissWithAnimation}
                disabled={isLoading}
                style={styles.cancelButton}
                accessibilityLabel="Cancel"
                accessibilityHint="Cancel task creation and close form"
              >
                Cancel
              </EnhancedButton>
              <EnhancedButton
                variant="primary"
                size="md"
                onPress={handleSubmit}
                loading={isLoading}
                disabled={isLoading}
                style={styles.submitButton}
                accessibilityLabel={task ? 'Update task' : 'Create task'}
                accessibilityHint={task ? 'Save changes to the task' : 'Create the new task'}
              >
                {task ? 'Update Task' : 'Create Task'}
              </EnhancedButton>
            </View>

            {/* Date Picker */}
            {showDatePicker && (
              <DateTimePicker
                value={formData.dueDate || new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </KeyboardAvoidingView>
        </Animated.View>
      </Modal>
    </Portal>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  addDateButton: {
    width: '100%',
  },
  assigneeAvatar: {
    backgroundColor: theme.colors.primary,
  },
  assigneeButton: {
    width: '100%',
  },
  assigneeButtonInner: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'flex-start',
  },
  assigneeContainer: {
    gap: theme.spacing.sm,
  },
  assigneeLabel: {
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.medium,
    letterSpacing: 0.1,
    lineHeight: theme.typography.fontSizes.base * theme.typography.lineHeights.normal,
  },
  assigneeOption: {
    width: '100%',
  },
  cancelButton: {
    flex: 1,
  },
  categoryChip: {
    marginBottom: theme.spacing.xs,
    marginRight: theme.spacing.xs,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  closeButton: {
    margin: 0,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl, // Increased padding for better breathing room
    paddingTop: theme.spacing.lg,
  },
  divider: {
    backgroundColor: theme.colors.outline,
    marginHorizontal: theme.spacing.lg,
  },
  dueDateContainer: {
    width: '100%',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSizes.sm,
    marginLeft: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  footer: {
    borderTopColor: `${theme.colors.outline}30`, // More subtle border
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.lg, // Increased gap between buttons
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl, // Increased padding
    paddingVertical: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl, // Increased padding
    paddingTop: theme.spacing.xl,
  },
  modal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl, // Larger radius for modern look
    elevation: theme.shadows.xl.elevation,
    maxHeight: '90%',
    maxWidth: 500,
    shadowColor: theme.shadows.xl.shadowColor,
    shadowOffset: theme.shadows.xl.shadowOffset,
    shadowOpacity: theme.shadows.xl.shadowOpacity,
    shadowRadius: theme.shadows.xl.shadowRadius,
    width: '100%',
  },
  modalContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  removeDateButton: {
    margin: 0,
  },
  section: {
    marginBottom: theme.spacing['2xl'], // Increased for better visual separation
  },
  sectionTitle: {
    color: theme.colors.onSurface,
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.semibold,
    letterSpacing: 0.1,
    lineHeight: theme.typography.fontSizes.base * theme.typography.lineHeights.tight,
    marginBottom: theme.spacing.md,
  },
  selectedDateContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  selectedDateText: {
    color: theme.colors.onPrimaryContainer,
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.medium,
    letterSpacing: 0.1,
    lineHeight: theme.typography.fontSizes.base * theme.typography.lineHeights.normal,
  },
  submitButton: {
    flex: 1,
  },
  textInput: {
    backgroundColor: theme.colors.transparent,
  },
  title: {
    color: theme.colors.onSurface,
    flex: 1,
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.semibold,
    letterSpacing: -0.2,
    lineHeight: theme.typography.fontSizes.xl * theme.typography.lineHeights.tight, // Tighter spacing for headings
  },
});

export default TaskForm;