import { useState, useCallback, useEffect } from 'react';
import { useUser } from '../contexts/userContext';
import { useHintCredit } from '../lib/supabaseSchema';

export function useHintCredits() {
  const { user, userProfile, refreshUserProfile } = useUser();
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setCreditsRemaining(userProfile.hint_credits_remaining);
    }
  }, [userProfile]);

  const useHint = useCallback(
    async (
      problemId: string,
      hintType: 'code' | 'approach' | 'complexity' | 'pseudocode',
      sectionIndex: number
    ) => {
      if (!user) {
        return { 
          success: false, 
          error: 'User not authenticated' 
        };
      }

      setIsLoading(true);
      try {
        const result = await useHintCredit(
          user.id,
          problemId,
          hintType,
          sectionIndex
        );

        if (result.success && result.creditsRemaining !== undefined) {
          setCreditsRemaining(result.creditsRemaining);
        }

        return result;
      } catch (error) {
        console.error('Error using hint credit:', error);
        return { 
          success: false, 
          error: 'Failed to use hint credit' 
        };
      } finally {
        setIsLoading(false);
        // Refresh user profile to get updated credits
        refreshUserProfile();
      }
    },
    [user, refreshUserProfile]
  );

  return {
    creditsRemaining,
    isLoading,
    useHint
  };
}