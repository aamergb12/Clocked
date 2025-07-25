// src/hooks/useVote.ts
import { useState, useCallback, useRef } from 'react'
import { PostService } from '../services/supabase'
import { UseVoteReturn } from '../types'

export const useVote = (userId?: string): UseVoteReturn => {
  // State management
  const [isVoting, setIsVoting] = useState(false)
  const [optimisticVotes, setOptimisticVotes] = useState<Record<string, 'green' | 'red' | null>>({})
  
  // Debounce voting to prevent spam
  const voteTimeouts = useRef<Record<string, NodeJS.Timeout>>({})

  // Vote on a post with optimistic updates
  const vote = useCallback(async (postId: string, voteType: 'green' | 'red') => {
    if (!userId) {
      console.error('❌ Cannot vote: User not authenticated')
      return
    }

    // Clear existing timeout for this post
    if (voteTimeouts.current[postId]) {
      clearTimeout(voteTimeouts.current[postId])
    }

    // Optimistic update
    setOptimisticVotes(prev => ({
      ...prev,
      [postId]: voteType
    }))

    // Debounce the actual API call
    voteTimeouts.current[postId] = setTimeout(async () => {
      try {
        setIsVoting(true)
        
        const { error } = await PostService.voteOnPost(userId, postId, voteType)
        
        if (error) {
          console.error('❌ Vote error:', error)
          
          // Revert optimistic update on error
          setOptimisticVotes(prev => {
            const updated = { ...prev }
            delete updated[postId]
            return updated
          })
          
          // You could show a toast notification here
          // Toast.show({ type: 'error', text1: 'Failed to submit vote' })
        } else {
          console.log('✅ Vote submitted successfully')
          
          // Clear optimistic state (real data will come from real-time updates)
          setTimeout(() => {
            setOptimisticVotes(prev => {
              const updated = { ...prev }
              delete updated[postId]
              return updated
            })
          }, 1000)
        }
      } catch (error) {
        console.error('❌ Vote service error:', error)
        
        // Revert optimistic update
        setOptimisticVotes(prev => {
          const updated = { ...prev }
          delete updated[postId]
          return updated
        })
      } finally {
        setIsVoting(false)
        delete voteTimeouts.current[postId]
      }
    }, 300) // 300ms debounce
  }, [userId])

  // Remove vote with optimistic updates
  const removeVote = useCallback(async (postId: string) => {
    if (!userId) {
      console.error('❌ Cannot remove vote: User not authenticated')
      return
    }

    // Clear existing timeout for this post
    if (voteTimeouts.current[postId]) {
      clearTimeout(voteTimeouts.current[postId])
    }

    // Optimistic update
    setOptimisticVotes(prev => ({
      ...prev,
      [postId]: null
    }))

    // Debounce the actual API call
    voteTimeouts.current[postId] = setTimeout(async () => {
      try {
        setIsVoting(true)
        
        const { error } = await PostService.removeVote(userId, postId)
        
        if (error) {
          console.error('❌ Remove vote error:', error)
          
          // Revert optimistic update on error
          setOptimisticVotes(prev => {
            const updated = { ...prev }
            delete updated[postId]
            return updated
          })
        } else {
          console.log('✅ Vote removed successfully')
          
          // Clear optimistic state
          setTimeout(() => {
            setOptimisticVotes(prev => {
              const updated = { ...prev }
              delete updated[postId]
              return updated
            })
          }, 1000)
        }
      } catch (error) {
        console.error('❌ Remove vote service error:', error)
        
        // Revert optimistic update
        setOptimisticVotes(prev => {
          const updated = { ...prev }
          delete updated[postId]
          return updated
        })
      } finally {
        setIsVoting(false)
        delete voteTimeouts.current[postId]
      }
    }, 300) // 300ms debounce
  }, [userId])

  // Toggle vote (smart voting)
  const toggleVote = useCallback(async (postId: string, currentVote: 'green' | 'red' | null, newVoteType: 'green' | 'red') => {
    if (currentVote === newVoteType) {
      // Same vote type - remove vote
      await removeVote(postId)
    } else {
      // Different vote type or no vote - add/change vote
      await vote(postId, newVoteType)
    }
  }, [vote, removeVote])

  // Get effective vote (considering optimistic updates)
  const getEffectiveVote = useCallback((postId: string, serverVote: 'green' | 'red' | null) => {
    const optimisticVote = optimisticVotes[postId]
    return optimisticVote !== undefined ? optimisticVote : serverVote
  }, [optimisticVotes])

  // Clear optimistic vote (useful for cleanup)
  const clearOptimisticVote = useCallback((postId: string) => {
    setOptimisticVotes(prev => {
      const updated = { ...prev }
      delete updated[postId]
      return updated
    })
  }, [])

  // Cleanup timeouts on unmount
  const cleanup = useCallback(() => {
    Object.values(voteTimeouts.current).forEach(timeout => {
      if (timeout) clearTimeout(timeout)
    })
    voteTimeouts.current = {}
  }, [])

  return {
    vote,
    removeVote,
    toggleVote,
    isVoting,
    optimisticVotes,
    getEffectiveVote,
    clearOptimisticVote,
    cleanup,
  } as UseVoteReturn & {
    toggleVote: (postId: string, currentVote: 'green' | 'red' | null, newVoteType: 'green' | 'red') => Promise<void>
    getEffectiveVote: (postId: string, serverVote: 'green' | 'red' | null) => 'green' | 'red' | null
    clearOptimisticVote: (postId: string) => void
    cleanup: () => void
  }
}

// 🔥 EXPERT HOOK: usePostVotes - For tracking votes on a specific post
export const usePostVotes = (postId: string) => {
  const [greenCount, setGreenCount] = useState(0)
  const [redCount, setRedCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // This would typically fetch vote counts and subscribe to changes
  // Implementation would depend on your specific needs

  return {
    greenCount,
    redCount,
    totalVotes: greenCount + redCount,
    isLoading,
  }
}