/**
 * VIBRA PRO THEME
 * Sistema de colores oscuro futurista con azul y morado
 */

export const theme = {
  colors: {
    // Primarios
    primary: {
      50: '#f0f4ff',
      100: '#e0e9ff',
      200: '#c7d9ff',
      300: '#a4bfff',
      400: '#7a9eff',
      500: '#5b7dff', // Azul principal
      600: '#3d5cff',
      700: '#2843e8',
      800: '#1f2fa3',
      900: '#1a2563',
    },
    // Secundarios
    secondary: {
      50: '#faf5ff',
      100: '#f5ebff',
      200: '#ead7ff',
      300: '#dcb8ff',
      400: '#c888ff',
      500: '#b366ff', // Morado principal
      600: '#9933ff',
      700: '#7d1aff',
      800: '#6600cc',
      900: '#4d0099',
    },
    // Neutrales (oscuro)
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937', // Fondo oscuro principal
      900: '#111827',
      950: '#030712',
    },
    // Estados
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    // Moods
    moods: {
      chill: '#4f46e5',   // Indigo
      energy: '#dc2626',  // Red
      sad: '#7c3aed',     // Violet
      party: '#ec4899',   // Pink
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
    xl: '1.5rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    'glow-primary': '0 0 20px rgba(91, 125, 255, 0.3)',
    'glow-secondary': '0 0 20px rgba(179, 102, 255, 0.3)',
  },
  transitions: {
    fast: 'all 150ms ease-in-out',
    normal: 'all 300ms ease-in-out',
    slow: 'all 500ms ease-in-out',
  },
} as const;

export type Theme = typeof theme;
