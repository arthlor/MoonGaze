import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import { Button, Modal, Surface, Text } from 'react-native-paper';
import { Task } from '../types';
import { theme } from '../utils/theme';
import { DURATIONS, EASING } from '../utils/animations';
import ConfettiAnimation from './ConfettiAnimation';

interface CelebrationModalProps {
  visible: boolean;
  onDismiss: () => void;
  task?: Task;
  pointsEarned?: number;
  completedBy?: string;
  currentUserId?: string;
}

const CelebrationModal: React.FC<CelebrationModalProps> = React.memo(
  ({
    visible,
    onDismiss,
    task,
    pointsEarned = 10,
    completedBy,
    currentUserId,
  }) => {
    const [showConfetti, setShowConfetti] = useState(false);
    const scaleAnim = useMemo(() => new Animated.Value(0), []);
    const fadeAnim = useMemo(() => new Animated.Value(0), []);
    const backdropAnim = useMemo(() => new Animated.Value(0), []);

    useEffect(() => {
      if (visible) {
        setShowConfetti(true);

        // Enhanced entrance animation with backdrop
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 120,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: DURATIONS.normal,
            easing: EASING,
            useNativeDriver: true,
          }),
          Animated.timing(backdropAnim, {
            toValue: 1,
            duration: DURATIONS.normal,
            easing: EASING,
            useNativeDriver: true,
          }),
        ]).start();

        // Announce to screen readers
        const message = `Task completed! ${task?.title || 'Task'} earned ${pointsEarned} points.`;
        AccessibilityInfo.announceForAccessibility(message);
      } else {
        // Exit animation
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: DURATIONS.fast,
            easing: EASING,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: DURATIONS.fast,
            easing: EASING,
            useNativeDriver: true,
          }),
          Animated.timing(backdropAnim, {
            toValue: 0,
            duration: DURATIONS.fast,
            easing: EASING,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowConfetti(false);
          scaleAnim.setValue(0);
          fadeAnim.setValue(0);
          backdropAnim.setValue(0);
        });
      }
    }, [backdropAnim, fadeAnim, pointsEarned, scaleAnim, task?.title, visible]);

    const handleConfettiComplete = useCallback(() => {
      setShowConfetti(false);
    }, []);

    const celebrationData = useMemo(() => {
      const isCompletedByCurrentUser = completedBy === currentUserId;
      const celebrationTitle = isCompletedByCurrentUser
        ? '� Task Completed!'
        : '🎊 Your Partner Completed a Task!';

      const celebrationMessage = isCompletedByCurrentUser
        ? `Great job! You've earned ${pointsEarned} points for completing "${task?.title}".`
        : `${task?.title} has been completed! Your team earned ${pointsEarned} points.`;

      const motivationalMessages = [
        'Keep up the great work! 💪',
        'You&apos;re on fire! 🔥',
        'Teamwork makes the dream work! ✨',
        'Another one bites the dust! 🎯',
        'Progress feels good! 🌟',
        'You&apos;re crushing it! 💎',
        'High five! 🙌',
        'Momentum is building! 🚀',
      ];

      const randomMessage =
        motivationalMessages[
          Math.floor(Math.random() * motivationalMessages.length)
        ];

      return {
        isCompletedByCurrentUser,
        celebrationTitle,
        celebrationMessage,
        randomMessage,
      };
    }, [completedBy, currentUserId, pointsEarned, task?.title]);

    return (
      <>
        <Modal
          visible={visible}
          onDismiss={onDismiss}
          contentContainerStyle={styles.modalContainer}
        >
          {/* Enhanced backdrop with animation */}
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropAnim,
              },
            ]}
          />

          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
              },
            ]}
            accessible={true}
            accessibilityRole="none"
            accessibilityLabel="Task completion celebration"
            accessibilityViewIsModal={true}
          >
            <Surface style={styles.celebrationCard} elevation={0}>
              {/* Celebration Icon */}
              <View style={styles.iconContainer}>
                <Text style={styles.celebrationIcon}>
                  {celebrationData.isCompletedByCurrentUser ? '🎉' : '🎊'}
                </Text>
              </View>

              {/* Title */}
              <Text variant="headlineSmall" style={styles.title}>
                {celebrationData.celebrationTitle}
              </Text>

              {/* Task Name */}
              {task && (
                <Text variant="titleMedium" style={styles.taskTitle}>
                  &quot;{task.title}&quot;
                </Text>
              )}

              {/* Message */}
              <Text variant="bodyLarge" style={styles.message}>
                {celebrationData.celebrationMessage}
              </Text>

              {/* Points Display */}
              <View style={styles.pointsContainer}>
                <Text variant="displaySmall" style={styles.pointsText}>
                  +{pointsEarned}
                </Text>
                <Text variant="bodyMedium" style={styles.pointsLabel}>
                  points earned
                </Text>
              </View>

              {/* Motivational Message */}
              <Text variant="bodyMedium" style={styles.motivationalMessage}>
                {celebrationData.randomMessage}
              </Text>

              {/* Action Button */}
              <Button
                mode="contained"
                onPress={onDismiss}
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
                accessibilityLabel="Close celebration modal"
                accessibilityHint="Dismisses the task completion celebration"
              >
                Awesome!
              </Button>
            </Surface>
          </Animated.View>
        </Modal>

        {/* Confetti Animation */}
        <ConfettiAnimation
          visible={showConfetti}
          onComplete={handleConfettiComplete}
          duration={2500}
          pieceCount={60}
        />
      </>
    );
  },
);

const styles = StyleSheet.create({
  actionButton: {
    borderRadius: theme.borderRadius.lg,
    width: '100%',
  },
  actionButtonContent: {
    paddingVertical: theme.spacing.sm,
  },
  backdrop: {
    backgroundColor: theme.colors.backdrop,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  celebrationCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    elevation: theme.shadows.xl.elevation,
    padding: theme.spacing.xl,
    shadowColor: theme.shadows.xl.shadowColor,
    shadowOffset: theme.shadows.xl.shadowOffset,
    shadowOpacity: theme.shadows.xl.shadowOpacity,
    shadowRadius: theme.shadows.xl.shadowRadius,
  },
  celebrationIcon: {
    fontSize: 64,
  },
  iconContainer: {
    marginBottom: theme.spacing.md,
  },
  message: {
    color: theme.colors.onSurfaceVariant,
    lineHeight:
      theme.typography.lineHeights.relaxed * theme.typography.fontSizes.base,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  modalContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  modalContent: {
    maxWidth: 400,
    width: '100%',
    zIndex: 1,
  },
  motivationalMessage: {
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  pointsContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: theme.borderRadius.lg,
    elevation: theme.shadows.sm.elevation,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm + 4,
    shadowColor: theme.shadows.sm.shadowColor,
    shadowOffset: theme.shadows.sm.shadowOffset,
    shadowOpacity: theme.shadows.sm.shadowOpacity,
    shadowRadius: theme.shadows.sm.shadowRadius,
  },
  pointsLabel: {
    color: theme.colors.onPrimaryContainer,
    fontWeight: theme.typography.fontWeights.medium as '500',
  },
  pointsText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.bold as '600',
    marginBottom: 4,
  },
  taskTitle: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.semibold as '600',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  title: {
    color: theme.colors.onSurface,
    fontWeight: theme.typography.fontWeights.bold as '600',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
});

export default CelebrationModal;
