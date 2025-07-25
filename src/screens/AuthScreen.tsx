// src/screens/AuthScreen.tsx
import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../hooks/useAuth'

const { width, height } = Dimensions.get('window')

export default function AuthScreen() {
  // Auth hook
  const { signInWithPhone, verifyOTP, isLoading, error } = useAuth()
  
  // Local state
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Format phone number as user types
  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '')
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
  }

  // Handle phone submission
  const handlePhoneSubmit = async () => {
    if (phone.replace(/\D/g, '').length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number')
      return
    }

    setIsSubmitting(true)
    const cleanPhone = `+1${phone.replace(/\D/g, '')}`
    
    const { error } = await signInWithPhone(cleanPhone)
    
    if (error) {
      Alert.alert('Error', error)
    } else {
      setStep('otp')
      Alert.alert('Code Sent!', 'Check your phone for the verification code')
    }
    
    setIsSubmitting(false)
  }

  // Handle OTP submission
  const handleOTPSubmit = async () => {
    if (otp.length < 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit verification code')
      return
    }

    setIsSubmitting(true)
    const cleanPhone = `+1${phone.replace(/\D/g, '')}`
    
    const { error } = await verifyOTP(cleanPhone, otp)
    
    if (error) {
      Alert.alert('Verification Failed', error)
      setIsSubmitting(false)
    }
    // If successful, auth state will update and screen will change
  }

  // Go back to phone step
  const goBackToPhone = () => {
    setStep('phone')
    setOtp('')
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#000000', '#1a1a1a', '#000000']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Clocked App</Text>
          <Text style={styles.tagline}>
            {step === 'phone' ? 'Is she going ?' : 'Enter verification code'}
          </Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {step === 'phone' ? (
            // Phone Input Step
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="(555) 123-4567"
                placeholderTextColor="#666"
                value={phone}
                onChangeText={(text) => setPhone(formatPhoneNumber(text))}
                keyboardType="phone-pad"
                maxLength={14}
                autoFocus
              />
              
              <TouchableOpacity
                style={[styles.button, isSubmitting && styles.buttonDisabled]}
                onPress={handlePhoneSubmit}
                disabled={isSubmitting || phone.replace(/\D/g, '').length < 10}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send Code</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            // OTP Input Step
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Verification Code</Text>
              <Text style={styles.sublabel}>
                Sent to {phone}
              </Text>
              
              <TextInput
                style={styles.input}
                placeholder="123456"
                placeholderTextColor="#666"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
              
              <TouchableOpacity
                style={[styles.button, isSubmitting && styles.buttonDisabled]}
                onPress={handleOTPSubmit}
                disabled={isSubmitting || otp.length < 6}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify & Continue</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={goBackToPhone}
                disabled={isSubmitting}
              >
                <Text style={styles.backButtonText}>← Change Phone Number</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.disclaimer}>
            By continuing, you agree to our{'\n'}
            <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  logo: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#ff6b6b',
    letterSpacing: -2,
    textShadowColor: 'rgba(255, 107, 107, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  tagline: {
    fontSize: 18,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  content: {
    flex: 2,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  inputContainer: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  sublabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    fontSize: 18,
    color: '#fff',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
    letterSpacing: 1,
  },
  button: {
    backgroundColor: '#ff6b6b',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#666',
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  backButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#999',
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },
  disclaimer: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: '#ff6b6b',
    textDecorationLine: 'underline',
  },
})