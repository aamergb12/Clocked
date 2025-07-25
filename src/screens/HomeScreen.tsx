// src/screens/HomeScreen.tsx
import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../hooks/useAuth'
import PostFeed from '../components/PostFeed'
import { Post } from '../types'

export default function HomeScreen() {
  // Auth state
  const { user, profile, signOut } = useAuth()
  
  // Local state
  const [refreshing, setRefreshing] = useState(false)

  // Handle post press
  const handlePostPress = useCallback((post: Post) => {
    // TODO: Navigate to post detail screen
    console.log('Post pressed:', post.id)
  }, [])

  // Handle user press
  const handleUserPress = useCallback((userId: string) => {
    // TODO: Navigate to user profile screen
    console.log('User pressed:', userId)
  }, [])

  // Handle sign out
  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: signOut 
        },
      ]
    )
  }, [signOut])

  // Check if user is verified
  const isVerified = profile?.verification_status === 'approved'

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['rgba(0,0,0,0.9)', 'transparent']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {/* Logo */}
          <Text style={styles.logo}>Tea</Text>
          
          {/* User info */}
          <View style={styles.userSection}>
            {!isVerified && (
              <View style={styles.verificationBadge}>
                <Text style={styles.verificationText}>
                  Pending Verification
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Main Content */}
      {isVerified ? (
        // Verified users see the feed
        <PostFeed 
          onPostPress={handlePostPress}
          onUserPress={handleUserPress}
        />
      ) : (
        // Unverified users see waiting screen
        <WaitingScreen profile={profile} />
      )}
    </SafeAreaView>
  )
}

// Waiting screen for unverified users
function WaitingScreen({ profile }: { profile: any }) {
  const getQueueMessage = () => {
    const status = profile?.verification_status
    
    switch (status) {
      case 'pending':
        return {
          title: 'Verification Pending',
          subtitle: 'Your account is being reviewed. This usually takes 24-48 hours.',
          emoji: '⏳'
        }
      case 'rejected':
        return {
          title: 'Verification Required',
          subtitle: 'Please submit new verification documents to access the app.',
          emoji: '❌'
        }
      default:
        return {
          title: 'Complete Verification',
          subtitle: 'Upload a selfie and ID to get verified and access Tea.',
          emoji: '📸'
        }
    }
  }

  const { title, subtitle, emoji } = getQueueMessage()

  return (
    <View style={styles.waitingContainer}>
      <LinearGradient
        colors={['#000000', '#1a1a1a', '#000000']}
        style={styles.waitingGradient}
      >
        <View style={styles.waitingContent}>
          <Text style={styles.waitingEmoji}>{emoji}</Text>
          <Text style={styles.waitingTitle}>{title}</Text>
          <Text style={styles.waitingSubtitle}>{subtitle}</Text>
          
          <TouchableOpacity style={styles.verifyButton}>
            <Text style={styles.verifyButtonText}>
              {profile?.verification_status === 'rejected' 
                ? 'Submit New Documents' 
                : 'Start Verification'
              }
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ff6b6b',
    letterSpacing: -1,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  verificationBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.4)',
  },
  verificationText: {
    color: '#ffc107',
    fontSize: 12,
    fontWeight: '600',
  },
  signOutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  signOutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  waitingContainer: {
    flex: 1,
  },
  waitingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
    maxWidth: 400,
  },
  waitingEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  waitingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  waitingSubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  verifyButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
})