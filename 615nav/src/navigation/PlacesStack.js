import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Colors } from '../theme/colors';
import PlacesScreen from '../screens/places/PlacesScreen';
import PlaceDetailScreen from '../screens/places/PlaceDetailScreen';

const Stack = createStackNavigator();

export default function PlacesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: Colors.background } }}>
      <Stack.Screen name="PlacesScreen" component={PlacesScreen} />
      <Stack.Screen name="PlaceDetail" component={PlaceDetailScreen} />
    </Stack.Navigator>
  );
}
