import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const signInWithEmail = async (email: string, password: string) => {
  return supabase.auth.signInWithPassword({ email, password })
}

export const signUpWithEmail = async (email: string, password: string, name: string) => {
  return supabase.auth.signUp({ 
    email, 
    password,
    options: {
      data: {
        full_name: name
      }
    }
  })
}

export const signOut = async () => {
  return supabase.auth.signOut()
}