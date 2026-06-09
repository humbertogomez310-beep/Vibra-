# 🌌 VIBRA PRO - Documentación Completa

## Descripción General

VIBRA PRO es una aplicación de música inteligente construida con React + Vite + TypeScript. Utiliza un sistema de "moods" (estados de ánimo) para recomendar y reproducir música adaptada al estado emocional del usuario.

**Versión**: 1.0.0  
**Modo**: VIBRA PRO  
**Arquitectura**: INSTINTO → HBG CORE → VIBRA

---

## 🏗️ Estructura del Proyecto

```
src/
├── App.tsx                 # Componente principal de la aplicación
├── main.tsx               # Punto de entrada React
├── components/
│   ├── Player.tsx         # Reproductor de música (play, pause, next)
│   ├── ControlCenter.tsx  # Panel de control (volumen, autoplay, info)
│   ├── MoodPanel.tsx      # Selector de moods (chill, energy, sad, party)
│   └── PartyMode.tsx      # Modo fiesta con efectos visuales
├── core/
│   ├── vibraState.ts      # Estado global de la aplicación
│   ├── moodEngine.ts      # Motor de estados de ánimo
│   ├── playerEngine.ts    # Motor de reproducción de audio
│   ├── aiEngine.ts        # Motor de IA para recomendaciones
│   ├── autodj.ts          # Auto DJ para reproducción automática
│   ├── memoryEngine.ts    # Persistencia de datos en localStorage
│   └── hbgCore.ts         # Cerebro central del sistema
└── ui/
    ├── styles.css         # Estilos globales (oscuro futurista)
    └── theme.ts           # Definición del tema y colores
```

---

## 🎮 Componentes

### Player.tsx
- ▶️ Botón Play/Pause
- ⏭️ Botón Next
- 🎵 Información de la canción actual
- Barra de progreso

### MoodPanel.tsx
Selector de 4 moods disponibles:
- **🌙 Chill**: Relajante y tranquilo (BPM: 90)
- **⚡ Energy**: Energético y motivador (BPM: 140)
- **💔 Sad**: Melancólico y emotivo (BPM: 80)
- **🎉 Party**: Fiestas y celebraciones (BPM: 130)

### ControlCenter.tsx
- 🔊 Control de volumen (0-100%)
- 🤖 Activar/desactivar Auto Play
- ℹ️ Botón de información del modo

### PartyMode.tsx
- 🎉 Botón de activación del modo fiesta
- Efectos de partículas animadas
- Automáticamente sube volumen al máximo

---

## 🧠 Core Engines

### vibraState.ts
**Estado Global Centralizado**
```typescript
interface VibraState {
  currentMood: Mood;
  currentSong: Song | null;
  playbackState: PlaybackState;
  queue: Song[];
  history: Song[];
  volume: number;
  isAutoPlay: boolean;
}
```

**Función Principal**: Mantener un estado único y reactivo de toda la aplicación.

### moodEngine.ts
**Motor de Moods**
- Define 4 moods disponibles
- Cada mood tiene: nombre, emoji, descripción, color, tempo, intensidad
- Genera recomendaciones de playlists por mood

### playerEngine.ts
**Motor de Reproducción**
- Controla el elemento HTML Audio
- Métodos: play(), pause(), resume(), stop(), next(), previous()
- Control de volumen y búsqueda en la canción
- Sistema de eventos para notificaciones

### aiEngine.ts
**Motor de Inteligencia Artificial**
- Recomienda canciones según mood
- Genera playlists personalizadas
- Calcula compatibilidad de canciones
- Analiza patrones de usuario (preparado para INSTINTO)

### autodj.ts
**Auto DJ - Reproducción Automática**
- Gestiona una cola de reproducción
- Genera nuevas canciones automáticamente
- Cambio dinámico de moods
- Control de la secuencia: playNext(), playPrevious()

### memoryEngine.ts
**Motor de Memoria**
- Persiste datos en localStorage
- Guarda historial de canciones (últimas 100)
- Guarda favoritos
- Guarda preferencias del usuario
- Registra cambios de mood en el tiempo

### hbgCore.ts
**Cerebro Central del Sistema**
- Coordina todos los engines
- Interfaz unificada de control
- Gestiona el estado global
- Prepara la arquitectura para futuras integraciones:
  - INSTINTO → HBG CORE → VIBRA
