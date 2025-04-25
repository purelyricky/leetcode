import React, { useState } from 'react'
import { Button } from '../ui/button'
import { signUpWithEmail } from '../../lib/supabase'
import { useToast } from '../../contexts/toast'

interface SignUpProps {
  onSwitchToSignIn: () => void
  onSignUpSuccess: () => void
}

export const SignUp: React.FC<SignUpProps> = ({ onSwitchToSignIn, onSignUpSuccess }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !email || !password) {
      showToast("Error", "Please fill in all fields", "error")
      return
    }
    
    if (password !== confirmPassword) {
      showToast("Error", "Passwords do not match", "error")
      return
    }
    
    if (password.length < 6) {
      showToast("Error", "Password must be at least 6 characters", "error")
      return
    }

    setIsLoading(true)
    
    try {
      const { data, error } = await signUpWithEmail(email, password, name)
      
      if (error) {
        throw error
      }
      
      showToast("Success", "Account created successfully!", "success")
      onSignUpSuccess()
    } catch (error: any) {
      console.error('Sign up error:', error)
      showToast("Error", error.message || "Failed to create account", "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-1">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-black/50 border border-amber-500/20 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50"
            placeholder="John Doe"
            required
          />
        </div>
        
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
            placeholder="Create a password (min. 6 characters)"
            required
          />
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80 mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-black/50 border border-amber-500/20 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50"
            placeholder="Confirm your password"
            required
          />
        </div>

        <Button 
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-all"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-white/60 text-sm">
          Already have an account?{' '}
          <button 
            onClick={onSwitchToSignIn} 
            className="text-amber-400 hover:text-amber-300 transition-colors"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  )
}