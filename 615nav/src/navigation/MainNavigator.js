import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useApp } from '../context/AppContext';

import HomeStack from './HomeStack';
import MapStack from './MapStack';
import PlacesStack from './PlacesStack';
import NotificationsStack from './NotificationsStack';
import ProfileStack from './ProfileStack';

const Tab = createBottomTabNavigator();

function BadgeDot({ count }) {
  if (!count) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

export default function MainNavigator() {
  const { unreadCount } = useApp();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Home: focused ? 'home' : 'home-outline',
            Map: focused ? 'map' : 'map-outline',
            Places: focused ? 'compass' : 'compass-outline',
            Notifications: focused ? 'notifications' : 'notifications-outline',
            Profile: focused ? 'person-circle' : 'person-circle-outline',
          };
          return (
            <View style={styles.iconContainer}>
              <Ionicons name={icons[route.name]} size={size} color={color} />
              {route.name === 'Notifications' && <BadgeDot count={unreadCount} />}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Map" component={MapStack} />
      <Tab.Screen name="Places" component={PlacesStack} />
      <Tab.Screen name="Notifications" component={NotificationsStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBackground,
    borderTopColor: Colors.borderDim,
    borderTopWidth: 1,
    paddingTop: 6,
    height: 84,
    paddingBottom: 20,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.primaryRed,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: Colors.cream,
    fontSize: 9,
    fontWeight: '700',
  },
});
