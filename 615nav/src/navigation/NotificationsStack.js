import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Colors } from '../theme/colors';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

const Stack = createStackNavigator();

export default function NotificationsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: Colors.background } }}>
      <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}
