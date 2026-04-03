import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { getCurrentLocation } from '../services/locationService';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [location, setLocation] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState('Home');
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    loadLocation();
    const sub = AppState.addEventListener('change', nextState => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        loadLocation();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, []);

  async function loadLocation() {
    const loc = await getCurrentLocation();
    setLocation(loc);
  }

  return (
    <AppContext.Provider value={{
      location,
      refreshLocation: loadLocation,
      unreadCount,
      setUnreadCount,
      activeTab,
      setActiveTab,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
