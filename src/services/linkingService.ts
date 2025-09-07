import {
  Timestamp,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import {
  LinkingCodeDocument,
  LinkingCode as LinkingCodeType,
  createLinkingCode,
  createPartnership,
  documentToLinkingCode,
  generateLinkingCode as generateCodeString,
  linkingCodeToDocument,
  partnershipToDocument,
} from '../types';
import { analyticsService } from './analyticsService';
import { logger } from '../utils/logger';

// Types for the linking service
export interface LinkingCode {
  code: string;
  expiresAt: Date;
  message: string;
}

export interface LinkingResult {
  partnershipId: string;
  partnerId: string;
  partnerName?: string;
  message: string;
}

/**
 * Generates a new linking code for partner linking
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
export const createNewLinkingCode = async (): Promise<LinkingCode> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to generate linking code');
    }

    // Clean up expired codes during linking operations (Requirement 3.2)
    cleanupExpiredCodes(currentUser.uid).catch((error) => logger.error('Failed to cleanup expired codes', error));

    // Check for existing active codes first (Requirement 1.2, 1.5)
    const existingCode = await checkForExistingActiveCode(currentUser.uid);
    if (existingCode) {
      return {
        code: existingCode.code,
        expiresAt: existingCode.expiresAt,
        message: 'Using existing active linking code',
      };
    }

    // Generate a new unique code (Requirement 1.1)
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const codeString = generateCodeString(); // ABC-123 format
      const linkingCodeData = createLinkingCode(currentUser.uid);

      try {
        // Create the linking code document
        const linkingCodeDoc: LinkingCodeDocument = linkingCodeToDocument({
          ...linkingCodeData,
          code: codeString,
        });

        // Use the code as the document ID to ensure uniqueness
        await setDoc(doc(db, 'linkingCodes', codeString), linkingCodeDoc);

        // Track partnership creation (when someone generates a code to start a partnership)
        analyticsService.trackPartnershipCreation();

        // Set expiration time of 15 minutes (Requirement 1.3)
        return {
          code: codeString,
          expiresAt: linkingCodeData.expiresAt,
          message: 'Linking code generated successfully',
        };
      } catch (error: unknown) {
        // If there's a collision, try again with a new code
        if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'already-exists') {
          attempts++;
          continue;
        }
        throw error;
      }
    }

    throw new Error(
      'Failed to generate unique linking code after multiple attempts',
    );
  } catch (error: unknown) {
    logger.error('Error generating linking code', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate linking code';
    throw new Error(errorMessage);
  }
};

/**
 * Checks for existing active linking codes for the current user
 * Requirements: 1.2, 1.5
 */
const checkForExistingActiveCode = async (
  userId: string,
): Promise<LinkingCodeType | null> => {
  try {
    const now = new Date();
    const linkingCodesRef = collection(db, 'linkingCodes');

    // Query for active codes created by this user that haven't expired
    const q = query(
      linkingCodesRef,
      where('createdBy', '==', userId),
      where('isUsed', '==', false),
      where('expiresAt', '>', Timestamp.fromDate(now)),
      orderBy('expiresAt', 'desc'),
      limit(1),
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const linkingCodeDoc = doc.data() as LinkingCodeDocument;
      return documentToLinkingCode(linkingCodeDoc);
    }

    return null;
  } catch (error: unknown) {
    logger.error('Error checking for existing active code', error);
    // Don't throw here, just return null to allow new code generation
    return null;
  }
};

/**
 * Cleans up expired linking codes for the current user
 * This is called during normal operations to keep storage optimized
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
const cleanupExpiredCodes = async (userId: string): Promise<void> => {
  try {
    const now = new Date();
    const linkingCodesRef = collection(db, 'linkingCodes');

    // Query for expired codes created by this user (limit to 5 for quota efficiency - Requirement 3.4)
    const q = query(
      linkingCodesRef,
      where('createdBy', '==', userId),
      where('expiresAt', '<', Timestamp.fromDate(now)), // Only delete codes older than expiration time (Requirement 3.3)
      limit(5), // Small batches as specified in task details
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const batch = writeBatch(db);

      querySnapshot.docs.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
      });

      await batch.commit();
      logger.info('Cleaned up expired linking codes', { 
        count: querySnapshot.docs.length, 
        userId,
      });
    }
  } catch (error: unknown) {
    logger.error('Error cleaning up expired codes', error);
    // Don't throw here, cleanup is non-critical (Requirement 3.5)
  }
};

/**
 * Public function to clean up expired codes for the current authenticated user
 * This is called when the app starts (Requirement 3.1)
 */
export const cleanupExpiredCodesForCurrentUser = async (): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return; // No user authenticated, nothing to clean up
    }

    await cleanupExpiredCodes(currentUser.uid);
  } catch (error: unknown) {
    logger.error('Error in cleanup for current user', error);
    // Don't throw here, cleanup is non-critical (Requirement 3.5)
  }
};

