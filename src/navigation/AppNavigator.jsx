import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DashboardScreen from '../screens/DashboardScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HistorialScreen from '../screens/HistorialScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Dashboard" screenOptions={{ headerShown: false }}>
        <Stack.Screen 
          name="Dashboard"
          component={DashboardScreen} 
        />
        <Stack.Screen 
          name="Register"
          component={RegisterScreen} 
        />
        <Stack.Screen 
          name="Historial" 
          component={HistorialScreen} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}