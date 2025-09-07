import { useEffect, useState } from 'react';
import { Partnership, User } from '../types';
import { getUser, subscribeToPartnership } from '../services/firestoreService';
import { validateAndFixUserPartnership } from '../services/partnershipValidationService';
import { useAuth } from '../contexts/AuthContext';
import { logError } from '../utils/errorHandling';

interface UsePartnershipResult {
  partnership: Partnership | null;
  partnerUser: User | null;
  loading: boolean;
  error: string | null;
}

export const usePartnership = (): UsePartnershipResult => {
  const { user } = useAuth();
  const [partnership, setPartnership] = useState<Partnership | null>(null);
  const [partnerUser, setPartnerUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.partnershipId) {
      setPartnership(null);
      setPartnerUser(null);
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const setupPartnershipData = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, validate the user's partnership data
        const isValidPartnership = await validateAndFixUserPartnership(user);

        if (!isValidPartnership) {
          // Partnership was invalid and couldn't be fixed
          setPartnership(null);
          setPartnerUser(null);
          setError(
            'Partnership data was inconsistent and has been cleared. Please create a new partnership.',
          );
          setLoading(false);
          return;
        }

        // If user no longer has a partnership after validation, exit early
        if (!user.partnershipId) {
          setPartnership(null);
          setPartnerUser(null);
          setLoading(false);
          return;
        }

        // Subscribe to partnership changes with enhanced error handling
        if (!user.partnershipId) {
          setError('User has no partnership ID');
          setLoading(false);
          return;
        }

        unsubscribe = subscribeToPartnership(
          user.partnershipId,
          async (partnershipData) => {
            setPartnership(partnershipData);

            if (partnershipData) {
              // Validate that current user is actually a member of this partnership
              const isValidMember =
                partnershipData.user1Id === user.id ||
                partnershipData.user2Id === user.id;

              if (!isValidMember) {
                logError(
                  new Error(
                    `User ${user.id} is not a member of partnership ${user.partnershipId}`,
                  ),
                  'usePartnership.validateMembership',
                );
                setError(
                  'Partnership data is inconsistent. Please contact support.',
                );
                setLoading(false);
                return;
              }

              // Get partner user data
              const partnerId =
                partnershipData.user1Id === user.id
                  ? partnershipData.user2Id
                  : partnershipData.user1Id;

              try {
                const partner = await getUser(partnerId);
                setPartnerUser(partner);
              } catch (partnerError) {
                logError(
                  partnerError as Error,
                  'usePartnership.getPartnerUser',
                );
                setError('Failed to load partner information');
              }
            } else {
              setPartnerUser(null);
            }

            setLoading(false);
          },
        );
      } catch (err) {
        const error = err as Error;
        logError(error, 'usePartnership.setupPartnershipData');

        // Handle specific Firebase permission errors
        if (
          error.message?.includes('permission-denied') ||
          error.message?.includes('Missing or insufficient permissions')
        ) {
          setError(
            'Unable to access partnership data. This may indicate a data inconsistency. Please try logging out and back in.',
          );
        } else {
          setError('Failed to load partnership data');
        }
        setLoading(false);
      }
    };

    setupPartnershipData();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.partnershipId, user?.id, user]);

  return {
    partnership,
    partnerUser,
    loading,
    error,
  };
};
