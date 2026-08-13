import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import Navbar from '../components/Navbar';

export default function HistorialScreen() {
    return (
        <View style={styles.container}>
            <Text>Bienvenido a la pantalla de Historial</Text>
            <Navbar currentRoute="Historial" />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    }
})