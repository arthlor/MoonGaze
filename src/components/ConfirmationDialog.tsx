import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, StyleSheet } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { DURATIONS, EASING } from '../utils/animations';
import { theme } from '../utils/theme';

interface ConfirmationDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  onDismiss,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Enhanced entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 150,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: DURATIONS.normal,
          easing: EASING,
          useNativeDriver: true,
        }),
      ]).start();

      // Announce to screen readers
      AccessibilityInfo.announceForAccessibility(`Dialog: ${title}. ${message}`);
    } else {
      // Exit animation
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
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
      ]).start(() => {
        scaleAnim.setValue(0);
        fadeAnim.setValue(0);
      });
    }
  }, [fadeAnim, message, scaleAnim, title, visible]);

  return (
    <Portal>
      <Dialog 
        visible={visible} 
        onDismiss={onDismiss}
        style={[
          styles.dialog,
          {
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        <Dialog.Title 
          style={styles.dialogTitle}
        >
          {title}
        </Dialog.Title>
        <Dialog.Content style={styles.dialogContent}>
          <Text 
            variant="bodyMedium" 
            style={styles.dialogMessage}
          >
            {message}
          </Text>
        </Dialog.Content>
        <Dialog.Actions style={styles.dialogActions}>
          <Button 
            onPress={onDismiss} 
            disabled={isLoading}
            style={styles.cancelButton}
            contentStyle={styles.buttonContent}
            accessibilityLabel={`${cancelText} button`}
            accessibilityHint="Cancels the action and closes the dialog"
          >
            {cancelText}
          </Button>
          <Button
            mode="contained"
            onPress={onConfirm}
            loading={isLoading}
            disabled={isLoading}
            buttonColor={isDestructive ? theme.colors.error : theme.colors.primary}
            textColor={isDestructive ? theme.colors.onError : theme.colors.onPrimary}
            style={styles.confirmButton}
            contentStyle={styles.buttonContent}
            accessibilityLabel={`${confirmText} button`}
            accessibilityHint={isDestructive ? 'Performs a destructive action' : 'Confirms the action'}
          >
            {confirmText}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  buttonContent: {
    paddingHorizontal: theme.spacing.md,
  },
  cancelButton: {
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
  },
  confirmButton: {
    borderRadius: theme.borderRadius.md,
    elevation: theme.shadows.sm.elevation,
    shadowColor: theme.shadows.sm.shadowColor,
    shadowOffset: theme.shadows.sm.shadowOffset,
    shadowOpacity: theme.shadows.sm.shadowOpacity,
    shadowRadius: theme.shadows.sm.shadowRadius,
  },
  dialog: {
    // Base dialog styles - animation transforms will be applied inline
  },
  dialogActions: {
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  dialogContent: {
    paddingVertical: theme.spacing.md,
  },
  dialogMessage: {
    color: theme.colors.onSurfaceVariant,
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.fontSizes.base,
  },
  dialogTitle: {
    color: theme.colors.onSurface,
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold as '600',
  },
});

export default ConfirmationDialog;