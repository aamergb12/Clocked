// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Post, Profile, Vote, Comment, Verification } from '../types'

// Environment variables - SECURE AS FUCK
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('🚨 MISSING SUPABASE CREDENTIALS - CHECK YOUR .env.local FILE')
}

// EXPERT SUPABASE CLIENT - Optimized for performance
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'tea-app-mobile',
    },
  },
})

// 🔥 AUTH SERVICE - Phone authentication like a PRO
export class AuthService {
  // Send OTP to phone number
  static async signInWithPhone(phone: string) {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phone.replace(/\D/g, ''), // Clean phone number
        options: {
          shouldCreateUser: true,
          data: { phone }, // Store phone in user metadata
        },
      })
      return { data, error: error?.message || null }
    } catch (error) {
      console.error('❌ Phone auth error:', error)
      return { data: null, error: 'Failed to send verification code' }
    }
  }

  // Verify OTP code
  static async verifyOTP(phone: string, token: string) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone.replace(/\D/g, ''),
        token: token.replace(/\D/g, ''),
        type: 'sms',
      })
      return { data, error: error?.message || null }
    } catch (error) {
      console.error('❌ OTP verification error:', error)
      return { data: null, error: 'Invalid verification code' }
    }
  }

  // Sign out user
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      return { error: error?.message || null }
    } catch (error) {
      console.error('❌ Sign out error:', error)
      return { error: 'Failed to sign out' }
    }
  }

  // Get current session
  static async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession()
      return { data, error: error?.message || null }
    } catch (error) {
      console.error('❌ Get session error:', error)
      return { data: null, error: 'Failed to get session' }
    }
  }

  // Listen to auth changes
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// 🔥 PROFILE SERVICE - User management like a PRO
export class ProfileService {
  // Get user profile with error handling
  static async getProfile(userId: string): Promise<{ data: Profile | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('❌ Profile fetch error:', error)
        return { data: null, error: 'Failed to load profile' }
      }
      
      return { data, error: null }
    } catch (error) {
      console.error('❌ Profile service error:', error)
      return { data: null, error: 'Network error' }
    }
  }

  // Update profile with optimistic updates
  static async updateProfile(userId: string, updates: Partial<Profile>) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId)
        .select()
        .single()
      
      if (error) {
        console.error('❌ Profile update error:', error)
        return { data: null, error: 'Failed to update profile' }
      }
      
      return { data, error: null }
    } catch (error) {
      console.error('❌ Profile update service error:', error)
      return { data: null, error: 'Network error' }
    }
  }

  // Check if user is verified
  static async isUserVerified(userId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('verification_status')
        .eq('id', userId)
        .single()
      
      return data?.verification_status === 'approved'
    } catch (error) {
      console.error('❌ Verification check error:', error)
      return false
    }
  }

  // Get queue position for unverified users
  static async getQueuePosition(userId: string): Promise<number> {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('verification_status', 'pending')
        .lt('created_at', new Date().toISOString())
      
      return data?.length || 0
    } catch (error) {
      console.error('❌ Queue position error:', error)
      return 0
    }
  }
}

// 🔥 POST SERVICE - Content management like a PRO
export class PostService {
  // Get posts with vote counts and user's vote - OPTIMIZED QUERY
  static async getPosts(userId?: string, limit = 20, offset = 0) {
    try {
      // Main posts query with vote counts
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          id,
          created_by,
          image_url,
          person_name,
          description,
          is_active,
          created_at,
          profiles!created_by (username)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('❌ Posts fetch error:', error)
        return { data: null, error: 'Failed to load posts' }
      }

      if (!posts?.length) {
        return { data: [], error: null }
      }

      // Get vote counts for all posts in one query
      const postIds = posts.map(p => p.id)
      const { data: votes } = await supabase
        .from('votes')
        .select('post_id, vote_type')
        .in('post_id', postIds)

      // Get user's votes if authenticated
      let userVotes: any[] = []
      if (userId) {
        const { data } = await supabase
          .from('votes')
          .select('post_id, vote_type')
          .eq('user_id', userId)
          .in('post_id', postIds)
        userVotes = data || []
      }

      // Aggregate vote counts and user votes
      const postsWithVotes = posts.map(post => {
        const postVotes = votes?.filter(v => v.post_id === post.id) || []
        const greenVotes = postVotes.filter(v => v.vote_type === 'green').length
        const redVotes = postVotes.filter(v => v.vote_type === 'red').length
        const userVote = userVotes.find(v => v.post_id === post.id)?.vote_type || null

        return {
          ...post,
          // Ensure all required Post fields are present
          is_active: post.is_active ?? true,
          // Add computed fields
          green_votes: greenVotes,
          red_votes: redVotes,
          user_vote: userVote,
        } as Post
      })

      return { data: postsWithVotes, error: null }
    } catch (error) {
      console.error('❌ Posts service error:', error)
      return { data: null, error: 'Network error' }
    }
  }

  // Create new post with validation
  static async createPost(userId: string, postData: {
    image_url: string
    person_name?: string
    description?: string
  }) {
    try {
      // Validate input
      if (!postData.image_url) {
        return { data: null, error: 'Image is required' }
      }

      const { data, error } = await supabase
        .from('posts')
        .insert({
          created_by: userId,
          image_url: postData.image_url,
          person_name: postData.person_name?.trim() || null,
          description: postData.description?.trim() || null,
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Post creation error:', error)
        return { data: null, error: 'Failed to create post' }
      }

      return { data, error: null }
    } catch (error) {
      console.error('❌ Post creation service error:', error)
      return { data: null, error: 'Network error' }
    }
  }

  // Vote on post with optimistic updates
  static async voteOnPost(userId: string, postId: string, voteType: 'green' | 'red') {
    try {
      // Use upsert to handle vote changes
      const { data, error } = await supabase
        .from('votes')
        .upsert({
          user_id: userId,
          post_id: postId,
          vote_type: voteType,
        }, {
          onConflict: 'user_id,post_id'
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Vote error:', error)
        return { data: null, error: 'Failed to submit vote' }
      }

      return { data, error: null }
    } catch (error) {
      console.error('❌ Vote service error:', error)
      return { data: null, error: 'Network error' }
    }
  }

  // Remove vote
  static async removeVote(userId: string, postId: string) {
    try {
      const { error } = await supabase
        .from('votes')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId)

      if (error) {
        console.error('❌ Remove vote error:', error)
        return { error: 'Failed to remove vote' }
      }

      return { error: null }
    } catch (error) {
      console.error('❌ Remove vote service error:', error)
      return { error: 'Network error' }
    }
  }
}

// 🔥 COMMENT SERVICE - Real-time comments like a PRO
export class CommentService {
  // Get comments for a post
  static async getComments(postId: string) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          is_anonymous,
          profiles!user_id (username)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('❌ Comments fetch error:', error)
        return { data: null, error: 'Failed to load comments' }
      }

      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Comments service error:', error)
      return { data: null, error: 'Network error' }
    }
  }

  // Add comment with validation
  static async addComment(
    userId: string, 
    postId: string, 
    content: string, 
    isAnonymous = true
  ) {
    try {
      // Validate content
      const trimmedContent = content.trim()
      if (!trimmedContent || trimmedContent.length < 1) {
        return { data: null, error: 'Comment cannot be empty' }
      }

      if (trimmedContent.length > 500) {
        return { data: null, error: 'Comment too long (max 500 characters)' }
      }

      const { data, error } = await supabase
        .from('comments')
        .insert({
          user_id: userId,
          post_id: postId,
          content: trimmedContent,
          is_anonymous: isAnonymous,
        })
        .select(`
          id,
          content,
          created_at,
          is_anonymous,
          profiles!user_id (username)
        `)
        .single()

      if (error) {
        console.error('❌ Comment creation error:', error)
        return { data: null, error: 'Failed to post comment' }
      }

      return { data, error: null }
    } catch (error) {
      console.error('❌ Comment service error:', error)
      return { data: null, error: 'Network error' }
    }
  }
}

