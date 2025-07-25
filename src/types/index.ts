// src/types/index.ts

// 🔥 CORE DATABASE TYPES - Matches Supabase schema EXACTLY

export interface Profile {
  id: string
  phone?: string
  username?: string
  verification_status: 'pending' | 'approved' | 'rejected'
  invited_by?: string
  invite_count: number
  queue_position?: number
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  created_by: string
  image_url: string
  person_name?: string
  description?: string
  is_active: boolean
  created_at: string
  // Computed fields (from joins/aggregations) - all optional
  green_votes?: number
  red_votes?: number
  total_comments?: number
  user_vote?: 'green' | 'red' | null
  // Joined profile data - flexible structure
  profiles?: {
    username?: string
  } | {
    username?: string
  }[]
}

export interface Vote {
  id: string
  post_id: string
  user_id: string
  vote_type: 'green' | 'red'
  created_at: string
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  is_anonymous: boolean
  created_at: string
  // Joined profile data
  profiles?: {
    username?: string
  }
}

export interface Verification {
  id: string
  user_id: string
  selfie_url: string
  id_document_url?: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
}

export interface Report {
  id: string
  reported_by: string
  post_id: string
  reason: string
  status: 'pending' | 'resolved' | 'dismissed'
  created_at: string
}

// 🔥 API RESPONSE TYPES - For consistent error handling

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  loading?: boolean
}

export interface ApiError {
  message: string
  code?: string
  details?: any
}

// 🔥 AUTH TYPES - Authentication state management

export interface AuthUser {
  id: string
  phone?: string
  email?: string
  user_metadata?: {
    phone?: string
    [key: string]: any
  }
}

export interface AuthSession {
  user: AuthUser
  access_token: string
  refresh_token: string
  expires_at?: number
}

