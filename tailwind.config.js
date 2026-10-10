export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F5F0E8',
        aegis: {
          navy: '#1B2A3A',
          blue: '#2D4A5C',
          slate: '#4A6275',
        },
        earth: {
          clay: '#A0522D',
          terracotta: '#E09267',
          ochre: '#C99A3B',
          sand: '#E8DCC8',
          cream: '#F5F0E8',
          stone: '#D4CDB9',
          moss: '#5B6E4F',
          sage: '#8B9B7E',
          deep: '#2C2520',
          charcoal: '#3A3530',
          bark: '#5C4F44',
          rust: '#9C5B3E',
          walnut: '#7B5E3B',
        },
        surface: {
          page: '#1E1B17',
          card: '#2C2823',
          raised: '#36302A',
          dark: '#1E1B17',
          darkSecondary: '#2C2823',
          darkCard: '#36302A',
        },
        ink: {
          primary: '#F5F0E8',
          muted: '#A89F92',
          light: '#F5F0E8',
          lightMuted: '#A89F92',
          inverse: '#2C2520',
        },
        status: {
          critical: '#9B3A2C',
          high: '#C66B47',
          warning: '#C99A3B',
          safe: '#5B6E4F',
          info: '#2D4A5C',
          offline: '#8B8479',
        },
        flood: {
          water: '#3D6A8C',
          deep: '#2A4D6B',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        '400': '400',
        '500': '500',
        '600': '600',
        '700': '700',
      },
      opacity: {
        4: '0.04',
        8: '0.08',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-in': 'slideIn 0.35s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-ring': 'pulseRing 3s ease-out infinite',
        'pulse-soft': 'pulseSoft 2.5s ease-in-out infinite',
        'loading-dot': 'loadingDot 1.4s ease-in-out infinite',
        'route-dash': 'routeDash 1.5s linear infinite',
        'marker-drop': 'markerDrop 0.4s ease-out',
        'hold-fill': 'holdFill 2s linear forwards',
        'line-grow': 'lineGrow 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.7)', opacity: '0.6' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        loadingDot: {
          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.3' },
          '30%': { transform: 'translateY(-5px)', opacity: '1' },
        },
        routeDash: {
          '0%': { strokeDashoffset: '0' },
          '100%': { strokeDashoffset: '30' },
        },
        markerDrop: {
          '0%': { transform: 'translateY(-12px) scale(0)', opacity: '0' },
          '70%': { transform: 'translateY(2px) scale(1.1)', opacity: '1' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        holdFill: {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        lineGrow: {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
    },
  },
  plugins: [],
};
