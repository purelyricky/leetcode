// src/components/Solutions/BlurredCodeSection.tsx

import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useUser } from '../../contexts/userContext';
import { useToast } from '../../contexts/toast';
import { Button } from '../ui/button';
import { Eye, Lock, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { trackCodeReveal } from '../../lib/supabaseSchema';

// Reveal levels definition
const REVEAL_LEVELS = [
  { name: "Hint 1", percentage: 20 },
  { name: "Hint 2", percentage: 40 },
  { name: "Hint 3", percentage: 60 },
  { name: "Hint 4", percentage: 80 },
  { name: "Full Solution", percentage: 100 }
];

interface BlurredCodeSectionProps {
  code: string;
  language: string;
  title: string;
  sectionIndex: number;
  problemId: string;
  sectionType: 'code' | 'approach' | 'complexity' | 'pseudocode';
}

const BlurredCodeSection: React.FC<BlurredCodeSectionProps> = ({
  code,
  language,
  title,
  sectionIndex,
  problemId,
  sectionType
}) => {
  const [revealLevel, setRevealLevel] = useState<number>(0); // 0 means fully blurred
  const [isSatisfied, setIsSatisfied] = useState<boolean>(false);
  const [isRevealing, setIsRevealing] = useState<boolean>(false);
  const { user } = useUser();
  const { showToast } = useToast();

  // Split code into chunks (lines) for progressive reveal
  const codeLines = code.split('\n');
  const totalLines = codeLines.length;
  
  // Calculate visible lines based on current reveal level
  const getVisibleLines = () => {
    if (revealLevel === 0) return [];
    const percentage = REVEAL_LEVELS[revealLevel - 1].percentage;
    const visibleLineCount = Math.ceil((percentage / 100) * totalLines);
    return codeLines.slice(0, visibleLineCount);
  };

  const visibleLines = getVisibleLines();
  const visibleCode = visibleLines.join('\n');
  
  // Handle revealing more code
  const handleRevealMore = async () => {
    if (!user) {
      showToast('Error', 'You must be signed in to reveal code', 'error');
      return;
    }

    setIsRevealing(true);
    
    try {
      // Increment reveal level
      const newLevel = Math.min(revealLevel + 1, REVEAL_LEVELS.length);
      
      // Track this reveal in the database
      const result = await trackCodeReveal(
        user.id,
        problemId,
        sectionType,
        sectionIndex,
        newLevel,
        isSatisfied ? newLevel : null
      );
      
      if (!result.success) {
        console.error('Error tracking code reveal:', result.error);
        // Continue anyway as this shouldn't block the user experience
      } else {
        console.log('Successfully tracked code reveal');
      }
      
      setRevealLevel(newLevel);
      
      // Show appropriate toast message
      if (newLevel === REVEAL_LEVELS.length) {
        showToast('Full Solution', 'Complete solution revealed', 'neutral');
      } else {
        showToast(
          `Hint ${newLevel}`, 
          `${REVEAL_LEVELS[newLevel-1].percentage}% of solution revealed`, 
          'neutral'
        );
      }
    } catch (error) {
      console.error('Error revealing code:', error);
      showToast('Error', 'Failed to reveal more code', 'error');
    } finally {
      setIsRevealing(false);
    }
  };
  
  // Handle marking as satisfied (understood)
  const handleMarkSatisfied = async () => {
    if (!user || revealLevel === 0) return;
    
    try {
      // Update the database to mark this level as satisfactory
      const result = await trackCodeReveal(
        user.id,
        problemId,
        sectionType,
        sectionIndex,
        revealLevel,
        revealLevel
      );
      
      if (!result.success) {
        console.error('Error marking as satisfied:', result.error);
        showToast('Warning', 'Progress saved locally but not synced to cloud', 'error');
      } else {
        console.log('Successfully marked code as understood');
      }
      
      setIsSatisfied(true);
      showToast('Great!', 'You\'ve marked this as understood', 'success');
    } catch (error) {
      console.error('Error marking as satisfied:', error);
      showToast('Error', 'Failed to save your progress', 'error');
    }
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-white/80">{title}</h3>

        {revealLevel === 0 ? (
          <Button
            size="sm"
            onClick={handleRevealMore}
            disabled={isRevealing}
            className="bg-amber-500 hover:bg-amber-600 text-black text-xs px-3 py-1 h-7"
          >
            {isRevealing ? (
              <span className="flex items-center">
                <span className="animate-pulse">Revealing...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                Show Hint
              </span>
            )}
          </Button>
        ) : (
          <div className="flex items-center space-x-2">
            {!isSatisfied && (
              <Button
                size="sm"
                onClick={handleMarkSatisfied}
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-7"
              >
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Got it!
                </span>
              </Button>
            )}
            
            {revealLevel < REVEAL_LEVELS.length && (
              <Button
                size="sm"
                onClick={handleRevealMore}
                disabled={isRevealing}
                className="bg-amber-500 hover:bg-amber-600 text-black text-xs px-3 py-1 h-7"
              >
                {isRevealing ? (
                  <span className="animate-pulse">More...</span>
                ) : (
                  <span className="flex items-center gap-1">
                    <ChevronDown className="w-3 h-3" />
                    Show More
                  </span>
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="relative">
        {revealLevel === 0 && (
          <div className="absolute inset-0 bg-black rounded-md flex items-center justify-center z-10">
            <div className="text-center p-4">
              <Lock className="w-8 h-8 text-amber-500/70 mx-auto mb-2" />
              <p className="text-white/80 text-sm mb-1">
                Solution is hidden
              </p>
              <p className="text-xs text-white/60 max-w-xs mx-auto">
                Reveal progressively to better understand the solution at your own pace
              </p>
            </div>
          </div>
        )}

        <SyntaxHighlighter
          showLineNumbers
          language={language === 'golang' ? 'go' : language}
          style={dracula}
          customStyle={{
            margin: 0,
            padding: '1rem',
            backgroundColor: 'rgba(22, 27, 34, 0.5)',
            borderRadius: '4px',
            filter: revealLevel === 0 ? 'blur(0px)' : 'none',
          }}
          wrapLongLines={true}
        >
          {revealLevel === 0 ? code : visibleCode}
        </SyntaxHighlighter>
        
        {revealLevel > 0 && revealLevel < REVEAL_LEVELS.length && (
          <div className="bg-black/60 p-2 border-t border-amber-500/20 rounded-b-md">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-2 bg-amber-500 rounded-full" 
                    style={{ width: `${REVEAL_LEVELS[revealLevel-1].percentage}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-xs text-white/60 ml-2">
                {REVEAL_LEVELS[revealLevel-1].percentage}% revealed
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlurredCodeSection;