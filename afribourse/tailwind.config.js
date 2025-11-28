/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    // Couleurs de fond
    {
      pattern: /bg-(blue|indigo|purple|pink|red|orange|amber|yellow|green|emerald|cyan|gray)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    // Bordures
    {
      pattern: /border-(blue|indigo|purple|pink|red|orange|amber|yellow|green|emerald|cyan|gray|white)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    // Texte
    {
      pattern: /text-(blue|indigo|purple|pink|red|orange|amber|yellow|green|emerald|cyan|gray|white)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    // Classes communes pour les modules
    'border-l-4',
    'rounded-r-xl',
    'rounded-xl',
    'rounded-lg',
    'shadow-sm',
    'shadow-md',
    'shadow-lg',
    'min-h-screen',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out'
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
