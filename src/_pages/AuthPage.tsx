import React, { useState } from 'react' 
import { AuthLayout } from '../components/Auth/AuthLayout' 
import { SignIn } from '../components/Auth/SignIn' 
import { SignUp } from '../components/Auth/SignUp' 
import { Code } from 'lucide-react' 

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

  return ( 
    <div className="min-h-screen bg-black"> 
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

      <div className="flex min-h-screen items-center justify-center"> 
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