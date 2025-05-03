// This defines the database schema and provides helper functions
// for interacting with the Supabase database

import { supabase } from './supabase';

// Table definitions that we'll need to create in Supabase
export const TABLES = {
  USER_PROFILES: 'user_profiles',
  PROBLEM_HISTORY: 'problem_history',
  USER_EXPLANATIONS: 'user_explanations',
  HINT_USAGE: 'hint_usage',
  LEARNING_PROGRESS: 'learning_progress',
};

// Define the schemas for each table
export interface UserProfile {
  id: string; // Reference to auth.users.id
  created_at?: string;
  updated_at?: string;
  hint_credits_remaining: number;
  last_credit_reset: string;
  problems_solved: number;
  streak_days: number;
  show_solutions_by_default: boolean;
}

export interface ProblemHistory {
  id?: string;
  user_id: string;
  created_at?: string;
  problem_title: string;
  problem_category: string; // e.g., "Array", "Dynamic Programming"
  problem_difficulty: string; // "Easy", "Medium", "Hard"
  problem_url?: string;
  screenshot_paths?: string[]; // Array of paths to screenshots
}

export interface UserExplanation {
  id?: string;
  user_id: string;
  problem_id: string;
  created_at?: string;
  explanation_text: string;
  understanding_score: number; // 0-100
  approach_score: number; // 0-100
  ai_feedback: string;
  is_skipped: boolean;
}

export interface HintUsage {
  id?: string;
  user_id: string;
  problem_id: string;
  created_at?: string;
  hint_type: 'code' | 'approach' | 'complexity' | 'pseudocode';
  section_index: number; // To track which section the hint was for
}

export interface LearningProgress {
  id?: string;
  user_id: string;
  created_at?: string;
  category: string; // e.g., "Array", "Dynamic Programming"
  problems_attempted: number;
  problems_solved: number;
  average_understanding: number; // 0-100
  recommended_topics: string[];
}

// Helper functions for database operations

// Initialize user profile
export async function initUserProfile(userId: string): Promise<UserProfile | null> {
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from(TABLES.USER_PROFILES)
    .insert({
      id: userId,
      created_at: now,
      updated_at: now,
      hint_credits_remaining: 20, // Start with 20 daily credits
      last_credit_reset: now,
      problems_solved: 0,
      streak_days: 0,
      show_solutions_by_default: false
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating user profile:', error);
    return null;
  }
  
  return data;
}

// Get current user profile, create one if it doesn't exist
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from(TABLES.USER_PROFILES)
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') { // Record not found
      return initUserProfile(userId);
    }
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  // Check if we need to reset hint credits (daily)
  const lastReset = new Date(data.last_credit_reset);
  const now = new Date();
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  if (now.getTime() - lastReset.getTime() >= oneDayMs) {
    // More than a day has passed, reset credits
    return resetDailyCredits(userId);
  }
  
  return data;
}

// Reset daily hint credits
export async function resetDailyCredits(userId: string): Promise<UserProfile | null> {
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from(TABLES.USER_PROFILES)
    .update({
      hint_credits_remaining: 20,
      last_credit_reset: now,
      updated_at: now
    })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    console.error('Error resetting daily credits:', error);
    return null;
  }
  
  return data;
}

