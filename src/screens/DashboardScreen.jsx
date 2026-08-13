import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { medicionesService } from '../services/medicionesService';
import Navbar from '../components/Navbar';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rawMediciones, setRawMediciones] = useState([]);
  
  // Vista de la gráfica: 'tension' | 'pulso' | 'glicemia_peso' | 'oxigeno'
  const [selectedMetricGroup, setSelectedMetricGroup] = useState('tension');

  const [maxRecord, setMaxRecord] = useState(null);
  const [minRecord, setMinRecord] = useState(null);
  const [edemasSummary, setEdemasSummary] = useState([]);

  const fetchDashboardData = async () => {
    try {
      const data = await medicionesService.obtenerMediciones();
      setRawMediciones(data);

      if (data && data.length > 0) {
        // 1. Obtener picos de tensión (Sistólica máxima)
        const getSystolicMax = (item) => {
          const izq = item.brazo_izquierdo_tension
            ? parseInt(item.brazo_izquierdo_tension.split('/')[0], 10)
            : 0;
          const der = item.brazo_derecho_tension
            ? parseInt(item.brazo_derecho_tension.split('/')[0], 10)
            : 0;
          return Math.max(izq || 0, der || 0);
        };

        const validos = data.filter((item) => getSystolicMax(item) > 0);

        if (validos.length > 0) {
          let maxItem = validos[0];
          let minItem = validos[0];

          validos.forEach((item) => {
            const currentVal = getSystolicMax(item);
            if (currentVal > getSystolicMax(maxItem)) maxItem = item;
            if (currentVal < getSystolicMax(minItem)) minItem = item;
          });

          setMaxRecord(maxItem);
          setMinRecord(minItem);
        }

        // 2. Filtrar días y turnos con presencia de edemas (diferentes de 'No' o vacíos)
        const edemasRegistrados = data.filter(
          (item) => item.edema && item.edema.toString().trim().toLowerCase() !== 'no'
        );

        // Ordenar edemas más recientes primero
        setEdemasSummary(
          edemasRegistrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        );
      }
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '--';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  };

  // Preparar dataset para la gráfica (últimos 7 registros cronológicos)
  const chartDataSource = [...rawMediciones]
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .slice(-7);

  const labels = chartDataSource.map((item) => {
    const day = new Date(item.fecha).getDate();
    return `${day} (${item.horario === 'Diurno' ? 'D' : 'N'})`;
  });

  // Generación dinámica de datos para la gráfica según la pestaña activa
  const buildChartData = () => {
    if (chartDataSource.length === 0) {
      return { labels: ['Sin datos'], datasets: [{ data: [0] }] };
    }

    switch (selectedMetricGroup) {
      case 'tension': {
        const izqSist = chartDataSource.map((i) =>
          i.brazo_izquierdo_tension ? parseInt(i.brazo_izquierdo_tension.split('/')[0], 10) || 0 : 0
        );
        const derSist = chartDataSource.map((i) =>
          i.brazo_derecho_tension ? parseInt(i.brazo_derecho_tension.split('/')[0], 10) || 0 : 0
        );
        return {
          labels,
          datasets: [
            { data: izqSist, color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})` }, // Azul - Tensión Izq
            { data: derSist, color: (opacity = 1) => `rgba(217, 119, 6, ${opacity})` }, // Naranja - Tensión Der
          ],
          legend: ['Tensión Izq', 'Tensión Der'],
        };
      }

      case 'pulso': {
        const pulsoIzq = chartDataSource.map((i) => i.brazo_izquierdo_pulso || 0);
        const pulsoDer = chartDataSource.map((i) => i.brazo_derecho_pulso || 0);
        return {
          labels,
          datasets: [
            { data: pulsoIzq, color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})` }, // Verde - Pulso Izq
            { data: pulsoDer, color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})` }, // Púrpura - Pulso Der
          ],
          legend: ['Pulso Izq', 'Pulso Der'],
        };
      }

      case 'glicemia_peso': {
        const glicemia = chartDataSource.map((i) => i.glicemia || 0);
        const peso = chartDataSource.map((i) => i.peso || 0);
        return {
          labels,
          datasets: [
            { data: glicemia, color: (opacity = 1) => `rgba(225, 29, 72, ${opacity})` }, // Rojo/Rosa - Glicemia
            { data: peso, color: (opacity = 1) => `rgba(14, 165, 233, ${opacity})` }, // Celeste - Peso
          ],
          legend: ['Glicemia (mg/dL)', 'Peso (kg)'],
        };
      }

      case 'oxigeno': {
        const spo2 = chartDataSource.map((i) => i.oximetro_oxigeno || 0);
        const pulsoOx = chartDataSource.map((i) => i.oximetro_pulso || 0);
        return {
          labels,
          datasets: [
            { data: spo2, color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})` }, // Índigo - SpO2
            { data: pulsoOx, color: (opacity = 1) => `rgba(234, 88, 12, ${opacity})` }, // Naranja - Pulso Ox.
          ],
          legend: ['Oxigeno (%)', 'Pulso Oxímetro'],
        };
      }

      default:
        return { labels: ['--'], datasets: [{ data: [0] }] };
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" backgroundColor="#f8fafc" />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View style={styles.header}>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Análisis completo de métricas clínicas</Text>
          </View>

          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          ) : (
            <>
              {/* REGISTROS DESTACADOS: PRESIÓN MÁXIMA Y MÍNIMA */}
              <Text style={styles.sectionTitle}>Picos de Tensión</Text>
              <View style={styles.recordsRow}>
                <View style={[styles.highlightCard, styles.cardHigh]}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="arrow-up-circle" size={22} color="#dc2626" />
                    <Text style={styles.highTag}>Máxima</Text>
                  </View>
                  {maxRecord ? (
                    <View style={styles.cardBody}>
                      <Text style={styles.metricValHigh}>
                        {maxRecord.brazo_izquierdo_tension || maxRecord.brazo_derecho_tension}
                      </Text>
                      <View style={styles.detailRow}>
                        <Ionicons
                          name={maxRecord.horario === 'Diurno' ? 'sunny' : 'moon'}
                          size={13}
                          color="#64748b"
                        />
                        <Text style={styles.detailText}>
                          {maxRecord.horario} • {formatearFecha(maxRecord.fecha)}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.noDataText}>Sin registros</Text>
                  )}
                </View>

                <View style={[styles.highlightCard, styles.cardLow]}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="arrow-down-circle" size={22} color="#16a34a" />
                    <Text style={styles.lowTag}>Mínima</Text>
                  </View>
                  {minRecord ? (
                    <View style={styles.cardBody}>
                      <Text style={styles.metricValLow}>
                        {minRecord.brazo_izquierdo_tension || minRecord.brazo_derecho_tension}
                      </Text>
                      <View style={styles.detailRow}>
                        <Ionicons
                          name={minRecord.horario === 'Diurno' ? 'sunny' : 'moon'}
                          size={13}
                          color="#64748b"
                        />
                        <Text style={styles.detailText}>
                          {minRecord.horario} • {formatearFecha(minRecord.fecha)}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.noDataText}>Sin registros</Text>
                  )}
                </View>
              </View>

              {/* SECCIÓN DE EDEMAS */}
              <View style={styles.edemaSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Registro de Edemas</Text>
                  <View style={styles.badgeCount}>
                    <Text style={styles.badgeCountText}>{edemasSummary.length} detectados</Text>
                  </View>
                </View>

                {edemasSummary.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.edemasScroll}
                  >
                    {edemasSummary.map((item, index) => (
                      <View key={index} style={styles.edemaCard}>
                        <View style={styles.edemaCardHeader}>
                          <Ionicons
                            name={item.horario === 'Diurno' ? 'sunny' : 'moon'}
                            size={16}
                            color={item.horario === 'Diurno' ? '#f59e0b' : '#6366f1'}
                          />
                          <Text style={styles.edemaTurnoText}>{item.horario}</Text>
                        </View>
                        <Text style={styles.edemaFechaText}>{formatearFecha(item.fecha)}</Text>
                        <View style={styles.edemaValueContainer}>
                          <Text style={styles.edemaLabel}>Grado / Detalle:</Text>
                          <Text style={styles.edemaValueText}>{item.edema}</Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.emptyEdemaBox}>
                    <Ionicons name="checkmark-circle-outline" size={24} color="#16a34a" />
                    <Text style={styles.emptyEdemaText}>
                      No se han registrado presencia de edemas en el historial.
                    </Text>
                  </View>
                )}
              </View>

              {/* SECCIÓN DE GRÁFICO COMPARATIVO COMPLETO */}
              <View style={styles.chartSection}>
                <Text style={styles.sectionTitle}>Gráfico Comparativo por Métrica</Text>

                {/* SELECTOR DESLIZANTE DE MÉTRICAS */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tabsScroll}
                >
                  <TouchableOpacity
                    style={[styles.tabPill, selectedMetricGroup === 'tension' && styles.tabPillActive]}
                    onPress={() => setSelectedMetricGroup('tension')}
                  >
                    <Ionicons
                      name="heart"
                      size={14}
                      color={selectedMetricGroup === 'tension' ? '#ffffff' : '#64748b'}
                    />
                    <Text style={[styles.tabPillText, selectedMetricGroup === 'tension' && styles.tabPillTextActive]}>
                      Tensión Brazo (I/D)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.tabPill, selectedMetricGroup === 'pulso' && styles.tabPillActive]}
                    onPress={() => setSelectedMetricGroup('pulso')}
                  >
                    <Ionicons
                      name="pulse"
                      size={14}
                      color={selectedMetricGroup === 'pulso' ? '#ffffff' : '#64748b'}
                    />
                    <Text style={[styles.tabPillText, selectedMetricGroup === 'pulso' && styles.tabPillTextActive]}>
                      Pulso Brazo (I/D)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.tabPill, selectedMetricGroup === 'glicemia_peso' && styles.tabPillActive]}
                    onPress={() => setSelectedMetricGroup('glicemia_peso')}
                  >
                    <Ionicons
                      name="water"
                      size={14}
                      color={selectedMetricGroup === 'glicemia_peso' ? '#ffffff' : '#64748b'}
                    />
                    <Text style={[styles.tabPillText, selectedMetricGroup === 'glicemia_peso' && styles.tabPillTextActive]}>
                      Glicemia y Peso
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.tabPill, selectedMetricGroup === 'oxigeno' && styles.tabPillActive]}
                    onPress={() => setSelectedMetricGroup('oxigeno')}
                  >
                    <Ionicons
                      name="fitness"
                      size={14}
                      color={selectedMetricGroup === 'oxigeno' ? '#ffffff' : '#64748b'}
                    />
                    <Text style={[styles.tabPillText, selectedMetricGroup === 'oxigeno' && styles.tabPillTextActive]}>
                      Oxigeno y Pulso Ox.
                    </Text>
                  </TouchableOpacity>
                </ScrollView>

                {/* CONTENEDOR DE GRÁFICA */}
                <View style={styles.chartCard}>
                  {chartDataSource.length > 0 ? (
                    <LineChart
                      data={buildChartData()}
                      width={screenWidth - 56}
                      height={230}
                      chartConfig={{
                        backgroundColor: '#ffffff',
                        backgroundGradientFrom: '#ffffff',
                        backgroundGradientTo: '#ffffff',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(15, 23, 42, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                        style: { borderRadius: 16 },
                        propsForDots: {
                          r: '4',
                          strokeWidth: '2',
                          stroke: '#ffffff',
                        },
                      }}
                      bezier
                      style={styles.chartStyle}
                    />
                  ) : (
                    <View style={styles.emptyChart}>
                      <Ionicons name="stats-chart-outline" size={40} color="#cbd5e1" />
                      <Text style={styles.emptyChartText}>No hay datos suficientes</Text>
                    </View>
                  )}
                </View>
              </View>
            </>
          )}
        </ScrollView>

        <Navbar currentRoute="Dashboard" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  header: {
    marginBottom: 16,
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 10,
  },
  recordsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  highlightCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  cardHigh: {
    borderTopWidth: 4,
    borderTopColor: '#ef4444',
  },
  cardLow: {
    borderTopWidth: 4,
    borderTopColor: '#22c55e',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  highTag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },
  lowTag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  cardBody: {
    gap: 2,
  },
  metricValHigh: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#991b1b',
  },
  metricValLow: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#166534',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  detailText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  noDataText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },

  /* ESTILOS DE EDEMAS */
  edemaSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeCount: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
  },
  edemasScroll: {
    gap: 10,
  },
  edemaCard: {
    backgroundColor: '#ffffff',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    width: 140,
  },
  edemaCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  edemaTurnoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  edemaFechaText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  edemaValueContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#fee2e2',
    paddingTop: 4,
  },
  edemaLabel: {
    fontSize: 10,
    color: '#991b1b',
  },
  edemaValueText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  emptyEdemaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
  },
  emptyEdemaText: {
    fontSize: 12,
    color: '#166534',
    flex: 1,
  },

  /* ESTILOS DE GRÁFICA */
  chartSection: {
    marginTop: 4,
  },
  tabsScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabPillActive: {
    backgroundColor: '#2563eb',
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  tabPillTextActive: {
    color: '#ffffff',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    elevation: 2,
  },
  chartStyle: {
    marginVertical: 4,
    borderRadius: 12,
  },
  emptyChart: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChartText: {
    marginTop: 8,
    fontSize: 13,
    color: '#94a3b8',
  },
});