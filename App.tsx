// App.tsx
import React, { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  SafeAreaView 
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from './src/hooks/useAuth'
import AuthScreen from './src/screens/AuthScreen'
import HomeScreen from './src/screens/HomeScreen'

export default function App() {
  // Auth state
  const { user, profile, isAuthenticated, isLoading } = useAuth()
  
  // App initialization state
  const [isAppReady, setIsAppReady] = useState(false)

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Add any app initialization logic here
        // e.g., load fonts, check for updates, etc.
        
        // Simulate brief loading for smooth UX
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setIsAppReady(true)
      } catch (error) {
        console.error('App initialization error:', error)
        setIsAppReady(true) // Continue anyway
      }
    }

    initializeApp()
  }, [])

  // Show loading screen while app initializes
  if (!isAppReady || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#000000', '#1a1a1a', '#000000']}
          style={styles.gradient}
        >
          <StatusBar style="light" />
          
          {/* Logo */}
          <Text style={styles.loadingLogo}>Clocked App</Text>
          
          {/* Loading indicator */}
          <ActivityIndicator 
            size="large" 
            color="#ff6b6b" 
            style={styles.loadingSpinner}
          />
          
          {/* Loading text */}
          <Text style={styles.loadingText}>
            {isLoading ? 'Checking authentication...' : 'Loading app...'}
          </Text>
        </LinearGradient>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#000" translucent={false} />
      
      {isAuthenticated && user ? (
        // User is logged in - show main app
        <HomeScreen />
      ) : (
        // User not logged in - show auth screen
        <AuthScreen />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLogo: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#ff6b6b',
    letterSpacing: -2,
    textShadowColor: 'rgba(255, 107, 107, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
    marginBottom: 40,
  },
  loadingSpinner: {
    marginBottom: 20,
  },
  loadingText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
  },
})