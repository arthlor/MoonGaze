import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  Divider,
  IconButton,
  List,
  Paragraph,
  Switch,
  Title,
} from 'react-native-paper';

import { logError } from '../utils/errorHandling';
import { theme } from '../utils/theme';

import { EnhancedButton, EnhancedCard } from '../components';
import ProfileEditForm from '../components/ProfileEditForm';

import { updateProfile } from '../services/profileService';

import { useAuth } from '../contexts/AuthContext';
import { usePartnership } from '../hooks/usePartnership';

const ProfileScreen: React.FC = () => {
  const { user, logout, clearPartnershipData } = useAuth();
  const { partnership, partnerUser, loading: partnershipLoading, error: partnershipError } = usePartnership();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [editFormVisible, setEditFormVisible] = useState(false);
  const [editFormLoading, setEditFormLoading] = useState(false);
  const [clearingPartnership, setClearingPartnership] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              logError(error as Error, 'ProfileScreen.handleLogout');
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Coming Soon', 'Account deletion will be available in a future update.');
          },
        },
      ],
    );
  };

  const handleEditProfile = () => {
    setEditFormVisible(true);
  };

  const handleProfileUpdate = async (data: { displayName: string }) => {
    if (!user?.id) return;

    setEditFormLoading(true);
    try {
      const success = await updateProfile(user.id, data);
      if (success) {
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      logError(error as Error, 'ProfileScreen.handleProfileUpdate');
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setEditFormLoading(false);
    }
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'This will redirect you to reset your password via email.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            Alert.alert('Coming Soon', 'Password change will be available in a future update.');
          },
        },
      ],
    );
  };

  const handleClearPartnershipData = () => {
    Alert.alert(
      'Clear Partnership Data',
      'This will remove your current partnership connection. You can create a new partnership afterwards. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Partnership',
          style: 'destructive',
          onPress: async () => {
            setClearingPartnership(true);
            try {
              await clearPartnershipData();
              Alert.alert(
                'Success',
                'Partnership data has been cleared. You can now create a new partnership.',
              );
            } catch (error) {
              logError(error as Error, 'ProfileScreen.handleClearPartnershipData');
              Alert.alert(
                'Error',
                'Failed to clear partnership data. Please try again or contact support.',
              );
            } finally {
              setClearingPartnership(false);
            }
          },
        },
      ],
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (partnershipLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Paragraph style={styles.loadingText}>Loading profile...</Paragraph>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <EnhancedCard style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <Avatar.Text
            size={80}
            label={getInitials(user?.displayName || user?.email)}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Title style={styles.displayName}>
              {user?.displayName || 'Anonymous User'}
            </Title>
            <Paragraph style={styles.email}>{user?.email}</Paragraph>
            <Paragraph style={styles.joinDate}>
              Joined {user?.createdAt ? formatDate(user.createdAt) : 'Unknown'}
            </Paragraph>
          </View>
          <IconButton
            icon="pencil"
            size={24}
            onPress={handleEditProfile}
            style={styles.editButton}
          />
        </View>
      </EnhancedCard>

      {/* Partnership Info */}
      {partnership && partnerUser && (
        <EnhancedCard style={styles.partnershipCard}>
          <Title style={styles.sectionTitle}>Partnership</Title>
          <View style={styles.partnershipInfo}>
            <View style={styles.partnerInfo}>
              <Avatar.Text
                size={50}
                label={getInitials(partnerUser.displayName || partnerUser.email)}
                style={styles.partnerAvatar}
              />
              <View>
                <Paragraph style={styles.partnerName}>
                  {partnerUser.displayName || 'Partner'}
                </Paragraph>
                <Paragraph style={styles.partnerEmail}>
                  {partnerUser.email}
                </Paragraph>
              </View>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Title style={styles.statValue}>{partnership.sharedPoints}</Title>
                <Paragraph style={styles.statLabel}>Team Points</Paragraph>
              </View>
              <View style={styles.statItem}>
                <Title style={styles.statValue}>{user?.totalPoints || 0}</Title>
                <Paragraph style={styles.statLabel}>Your Points</Paragraph>
              </View>
              <View style={styles.statItem}>
                <Title style={styles.statValue}>
                  {formatDate(partnership.createdAt)}
                </Title>
                <Paragraph style={styles.statLabel}>Linked Since</Paragraph>
              </View>
            </View>
          </View>
        </EnhancedCard>
      )}

      {/* Settings */}
      <EnhancedCard style={styles.settingsCard}>
        <Title style={styles.sectionTitle}>Settings</Title>
        <List.Item
          title="Push Notifications"
          description="Receive notifications when your partner completes tasks"
          right={() => (
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
            />
          )}
        />
        <Divider />
        <List.Item
          title="Change Password"
          description="Update your account password"
          left={props => <List.Icon {...props} icon="lock" />}
          onPress={handleChangePassword}
        />
        <Divider />
        <List.Item
          title="Privacy Policy"
          description="View our privacy policy"
          left={props => <List.Icon {...props} icon="shield-account" />}
          onPress={() => {
            Alert.alert('Coming Soon', 'Privacy policy will be available in a future update.');
          }}
        />
        <Divider />
        <List.Item
          title="Help & Support"
          description="Get help or contact support"
          left={props => <List.Icon {...props} icon="help-circle" />}
          onPress={() => {
            Alert.alert('Coming Soon', 'Help & support will be available in a future update.');
          }}
        />
        {(partnershipError || (user?.partnershipId && !partnership)) && (
          <>
            <Divider />
            <List.Item
              title="Fix Partnership Issues"
              description="Clear corrupted partnership data if you&apos;re experiencing connection issues"
              left={props => <List.Icon {...props} icon="wrench" />}
              right={() => clearingPartnership ? <ActivityIndicator size="small" /> : undefined}
              onPress={clearingPartnership ? undefined : handleClearPartnershipData}
              disabled={clearingPartnership}
            />
          </>
        )}
      </EnhancedCard>

      {/* Account Actions */}
      <View style={styles.actionsContainer}>
        <EnhancedButton
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          icon="logout"
        >
          Logout
        </EnhancedButton>
        
        <EnhancedButton
          mode="outlined"
          onPress={handleDeleteAccount}
          style={styles.deleteButton}
          buttonColor={theme.colors.error}
          textColor={theme.colors.onError}
          icon="delete"
        >
          Delete Account
        </EnhancedButton>
      </View>

      {/* Profile Edit Form */}
      {user && (
        <ProfileEditForm
          visible={editFormVisible}
          onDismiss={() => setEditFormVisible(false)}
          onSubmit={handleProfileUpdate}
          user={user}
          isLoading={editFormLoading}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  actionsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
  },
  container: {
    backgroundColor: theme.colors.background,
    flex: 1,
    padding: 16,
  },
  deleteButton: {
    borderColor: theme.colors.error,
  },
  displayName: {
    color: theme.colors.onSurface,
    fontSize: 20,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 16,
  },
  editButton: {
    margin: 0,
  },
  email: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  joinDate: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    marginTop: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 16,
  },
  logoutButton: {
    borderColor: theme.colors.outline,
  },
  partnerAvatar: {
    backgroundColor: theme.colors.secondary,
    marginRight: 12,
  },
  partnerEmail: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
  },
  partnerInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  partnerName: {
    color: theme.colors.onSurface,
    fontSize: 16,
    fontWeight: '600',
  },
  partnershipCard: {
    marginBottom: 16,
  },
  partnershipInfo: {
    padding: 16,
  },
  profileCard: {
    marginBottom: 16,
  },
  profileHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 16,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  sectionTitle: {
    color: theme.colors.onSurface,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  settingsCard: {
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  statValue: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

export default ProfileScreen;