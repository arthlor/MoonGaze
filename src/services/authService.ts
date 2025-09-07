import {
  AuthError,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import {
  User,
  UserDocument,
  createUser,
  documentToUser,
  userToDocument,
} from '../types';
import {
  analyzeError,
  clearCrashlyticsUserContext,
  logError,
  setCrashlyticsUserContext,
  withRetry,
} from '../utils/errorHandling';
import { logger } from '../utils/logger';

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

/**
 * Creates a new user account with email and password
 */
export const signUp = async (data: SignUpData): Promise<AuthResult> => {
  try {
    const result = await withRetry(
      async () => {
        const { email, password, displayName } = data;

        // Create Firebase user
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const firebaseUser = userCredential.user;

        // Update display name if provided
        if (displayName) {
          await updateProfile(firebaseUser, { displayName });
        }

        // Create user document in Firestore
        if (!firebaseUser.email) {
          throw new Error('User email is required but not available');
        }
        
        const userData = createUser(
          firebaseUser.uid,
          firebaseUser.email,
          displayName || firebaseUser.displayName || undefined,
        );

        // Convert to Firestore document format
        const userDocument = userToDocument(userData);
        await setDoc(doc(db, 'users', firebaseUser.uid), userDocument);

        // Set user context for Crashlytics
        setCrashlyticsUserContext(
          userData.id,
          userData.email,
          userData.displayName,
        );

        return userData;
      },
      { maxRetries: 2 },
    );

    return {
      success: true,
      user: result,
    };
  } catch (error) {
    logError(error, 'signUp');
    const errorInfo = analyzeError(error);
    return {
      success: false,
      error: errorInfo.userMessage,
    };
  }
};

/**
 * Signs in user with email and password
 */
export const login = async (data: LoginData): Promise<AuthResult> => {
  try {
    const result = await withRetry(
      async () => {
        const { email, password } = data;

        // Sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const firebaseUser = userCredential.user;

        // Get user document from Firestore, or create it if it's missing (self-healing)
        const userRef = doc(db, 'users', firebaseUser.uid);
        let userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          logger.warn(
            'User document not found on login, creating it now.',
            { uid: firebaseUser.uid, email: firebaseUser.email },
          );
          if (!firebaseUser.email) {
            throw new Error('User email is required but not available');
          }
          const newUser = createUser(
            firebaseUser.uid,
            firebaseUser.email,
            firebaseUser.displayName || undefined,
          );
          const newUserDoc = userToDocument(newUser);
          await setDoc(userRef, newUserDoc);
          userDoc = await getDoc(userRef); // Re-fetch the newly created doc
        }

        if (!userDoc.exists()) {
          // This should now be an unreachable state
          throw new Error('User data not found even after attempting creation');
        }

        const userData = documentToUser(userDoc.data() as UserDocument);

        // Set user context for Crashlytics
        setCrashlyticsUserContext(
          userData.id,
          userData.email,
          userData.displayName,
        );

        return userData;
      },
      { maxRetries: 2 },
    );

    return {
      success: true,
      user: result,
    };
  } catch (error) {
    logError(error, 'login');
    const errorInfo = analyzeError(error);
    return {
      success: false,
      error: errorInfo.userMessage,
    };
  }
};

/**
 * Signs out the current user
 */
export const logout = async (): Promise<AuthResult> => {
  try {
    // Clear user context from Crashlytics before signing out
    clearCrashlyticsUserContext();

    await signOut(auth);
    return {
      success: true,
    };
  } catch (error) {
    const authError = error as AuthError;
    return {
      success: false,
      error: getAuthErrorMessage(authError.code),
    };
  }
};

/**
 * Sends password reset email
 */
export const resetPassword = async (email: string): Promise<AuthResult> => {
  try {
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
    };
  } catch (error) {
    const authError = error as AuthError;
    return {
      success: false,
      error: getAuthErrorMessage(authError.code),
    };
  }
};

/**
 * Gets current user data from Firestore
 */
export const getCurrentUser = async (
  firebaseUser: FirebaseUser,
): Promise<User | null> => {
  try {
    if (!firebaseUser?.uid) {
      logger.error('Invalid Firebase user provided', null, { 
        function: 'getCurrentUser',
      });
      return null;
    }

    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

    if (!userDoc.exists()) {
      return null;
    }

    const userDocument = userDoc.data();
    if (!userDocument) {
      logger.error('User document exists but has no data', null, { 
        function: 'getCurrentUser',
        userId: firebaseUser.uid,
      });
      return null;
    }

    return documentToUser(userDocument as UserDocument);
  } catch (error) {
    logger.error('Error getting current user', error, { 
      function: 'getCurrentUser',
      userId: firebaseUser?.uid, 
    });
    return null;
  }
};

/**
 * Updates user's onboarding completion status
 */
export const updateUserOnboardingStatus = async (
  userId: string,
  completed: boolean,
): Promise<void> => {
  try {
    if (!userId?.trim()) {
      throw new Error('User ID is required');
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User document not found');
    }

    const userDocument = userDoc.data();
    if (!userDocument) {
      throw new Error('User document exists but has no data');
    }

    const userData = documentToUser(userDocument as UserDocument);

    const updatedUserData = {
      ...userData,
      hasCompletedOnboarding: completed,
      lastActive: new Date(),
    };

    const updatedUserDocument = userToDocument(updatedUserData);
    await setDoc(userRef, updatedUserDocument);
  } catch (error) {
    logger.error('Error updating onboarding status', error, { 
      function: 'updateUserOnboardingStatus',
      userId,
      completed, 
    });
    throw error;
  }
};

/**
 * Converts Firebase auth error codes to user-friendly messages
 */
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    default:
      return 'An error occurred. Please try again.';
  }
};