/**
 * Links the current user with a partner using a linking code
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */
export const linkWithPartner = async (code: string): Promise<LinkingResult> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to link with partner');
    }

    // Clean up expired codes during linking operations (Requirement 3.2)
    cleanupExpiredCodes(currentUser.uid).catch((error) => logger.error('Failed to cleanup expired codes during linking', error));

    // Validate code format (Requirement 2.7)
    if (
      !code ||
      typeof code !== 'string'
    ) {
      throw new Error('Invalid linking code format');
    }

    const trimmedCode = code.trim().toUpperCase();
    
    // Validate the code format matches our generation pattern (XXX-XXX)
    if (!/^[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(trimmedCode)) {
      logger.error('Code format validation failed', { 
        code: trimmedCode, 
        length: trimmedCode.length,
        pattern: /^[A-Z0-9]{3}-[A-Z0-9]{3}$/,
        testResult: /^[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(trimmedCode),
      });
      throw new Error(`Invalid linking code format. Expected format: ABC-123, got: ${trimmedCode}`);
    }

    // Use Firestore transaction for atomic partnership creation (Requirement 2.2)
    const result = await runTransaction(db, async (transaction) => {
      // Find the linking code by document ID for strong consistency (Requirement 2.1)
      const codeRef = doc(db, 'linkingCodes', trimmedCode);
      const codeDoc = await transaction.get(codeRef);

      if (!codeDoc.exists()) {
        throw new Error('Invalid linking code');
      }

      const linkingCodeData = codeDoc.data() as LinkingCodeDocument;
      const linkingCode = documentToLinkingCode(linkingCodeData);

      // Validate code expiration (Requirement 2.3)
      const now = new Date();
      if (linkingCode.expiresAt <= now) {
        throw new Error('Linking code has expired');
      }

      // Check if code is already used (Requirement 2.6)
      if (linkingCode.isUsed) {
        throw new Error('This linking code has already been used');
      }

      // Prevent users from linking with themselves (Requirement 2.3)
      if (linkingCode.createdBy === currentUser.uid) {
        throw new Error('Cannot link with yourself');
      }

      // Declare refs for use in transaction writes
      const currentUserRef = doc(db, 'users', currentUser.uid);
      const partnerUserRef = doc(db, 'users', linkingCode.createdBy);

      // Atomically read user profiles to ensure neither is already in a partnership.
      // We read sequentially to provide a better error message if the partner read fails,
      // which is likely due to the security rule protecting an already-partnered user.
      const currentUserDoc = await transaction.get(currentUserRef);
      if (!currentUserDoc.exists()) {
        throw new Error('Your user account could not be found.');
      }
      if (currentUserDoc.data()?.partnershipId) {
        throw new Error('You are already in a partnership.');
      }

      let partnerUserDoc;
      try {
        partnerUserDoc = await transaction.get(partnerUserRef);
      } catch (error) {
        logger.error('Failed to read partner document inside transaction', { partnerId: linkingCode.createdBy, error });
        throw new Error(
          'Could not link with partner. They may already be in a partnership or their account is unavailable.',
        );
      }

      if (!partnerUserDoc.exists()) {
        throw new Error('Partner\'s user account not found.');
      }
      if (partnerUserDoc.data()?.partnershipId) {
        throw new Error('This user is already in a partnership.');
      }

      // Create partnership document (Requirement 2.5)
      const partnershipData = createPartnership(
        currentUser.uid,
        linkingCode.createdBy,
      );
      const partnershipRef = doc(collection(db, 'partnerships'));
      const partnershipDoc = partnershipToDocument({
        ...partnershipData,
        id: partnershipRef.id,
      });

      transaction.set(partnershipRef, partnershipDoc);

      // Update both user documents with partnership information
      transaction.update(currentUserRef, {
        partnerId: linkingCode.createdBy,
        partnershipId: partnershipRef.id,
        lastActive: Timestamp.fromDate(new Date()),
      });

      transaction.update(partnerUserRef, {
        partnerId: currentUser.uid,
        partnershipId: partnershipRef.id,
        lastActive: Timestamp.fromDate(new Date()),
      });

      // Mark the linking code as used (Requirement 2.6)
      transaction.update(codeRef, {
        isUsed: true,
      });

      return {
        partnershipId: partnershipRef.id,
        partnerId: linkingCode.createdBy,
        partnerName: undefined,
        message: 'Successfully linked with partner',
      };
    });

    // Track partnership creation
    analyticsService.trackPartnershipJoined();

    return result;
  } catch (error: unknown) {
    logger.error('Error linking with partner', error);

    // Map error messages to user-friendly messages (Requirement 2.7)
    let errorMessage = 'Failed to link with partner';

    if (error instanceof Error && error.message) {
      // Use the specific error messages we throw above
      if (
        error.message.includes('Invalid linking code') ||
        error.message.includes('format')
      ) {
        errorMessage = 'Invalid linking code';
      } else if (error.message.includes('expired')) {
        errorMessage = 'Linking code has expired';
      } else if (error.message.includes('already been used')) {
        errorMessage = 'This code has already been used';
      } else if (error.message.includes('Cannot link with yourself')) {
        errorMessage = 'Cannot link with yourself';
      } else if (error.message.includes('already in a partnership')) {
        errorMessage =
          'You or your partner are already linked with someone else';
      } else if (error.message.includes('not found')) {
        errorMessage = 'User account not found';
      } else {
        errorMessage = error.message;
      }
    }

    throw new Error(errorMessage);
  }
};
