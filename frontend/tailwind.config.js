/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: '#0a0a0a',
        'void-light': '#111111',
        'void-card': '#141414',
        gold: {
          DEFAULT: '#FFD700',
          50: '#FFF9E0',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        amber: {
          DEFAULT: '#F59E0B',
          glow: 'rgba(245, 158, 11, 0.15)',
        },
        cream: '#FEF3C7',
        'text-primary': '#FFFFFF',
        'text-dim': '#E5E7EB',
        'text-muted': '#D1D5DB',
        'border-gold': 'rgba(255, 215, 0, 0.15)',
        'glass-gold': 'rgba(255, 215, 0, 0.03)',
      },
      fontFamily: {
        heading: ['Orbitron', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(255, 215, 0, 0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
        'glow-gold': '0 0 20px rgba(255, 215, 0, 0.3), 0 0 60px rgba(255, 215, 0, 0.08)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.3), 0 0 60px rgba(245, 158, 11, 0.08)',
      },
    },
  },
  plugins: [],
}
