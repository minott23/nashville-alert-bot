import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AppProvider } from './src/context/AppContext';
import MainNavigator from './src/navigation/MainNavigator';
import AuthScreen from './src/screens/auth/AuthScreen';
import { Colors } from './src/theme/colors';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingBadge}>
          <ActivityIndicator color={Colors.cream} size="large" />
        </View>
      </View>
    );
  }

  return user ? <MainNavigator /> : <AuthScreen />;
}

const linking = {
  prefixes: ['615nav://'],
  config: {
    screens: {
      Home: 'home',
      Map: 'map',
      Places: 'places',
      Notifications: 'notifications',
      Profile: 'profile',
    },
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppProvider>
            <NavigationContainer linking={linking}>
              <StatusBar style="light" backgroundColor={Colors.background} />
              <AppContent />
            </NavigationContainer>
          </AppProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  loadingScreen: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
