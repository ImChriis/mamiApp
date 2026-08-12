// src/components/Navbar.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function Navbar() {
  const navigation = useNavigation();
  const route = useRoute();

  const tabs = [
    { id: 'Dashboard', label: 'Métricas', icon: 'stats-chart' },
    { id: 'Register', label: 'Registrar', icon: 'add-circle' },
    { id: 'Historial', label: 'Historial', icon: 'time' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = route.name === tab.id;
        const iconName = isActive ? tab.icon : `${tab.icon}-outline`;
        const color = isActive ? '#2563eb' : '#64748b';

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(tab.id)}
          >
            <Ionicons name={iconName} size={24} color={color} />
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 8,
    paddingBottom: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 8,
  },
  tabButton: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  label: { fontSize: 12, fontWeight: '600', marginTop: 4 },
});