- Soporta dos modos: VIBRA_FREE y VIBRA_PRO

---

## 🎨 Diseño y Estilos

### Paleta de Colores
- **Primario**: Azul (#5b7dff) - Interacciones principales
- **Secundario**: Morado (#b366ff) - Acentos y énfasis
- **Fondo**: Degradado oscuro (#030712 → #111827)
- **Texto**: Gris claro (#f3f4f6)

### Características de Diseño
- Modo oscuro futurista
- Gradientes dinámicos
- Efectos de brillo (glow)
- Animaciones suaves
- Diseño responsivo (mobile-first)
- Glassmorphism (efecto de vidrio esmerilado)

### Animaciones Principales
- `fadeInDown`: Aparición del encabezado
- `slideInUp`: Aparición de componentes
- `float`: Efecto de flotación de partículas
- `pulse`: Efecto pulsante en modo fiesta

---

## 🚀 Flujo de Uso

1. **Inicio**: El usuario ve la interfaz de VIBRA PRO
2. **Seleccionar Mood**: Elige su estado de ánimo actual
3. **Reproducción**: 
   - Presiona Play para reproducir recomendación
   - O activa Auto Play para reproducción automática
4. **Control**: Ajusta volumen, cambia de canción
5. **Fiesta**: Opcionalmente activa Modo Fiesta
6. **Persistencia**: El sistema recuerda preferencias

---

## 💾 Almacenamiento Local

### localStorage Keys
- `vibra_history`: Historial de canciones reproducidas
- `vibra_favorites`: Canciones favoritas
- `vibra_preferences`: Preferencias del usuario
- `vibra_mood_history`: Historial de cambios de mood

---

## 🔌 Arquitectura Preparada para Futuras Integraciones

### INSTINTO → HBG CORE → VIBRA

El sistema está diseñado para recibir entrada de un futuro módulo INSTINTO que proporcionaría:
- Análisis emocional en tiempo real
- Detección de contexto
- Preferencias dinámicas

HBG CORE actuaría como intermediario que procesa esta información y la envía a VIBRA.

### Planes Futuros
- **VIBRA FREE**: Versión gratuita con funcionalidades básicas
- **VIBRA PRO**: Versión premium con IA avanzada (actual)
- **Sistema de Pagos**: Integración preparada pero no implementada
- **Backend**: Infraestructura preparada para futura sincronización

---

## 🛠️ Configuración Técnica

### TypeScript
- Strict mode activado
- JSX mode: react-jsx
- Module resolution: node
- Paths: @/* → ./src/*

### Vite
- Hot Module Replacement (HMR) activado
- Optimización de producción automática
- Alias @/ para imports limpios

### Dependencias Principales
- **React 18.2.0**: UI Framework
- **TypeScript 5.3.3**: Type safety
- **Vite 5.0.8**: Build tool
- **Lucide React**: Icons (disponible para futuro uso)

---

## 📦 Scripts Disponibles

```bash
# Desarrollo
npm run dev        # Inicia servidor de desarrollo

# Compilación
npm run build      # Build para producción
npm run serve      # Preview del build

# Testing
npm run typecheck  # Verificar tipos TypeScript
```

---

## ✅ Verificaciones Completadas

- ✅ Typecheck sin errores
- ✅ Build compilado exitosamente
- ✅ Estructura completa creada
- ✅ Estilos oscuros futuristas implementados
- ✅ Todos los engines funcionales
- ✅ Sistema reactivo funcionando
- ✅ localStorage integrado
- ✅ Arquitectura preparada para futuras integraciones

---

## 📝 Notas Importantes

1. **Sin Backend Aún**: La aplicación es completamente frontend
2. **Sin Sistema de Pagos**: Preparado pero no implementado
3. **Modo VIBRA PRO**: Por defecto, preparado para VIBRA FREE
4. **Datos Locales**: Todo se persiste en localStorage del navegador
5. **INSTINTO Pendiente**: Arquitectura lista para su integración

---

## 🎯 Próximos Pasos Sugeridos

1. Integrar API de streaming musical real
2. Implementar INSTINTO para análisis emocional
3. Crear backend para sincronización de usuarios
4. Implementar sistema de pagos
5. Agregar más personalización de moods
6. Integrar machine learning para mejores recomendaciones

---

**Desarrollado con ❤️ en el Universo HBG**  
*VIBRA PRO v1.0.0 - Modo Pro Lista para Producción*
