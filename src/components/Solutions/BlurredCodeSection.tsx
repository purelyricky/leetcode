import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useUser } from '../../contexts/userContext';
import { useToast } from '../../contexts/toast';
import { useHintCredits } from '../../hooks/useHintCredits';
import { Button } from '../ui/button';
import { Eye, Lock, Gift } from 'lucide-react';

interface BlurredCodeSectionProps {
  code: string;
  language: string;
  title: string;
  sectionIndex: number;
  problemId: string;
  hintType: 'code' | 'approach' | 'complexity' | 'pseudocode';
}

const BlurredCodeSection: React.FC<BlurredCodeSectionProps> = ({
  code,
  language,
  title,
  sectionIndex,
  problemId,
  hintType
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const { userProfile } = useUser();
  const { showToast } = useToast();
  const { useHint, creditsRemaining } = useHintCredits();

  const handleReveal = async () => {
    if (!userProfile) {
      showToast('Error', 'Please sign in to use hint credits', 'error');
      return;
    }
    
    // Already revealed, no need to do anything
    if (isRevealed) return;
    
    setIsRevealing(true);
    
    const result = await useHint(problemId, hintType, sectionIndex);
    
    if (result.success) {
      setIsRevealed(true);
      showToast(
        'Hint Revealed', 
        `${result.creditsRemaining} hint credits remaining today`, 
        'success'
      );
    } else {
      showToast('Error', result.error || 'Failed to reveal hint', 'error');
    }
    
    setIsRevealing(false);
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-white/80">{title}</h3>
        
        {!isRevealed && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-amber-400">
              {creditsRemaining || userProfile?.hint_credits_remaining || 0} credits remaining
            </span>
            <Button
              size="sm"
              onClick={handleReveal}
              disabled={
                isRevealing || 
                !userProfile || 
                (userProfile.hint_credits_remaining <= 0)
              }
              className="bg-amber-500 hover:bg-amber-600 text-black text-xs px-3 py-1 h-7"
            >
              {isRevealing ? (
                <span className="flex items-center">
                  <span className="animate-pulse">Revealing...</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Reveal (1 credit)
                </span>
              )}
            </Button>
          </div>
        )}
      </div>
      
      <div className="relative">
        {!isRevealed && (
          <div className="absolute inset-0 backdrop-blur-md bg-black/30 rounded-md flex items-center justify-center z-10">
            <div className="text-center p-4">
              <Lock className="w-8 h-8 text-amber-500/70 mx-auto mb-2" />
              <p className="text-white/80 text-sm mb-1">
                This hint is locked
              </p>
              <p className="text-xs text-white/60 max-w-xs mx-auto">
                Use a hint credit to reveal this section and improve your understanding
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
            filter: isRevealed ? 'none' : 'blur(0px)', // No blur so it loads properly behind the overlay
          }}
          wrapLongLines={true}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default BlurredCodeSection;