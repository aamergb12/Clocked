// src/components/PostCard.tsx
import React, { useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useVote } from '../hooks/useVote'
import { Post } from '../types'

const { width } = Dimensions.get('window')
const CARD_WIDTH = width - 32
const IMAGE_HEIGHT = CARD_WIDTH * 0.75

interface PostCardProps {
  post: Post
  currentUserId?: string
  onPress?: () => void
  onUserPress?: () => void
}

export default function PostCard({ 
  post, 
  currentUserId, 
  onPress, 
  onUserPress 
}: PostCardProps) {
  // Hooks
  const { vote, removeVote, isVoting, getEffectiveVote } = useVote(currentUserId)
  
  // Local state
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  // Get effective vote (with optimistic updates)
  const effectiveVote = getEffectiveVote(post.id, post.user_vote || null)
  
  // Calculate vote counts with optimistic updates
  const greenCount = useMemo(() => {
    let count = post.green_votes || 0
    if (post.user_vote === 'green' && effectiveVote !== 'green') count--
    if (post.user_vote !== 'green' && effectiveVote === 'green') count++
    return count
  }, [post.green_votes, post.user_vote, effectiveVote])

  const redCount = useMemo(() => {
    let count = post.red_votes || 0
    if (post.user_vote === 'red' && effectiveVote !== 'red') count--
    if (post.user_vote !== 'red' && effectiveVote === 'red') count++
    return count
  }, [post.red_votes, post.user_vote, effectiveVote])

  // Calculate percentages
  const totalVotes = greenCount + redCount
  const greenPercentage = totalVotes > 0 ? (greenCount / totalVotes) * 100 : 0
  const redPercentage = totalVotes > 0 ? (redCount / totalVotes) * 100 : 0

  // Handle vote
  const handleVote = useCallback(async (voteType: 'green' | 'red') => {
    if (!currentUserId) {
      Alert.alert('Login Required', 'Please log in to vote')
      return
    }

    try {
      if (effectiveVote === voteType) {
        // Remove vote if clicking same type
        await removeVote(post.id)
      } else {
        // Add or change vote
        await vote(post.id, voteType)
      }
    } catch (error) {
      console.error('Vote error:', error)
      Alert.alert('Error', 'Failed to submit vote')
    }
  }, [currentUserId, effectiveVote, post.id, vote, removeVote])

  // Handle image load
  const handleImageLoad = useCallback(() => {
    setImageLoading(false)
  }, [])

  const handleImageError = useCallback(() => {
    setImageLoading(false)
    setImageError(true)
  }, [])

  // Format time
  const formatTime = useCallback((dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString()
  }, [])

  // Get username from profiles
  const username = useMemo(() => {
    if (Array.isArray(post.profiles)) {
      return post.profiles[0]?.username || 'Anonymous'
    }
    return post.profiles?.username || 'Anonymous'
  }, [post.profiles])

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.95}
    >
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.userInfo}
            onPress={onUserPress}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {username[0]?.toUpperCase() || 'A'}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.username}>{username}</Text>
              <Text style={styles.timeStamp}>
                {formatTime(post.created_at)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Image */}
        <View style={styles.imageContainer}>
          {imageLoading && (
            <View style={styles.imageLoader}>
              <ActivityIndicator size="large" color="#ff6b6b" />
            </View>
          )}
          
          {imageError ? (
            <View style={styles.imageError}>
              <Text style={styles.imageErrorText}>Failed to load image</Text>
            </View>
          ) : (
            <Image
              source={{ uri: post.image_url }}
              style={styles.image}
              onLoad={handleImageLoad}
              onError={handleImageError}
              resizeMode="cover"
            />
          )}

          {/* Image overlay with person name */}
          {post.person_name && (
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.imageOverlay}
            >
              <Text style={styles.personName}>{post.person_name}</Text>
            </LinearGradient>
          )}
        </View>

        {/* Description */}
        {post.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>{post.description}</Text>
          </View>
        )}

        {/* Vote Section */}
        <View style={styles.voteSection}>
          {/* Vote Buttons */}
          <View style={styles.voteButtons}>
            {/* Green Flag Button */}
            <TouchableOpacity
              style={[
                styles.voteButton,
                styles.greenButton,
                effectiveVote === 'green' && styles.activeGreenButton,
                isVoting && styles.votingButton,
              ]}
              onPress={() => handleVote('green')}
              disabled={isVoting}
            >
              <Text style={[
                styles.voteButtonText,
                effectiveVote === 'green' && styles.activeVoteText,
              ]}>
                🟢 {greenCount}
              </Text>
            </TouchableOpacity>

            {/* Red Flag Button */}
            <TouchableOpacity
              style={[
                styles.voteButton,
                styles.redButton,
                effectiveVote === 'red' && styles.activeRedButton,
                isVoting && styles.votingButton,
              ]}
              onPress={() => handleVote('red')}
              disabled={isVoting}
            >
              <Text style={[
                styles.voteButtonText,
                effectiveVote === 'red' && styles.activeVoteText,
              ]}>
                🔴 {redCount}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Vote Progress Bar */}
          {totalVotes > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    styles.greenProgress,
                    { width: `${greenPercentage}%` }
                  ]} 
                />
                <View 
                  style={[
                    styles.progressFill,
                    styles.redProgress,
                    { width: `${redPercentage}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(greenPercentage)}% 🟢 • {Math.round(redPercentage)}% 🔴
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  header: {
    padding: 16,
    paddingBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  timeStamp: {
    color: '#999',
    fontSize: 12,
  },
  imageContainer: {
    position: 'relative',
    height: IMAGE_HEIGHT,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  imageError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  imageErrorText: {
    color: '#999',
    fontSize: 14,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  personName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  descriptionContainer: {
    padding: 16,
    paddingTop: 12,
  },
  description: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  voteSection: {
    padding: 16,
    paddingTop: 8,
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  voteButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  greenButton: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  redButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  activeGreenButton: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    borderColor: '#34c759',
  },
  activeRedButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    borderColor: '#ff3b30',
  },
  votingButton: {
    opacity: 0.6,
  },
  voteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  activeVoteText: {
    color: '#fff',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  greenProgress: {
    backgroundColor: '#34c759',
  },
  redProgress: {
    backgroundColor: '#ff3b30',
  },
  progressText: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
})