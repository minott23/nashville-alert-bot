import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    if (mode === 'signup' && !username.trim()) {
      Alert.alert('Missing Username', 'Please choose a username.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, username.trim());
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>615</Text>
              <Text style={styles.logoSub}>NAV</Text>
            </View>
            <Text style={styles.tagline}>Nashville's Real-Time Feed</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>
              {mode === 'signin' ? 'Welcome back' : 'Create account'}
            </Text>

            {mode === 'signup' && (
              <View style={styles.inputGroup}>
                <Ionicons name="person-outline" size={18} color={Colors.textDim} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor={Colors.textDim}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Ionicons name="mail-outline" size={18} color={Colors.textDim} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.textDim}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textDim} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Password"
                placeholderTextColor={Colors.textDim}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeButton}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={Colors.textDim}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={Colors.cream} />
                : <Text style={styles.submitText}>
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  </Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.switchMode} onPress={() => setMode(m => m === 'signin' ? 'signup' : 'signin')}>
              <Text style={styles.switchText}>
                {mode === 'signin'
                  ? "Don't have an account? "
                  : 'Already have an account? '}
                <Text style={styles.switchLink}>
                  {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl * 1.5,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.primaryRed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logoText: {
    color: Colors.cream,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 30,
  },
  logoSub: {
    color: Colors.cream,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
  },
  tagline: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.sm,
    letterSpacing: 0.5,
  },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.xl,
  },
  formTitle: {
    color: Colors.text,
    fontSize: Typography.fontSizes.xl,
    fontWeight: '700',
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.borderDim,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: Typography.fontSizes.md,
    paddingVertical: 14,
  },
  passwordInput: { paddingRight: 36 },
  eyeButton: { padding: Spacing.sm },
  submitBtn: {
    backgroundColor: Colors.primaryRed,
    borderRadius: Radii.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: {
    color: Colors.cream,
    fontSize: Typography.fontSizes.md,
    fontWeight: '700',
  },
  switchMode: { alignItems: 'center', marginTop: Spacing.lg },
  switchText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizes.sm,
  },
  switchLink: {
    color: Colors.primaryRed,
    fontWeight: '600',
  },
});
