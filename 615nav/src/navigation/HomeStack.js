import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Colors } from '../theme/colors';

import HomeScreen from '../screens/home/HomeScreen';
import CreatePostScreen from '../screens/home/CreatePostScreen';
import CommentsScreen from '../screens/home/CommentsScreen';

const Stack = createStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background, shadowColor: 'transparent' },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '700' },
        cardStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen
        name="Comments"
        component={CommentsScreen}
        options={{ headerShown: false, presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
