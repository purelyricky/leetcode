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


// Track code reveal levels
export async function trackCodeReveal(
  userId: string,
  problemId: string,
  sectionType: 'code' | 'approach' | 'complexity' | 'pseudocode',
  sectionIndex: number,
  revealLevel: number,
  satisfiedAtLevel: number | null
): Promise<void> {
  try {
    // First check if there's an existing record
    const { data: existingRecord, error: fetchError } = await supabase
      .from('code_reveals')
      .select('*')
      .eq('user_id', userId)
      .eq('problem_id', problemId)
      .eq('section_type', sectionType)
      .eq('section_index', sectionIndex)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // Not just "not found"
      console.error('Error fetching code reveal record:', fetchError);
      return;
    }
    
    if (!existingRecord) {
      // Create new record
      const { error } = await supabase
        .from('code_reveals')
        .insert({
          user_id: userId,
          problem_id: problemId,
          section_type: sectionType,
          section_index: sectionIndex,
          reveal_level: revealLevel,
          satisfied_at_level: satisfiedAtLevel,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error creating code reveal record:', error);
      }
    } else {
      // Update existing record if the reveal level increased
      if (existingRecord.reveal_level < revealLevel) {
        const { error } = await supabase
          .from('code_reveals')
          .update({
            reveal_level: revealLevel,
            satisfied_at_level: satisfiedAtLevel
          })
          .eq('id', existingRecord.id);
        
        if (error) {
          console.error('Error updating code reveal record:', error);
        }
      } else if (satisfiedAtLevel !== null && existingRecord.satisfied_at_level === null) {
        // Only update the satisfied_at_level if it was previously null
        const { error } = await supabase
          .from('code_reveals')
          .update({
            satisfied_at_level: satisfiedAtLevel
          })
          .eq('id', existingRecord.id);
        
        if (error) {
          console.error('Error updating code reveal satisfaction:', error);
        }
      }
    }
    
    // Update learning progress stats
    await updateLearningProgressFromReveal(userId, problemId, sectionType, revealLevel, satisfiedAtLevel);
    
  } catch (error) {
    console.error('Error tracking code reveal:', error);
  }
}

