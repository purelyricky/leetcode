import React, { useState } from 'react';
import { Button } from '../ui/button';
import { useUser } from '../../contexts/userContext';
import { saveUserExplanation, saveProblemToHistory } from '../../lib/supabaseSchema';

interface UserExplanationProps {
  problemInfo: any;
  onComplete: (
    explanationSubmitted: boolean, 
    explanationText: string,
    problemId: string
  ) => void;
}

const UserExplanation: React.FC<UserExplanationProps> = ({ 
  problemInfo, 
  onComplete 
}) => {
  const [explanation, setExplanation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();

  // Extract problem attributes for categorization
  const extractProblemAttributes = () => {
    // This would ideally be more robust in a real implementation
    // First try to identify the difficulty
    let difficulty = 'Medium'; // Default
    const difficultyKeywords = {
      easy: ['easy', 'simple', 'straightforward', 'beginner'],
      medium: ['medium', 'moderate', 'intermediate'],
      hard: ['hard', 'difficult', 'challenging', 'complex', 'advanced']
    };
    
    const problemText = problemInfo.problem_statement.toLowerCase();
    
    // Check for difficulty keywords
    for (const [level, keywords] of Object.entries(difficultyKeywords)) {
      if (keywords.some(keyword => problemText.includes(keyword))) {
        difficulty = level.charAt(0).toUpperCase() + level.slice(1);
        break;
      }
    }
    
    // Try to identify the category
    const categories = [
      'Array', 'String', 'Hash Table', 'Dynamic Programming', 'Math',
      'Sorting', 'Greedy', 'Depth-First Search', 'Binary Search',
      'Breadth-First Search', 'Tree', 'Matrix', 'Graph', 'Bit Manipulation',
      'Heap', 'Stack', 'Linked List', 'Recursion', 'Two Pointers', 'Sliding Window'
    ];
    
    // Simple heuristic: check if any category keywords appear in the problem
    let category = 'Other';
    for (const cat of categories) {
      if (problemText.includes(cat.toLowerCase())) {
        category = cat;
        break;
      }
    }
    
    return {
      title: problemInfo.problem_statement.split('.')[0]?.substring(0, 100) || 'Unnamed Problem',
      category,
      difficulty
    };
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // First, save problem to history
      const problemAttributes = extractProblemAttributes();
      const problemId = await saveProblemToHistory(user.id, {
        problem_title: problemAttributes.title,
        problem_category: problemAttributes.category,
        problem_difficulty: problemAttributes.difficulty,
        screenshot_paths: [] // We don't have this info here, but it's a required field
      });
      
      if (!problemId) {
        throw new Error('Failed to save problem history');
      }
      
      // Next, save user explanation
      await saveUserExplanation(
        user.id,
        problemId,
        explanation,
        false, // Not skipped
        problemInfo // The AI-generated solution
      );
      
      onComplete(true, explanation, problemId);
    } catch (error) {
      console.error('Error saving explanation:', error);
      // Still call onComplete but with a generated problemId
      // This ensures the user experience isn't blocked
      onComplete(true, explanation, `temp-${Date.now()}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!user) {
      onComplete(false, '', `temp-${Date.now()}`);
      return;
    }
    
    setIsSubmitting(true);
    try {
      // First, save problem to history
      const problemAttributes = extractProblemAttributes();
      const problemId = await saveProblemToHistory(user.id, {
        problem_title: problemAttributes.title,
        problem_category: problemAttributes.category,
        problem_difficulty: problemAttributes.difficulty,
        screenshot_paths: [] // We don't have this info here
      });
      
      if (!problemId) {
        throw new Error('Failed to save problem history');
      }
      
      // Save skipped explanation
      await saveUserExplanation(
        user.id,
        problemId,
        '',
        true, // Skipped
        problemInfo
      );
      
      onComplete(false, '', problemId);
    } catch (error) {
      console.error('Error handling skip:', error);
      onComplete(false, '', `temp-${Date.now()}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-black/60 p-6 rounded-lg border border-amber-500/10">
      <h2 className="text-lg font-semibold text-white mb-2">
        Before seeing the solution...
      </h2>
      
      <p className="text-white/70 text-sm mb-4">
        Explaining a problem in your own words helps solidify your understanding. 
        Tell us how you would approach this problem. What data structures would you use? 
        What algorithm would you apply?
      </p>
      
      <div className="space-y-4">
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          className="w-full bg-black/50 border border-amber-500/20 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 min-h-[150px] resize-none"
          placeholder="I would approach this problem by..."
        />
        
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="border-amber-500/20 hover:bg-amber-500/10 text-white/70"
          >
            {isSubmitting ? 'Please wait...' : 'Skip for now'}
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || explanation.trim().length < 5}
            className="bg-amber-500 hover:bg-amber-600 text-black font-medium"
          >
            {isSubmitting ? 'Submitting...' : 'Submit & See Solution'}
          </Button>
        </div>
        
        <p className="text-xs text-white/50 italic text-center mt-2">
          Your explanations help us tailor learning recommendations and track your progress.
        </p>
      </div>
    </div>
  );
};

export default UserExplanation;