import React from 'react';
import { Button } from './ui/button';
import { Code, KeyRound, MousePointerClick, Keyboard, Minus, X } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
  // Functions to handle minimize and close actions
  const handleMinimize = () => {
    if (window.electronAPI && typeof window.electronAPI.minimizeWindow === 'function') {
      window.electronAPI.minimizeWindow();
    } else {
      console.error('Minimize window function is not available');
    }
  };

  const handleClose = () => {
    if (window.electronAPI && typeof window.electronAPI.closeWindow === 'function') {
      window.electronAPI.closeWindow();
    } else {
      console.error('Close window function is not available');
    }
  };

  return (
    <div className="h-[660px] w-[500px] mx-auto bg-black flex flex-col items-center justify-center p-6 rounded-3xl relative">
      {/* Window control buttons */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button 
          onClick={handleMinimize}
          className="w-6 h-6 rounded-full bg-amber-500/20 hover:bg-amber-500/40 flex items-center justify-center transition-colors"
          aria-label="Minimize"
        >
          <Minus className="w-3 h-3 text-amber-500" />
        </button>
        <button 
          onClick={handleClose}
          className="w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="w-3 h-3 text-red-500" />
        </button>
      </div>
      
      <div className="max-w-md w-full bg-[#0A0A0A] border border-amber-500/10 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-amber-500 w-10 h-10 rounded-lg flex items-center justify-center">
            <Code className="w-6 h-6 text-black" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            LeetCode Helper
          </h1>
        </div>
        
        <div className="mb-6">
          <p className="text-white/70 text-sm mb-5">
            Get comprehensive educational explanations for data structures and algorithms problems.
          </p>
          
          <Button 
            onClick={onGetStarted}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-all"
          >
            Get Started
          </Button>
        </div>
        
        <div className="border-t border-amber-500/10 pt-5 mb-5">
          <h3 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
            <Keyboard className="w-4 h-4" />
            Key Shortcuts
          </h3>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <ShortcutItem icon={<KeyRound className="w-3.5 h-3.5" />} action="Toggle Visibility" keys="Ctrl+B" />
            <ShortcutItem icon={<MousePointerClick className="w-3.5 h-3.5" />} action="Click-Through" keys="Ctrl+T" />
            <ShortcutItem icon={<Code className="w-3.5 h-3.5" />} action="Capture Screen" keys="Ctrl+H" />
            <ShortcutItem icon={<Code className="w-3.5 h-3.5" />} action="Analyze" keys="Ctrl+Enter" />
          </div>
        </div>
        
        <div className="bg-black/40 rounded-lg p-3 text-xs text-white/60">
          LeetCode Helper will analyze problems and provide educational step-by-step solutions to help you learn algorithms and data structures.
        </div>
      </div>
    </div>
  );
};

// Helper component for shortcuts
const ShortcutItem = ({ icon, action, keys }: { icon: React.ReactNode, action: string, keys: string }) => (
  <div className="flex items-center gap-1.5">
    <div className="text-amber-500">
      {icon}
    </div>
    <div>
      <div className="text-xs text-white/80">{action}</div>
      <div className="text-[10px] text-amber-500/80 font-mono">{keys}</div>
    </div>
  </div>
);

export default WelcomeScreen;