import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { medicionesService } from '../services/medicionesService';
import Navbar from '../components/Navbar';

export default function RegisterScreen({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estado que mapea exactamente con la tabla public.mediciones
  const [formData, setFormData] = useState({
    horario: 'Diurno', // 'Diurno' | 'Nocturno'
    brazo_izquierdo_tension: '',
    brazo_izquierdo_pulso: '',
    brazo_derecho_tension: '',
    brazo_derecho_pulso: '',
    glicemia: '',
    peso: '',
    oximetro_oxigeno: '',
    oximetro_pulso: '',
    edema: 'No', // 'Si' | 'No' | 'Poco'
  });

  // Abrir modal según la Card seleccionada
  const handleOpenModal = (selectedHorario) => {
    setFormData({
      horario: selectedHorario,
      brazo_izquierdo_tension: '',
      brazo_izquierdo_pulso: '',
      brazo_derecho_tension: '',
      brazo_derecho_pulso: '',
      glicemia: '',
      peso: '',
      oximetro_oxigeno: '',
      oximetro_pulso: '',
      edema: 'No',
    });
    setModalVisible(true);
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const isFormValid = Object.values(formData).every((value) => String(value).trim() !== '');

  // Enviar a Supabase
  const handleSubmit = async () => {
    if(!isFormValid) return;

    try {
      setLoading(true);

      // Mapeo y formateo de los datos antes de insertar
      const registro = {
        horario: formData.horario,
        brazo_izquierdo_tension: formData.brazo_izquierdo_tension.trim() || null,
        brazo_izquierdo_pulso: formData.brazo_izquierdo_pulso
          ? parseInt(formData.brazo_izquierdo_pulso, 10)
          : null,
        brazo_derecho_tension: formData.brazo_derecho_tension.trim() || null,
        brazo_derecho_pulso: formData.brazo_derecho_pulso
          ? parseInt(formData.brazo_derecho_pulso, 10)
          : null,
        glicemia: formData.glicemia
          ? parseFloat(formData.glicemia.replace(',', '.'))
          : null,
        peso: formData.peso
          ? parseFloat(formData.peso.replace(',', '.'))
          : null,
        oximetro_oxigeno: formData.oximetro_oxigeno
          ? parseInt(formData.oximetro_oxigeno, 10)
          : null,
        oximetro_pulso: formData.oximetro_pulso
          ? parseInt(formData.oximetro_pulso, 10)
          : null,
        edema: formData.edema,
      };

      await medicionesService.crearMedicion(registro);

      Alert.alert(
        'Éxito',
        `Medición del turno ${formData.horario} guardada correctamente`
      );
      setModalVisible(false);
      navigation.navigate('Historial');
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo guardar la medición');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" backgroundColor="#f8fafc" />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Registrar Medición</Text>
          <Text style={styles.subtitle}>Selecciona el horario correspondiente:</Text>

          {/* CARDS DIURNO Y NOCTURNO */}
          <View style={styles.cardsContainer}>
            <TouchableOpacity
              style={[styles.card, styles.cardDiurno]}
              activeOpacity={0.8}
              onPress={() => handleOpenModal('Diurno')}
            >
              <View style={styles.iconBadge}>
                <Ionicons name="sunny" size={32} color="#d97706" />
              </View>
              <Text style={styles.cardTitle}>Diurno</Text>
              <Text style={styles.cardSubtitle}>Toma matutina / día</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.card, styles.cardNocturno]}
              activeOpacity={0.8}
              onPress={() => handleOpenModal('Nocturno')}
            >
              <View style={styles.iconBadge}>
                <Ionicons name="moon" size={32} color="#4f46e5" />
              </View>
              <Text style={styles.cardTitle}>Nocturno</Text>
              <Text style={styles.cardSubtitle}>Toma antes de dormir / noche</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* MODAL CON FORMULARIO COMPLETO */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Header Modal */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Turno {formData.horario}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close-circle" size={28} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* SECCIÓN: BRAZO IZQUIERDO */}
                <Text style={styles.sectionHeader}>Brazo Izquierdo</Text>
                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Tensión (120/80)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="120/80"
                      maxLength={7}
                      value={formData.brazo_izquierdo_tension}
                      onChangeText={(val) =>
                        handleChange('brazo_izquierdo_tension', val)
                      }
                    />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Pulso (BPM)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="75"
                      keyboardType="numeric"
                      value={formData.brazo_izquierdo_pulso}
                      onChangeText={(val) =>
                        handleChange('brazo_izquierdo_pulso', val)
                      }
                    />
                  </View>
                </View>

                {/* SECCIÓN: BRAZO DERECHO */}
                <Text style={styles.sectionHeader}>Brazo Derecho</Text>
                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Tensión (120/80)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="120/80"
                      maxLength={7}
                      value={formData.brazo_derecho_tension}
                      onChangeText={(val) =>
                        handleChange('brazo_derecho_tension', val)
                      }
                    />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Pulso (BPM)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="75"
                      keyboardType="numeric"
                      value={formData.brazo_derecho_pulso}
                      onChangeText={(val) =>
                        handleChange('brazo_derecho_pulso', val)
                      }
                    />
                  </View>
                </View>

                {/* SECCIÓN: GLICEMIA Y PESO */}
                <Text style={styles.sectionHeader}>Glicemia y Peso</Text>
                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Glicemia (mg/dL)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="95.5"
                      keyboardType="decimal-pad"
                      value={formData.glicemia}
                      onChangeText={(val) => handleChange('glicemia', val)}
                    />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Peso (kg)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="70.2"
                      keyboardType="decimal-pad"
                      value={formData.peso}
                      onChangeText={(val) => handleChange('peso', val)}
                    />
                  </View>
                </View>

                {/* SECCIÓN: OXÍMETRO */}
                <Text style={styles.sectionHeader}>Oxímetro</Text>
                <View style={styles.row}>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Oxígeno (% SpO2)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="98"
                      keyboardType="numeric"
                      value={formData.oximetro_oxigeno}
                      onChangeText={(val) =>
                        handleChange('oximetro_oxigeno', val)
                      }
                    />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Pulso Oxímetro</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="72"
                      keyboardType="numeric"
                      value={formData.oximetro_pulso}
                      onChangeText={(val) =>
                        handleChange('oximetro_pulso', val)
                      }
                    />
                  </View>
                </View>

                {/* SECCIÓN: EDEMA (ENUM) */}
                <Text style={styles.sectionHeader}>Edema</Text>
                <View style={styles.enumRow}>
                  {['No', 'Poco', 'Si'].map((option) => {
                    const selected = formData.edema === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.enumButton,
                          selected && styles.enumButtonActive,
                        ]}
                        onPress={() => handleChange('edema', option)}
                      >
                        <Text
                          style={[
                            styles.enumText,
                            selected && styles.enumTextActive,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* ACCIONES */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                     (!isFormValid || loading) && styles.buttonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={!isFormValid || loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.saveButtonText}>Guardar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Navbar currentRoute="Register" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  cardsContainer: { gap: 16 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 3,
  },
  cardDiurno: { borderLeftWidth: 6, borderLeftColor: '#f59e0b' },
  cardNocturno: { borderLeftWidth: 6, borderLeftColor: '#6366f1' },
  iconBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  cardSubtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },

  /* STYLES MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  flex1: { flex: 1 },
  label: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 4 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#0f172a',
  },
  enumRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  enumButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  enumButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  enumText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  enumTextActive: { color: '#ffffff' },

  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 16, marginBottom: 20 },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: { color: '#64748b', fontWeight: '600' },
  saveButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: { color: '#ffffff', fontWeight: '600' },
  buttonDisabled: { backgroundColor: '#93c5fd' },
});