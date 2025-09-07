import React, { ReactNode, createContext, useContext, useEffect, useReducer } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { AuthResult, LoginData, SignUpData, getCurrentUser } from '../services/authService';
import * as authService from '../services/authService';
import { User } from '../types';
import { notificationService } from '../services/notificationService';
import { cleanupExpiredCodesForCurrentUser } from '../services/linkingService';
import { clearUserPartnership } from '../services/partnershipValidationService';
import { analyticsService } from '../services/analyticsService';
import { clearCrashlyticsUserContext, setCrashlyticsUserContext } from '../utils/errorHandling';
import { logger } from '../utils/logger';

// Auth State Interface
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

// Auth Actions
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' };

// Auth Context Interface
export interface AuthContextType extends AuthState {
  signUp: (data: SignUpData) => Promise<AuthResult>;
  login: (data: LoginData) => Promise<AuthResult>;
  logout: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updateUserOnboardingStatus: (userId: string, completed: boolean) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  clearPartnershipData: () => Promise<void>;
}

// Initial State
const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

// Auth Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      dispatch({ type: 'SET_LOADING', payload: true });

      if (firebaseUser) {
        try {
          const userData = await getCurrentUser(firebaseUser);
          dispatch({ type: 'SET_USER', payload: userData });
          
          // Set analytics user ID and Crashlytics user context
          if (userData) {
            analyticsService.setUserId(userData.id);
            setCrashlyticsUserContext(userData.id, userData.email, userData.displayName);
          }
          
          // Initialize notifications when user is authenticated
          await notificationService.initialize();
          
          // Clean up expired codes when app starts (Requirement 3.1)
          cleanupExpiredCodesForCurrentUser().catch((error) => {
            logger.error('Error cleaning up expired codes', error, { 
              function: 'AuthContext.useEffect',
              userId: userData?.id, 
            });
          });
        } catch (error) {
          logger.error('Error getting user data', error, { 
            function: 'AuthContext.useEffect',
            firebaseUserId: firebaseUser?.uid, 
          });
          dispatch({ type: 'SET_ERROR', payload: 'Failed to load user data' });
        }
      } else {
        dispatch({ type: 'SET_USER', payload: null });
        
        // Clean up notifications and Crashlytics context when user logs out
        notificationService.cleanup();
        clearCrashlyticsUserContext();
      }
    });

    return unsubscribe;
  }, []);

  // Sign Up Function
  const signUp = async (data: SignUpData): Promise<AuthResult> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    const result = await authService.signUp(data);

    if (result.success && result.user) {
      dispatch({ type: 'SET_USER', payload: result.user });
      // Track signup event
      analyticsService.trackUserSignup('email');
    } else if (result.error) {
      dispatch({ type: 'SET_ERROR', payload: result.error });
    }

    return result;
  };

  // Login Function
  const login = async (data: LoginData): Promise<AuthResult> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    const result = await authService.login(data);

    if (result.success && result.user) {
      dispatch({ type: 'SET_USER', payload: result.user });
      // Track login event
      analyticsService.trackUserLogin('email');
    } else if (result.error) {
      dispatch({ type: 'SET_ERROR', payload: result.error });
    }

    return result;
  };

  // Logout Function
  const logout = async (): Promise<AuthResult> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    const result = await authService.logout();

    if (result.success) {
      dispatch({ type: 'SET_USER', payload: null });
    } else if (result.error) {
      dispatch({ type: 'SET_ERROR', payload: result.error });
    }

    return result;
  };

  // Reset Password Function
  const resetPassword = async (email: string): Promise<AuthResult> => {
    dispatch({ type: 'CLEAR_ERROR' });
    return await authService.resetPassword(email);
  };

  // Update User Onboarding Status Function
  const updateUserOnboardingStatus = async (userId: string, completed: boolean): Promise<void> => {
    try {
      await authService.updateUserOnboardingStatus(userId, completed);
      
      // Update local state
      if (state.user && state.user.id === userId) {
        dispatch({ 
          type: 'SET_USER', 
          payload: { 
            ...state.user, 
            hasCompletedOnboarding: completed, 
          }, 
        });
      }
    } catch (error) {
      logger.error('Error updating onboarding status', error, { 
        function: 'updateOnboardingStatus',
        userId: state.user?.id,
        completed, 
      });
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update onboarding status' });
    }
  };

  // Refresh User Function
  const refreshUser = async (): Promise<void> => {
    if (auth.currentUser) {
      try {
        const userData = await getCurrentUser(auth.currentUser);
        dispatch({ type: 'SET_USER', payload: userData });
      } catch (error) {
        logger.error('Error refreshing user data', error, { 
          function: 'refreshUser',
          userId: state.user?.id, 
        });
        dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh user data' });
      }
    }
  };

  // Clear Error Function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Clear Partnership Data Function
  const clearPartnershipData = async (): Promise<void> => {
    if (!state.user) {
      throw new Error('No user logged in');
    }

    try {
      await clearUserPartnership(state.user.id);
      
      // Refresh user data to reflect the changes
      await refreshUser();
    } catch (error) {
      logger.error('Error clearing partnership data', error, { 
        function: 'clearPartnership',
        userId: state.user?.id, 
      });
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear partnership data' });
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    ...state,
    signUp,
    login,
    logout,
    resetPassword,
    updateUserOnboardingStatus,
    refreshUser,
    clearError,
    clearPartnershipData,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook to use Auth Context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};