// Use a hint credit
export async function useHintCredit(
  userId: string, 
  problemId: string, 
  hintType: 'code' | 'approach' | 'complexity' | 'pseudocode',
  sectionIndex: number
): Promise<{success: boolean, creditsRemaining?: number, error?: string}> {
  // First check if user has credits remaining
  const profile = await getUserProfile(userId);
  
  if (!profile) {
    return { success: false, error: 'User profile not found' };
  }
  
  if (profile.hint_credits_remaining <= 0) {
    return { 
      success: false, 
      creditsRemaining: 0,
      error: 'No hint credits remaining today' 
    };
  }
  
  // Begin a transaction to update credits and record hint usage
  const { data: updatedProfile, error: updateError } = await supabase
    .from(TABLES.USER_PROFILES)
    .update({
      hint_credits_remaining: profile.hint_credits_remaining - 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();
  
  if (updateError) {
    console.error('Error updating hint credits:', updateError);
    return { success: false, error: 'Failed to update hint credits' };
  }
  
  // Record the hint usage
  const { error: usageError } = await supabase
    .from(TABLES.HINT_USAGE)
    .insert({
      user_id: userId,
      problem_id: problemId,
      hint_type: hintType,
      section_index: sectionIndex,
      created_at: new Date().toISOString()
    });
  
  if (usageError) {
    console.error('Error recording hint usage:', usageError);
    // Continue anyway since we've already deducted the credit
  }
  
  return { 
    success: true, 
    creditsRemaining: updatedProfile.hint_credits_remaining
  };
}

// Save a problem to history
export async function saveProblemToHistory(
  userId: string,
  problem: Omit<ProblemHistory, 'user_id' | 'created_at' | 'id'>
): Promise<string | null> {
  const { data, error } = await supabase
    .from(TABLES.PROBLEM_HISTORY)
    .insert({
      user_id: userId,
      ...problem,
      created_at: new Date().toISOString()
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Error saving problem to history:', error);
    return null;
  }
  
  return data.id;
}

// Save user explanation and get AI feedback
export async function saveUserExplanation(
  userId: string,
  problemId: string,
  explanation: string,
  isSkipped: boolean,
  aiGeneratedSolution: any // The solution generated by AI
): Promise<UserExplanation | null> {
  // Calculate understanding and approach scores by comparing with AI solution
  let understandingScore = 0;
  let approachScore = 0;
  let aiFeedback = '';
  
  if (!isSkipped && explanation.trim().length > 0) {
    // This would normally involve a more complex analysis
    // For now, we'll use a simple length-based heuristic
    understandingScore = Math.min(100, explanation.length / 5);
    approachScore = Math.min(100, explanation.length / 8);
    
    // In a real implementation, we would send the explanation to AI
    // for evaluation against the solution
    aiFeedback = "Your explanation shows good understanding of the problem.";
  }
  
  const { data, error } = await supabase
    .from(TABLES.USER_EXPLANATIONS)
    .insert({
      user_id: userId,
      problem_id: problemId,
      explanation_text: explanation,
      understanding_score: understandingScore,
      approach_score: approachScore,
      ai_feedback: aiFeedback,
      is_skipped: isSkipped,
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error saving user explanation:', error);
    return null;
  }
  
  return data;
}

// Update learning progress for a category
export async function updateLearningProgress(
  userId: string,
  category: string,
  problemSolved: boolean,
  understandingScore: number
): Promise<void> {
  // First check if entry exists
  const { data: existing, error: fetchError } = await supabase
    .from(TABLES.LEARNING_PROGRESS)
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)
    .single();
  
  if (fetchError && fetchError.code !== 'PGRST116') { // Not just "not found"
    console.error('Error fetching learning progress:', fetchError);
    return;
  }
  
  if (!existing) {
    // Create new entry
    const { error } = await supabase
      .from(TABLES.LEARNING_PROGRESS)
      .insert({
        user_id: userId,
        category,
        problems_attempted: 1,
        problems_solved: problemSolved ? 1 : 0,
        average_understanding: understandingScore,
        recommended_topics: [],
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error creating learning progress:', error);
    }
  } else {
    // Update existing entry
    const newAttempts = existing.problems_attempted + 1;
    const newSolved = existing.problems_solved + (problemSolved ? 1 : 0);
    const newAvg = ((existing.average_understanding * existing.problems_attempted) + understandingScore) / newAttempts;
    
    const { error } = await supabase
      .from(TABLES.LEARNING_PROGRESS)
      .update({
        problems_attempted: newAttempts,
        problems_solved: newSolved,
        average_understanding: newAvg,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);
    
    if (error) {
      console.error('Error updating learning progress:', error);
    }
  }
}

// Get user's learning progress across all categories
export async function getUserLearningProgress(userId: string): Promise<LearningProgress[] | null> {
  const { data, error } = await supabase
    .from(TABLES.LEARNING_PROGRESS)
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching user learning progress:', error);
    return null;
  }
  
  return data;
}

// Get user's recent problems
export async function getUserRecentProblems(userId: string, limit: number = 10): Promise<ProblemHistory[] | null> {
  const { data, error } = await supabase
    .from(TABLES.PROBLEM_HISTORY)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching recent problems:', error);
    return null;
  }
  
  return data;
}