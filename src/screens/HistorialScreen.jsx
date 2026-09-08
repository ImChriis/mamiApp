import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { medicionesService } from '../services/medicionesService';
import Navbar from '../components/Navbar';

export default function HistorialScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [diasAgrupados, setDiasAgrupados] = useState([]);

  // Estados para el Modal de Filtro de PDF
  const [modalVisible, setModalVisible] = useState(false);
  const [fechaDesde, setFechaDesde] = useState(new Date());
  const [fechaHasta, setFechaHasta] = useState(new Date());
  const [showPickerDesde, setShowPickerDesde] = useState(false);
  const [showPickerHasta, setShowPickerHasta] = useState(false);

  // Cargar datos cada vez que la pantalla enfoca
  const fetchHistorial = async () => {
    try {
      const data = await medicionesService.obtenerMediciones();

      // Agrupar mediciones por fecha (YYYY-MM-DD)
      const grupos = data.reduce((acc, item) => {
        const fechaKey = new Date(item.fecha).toISOString().split('T')[0];

        if (!acc[fechaKey]) {
          acc[fechaKey] = {
            fecha: fechaKey,
            Diurno: null,
            Nocturno: null,
          };
        }

        if (item.horario === 'Diurno') {
          acc[fechaKey].Diurno = item;
        } else if (item.horario === 'Nocturno') {
          acc[fechaKey].Nocturno = item;
        }

        return acc;
      }, {});

      // Convertir objeto a Array ordenado por fecha descendente
      const listaOrdenada = Object.values(grupos).sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
      );

      setDiasAgrupados(listaOrdenada);
    } catch (error) {
      console.error('Error al cargar historial:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistorial();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHistorial();
  };

  const formatearFechaHeader = (fechaStr) => {
    const [year, month, day] = fechaStr.split('-');
    const fecha = new Date(year, month - 1, day);
    return fecha.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatearFechaDisplay = (date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Abrir Modal de PDF
  const handleOpenPdfModal = () => {
    if (diasAgrupados.length === 0) {
      Alert.alert('Aviso', 'No hay registros para exportar en PDF.');
      return;
    }

    // Inicializar fechas por defecto (por ejemplo: hace 30 días hasta hoy)
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);

    setFechaDesde(hace30Dias);
    setFechaHasta(hoy);
    setModalVisible(true);
  };

  // Generador de reporte PDF con rango filtrado
  const handleExportPDF = async () => {
    // Ajustar 'desde' al inicio del día y 'hasta' al final del día
    const inicio = new Date(fechaDesde);
    inicio.setHours(0, 0, 0, 0);

    const fin = new Date(fechaHasta);
    fin.setHours(23, 59, 59, 999);

    if (inicio > fin) {
      Alert.alert('Error', 'La fecha "Desde" no puede ser posterior a "Hasta".');
      return;
    }

    // Filtrar los días dentro del rango
    const diasFiltrados = diasAgrupados.filter((item) => {
      const [year, month, day] = item.fecha.split('-');
      const fechaItem = new Date(year, month - 1, day);
      return fechaItem >= inicio && fechaItem <= fin;
    });

    if (diasFiltrados.length === 0) {
      Alert.alert('Aviso', 'No hay registros en el rango de fechas seleccionado.');
      return;
    }

    setModalVisible(false);

    try {
      setDownloadingPdf(true);

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Reporte de Mediciones Médicas</title>
            <style>
              body {
                font-family: Arial, Helvetica, sans-serif;
                padding: 20px;
                color: #1e293b;
                background-color: #ffffff;
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #2563eb;
                padding-bottom: 12px;
                margin-bottom: 24px;
              }
              .title {
                font-size: 24px;
                font-weight: bold;
                color: #0f172a;
                margin: 0;
              }
              .subtitle {
                font-size: 13px;
                color: #64748b;
                margin-top: 4px;
              }
              .day-block {
                margin-bottom: 24px;
                page-break-inside: avoid;
              }
              .day-title {
                font-size: 15px;
                font-weight: bold;
                background-color: #eff6ff;
                color: #1e40af;
                padding: 6px 12px;
                border-radius: 4px;
                margin-bottom: 8px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 4px;
                font-size: 12px;
              }
              th {
                background-color: #f1f5f9;
                color: #334155;
                font-weight: bold;
                text-align: center;
                padding: 8px 6px;
                border: 1px solid #cbd5e1;
              }
              td {
                padding: 8px 6px;
                text-align: center;
                border: 1px solid #e2e8f0;
              }
              .diurno-tag { color: #b45309; font-weight: bold; }
              .nocturno-tag { color: #4338ca; font-weight: bold; }
              .pending { color: #94a3b8; font-style: italic; }
              .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 10px;
                color: #94a3b8;
                border-top: 1px solid #e2e8f0;
                padding-top: 10px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="title">Historial de Mediciones Médicas</h1>
              <p class="subtitle">Período: ${formatearFechaDisplay(fechaDesde)} al ${formatearFechaDisplay(fechaHasta)}</p>
              <p class="subtitle">Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>

            ${diasFiltrados
              .map((dia) => {
                const renderRow = (turno, datos) => {
                  if (!datos) {
                    return `
                      <tr>
                        <td class="${turno === 'Diurno' ? 'diurno-tag' : 'nocturno-tag'}">${turno}</td>
                        <td colspan="6" class="pending">Sin registro cargado</td>
                      </tr>
                    `;
                  }
                  return `
                    <tr>
                      <td class="${turno === 'Diurno' ? 'diurno-tag' : 'nocturno-tag'}">${turno}</td>
                      <td>${datos.brazo_izquierdo_tension || '--'} / ${datos.brazo_izquierdo_pulso ? datos.brazo_izquierdo_pulso + ' BPM' : '--'}</td>
                      <td>${datos.brazo_derecho_tension || '--'} / ${datos.brazo_derecho_pulso ? datos.brazo_derecho_pulso + ' BPM' : '--'}</td>
                      <td>${datos.glicemia ? datos.glicemia + ' mg/dL' : '--'}</td>
                      <td>${datos.oximetro_oxigeno ? datos.oximetro_oxigeno + '%' : '--'}</td>
                      <td>${datos.oximetro_pulso ? datos.oximetro_pulso + ' BPM' : '--'}</td>
                      <td>${datos.edema || 'No'}</td>
                    </tr>
                  `;
                };

                return `
                  <div class="day-block">
                    <div class="day-title">Fecha: ${formatearFechaHeader(dia.fecha)}</div>
                    <table>
                      <thead>
                        <tr>
                          <th>Turno</th>
                          <th>Brazo Izq. (T/P)</th>
                          <th>Brazo Der. (T/P)</th>
                          <th>Glicemia</th>
                          <th>Oxígeno</th>
                          <th>Pulso Ox.</th>
                          <th>Edema</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${renderRow('Diurno', dia.Diurno)}
                        ${renderRow('Nocturno', dia.Nocturno)}
                      </tbody>
                    </table>
                  </div>
                `;
              })
              .join('')}

            <div class="footer">
              Reporte de seguimiento diario de salud - Registro personal.
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: 'Descargar Historial de Mediciones',
        });
      } else {
        Alert.alert('Éxito', `PDF generado en: ${uri}`);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el archivo PDF');
      console.error(error);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const CardTurno = ({ tipo, datos }) => {
    const isDiurno = tipo === 'Diurno';
    const borderStyle = isDiurno ? styles.borderDiurno : styles.borderNocturno;
    const iconName = isDiurno ? 'sunny' : 'moon';
    const iconColor = isDiurno ? '#f59e0b' : '#6366f1';

    if (!datos) {
      return (
        <View style={[styles.card, styles.cardPendiente]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleGroup}>
              <Ionicons name={iconName} size={20} color="#94a3b8" />
              <Text style={styles.cardTitlePendiente}>{tipo}</Text>
            </View>
            <Text style={styles.badgePendiente}>Pendiente</Text>
          </View>
          <Text style={styles.textPendiente}>Sin registro cargado</Text>
        </View>
      );
    }

    return (
      <View style={[styles.card, borderStyle]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleGroup}>
            <Ionicons name={iconName} size={20} color={iconColor} />
            <Text style={styles.cardTitle}>{tipo}</Text>
          </View>
          {datos.edema && datos.edema !== 'No' && (
            <View style={styles.badgeEdema}>
              <Text style={styles.badgeEdemaText}>Edema: {datos.edema}</Text>
            </View>
          )}
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Brazo Izquierdo</Text>
            <Text style={styles.metricValue}>
              {datos.brazo_izquierdo_tension || '--/--'}
            </Text>
            <Text style={styles.subMetric}>
              {datos.brazo_izquierdo_pulso ? `${datos.brazo_izquierdo_pulso} BPM` : 'P: --'}
            </Text>
          </View>

          <View style={styles.dividerVertical} />

          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Brazo Derecho</Text>
            <Text style={styles.metricValue}>
              {datos.brazo_derecho_tension || '--/--'}
            </Text>
            <Text style={styles.subMetric}>
              {datos.brazo_derecho_pulso ? `${datos.brazo_derecho_pulso} BPM` : 'P: --'}
            </Text>
          </View>
        </View>

        <View style={styles.secondaryRow}>
          <Text style={styles.secondaryItem}>
            <Text style={styles.boldText}>Glicemia: </Text>
            {datos.glicemia ? `${datos.glicemia} mg/dL` : '--'}
          </Text>
          <Text style={styles.secondaryItem}>
            <Text style={styles.boldText}>SpO2: </Text>
            {datos.oximetro_oxigeno ? `${datos.oximetro_oxigeno}%` : '--'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" backgroundColor="#f8fafc" />

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Historial</Text>
            <Text style={styles.subtitle}>Registro diario de mediciones</Text>
          </View>

          <TouchableOpacity
            style={styles.downloadButton}
            onPress={handleOpenPdfModal}
            disabled={downloadingPdf}
            activeOpacity={0.7}
          >
            {downloadingPdf ? (
              <ActivityIndicator size="small" color="#2563eb" />
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color="#2563eb" />
                <Text style={styles.downloadText}>PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <FlatList
            data={diasAgrupados}
            keyExtractor={(item) => item.fecha}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="clipboard-outline" size={48} color="#94a3b8" />
                <Text style={styles.emptyText}>No hay mediciones registradas aún.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.dayGroup}>
                <View style={styles.dayHeader}>
                  <Ionicons name="calendar-outline" size={18} color="#2563eb" />
                  <Text style={styles.dayTitle}>{formatearFechaHeader(item.fecha)}</Text>
                </View>

                <View style={styles.cardsRow}>
                  <CardTurno tipo="Diurno" datos={item.Diurno} />
                  <CardTurno tipo="Nocturno" datos={item.Nocturno} />
                </View>
              </View>
            )}
          />
        )}

        {/* Modal de Exportación PDF con Selección de Rango */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Ionicons name="document-text-outline" size={24} color="#2563eb" />
                <Text style={styles.modalTitle}>Exportar PDF</Text>
              </View>
              <Text style={styles.modalSubtitle}>
                Selecciona el rango de fechas para generar el reporte.
              </Text>

              {/* Fecha Desde */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Desde:</Text>
                <TouchableOpacity
                  style={styles.dateSelector}
                  onPress={() => setShowPickerDesde(true)}
                >
                  <Ionicons name="calendar-outline" size={18} color="#64748b" />
                  <Text style={styles.dateText}>
                    {formatearFechaDisplay(fechaDesde)}
                  </Text>
                </TouchableOpacity>
              </View>

              {showPickerDesde && (
                <DateTimePicker
                  value={fechaDesde}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(event, date) => {
                    setShowPickerDesde(Platform.OS === 'ios');
                    if (date) setFechaDesde(date);
                  }}
                />
              )}

              {/* Fecha Hasta */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Hasta:</Text>
                <TouchableOpacity
                  style={styles.dateSelector}
                  onPress={() => setShowPickerHasta(true)}
                >
                  <Ionicons name="calendar-outline" size={18} color="#64748b" />
                  <Text style={styles.dateText}>
                    {formatearFechaDisplay(fechaHasta)}
                  </Text>
                </TouchableOpacity>
              </View>

              {showPickerHasta && (
                <DateTimePicker
                  value={fechaHasta}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(event, date) => {
                    setShowPickerHasta(Platform.OS === 'ios');
                    if (date) setFechaHasta(date);
                  }}
                />
              )}

              {/* Botones de Acción */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleExportPDF}
                >
                  <Ionicons name="download-outline" size={18} color="#ffffff" />
                  <Text style={styles.confirmButtonText}>Generar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Navbar currentRoute="Historial" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  downloadText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  dayGroup: {
    marginTop: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    backgroundColor: '#eff6ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  dayTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e40af',
    textTransform: 'capitalize',
  },
  cardsRow: {
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  borderDiurno: {
    borderLeftWidth: 5,
    borderLeftColor: '#f59e0b',
  },
  borderNocturno: {
    borderLeftWidth: 5,
    borderLeftColor: '#6366f1',
  },
  cardPendiente: {
    backgroundColor: '#f8fafc',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  cardTitlePendiente: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
  },
  badgePendiente: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  textPendiente: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  badgeEdema: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeEdemaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subMetric: {
    fontSize: 11,
    color: '#475569',
    marginTop: 1,
  },
  dividerVertical: {
    width: 1,
    height: '80%',
    backgroundColor: '#cbd5e1',
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  secondaryItem: {
    fontSize: 12,
    color: '#475569',
  },
  boldText: {
    fontWeight: '600',
    color: '#1e293b',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748b',
  },
  // Estilos del Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  confirmButton: {
    backgroundColor: '#2563eb',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});