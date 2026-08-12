import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import DashboardScreen from '../screens/DashboardScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HistorialScreen from '../screens/HistorialScreen';

import Navbar from '../components/Navbar';

const Stack = createNativeStackNavigator();

export default function AppNavigator(){
    return (
        <SafeAreaProvider>
      <NavigationContainer>
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
          <View style={styles.content}>
            <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              {/* <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="Historial" component={HistorialScreen} /> */}
            </Stack.Navigator>
          </View>

          {/* Tu Navbar personalizada fija en el footer */}
          <Navbar />
        </SafeAreaView>
      </NavigationContainer>
    </SafeAreaProvider>
    )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flex: 1 },
});