export interface AuthState {
  user: AuthUser | null
  session: AuthSession | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// 🔥 NAVIGATION TYPES - Type-safe navigation

export type RootStackParamList = {
  // Auth flow
  Auth: undefined
  PhoneLogin: undefined
  OTPVerification: { phone: string }
  
  // Main app
  Main: undefined
  Home: undefined
  
  // Post flow
  PostDetail: { postId: string }
  CreatePost: undefined
  
  // Profile & verification
  Profile: { userId?: string }
  EditProfile: undefined
  Verification: undefined
  VerificationStatus: undefined
  
  // Modals
  CommentModal: { postId: string }
  ReportModal: { postId: string }
  ImagePreview: { imageUrl: string }
}

export type BottomTabParamList = {
  Home: undefined
  Search: undefined
  Create: undefined
  Profile: undefined
}

// 🔥 FORM TYPES - Form validation and submission

export interface PhoneLoginForm {
  phone: string
}

export interface OTPVerificationForm {
  code: string
}

export interface CreatePostForm {
  image: string | null
  personName?: string
  description?: string
}

export interface VerificationForm {
  selfie: string | null
  idDocument?: string | null
}

export interface CommentForm {
  content: string
  isAnonymous: boolean
}

export interface ProfileUpdateForm {
  username?: string
  phone?: string
}

export interface ReportForm {
  reason: string
  details?: string
}

// 🔥 UI STATE TYPES - Component state management

export interface LoadingState {
  isLoading: boolean
  error: string | null
}

export interface PaginationState {
  page: number
  limit: number
  hasMore: boolean
  isLoadingMore: boolean
}

export interface PostsState extends LoadingState {
  posts: Post[]
  pagination: PaginationState
  lastRefresh: number
}

export interface CommentsState extends LoadingState {
  comments: Comment[]
  isAddingComment: boolean
}

export interface VoteState {
  isVoting: boolean
  optimisticVote?: 'green' | 'red' | null
}

// 🔥 APP STATE TYPES - Global state management

export interface AppState {
  auth: AuthState
  user: {
    profile: Profile | null
    isLoading: boolean
    error: string | null
  }
  posts: PostsState
  ui: {
    theme: 'light' | 'dark'
    isOnline: boolean
    activeTab: keyof BottomTabParamList
  }
}

// 🔥 HOOK TYPES - Custom hook return types

export interface UsePostsReturn {
  posts: Post[]
  isLoading: boolean
  error: string | null
  hasMore: boolean
  isLoadingMore: boolean
  refresh: () => Promise<void>
  loadMore: () => Promise<void>
}

export interface UseCommentsReturn {
  comments: Comment[]
  isLoading: boolean
  error: string | null
  addComment: (content: string, isAnonymous?: boolean) => Promise<void>
  isAddingComment: boolean
}

export interface UseVoteReturn {
  vote: (postId: string, voteType: 'green' | 'red') => Promise<void>
  removeVote: (postId: string) => Promise<void>
  isVoting: boolean
  optimisticVotes: Record<string, 'green' | 'red' | null>
  getEffectiveVote: (postId: string, serverVote: 'green' | 'red' | null) => 'green' | 'red' | null
  toggleVote: (postId: string, currentVote: 'green' | 'red' | null, newVoteType: 'green' | 'red') => Promise<void>
  clearOptimisticVote: (postId: string) => void
  cleanup: () => void
}

export interface UseAuthReturn {
  user: AuthUser | null
  profile: Profile | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  signInWithPhone: (phone: string) => Promise<{ error: string | null }>
  verifyOTP: (phone: string, code: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export interface UseVerificationReturn {
  status: Verification | null
  isLoading: boolean
  error: string | null
  submitVerification: (selfieUrl: string, idDocumentUrl?: string) => Promise<{ error: string | null }>
  isSubmitting: boolean
}

// 🔥 UTILITY TYPES - Helper types for development

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type NonNullable<T> = T extends null | undefined ? never : T

// 🔥 EVENT TYPES - Real-time event handling

export interface RealtimeEvent<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T
  old: T
  errors: any[]
}

export interface PostEvent extends RealtimeEvent<Post> {}
export interface VoteEvent extends RealtimeEvent<Vote> {}
export interface CommentEvent extends RealtimeEvent<Comment> {}

// 🔥 STORAGE TYPES - File upload handling

export interface UploadResult {
  path: string
  publicUrl: string
}

export interface ImageUploadOptions {
  bucket: 'post-images' | 'verification-docs'
  maxSize?: number // in bytes
  quality?: number // 0-1
  resize?: {
    width: number
    height: number
  }
}

// 🔥 NOTIFICATION TYPES - Push notifications

export interface PushNotification {
  id: string
  title: string
  body: string
  data?: {
    type: 'post' | 'comment' | 'vote' | 'verification'
    postId?: string
    userId?: string
  }
  timestamp: number
}

// 🔥 ANALYTICS TYPES - User behavior tracking

export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  userId?: string
  timestamp: number
}

export interface UserAction {
  type: 'post_view' | 'post_vote' | 'comment_add' | 'profile_view' | 'verification_submit'
  postId?: string
  voteType?: 'green' | 'red'
  timestamp: number
}

// 🔥 THEME TYPES - UI styling

export interface ThemeColors {
  primary: string
  secondary: string
  background: string
  surface: string
  text: string
  textSecondary: string
  success: string
  warning: string
  error: string
  border: string
}

export interface Theme {
  colors: ThemeColors
  spacing: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
  }
  typography: {
    sizes: {
      xs: number
      sm: number
      md: number
      lg: number
      xl: number
      xxl: number
    }
    weights: {
      regular: string
      medium: string
      semibold: string
      bold: string
    }
  }
  borderRadius: {
    sm: number
    md: number
    lg: number
    xl: number
  }
}

// 🔥 VALIDATION TYPES - Form validation schemas

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => boolean | string
}

export interface ValidationSchema {
  [key: string]: ValidationRule
}

export interface ValidationError {
  field: string
  message: string
}

// 🔥 EXPORT ALL TYPES FOR EASY IMPORTING
export type * from './index'