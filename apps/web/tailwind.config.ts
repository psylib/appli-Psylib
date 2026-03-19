import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Design tokens PsyScale
      colors: {
        // Palette principale
        primary: {
          DEFAULT: '#3D52A0',
          light: '#7B9CDA',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#0D9488',
          foreground: '#FFFFFF',
        },
        warm: {
          DEFAULT: '#7C3AED',
          foreground: '#FFFFFF',
        },
        // Backgrounds
        background: '#F8F7FF',
        surface: '#F1F0F9',
        // Texte
        foreground: '#1E1B4B',
        // Mood tracking (toujours accompagné d'icône — daltonisme)
        mood: {
          5: '#10B981',
          4: '#84CC16',
          3: '#F59E0B',
          2: '#F97316',
          1: '#EF4444',
        },
        // shadcn/ui compatibility
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        // ── Landing palette ──────────────────────────────────────────
        sage: {
          DEFAULT: '#7B9E87',
          50:  '#F2F6F3',
          100: '#E4EDE7',
          200: '#C9DBCE',
          300: '#AECAB5',
          400: '#93B89C',
          500: '#7B9E87',
          600: '#627F6C',
          700: '#4A5F51',
          800: '#314036',
          900: '#19201B',
        },
        cream: {
          DEFAULT: '#F7F3EE',
          50:  '#FDFCFA',
          100: '#F7F3EE',
          200: '#EFE7DC',
          300: '#E4D7C7',
          400: '#D9C7B2',
        },
        'warm-white': '#FDFAF7',
        charcoal: {
          DEFAULT: '#1C1C1E',
          700: '#2C2C2E',
          600: '#3A3A3C',
          500: '#48484A',
          400: '#636366',
          300: '#8E8E93',
          200: '#AEAEB2',
          100: '#C7C7CC',
        },
        terracotta: {
          DEFAULT: '#C8956C',
          50:  '#FBF4EE',
          100: '#F5E4D3',
          200: '#EBCAA8',
          300: '#DFAF7D',
          400: '#D3A275',
          500: '#C8956C',
          600: '#B07A52',
          700: '#8A5F3D',
          800: '#63442B',
          900: '#3D2918',
        },
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        playfair: ['var(--font-playfair)', 'Georgia', 'serif'],
        'dm-sans': ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        'dm-mono': ['var(--font-dm-mono)', 'monospace'],
      },
      fontSize: {
        xs:   ['0.75rem',  { lineHeight: '1rem' }],
        sm:   ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem',     { lineHeight: '1.5rem' }],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      ringWidth: {
        DEFAULT: '3px',
      },
      ringColor: {
        DEFAULT: '#3D52A0',
      },
      ringOffsetWidth: {
        DEFAULT: '2px',
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'slide-in': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'slide-in':       'slide-in 0.3s ease-out',
        'fade-up':        'fade-up 0.6s ease-out forwards',
        float:            'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
