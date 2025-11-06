import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#00ffbd',
          50: '#e6fff7',
          100: '#b3ffe5',
          200: '#80ffd3',
          300: '#4dffc1',
          400: '#1affaf',
          500: '#00e6a8',
          600: '#00b384',
          700: '#008060',
          800: '#004d3c',
          900: '#001a18'
        },
        surface: {
          50: '#0b0b10',
          100: '#0f0f17',
          200: '#131322',
          300: '#17172a',
          400: '#1b1b32'
        }
      },
      boxShadow: {
        glow: '0 0 0 2px rgba(0,255,189,0.15), 0 0 40px rgba(0,255,189,0.08)'
      },
      backgroundImage: {
        'brand-radial': 'radial-gradient(60% 60% at 50% 0%, rgba(0,255,189,0.15) 0%, rgba(0,0,0,0) 100%)'
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 0 2px rgba(0,255,189,0.12), 0 0 28px rgba(0,255,189,0.06)' },
          '50%': { boxShadow: '0 0 0 2px rgba(0,255,189,0.18), 0 0 48px rgba(0,255,189,0.10)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      },
      animation: {
        glow: 'glowPulse 3s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite'
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
} satisfies Config;


