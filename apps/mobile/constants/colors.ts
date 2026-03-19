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
  tabInactive: '#9CA3AF',
  tabBackground: '#FFFFFF',
} as const;

export type ColorKey = keyof typeof Colors;
