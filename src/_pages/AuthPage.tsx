import React, { useState } from 'react' 
import { AuthLayout } from '../components/Auth/AuthLayout' 
import { SignIn } from '../components/Auth/SignIn' 
import { SignUp } from '../components/Auth/SignUp' 
import { Code, Minus, X } from 'lucide-react' 

interface AuthPageProps { 
  onAuthSuccess: () => void 
} 

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => { 
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin') 

  // This function will be called when sign-in is successful 
  const handleSignInSuccess = () => { 
    onAuthSuccess(); 
  } 
  
  // This function will be called when sign-up is successful to switch to sign-in view 
  const handleSignUpSuccess = () => { 
    setAuthMode('signin'); 
  } 

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
      
      <div className="absolute top-8 left-0 right-0 flex justify-center"> 
        <div className="flex items-center gap-3"> 
          <div className="bg-amber-500 w-10 h-10 rounded-lg flex items-center justify-center"> 
            <Code className="w-6 h-6 text-black" /> 
          </div> 
          <h1 className="text-2xl font-bold text-white"> 
            LeetCode Helper 
          </h1> 
        </div> 
      </div> 

      <div className="flex items-center justify-center flex-1 w-full"> 
        <div className="w-full max-w-md p-6"> 
          {authMode === 'signin' ? ( 
            <AuthLayout 
              title="Welcome Back" 
              subtitle="Sign in to continue your learning journey" 
            > 
              <SignIn 
                onSwitchToSignUp={() => setAuthMode('signup')} 
                onSignInSuccess={handleSignInSuccess} 
              /> 
            </AuthLayout> 
          ) : ( 
            <AuthLayout 
              title="Create Account" 
              subtitle="Join to improve your DSA skills" 
            > 
              <SignUp 
                onSwitchToSignIn={() => setAuthMode('signin')} 
                onSignUpSuccess={handleSignUpSuccess} 
              /> 
            </AuthLayout> 
          )} 
        </div> 
      </div> 
    </div> 
  ) 
} 

export default AuthPage