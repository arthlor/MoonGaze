import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import {
  Divider,
  Modal,
  Portal,
  Title,
} from 'react-native-paper';

import type { User } from '../types';

import { theme } from '../utils/theme';

import EnhancedButton from './EnhancedButton';
import EnhancedCard from './EnhancedCard';
import EnhancedTextInput from './EnhancedTextInput';

interface ProfileEditFormProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: { displayName: string }) => Promise<void>;
  user: User;
  isLoading?: boolean;
}

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  visible,
  onDismiss,
  onSubmit,
  user,
  isLoading = false,
}) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [errors, setErrors] = useState<{ displayName?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { displayName?: string } = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    } else if (displayName.trim().length < 2) {
      newErrors.displayName = 'Display name must be at least 2 characters';
    } else if (displayName.trim().length > 50) {
      newErrors.displayName = 'Display name must be less than 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await onSubmit({
        displayName: displayName.trim(),
      });
      onDismiss();
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const handleCancel = () => {
    setDisplayName(user.displayName || '');
    setErrors({});
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleCancel}
        contentContainerStyle={styles.modalContainer}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <EnhancedCard style={styles.formCard}>
            <View style={styles.header}>
              <Title style={styles.title}>Edit Profile</Title>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.form}>
              <EnhancedTextInput
                label="Display Name"
                value={displayName}
                onChangeText={setDisplayName}
                error={!!errors.displayName}
                errorText={errors.displayName}
                placeholder="Enter your display name"
                maxLength={50}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                disabled={isLoading}
              />

              <View style={styles.actions}>
                <EnhancedButton
                  mode="outlined"
                  onPress={handleCancel}
                  style={styles.cancelButton}
                  disabled={isLoading}
                >
                  Cancel
                </EnhancedButton>

                <EnhancedButton
                  mode="contained"
                  onPress={handleSubmit}
                  style={styles.saveButton}
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Save Changes
                </EnhancedButton>
              </View>
            </View>
          </EnhancedCard>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    borderColor: theme.colors.outline,
    flex: 1,
  },
  divider: {
    marginHorizontal: 20,
  },
  form: {
    gap: 16,
    padding: 20,
  },
  formCard: {
    maxHeight: '80%',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
  },
  modalContainer: {
    justifyContent: 'center',
    margin: 20,
  },
  saveButton: {
    flex: 1,
  },
  title: {
    color: theme.colors.onSurface,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ProfileEditForm;