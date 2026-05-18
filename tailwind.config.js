/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#050a14',
          900: '#0a1220',
          850: '#0d1628',
          800: '#111d33',
          700: '#1a2844',
        },
        neon: {
          cyan: '#00e5ff',
          'cyan-dim': '#00b8d4',
          green: '#00e676',
          orange: '#ff9100',
          red: '#ff5252',
        },
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 229, 255, 0.15)',
        'glow-green': '0 0 20px rgba(0, 230, 118, 0.2)',
        'glow-orange': '0 0 20px rgba(255, 145, 0, 0.25)',
        'glow-red': '0 0 20px rgba(255, 82, 82, 0.25)',
        card: '0 0 0 1px rgba(0, 229, 255, 0.12), 0 4px 24px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        sparkline: 'sparkline 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        sparkline: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
