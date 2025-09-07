import { deleteUser as deleteAuthUser, updatePassword } from 'firebase/auth';

import type { User } from '../types';

import { logError } from '../utils/errorHandling';

import { getUser, updateUser } from './firestoreService';
import { auth } from './firebase';

export interface ProfileUpdateData {
  displayName?: string;
  // Add more profile fields as needed
}

/**
 * Updates user profile information
 */
export const updateProfile = async (
  userId: string,
  updates: ProfileUpdateData,
): Promise<boolean> => {
  try {
    const updateData: Partial<User> = {
      ...updates,
      lastActive: new Date(),
    };

    await updateUser(userId, updateData);
    return true;
  } catch (error) {
    logError(error as Error, 'profileService.updateProfile');
    return false;
  }
};

/**
 * Changes user password
 */
export const changePassword = async (newPassword: string): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found');
    }

    await updatePassword(user, newPassword);
    return true;
  } catch (error) {
    logError(error as Error, 'profileService.changePassword');
    return false;
  }
};

/**
 * Deletes user account and all associated data
 */
export const deleteAccount = async (_userId: string): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No authenticated user found');
    }

    // TODO: Implement cleanup of user data from Firestore
    // This should include:
    // - Removing user from partnerships
    // - Cleaning up tasks created by user
    // - Removing user document
    
    // For now, just delete the auth user
    await deleteAuthUser(user);
    return true;
  } catch (error) {
    logError(error as Error, 'profileService.deleteAccount');
    return false;
  }
};

/**
 * Gets user profile data
 */
export const getProfile = async (userId: string): Promise<User | null> => {
  try {
    return await getUser(userId);
  } catch (error) {
    logError(error as Error, 'profileService.getProfile');
    return null;
  }
};

/**
 * Updates user notification preferences
 */
export const updateNotificationPreferences = async (
  userId: string,
  _preferences: {
    pushNotifications?: boolean;
    emailNotifications?: boolean;
  },
): Promise<boolean> => {
  try {
    // For now, we'll store this in the user document
    // In the future, this could be a separate preferences collection
    const updateData: Partial<User> = {
      // Add notification preferences to user type if needed
      lastActive: new Date(),
    };

    await updateUser(userId, updateData);
    return true;
  } catch (error) {
    logError(error as Error, 'profileService.updateNotificationPreferences');
    return false;
  }
};