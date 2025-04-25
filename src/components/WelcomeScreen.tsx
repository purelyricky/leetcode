import React from 'react';
import { Button } from './ui/button';
import { Code, KeyRound, MousePointerClick, Keyboard } from 'lucide-react';

interface WelcomeScreenProps {
  onOpenSettings: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onOpenSettings }) => {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#0A0A0A] border border-amber-500/10 rounded-xl p-6 shadow-lg">
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
            Configure your API key to start analyzing DSA problems and getting step-by-step explanations.
          </p>
          
          <Button 
            onClick={onOpenSettings}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-all"
          >
            Configure API Settings
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