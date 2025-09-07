import React, { useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { TaskStatus } from '../types';
import { theme } from '../utils/theme';
import EnhancedChip from './EnhancedChip';
import { ACCESSIBILITY_TIMEOUTS, announceStateChange, createComplexAccessibilityLabel } from '../utils/accessibilityHelpers';
import { quickAccessibilityCheck } from '../utils/accessibilityAudit';

interface TaskFiltersProps {
  selectedStatus: TaskStatus | 'all';
  onStatusChange: (status: TaskStatus | 'all') => void;
  taskCounts: {
    all: number;
    todo: number;
    in_progress: number;
    done: number;
  };
}

const TaskFilters: React.FC<TaskFiltersProps> = React.memo(({
  selectedStatus,
  onStatusChange,
  taskCounts,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);

  // Accessibility audit in development
  React.useEffect(() => {
    quickAccessibilityCheck('TaskFilters', {
      type: 'navigation',
      accessibilityLabel: 'Task status filters',
      hasKeyboardNavigation: true,
      hasProperFocus: true,
      textContent: 'Filter tasks by status',
    });
  }, []);

  const filters = [
    { 
      key: 'all' as const, 
      label: 'All', 
      count: taskCounts.all,
      color: theme.colors.secondary,
      accessibilityHint: 'Show all tasks',
    },
    { 
      key: 'todo' as const, 
      label: 'To-Do', 
      count: taskCounts.todo,
      color: theme.colorPalette.neutral[500],
      accessibilityHint: 'Show tasks that need to be started',
    },
    { 
      key: 'in_progress' as const, 
      label: 'In Progress', 
      count: taskCounts.in_progress,
      color: theme.colors.primary,
      accessibilityHint: 'Show tasks currently being worked on',
    },
    { 
      key: 'done' as const, 
      label: 'Done', 
      count: taskCounts.done,
      color: theme.colors.tertiary,
      accessibilityHint: 'Show completed tasks',
    },
  ];

  const handleStatusChange = (status: TaskStatus | 'all') => {
    const previousStatus = selectedStatus;
    onStatusChange(status);
    
    // Announce filter change to screen readers
    const selectedFilter = filters.find(f => f.key === status);
    if (selectedFilter && status !== previousStatus) {
      announceStateChange(
        `Filter changed to ${selectedFilter.label}, showing ${selectedFilter.count} tasks`,
        ACCESSIBILITY_TIMEOUTS.stateChange,
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={120} // Approximate chip width for better scrolling
        snapToAlignment="start"
        accessibilityRole="tablist"
        accessibilityLabel="Task status filters"
      >
        {filters.map((filter) => (
          <View key={filter.key} style={styles.chipContainer}>
            <EnhancedChip
              variant="filter"
              size="md"
              selected={selectedStatus === filter.key}
              onPress={() => handleStatusChange(filter.key)}
              accessibilityLabel={createComplexAccessibilityLabel(
                `${filter.label} filter`,
                { selected: selectedStatus === filter.key },
                [`${filter.count} tasks`],
              )}
              accessibilityHint={filter.accessibilityHint}
              testID={`task-filter-${filter.key}`}
              style={styles.chip}
            >
              {filter.label} ({filter.count})
            </EnhancedChip>
          </View>
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  chip: {
    // Enhanced chip styling is handled by EnhancedChip component
  },
  chipContainer: {
    // Container for individual chip animations
  },
  container: {
    backgroundColor: theme.colors.background,
    paddingVertical: theme.spacing.sm,
  },
  scrollContent: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
});

export default TaskFilters;