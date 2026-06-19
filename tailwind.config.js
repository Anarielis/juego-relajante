/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Pastel Light Colors
        bgLight: '#FAF9F6', // Soft Warm Alabaster
        bgDark: '#0D0B14',  // Deep Night Obsidian
        
        pastel: {
          lavender: {
            light: '#E8E5F6',
            DEFAULT: '#D1CBEA',
            dark: '#2A2346',
            hover: '#C2B8E2',
          },
          mint: {
            light: '#E5F6EE',
            DEFAULT: '#CBEFDC',
            dark: '#1E3527',
            hover: '#B5E8CD',
          },
          peach: {
            light: '#FDF0EC',
            DEFAULT: '#FAD8CC',
            dark: '#3A251C',
            hover: '#F7C6B7',
          },
          rose: {
            light: '#FDEEF2',
            DEFAULT: '#FAD3DC',
            dark: '#3B1E29',
            hover: '#F7BDCC',
          },
          sky: {
            light: '#E5F2F9',
            DEFAULT: '#CBE5F5',
            dark: '#1A2938',
            hover: '#B3D9F0',
          },
        },
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        nunito: ['Nunito', 'sans-serif'],
      },
      animation: {
        'breathe-slow': 'breathe 16s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'pulse-gentle': 'pulseGentle 4s ease-in-out infinite',
        'fade-in': 'fadeIn 1s ease-out forwards',
        'drift': 'drift 20s linear infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: 0.9 },
          '25%': { transform: 'scale(1.25)', opacity: 1 }, // Inhale + hold
          '50%': { transform: 'scale(1.25)', opacity: 1 },
          '75%': { transform: 'scale(1)', opacity: 0.9 }, // Exhale + hold
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseGentle: {
          '0%, 100%': { opacity: 0.6, transform: 'scale(0.98)' },
          '50%': { opacity: 1, transform: 'scale(1.02)' },
        },
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        drift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'pastel': '0 10px 30px -10px rgba(209, 203, 234, 0.3)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
