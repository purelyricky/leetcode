import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { 
  getUserProfile, 
  UserProfile, 
  ProblemHistory,
  LearningProgress,
  getUserLearningProgress,
  getUserRecentProblems
} from '../lib/supabaseSchema';
import { supabase } from '../lib/supabase';
import { useToast } from './toast';

interface UserContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isLoadingProfile: boolean;
  learningProgress: LearningProgress[] | null;
  recentProblems: ProblemHistory[] | null;
  refreshUserProfile: () => Promise<void>;
  refreshLearningData: () => Promise<void>;
  toggleShowSolutionsByDefault: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);
  const [learningProgress, setLearningProgress] = useState<LearningProgress[] | null>(null);
  const [recentProblems, setRecentProblems] = useState<ProblemHistory[] | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    // Get initial auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        
        if (session?.user) {
          refreshUserProfile();
          refreshLearningData();
        } else {
          setUserProfile(null);
          setLearningProgress(null);
          setRecentProblems(null);
        }
      }
    );

    // Get initial user session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      
      if (session?.user) {
        refreshUserProfile();
        refreshLearningData();
      } else {
        setIsLoadingProfile(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshUserProfile = async () => {
    if (!user) return;
    
    setIsLoadingProfile(true);
    try {
      const profile = await getUserProfile(user.id);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
      showToast('Error', 'Failed to load user profile', 'error');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const refreshLearningData = async () => {
    if (!user) return;
    
    try {
      // Get learning progress
      const progress = await getUserLearningProgress(user.id);
      setLearningProgress(progress);
      
      // Get recent problems
      const problems = await getUserRecentProblems(user.id);
      setRecentProblems(problems);
    } catch (error) {
      console.error('Error loading learning data:', error);
    }
  };

  const toggleShowSolutionsByDefault = async () => {
    if (!user || !userProfile) return;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          show_solutions_by_default: !userProfile.show_solutions_by_default,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setUserProfile(data);
      showToast(
        'Preferences Updated', 
        `Solutions will ${data.show_solutions_by_default ? 'now' : 'no longer'} be shown by default`, 
        'success'
      );
    } catch (error) {
      console.error('Error updating user preferences:', error);
      showToast('Error', 'Failed to update preferences', 'error');
    }
  };

  return (
    <UserContext.Provider value={{
      user,
      userProfile,
      isLoadingProfile,
      learningProgress,
      recentProblems,
      refreshUserProfile,
      refreshLearningData,
      toggleShowSolutionsByDefault
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};