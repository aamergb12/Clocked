// src/hooks/usePosts.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import { PostService, RealtimeService } from '../services/supabase'
import { Post, UsePostsReturn } from '../types'

export const usePosts = (userId?: string): UsePostsReturn => {
  // State management
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  
  // Pagination state
  const [page, setPage] = useState(0)
  const pageSize = 20
  
  // Refs for cleanup
  const realtimeChannel = useRef<any>(null)
  const mounted = useRef(true)

  // Load posts with pagination
  const loadPosts = useCallback(async (pageNum: number = 0, replace: boolean = true) => {
    try {
      if (pageNum === 0) {
        setIsLoading(true)
        setError(null)
      } else {
        setIsLoadingMore(true)
      }

      const offset = pageNum * pageSize
      const { data: newPosts, error: postsError } = await PostService.getPosts(
        userId,
        pageSize,
        offset
      )

      if (!mounted.current) return

      if (postsError) {
        console.error('❌ Posts load error:', postsError)
        setError(postsError)
        return
      }

      if (newPosts) {
        if (replace || pageNum === 0) {
          // Replace posts (refresh)
          setPosts(newPosts)
        } else {
          // Append posts (load more)
          setPosts(prevPosts => {
            // Remove duplicates
            const existingIds = new Set(prevPosts.map(p => p.id))
            const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id))
            return [...prevPosts, ...uniqueNewPosts]
          })
        }

        // Update pagination state
        setHasMore(newPosts.length === pageSize)
        setPage(pageNum)
      }
    } catch (error) {
      console.error('❌ Posts service error:', error)
      if (mounted.current) {
        setError('Failed to load posts')
      }
    } finally {
      if (mounted.current) {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    }
  }, [userId, pageSize])

  // Refresh posts (pull to refresh)
  const refresh = useCallback(async () => {
    await loadPosts(0, true)
  }, [loadPosts])

  // Load more posts (infinite scroll)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    await loadPosts(page + 1, false)
  }, [loadPosts, page, isLoadingMore, hasMore])

  // Handle real-time new posts
  const handleNewPost = useCallback((newPost: Post) => {
    if (!mounted.current) return

    setPosts(prevPosts => {
      // Check if post already exists
      const exists = prevPosts.some(p => p.id === newPost.id)
      if (exists) return prevPosts

      // Add new post to the beginning
      return [newPost, ...prevPosts]
    })
  }, [])

  // Update post in state (for optimistic updates)
  const updatePost = useCallback((postId: string, updates: Partial<Post>) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, ...updates }
          : post
      )
    )
  }, [])

  // Remove post from state
  const removePost = useCallback((postId: string) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId))
  }, [])

  // Initialize posts and real-time subscriptions
  useEffect(() => {
    mounted.current = true

    // Load initial posts
    loadPosts(0, true)

    // Subscribe to new posts if user is authenticated
    if (userId) {
      realtimeChannel.current = RealtimeService.subscribeToNewPosts(handleNewPost)
    }

    // Cleanup function
    return () => {
      mounted.current = false
      if (realtimeChannel.current) {
        RealtimeService.unsubscribe(realtimeChannel.current)
      }
    }
  }, [loadPosts, userId, handleNewPost])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  return {
    posts,
    isLoading,
    error,
    hasMore,
    isLoadingMore,
    refresh,
    loadMore,
    // Internal methods for other hooks to use
    updatePost,
    removePost,
  } as UsePostsReturn & {
    updatePost: (postId: string, updates: Partial<Post>) => void
    removePost: (postId: string) => void
  }
}

// 🔥 EXPERT HOOK: useSinglePost - For post detail views
export const useSinglePost = (postId: string, userId?: string) => {
  const [post, setPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Real-time subscriptions
  const voteChannel = useRef<any>(null)
  const mounted = useRef(true)

  // Load single post
  const loadPost = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: posts, error: postsError } = await PostService.getPosts(userId, 50, 0)

      if (!mounted.current) return

      if (postsError) {
        setError(postsError)
        return
      }

      const foundPost = posts?.find(p => p.id === postId)
      setPost(foundPost || null)
    } catch (error) {
      console.error('❌ Single post load error:', error)
      if (mounted.current) {
        setError('Failed to load post')
      }
    } finally {
      if (mounted.current) {
        setIsLoading(false)
      }
    }
  }, [postId, userId])

  // Handle vote updates
  const handleVoteUpdate = useCallback(() => {
    // Reload post to get updated vote counts
    loadPost()
  }, [loadPost])

  // Update post state
  const updatePost = useCallback((updates: Partial<Post>) => {
    if (post) {
      setPost(prevPost => prevPost ? { ...prevPost, ...updates } : null)
    }
  }, [post])

  useEffect(() => {
    mounted.current = true

    // Load post
    loadPost()

    // Subscribe to vote changes
    voteChannel.current = RealtimeService.subscribeToPostVotes(postId, handleVoteUpdate)

    return () => {
      mounted.current = false
      if (voteChannel.current) {
        RealtimeService.unsubscribe(voteChannel.current)
      }
    }
  }, [loadPost, postId, handleVoteUpdate])

  return {
    post,
    isLoading,
    error,
    refresh: loadPost,
    updatePost,
  }
}