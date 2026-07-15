/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        vl: {
          bg: '#F5F6FA',
          surface: '#FFFFFF',
          'surface-soft': '#FAFAFD',
          border: '#E8E9F1',
          ink: '#15181F',
          'ink-dim': '#676C7E',
          'ink-faint': '#9EA2B2',
          amber: '#B9862B',
          'amber-bright': '#D7A344',
          'amber-soft': '#F7EDD9',
          rust: '#C1573F',
          'rust-soft': '#FBEAE6',
          'rust-dim': '#8C4433',
          teal: '#3F8F82',
          'teal-soft': '#E4F2EF',
        },
      },
      fontFamily: {
        fraunces: ['Fraunces', 'serif'],
        karla: ['Karla', 'sans-serif'],
        plexmono: ['"IBM Plex Mono"', 'monospace'],
        nastaliq: ['"Noto Nastaliq Urdu"', 'serif'],
      },
      borderRadius: {
        'vl-sm': '10px',
        'vl-md': '16px',
        'vl-lg': '22px',
      },
      boxShadow: {
        'vl-xs': '0 1px 2px rgba(21,24,31,0.05)',
        'vl-sm': '0 2px 8px rgba(21,24,31,0.06), 0 1px 2px rgba(21,24,31,0.04)',
        'vl-md': '0 10px 24px rgba(21,24,31,0.08), 0 2px 6px rgba(21,24,31,0.05)',
        'vl-lg': '0 24px 48px rgba(21,24,31,0.12), 0 8px 20px rgba(21,24,31,0.06)',
        'vl-glow': '0 0 0 6px rgba(193,87,63,0.10), 0 16px 36px rgba(193,87,63,0.30)',
      },
      keyframes: {
        'vl-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.045)' },
        },
        'vl-expand': {
          '0%': { transform: 'scale(.85)', opacity: '.5' },
          '100%': { transform: 'scale(1.4)', opacity: '0' },
        },
      },
      animation: {
        'vl-pulse': 'vl-pulse 1.6s ease-in-out infinite',
        'vl-expand': 'vl-expand 1.6s ease-out infinite',
        'vl-expand-delay': 'vl-expand 1.6s ease-out .3s infinite',
      },
    },
  },
  plugins: [],
};