// Update learning progress based on code reveals
async function updateLearningProgressFromReveal(
  userId: string,
  problemId: string,
  sectionType: string,
  revealLevel: number,
  satisfiedAtLevel: number | null
): Promise<void> {
  try {
    // Get the problem category
    const { data: problem, error: problemError } = await supabase
      .from('problem_history')
      .select('problem_category')
      .eq('id', problemId)
      .single();
    
    if (problemError) {
      console.error('Error fetching problem category:', problemError);
      return;
    }
    
    const category = problem.problem_category;
    
    // Get user's learning progress for this category
    const { data: progress, error: progressError } = await supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .single();
    
    if (progressError && progressError.code !== 'PGRST116') {
      console.error('Error fetching learning progress:', progressError);
      return;
    }
    
    // Calculate metrics based on reveals
    // Lower reveal level is better - it means user needed less help
    // Get all reveals for this user in this category in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // First get the problem IDs for this category
    const { data: categoryProblems, error: categoryError } = await supabase
      .from('problem_history')
      .select('id')
      .eq('problem_category', category)
      .eq('user_id', userId);
      
    if (categoryError) {
      console.error('Error fetching category problems:', categoryError);
      return;
    }
    
    const problemIds = categoryProblems?.map(row => row.id) || [];
    
    // Then use those IDs in the main query
    const { data: recentReveals, error: revealsError } = await supabase
      .from('code_reveals')
      .select('reveal_level, satisfied_at_level, problem_id')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .in('problem_id', problemIds);
    
    if (revealsError) {
      console.error('Error fetching recent reveals:', revealsError);
      return;
    }
    
    // Calculate average reveal level needed (lower is better)
    const uniqueProblems = new Set();
    let totalRevealLevel = 0;
    let totalProblems = 0;
    
    recentReveals?.forEach(reveal => {
      if (!uniqueProblems.has(reveal.problem_id)) {
        uniqueProblems.add(reveal.problem_id);
        // Use satisfied_at_level if available, otherwise use reveal_level
        const effectiveLevel = reveal.satisfied_at_level || reveal.reveal_level;
        totalRevealLevel += effectiveLevel;
        totalProblems++;
      }
    });
    
    const avgRevealLevel = totalProblems > 0 ? totalRevealLevel / totalProblems : 5;
    
    // Calculate improvement rate by comparing recent vs older reveals
    // (this would require more complex calculations - simplified for now)
    const improvementRate = 0.0; // Placeholder
    
    if (!progress) {
      // Create new progress record
      const { error } = await supabase
        .from('learning_progress')
        .insert({
          user_id: userId,
          category,
          problems_attempted: 1,
          problems_solved: satisfiedAtLevel !== null ? 1 : 0,
          avg_reveal_level: avgRevealLevel,
          improvement_rate: improvementRate,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error creating learning progress:', error);
      }
    } else {
      // Update existing progress
      const { error } = await supabase
        .from('learning_progress')
        .update({
          problems_attempted: uniqueProblems.size,
          problems_solved: progress.problems_solved + (satisfiedAtLevel !== null ? 1 : 0),
          avg_reveal_level: avgRevealLevel,
          improvement_rate: improvementRate,
          updated_at: new Date().toISOString()
        })
        .eq('id', progress.id);
      
      if (error) {
        console.error('Error updating learning progress:', error);
      }
    }
    
  } catch (error) {
    console.error('Error updating learning progress from reveals:', error);
  }
}

// Get user's learning improvement over time
export async function getUserLearningTrend(
  userId: string, 
  timeframe: 'week' | 'month' | 'all' = 'month'
): Promise<any> {
  try {
    // Calculate the start date based on timeframe
    const startDate = new Date();
    if (timeframe === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    
    // Get all code reveals for this user in the selected timeframe
    const { data: reveals, error } = await supabase
      .from('code_reveals')
      .select(`
        id, 
        reveal_level, 
        satisfied_at_level, 
        created_at, 
        problem_id, 
        problem_history:problem_id (problem_category, problem_difficulty)
      `)
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching user learning trend:', error);
      return null;
    }
    
    // Group reveals by week/month and calculate metrics
    const timeSegments: { [key: string]: any } = {};
    
    reveals?.forEach(reveal => {
      // Format date as YYYY-WW (year-week number) or YYYY-MM
      const date = new Date(reveal.created_at);
      const year = date.getFullYear();
      
      let timeKey: string;
      if (timeframe === 'week') {
        // Get ISO week number (1-52)
        const weekNumber = Math.ceil((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
        timeKey = `${year}-W${weekNumber.toString().padStart(2, '0')}`;
      } else {
        const month = date.getMonth() + 1;
        timeKey = `${year}-${month.toString().padStart(2, '0')}`;
      }
      
      // Initialize segment if it doesn't exist
      if (!timeSegments[timeKey]) {
        timeSegments[timeKey] = {
          period: timeKey,
          problems_attempted: new Set(),
          total_reveal_level: 0,
          total_reveals: 0,
          categories: {}
        };
      }
      
      // Add to metrics
      timeSegments[timeKey].problems_attempted.add(reveal.problem_id);
      timeSegments[timeKey].total_reveal_level += reveal.satisfied_at_level || reveal.reveal_level;
      timeSegments[timeKey].total_reveals++;
      
      // Track by category
      const category = reveal.problem_history?.[0]?.problem_category || 'Unknown';
      if (!timeSegments[timeKey].categories[category]) {
        timeSegments[timeKey].categories[category] = {
          problems: new Set(),
          total_reveal_level: 0,
          total_reveals: 0
        };
      }
      
      timeSegments[timeKey].categories[category].problems.add(reveal.problem_id);
      timeSegments[timeKey].categories[category].total_reveal_level += reveal.satisfied_at_level || reveal.reveal_level;
      timeSegments[timeKey].categories[category].total_reveals++;
    });
    
    // Format the results
    const trendData = Object.values(timeSegments).map(segment => {
      const avgRevealLevel = segment.total_reveals > 0 
        ? segment.total_reveal_level / segment.total_reveals 
        : 0;
      
      const categoryData = Object.entries(segment.categories).map(([category, data]: [string, any]) => {
        const categoryAvgReveal = data.total_reveals > 0 
          ? data.total_reveal_level / data.total_reveals 
          : 0;
        
        return {
          category,
          problems_count: data.problems.size,
          avg_reveal_level: categoryAvgReveal
        };
      });
      
      return {
        period: segment.period,
        problems_count: segment.problems_attempted.size,
        avg_reveal_level: avgRevealLevel,
        categories: categoryData
      };
    });
    
    return trendData;
    
  } catch (error) {
    console.error('Error getting user learning trend:', error);
    return null;
  }
}

// Get recommended categories to focus on
export async function getRecommendedCategories(userId: string): Promise<any> {
  try {
    // Get all learning progress entries
    const { data: progressData, error } = await supabase
      .from('learning_progress')
      .select('*')
      .eq('user_id', userId)
      .order('avg_reveal_level', { ascending: false });
    
    if (error) {
      console.error('Error fetching learning progress:', error);
      return null;
    }
    
    // Sort categories by avg_reveal_level (descending - higher means needs more help)
    const recommendations = progressData
      ?.filter(entry => entry.problems_attempted > 0)
      ?.map(entry => ({
        category: entry.category,
        avg_reveal_level: entry.avg_reveal_level,
        problems_attempted: entry.problems_attempted,
        problems_solved: entry.problems_solved,
        focus_reason: entry.avg_reveal_level > 3 
          ? 'You typically need more help with this category'
          : 'You\'re making good progress in this category'
      }))
      ?.sort((a, b) => b.avg_reveal_level - a.avg_reveal_level);
    
    return recommendations;
    
  } catch (error) {
    console.error('Error getting recommended categories:', error);
    return null;
  }
}