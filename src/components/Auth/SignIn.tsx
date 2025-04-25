import React, { useState } from 'react'
import { Button } from '../ui/button'
import { signInWithEmail } from '../../lib/supabase'
import { useToast } from '../../contexts/toast'

interface SignInProps {
  onSwitchToSignUp: () => void
  onSignInSuccess: () => void
}

export const SignIn: React.FC<SignInProps> = ({ onSwitchToSignUp, onSignInSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      showToast("Error", "Please fill in all fields", "error")
      return
    }

    setIsLoading(true)
    
    try {
      const { data, error } = await signInWithEmail(email, password)
      
      if (error) {
        throw error
      }
      
      showToast("Success", "Signed in successfully", "success")
      onSignInSuccess()
    } catch (error: any) {
      console.error('Sign in error:', error)
      showToast("Error", error.message || "Failed to sign in", "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black/50 border border-amber-500/20 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50"
            placeholder="you@example.com"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black/50 border border-amber-500/20 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50"
            placeholder="Enter your password"
            required
          />
        </div>

        <Button 
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-all"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-white/60 text-sm">
          Don't have an account?{' '}
          <button 
            onClick={onSwitchToSignUp} 
            className="text-amber-400 hover:text-amber-300 transition-colors"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  )
}