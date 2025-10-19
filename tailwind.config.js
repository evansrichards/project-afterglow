/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette: Warm, calm, optimistic tones
        afterglow: {
          // Sunrise warmth - primary brand color
          50: '#fff9f5',
          100: '#fff2e8',
          200: '#ffe3d1',
          300: '#ffcca8',
          400: '#ffab73',
          500: '#ff8a3d',
          600: '#f96d1f',
          700: '#e05416',
          800: '#b84315',
          900: '#8d3314',
        },
        // Twilight blues - calming secondary
        twilight: {
          50: '#f4f8fb',
          100: '#e9f1f7',
          200: '#cfe3f0',
          300: '#a5cce4',
          400: '#74b1d5',
          500: '#5196c4',
          600: '#3c7cb0',
          700: '#31658f',
          800: '#2c5577',
          900: '#294764',
        },
        // Neutral grays with warmth
        warm: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
        // Accent colors for insights
        insight: {
          // Positive/success - gentle green
          positive: '#10b981',
          'positive-light': '#d1fae5',
          // Growth opportunity - soft amber
          growth: '#f59e0b',
          'growth-light': '#fef3c7',
          // Warning/caution - warm coral
          caution: '#f97316',
          'caution-light': '#ffedd5',
          // Reflection - calm purple
          reflection: '#8b5cf6',
          'reflection-light': '#ede9fe',
        }
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter var', 'sans-serif'],
      },
      fontSize: {
        // Type scale optimized for readability
        'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        'sm': ['0.875rem', { lineHeight: '1.6', letterSpacing: '0.01em' }],
        'base': ['1rem', { lineHeight: '1.7', letterSpacing: '0' }],
        'lg': ['1.125rem', { lineHeight: '1.7', letterSpacing: '-0.01em' }],
        'xl': ['1.25rem', { lineHeight: '1.6', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '1.5', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '1.4', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '1.3', letterSpacing: '-0.03em' }],
        '5xl': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.03em' }],
      },
      spacing: {
        // Breathing room for calm UI
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        // Soft, elevated shadows
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 2px 6px -2px rgba(0, 0, 0, 0.05)',
        'soft-lg': '0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 2px 10px -2px rgba(0, 0, 0, 0.05)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-gentle': 'pulseGentle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGentle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}
