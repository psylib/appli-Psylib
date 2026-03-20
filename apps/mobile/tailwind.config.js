/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3D52A0',
          light: '#7B9CDA',
          dark: '#2A3A70',
        },
        accent: {
          DEFAULT: '#0D9488',
          light: '#5EEAD4',
        },
        warm: {
          DEFAULT: '#7C3AED',
          light: '#C4B5FD',
        },
        bg: '#F8F7FF',
        surface: {
          DEFAULT: '#F1F0F9',
          elevated: '#FFFFFF',
        },
        text: {
          DEFAULT: '#1E1B4B',
          secondary: '#4B5563',
        },
        muted: {
          DEFAULT: '#6B7280',
          light: '#9CA3AF',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
        border: {
          DEFAULT: '#E5E7EB',
          focus: '#3D52A0',
        },
        mood: {
          1: '#EF4444',
          2: '#F97316',
          3: '#F59E0B',
          4: '#84CC16',
          5: '#10B981',
        },
        tab: {
          active: '#3D52A0',
          inactive: '#9CA3AF',
          bg: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['DMSans_400Regular'],
        'sans-medium': ['DMSans_500Medium'],
        'sans-bold': ['DMSans_700Bold'],
        serif: ['PlayfairDisplay_700Bold'],
        mono: ['DMMono_400Regular'],
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
};
