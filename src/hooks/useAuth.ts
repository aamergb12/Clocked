// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react'
import { AuthService, ProfileService } from '../services/supabase'
import { AuthUser, Profile, UseAuthReturn } from '../types'

export const useAuth = (): UseAuthReturn => {
  // State management
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Computed state
  const isAuthenticated = !!user

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Get current session
        const { data: session, error: sessionError } = await AuthService.getSession()
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          setError(sessionError)
          return
        }

        if (session?.session?.user && mounted) {
          const authUser = session.session.user as AuthUser
          setUser(authUser)

          // Fetch user profile
          const { data: userProfile, error: profileError } = await ProfileService.getProfile(authUser.id)
          
          if (profileError) {
            console.error('❌ Profile fetch error:', profileError)
            setError(profileError)
          } else if (userProfile && mounted) {
            setProfile(userProfile)
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error)
        setError('Failed to initialize authentication')
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = AuthService.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state changed:', event)
      
      if (!mounted) return

      try {
        if (event === 'SIGNED_IN' && session?.user) {
          const authUser = session.user as AuthUser
          setUser(authUser)
          setError(null)

          // Fetch profile for new user
          const { data: userProfile, error: profileError } = await ProfileService.getProfile(authUser.id)
          
          if (profileError) {
            console.error('❌ Profile fetch error:', profileError)
            setError(profileError)
          } else {
            setProfile(userProfile)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setError(null)
        }
      } catch (error) {
        console.error('❌ Auth state change error:', error)
        setError('Authentication error occurred')
      } finally {
        setIsLoading(false)
      }
    })

    // Cleanup
    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  // Sign in with phone number
  const signInWithPhone = useCallback(async (phone: string) => {
    try {
      setError(null)
      
      // Validate phone number
      const cleanPhone = phone.replace(/\D/g, '')
      if (cleanPhone.length < 10) {
        const error = 'Please enter a valid phone number'
        setError(error)
        return { error }
      }

      const { error: authError } = await AuthService.signInWithPhone(phone)
      
      if (authError) {
        setError(authError)
        return { error: authError }
      }

      return { error: null }
    } catch (error) {
      console.error('❌ Sign in error:', error)
      const errorMessage = 'Failed to send verification code'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }, [])

  // Verify OTP code
  const verifyOTP = useCallback(async (phone: string, code: string) => {
    try {
      setError(null)
      
      // Validate OTP code
      const cleanCode = code.replace(/\D/g, '')
      if (cleanCode.length !== 6) {
        const error = 'Please enter a valid 6-digit code'
        setError(error)
        return { error }
      }

      const { data, error: verifyError } = await AuthService.verifyOTP(phone, code)
      
      if (verifyError) {
        setError(verifyError)
        return { error: verifyError }
      }

      // Auth state will be updated via the listener
      return { error: null }
    } catch (error) {
      console.error('❌ OTP verification error:', error)
      const errorMessage = 'Failed to verify code'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }, [])

  // Sign out user
  const signOut = useCallback(async () => {
    try {
      setError(null)
      await AuthService.signOut()
      // Auth state will be updated via the listener
    } catch (error) {
      console.error('❌ Sign out error:', error)
      setError('Failed to sign out')
    }
  }, [])

  // Refresh user profile
  const refreshProfile = useCallback(async () => {
    if (!user) return

    try {
      setError(null)
      const { data: userProfile, error: profileError } = await ProfileService.getProfile(user.id)
      
      if (profileError) {
        console.error('❌ Profile refresh error:', profileError)
        setError(profileError)
      } else {
        setProfile(userProfile)
      }
    } catch (error) {
      console.error('❌ Profile refresh error:', error)
      setError('Failed to refresh profile')
    }
  }, [user])

  return {
    user,
    profile,
    isAuthenticated,
    isLoading,
    error,
    signInWithPhone,
    verifyOTP,
    signOut,
    refreshProfile,
  }
}