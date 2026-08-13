# 🩺 mamiApp

**mamiApp** es una aplicación móvil desarrollada con **React Native** y **Expo**, diseñada para el registro, control y seguimiento diario de métricas de salud (tensión arterial, pulso, glicemia, peso, oximetría y evaluación de edema) organizadas por turnos (*Diurno* y *Nocturno*). Los datos se almacenan de forma segura en **Supabase**.

---

## 🎨 Icono de la Aplicación

<div align="center">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="120" height="120">
    <rect width="512" height="512" rx="112" fill="#2563eb" />
    <path fill="#ffffff" d="M256 427.5c-8.2 0-16.1-3.3-22.1-9.2L101.4 285.8c-37.1-37.1-37.1-97.5 0-134.6 36.3-36.3 95.3-37.1 132.6-1.8l22 20.8 22-20.8c37.3-35.3 96.3-34.5 132.6 1.8 37.1 37.1 37.1 97.5 0 134.6L278.1 418.3c-6 5.9-13.9 9.2-22.1 9.2z" />
  </svg>
</div>

---

## ✨ Características Principales

- ☀️ **Registro Diurno y Nocturno:** Clasificación clara para las tomas matutinas y nocturnas.
- 📊 **Captura Completa de Datos de Salud:**
  - Tensión y pulso en brazo izquierdo y brazo derecho.
  - Medición de glicemia (mg/dL) y peso (kg).
  - Oximetría (SpO2%) y pulso de oxímetro.
  - Nivel de edema (*No*, *Poco*, *Sí*).
- 🔒 **Validación Estricta:** Impedimento de envío con campos vacíos para garantizar la integridad de los registros.
- 📜 **Historial de Mediciones:** Visualización y seguimiento del registro histórico.
- 📱 **Interfaz Adaptativa:** Compatible con iOS y Android con soporte para áreas seguras (`react-native-safe-area-context`).

---

## 🛠️ Tecnologías Utilizadas

- **Framework:** [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/)
- **Base de Datos / Backend:** [Supabase](https://supabase.com/)
- **Iconos:** [@expo/vector-icons](https://icons.expo.fyi/)
- **Compilación APK:** [EAS Build (Expo Application Services)](https://docs.expo.dev/build/introduction/)

---

## 🚀 Requisitos Previos

Asegúrate de contar con lo siguiente en tu entorno de desarrollo:

- [Node.js](https://nodejs.org/) (versión LTS recomendada)
- [npm](https://www.npmjs.com/) o [yarn](https://yarnpkg.com/)
- CLI de Expo: `npm install -g expo-cli`
- CLI de EAS (para compilar APKs): `npm install -g eas-cli`
- Cuenta en **Supabase** activa.

---

## ⚙️ Configuración del Proyecto

### 1. Clonar el repositorio
```bash
git clone [https://github.com/NETSOLCA/mamiapp.git](https://github.com/NETSOLCA/mamiapp.git)
cd mamiapp