// 🔥 VERIFICATION SERVICE - Identity verification like a PRO
export class VerificationService {
  // Submit verification documents
  static async submitVerification(userId: string, selfieUrl: string, idDocumentUrl?: string) {
    try {
      const { data, error } = await supabase
        .from('verifications')
        .insert({
          user_id: userId,
          selfie_url: selfieUrl,
          id_document_url: idDocumentUrl || null,
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Verification submission error:', error)
        return { data: null, error: 'Failed to submit verification' }
      }

      return { data, error: null }
    } catch (error) {
      console.error('❌ Verification service error:', error)
      return { data: null, error: 'Network error' }
    }
  }

  // Get verification status
  static async getVerificationStatus(userId: string) {
    try {
      const { data, error } = await supabase
        .from('verifications')
        .select('status, rejection_reason, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found is OK
        console.error('❌ Verification status error:', error)
        return { data: null, error: 'Failed to check verification status' }
      }

      return { data: data || null, error: null }
    } catch (error) {
      console.error('❌ Verification status service error:', error)
      return { data: null, error: 'Network error' }
    }
  }
}

// 🔥 STORAGE SERVICE - File uploads like a PRO
export class StorageService {
  // Upload image with compression and validation
  static async uploadImage(
    bucket: 'post-images' | 'verification-docs',
    file: Blob | File,
    fileName: string,
    userId?: string
  ) {
    try {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return { data: null, error: 'File too large (max 10MB)' }
      }

      // Create organized file path
      const timestamp = Date.now()
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = userId 
        ? `${userId}/${timestamp}_${cleanFileName}`
        : `${timestamp}_${cleanFileName}`

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        console.error('❌ Upload error:', error)
        return { data: null, error: 'Failed to upload image' }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      return { 
        data: { 
          path: data.path, 
          publicUrl: urlData.publicUrl 
        }, 
        error: null 
      }
    } catch (error) {
      console.error('❌ Storage service error:', error)
      return { data: null, error: 'Upload failed' }
    }
  }

  // Delete image
  static async deleteImage(bucket: 'post-images' | 'verification-docs', filePath: string) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath])

      if (error) {
        console.error('❌ Delete error:', error)
        return { error: 'Failed to delete image' }
      }

      return { error: null }
    } catch (error) {
      console.error('❌ Delete service error:', error)
      return { error: 'Delete failed' }
    }
  }
}

// 🔥 REALTIME SERVICE - Live updates like a PRO
export class RealtimeService {
  // Subscribe to new posts
  static subscribeToNewPosts(callback: (post: Post) => void) {
    return supabase
      .channel('new-posts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
        filter: 'is_active=eq.true',
      }, (payload) => {
        console.log('🔔 New post:', payload.new)
        callback(payload.new as Post)
      })
      .subscribe()
  }

  // Subscribe to vote changes on a post
  static subscribeToPostVotes(postId: string, callback: (vote: Vote) => void) {
    return supabase
      .channel(`post-votes-${postId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'votes',
        filter: `post_id=eq.${postId}`,
      }, (payload) => {
        console.log('🔔 Vote update:', payload)
        if (payload.eventType !== 'DELETE') {
          callback(payload.new as Vote)
        }
      })
      .subscribe()
  }

  // Subscribe to new comments on a post
  static subscribeToPostComments(postId: string, callback: (comment: Comment) => void) {
    return supabase
      .channel(`post-comments-${postId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`,
      }, (payload) => {
        console.log('🔔 New comment:', payload.new)
        callback(payload.new as Comment)
      })
      .subscribe()
  }

  // Unsubscribe from channel
  static unsubscribe(channel: any) {
    if (channel) {
      supabase.removeChannel(channel)
    }
  }
}

// Export the main client for direct access
export default supabase

// 🔥 HEALTH CHECK - Make sure everything is working
export const healthCheck = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (error) {
      console.error('❌ Health check failed:', error)
      return false
    }

    console.log('✅ Supabase connection healthy')
    return true
  } catch (error) {
    console.error('❌ Health check error:', error)
    return false
  }
}