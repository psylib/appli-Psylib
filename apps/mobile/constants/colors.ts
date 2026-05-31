/**
 * Design tokens PsyScale — Mobile
 * Identiques au design system web (WCAG AA)
 */

export const Colors = {
  // Brand
  primary: '#3D52A0',
  primaryLight: '#7B9CDA',
  primaryDark: '#2A3A70',

  // Accents
  accent: '#0D9488',
  accentLight: '#5EEAD4',
  warm: '#7C3AED',
  warmLight: '#C4B5FD',

  // Backgrounds
  bg: '#F8F7FF',
  surface: '#F1F0F9',
  surfaceElevated: '#FFFFFF',

  // Text
  text: '#1E1B4B',
  textSecondary: '#4B5563',
  muted: '#6B7280',
  mutedLight: '#9CA3AF',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Borders
  border: '#E5E7EB',
  borderFocus: '#3D52A0',

  // Mood tokens (toujours accompagnés d'icône/label — daltonisme)
  mood1: '#EF4444', // Très difficile
  mood2: '#F97316', // Difficile
  mood3: '#F59E0B', // Neutre
  mood4: '#84CC16', // Bien
  mood5: '#10B981', // Très bien

  // White / Black
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Tab bar
  tabActive: '#3D52A0',
  tabInactive: '#6B7280', // Fixed WCAG: 5.74:1 contrast on white (was #9CA3AF = 2.85:1 FAIL)
  tabBackground: '#FFFFFF',
  tabIndicator: '#3D52A0',

  // Hero gradient
  heroGradientStart: '#3D52A0',
  heroGradientEnd: '#2A3A70',

  // Patient-specific
  patientPrimary: '#0D9488',
  patientSurface: '#F0FDFA',

  // AI
  aiAccent: '#0D9488',
  aiBg: '#F0FDFA',

  // Save states
  savePending: '#F59E0B',
  saveSuccess: '#10B981',
  saveError: '#EF4444',

  // Warm — Sauge / Forêt (dashboard redesign)
  sageBase: '#4A7C59',
  sageDark: '#3D6B4A',
  sageLight: '#6B9E78',
  sageSurface: '#EEF5EE',
  sageCard: '#E4F0E4',
  sageMuted: 'rgba(74,124,89,0.12)',
  cream: '#FAFAF8',
  stone: '#F5F4F1',
  warmText: '#1C1917',
  warmMuted: '#78716C',
  warmBorder: '#DDE8DD',
} as const;

export type ColorKey = keyof typeof Colors;
