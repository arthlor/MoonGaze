/**
 * Partnership Validation Service
 *
 * Handles validation and cleanup of partnership data inconsistencies
 */
import { getPartnership, getUser, updateUser } from './firestoreService';
import { logError } from '../utils/errorHandling';
import type { User } from '../types';

export interface PartnershipValidationResult {
  isValid: boolean;
  shouldClearPartnership: boolean;
  error?: string;
}

/**
 * Validates a user's partnership data for consistency
 */
export const validateUserPartnership = async (
  user: User,
): Promise<PartnershipValidationResult> => {
  // If user has no partnership, it's valid
  if (!user.partnershipId || !user.partnerId) {
    return { isValid: true, shouldClearPartnership: false };
  }

  try {
    // Check if partnership document exists and user is a member
    const partnership = await getPartnership(user.partnershipId);

    if (!partnership) {
      logError(
        new Error(
          `Partnership ${user.partnershipId} not found for user ${user.id}`,
        ),
        'partnershipValidation.missingPartnership',
      );
      return {
        isValid: false,
        shouldClearPartnership: true,
        error: 'Partnership document not found',
      };
    }

    // Check if user is actually a member of the partnership
    const isValidMember =
      partnership.user1Id === user.id || partnership.user2Id === user.id;

    if (!isValidMember) {
      logError(
        new Error(
          `User ${user.id} is not a member of partnership ${user.partnershipId}`,
        ),
        'partnershipValidation.invalidMembership',
      );
      return {
        isValid: false,
        shouldClearPartnership: true,
        error: 'User is not a member of the referenced partnership',
      };
    }

    // Check if partner user exists
    const expectedPartnerId =
      partnership.user1Id === user.id
        ? partnership.user2Id
        : partnership.user1Id;

    if (user.partnerId !== expectedPartnerId) {
      logError(
        new Error(
          `User ${user.id} has incorrect partnerId. Expected: ${expectedPartnerId}, Got: ${user.partnerId}`,
        ),
        'partnershipValidation.incorrectPartnerId',
      );
      return {
        isValid: false,
        shouldClearPartnership: true,
        error: 'Partner ID mismatch',
      };
    }

    const partnerUser = await getUser(expectedPartnerId);

    if (!partnerUser) {
      logError(
        new Error(
          `Partner user ${expectedPartnerId} not found for user ${user.id}`,
        ),
        'partnershipValidation.missingPartner',
      );
      return {
        isValid: false,
        shouldClearPartnership: true,
        error: 'Partner user not found',
      };
    }

    // All checks passed
    return { isValid: true, shouldClearPartnership: false };
  } catch (error) {
    logError(error as Error, 'partnershipValidation.validationError');

    // If it's a permission error, suggest clearing the partnership
    if ((error as Error).message?.includes('permission-denied')) {
      return {
        isValid: false,
        shouldClearPartnership: true,
        error: 'Permission denied accessing partnership data',
      };
    }

    return {
      isValid: false,
      shouldClearPartnership: false,
      error: 'Failed to validate partnership',
    };
  }
};

/**
 * Clears partnership data from a user document
 */
export const clearUserPartnership = async (userId: string): Promise<void> => {
  try {
    await updateUser(userId, {
      partnerId: undefined,
      partnershipId: undefined,
    });

    logError(
      new Error(
        `Cleared partnership data for user ${userId} due to validation failure`,
      ),
      'partnershipValidation.partnershipCleared',
    );
  } catch (error) {
    logError(error as Error, 'partnershipValidation.clearPartnershipError');
    throw error;
  }
};

/**
 * Validates and potentially fixes a user's partnership data
 */
export const validateAndFixUserPartnership = async (
  user: User,
): Promise<boolean> => {
  const validation = await validateUserPartnership(user);

  if (!validation.isValid && validation.shouldClearPartnership) {
    try {
      await clearUserPartnership(user.id);
      return true; // Partnership was cleared
    } catch (error) {
      logError(error as Error, 'partnershipValidation.fixPartnershipError');
      return false;
    }
  }

  return validation.isValid;
};
