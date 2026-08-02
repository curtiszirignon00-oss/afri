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
      // Couleurs reprises du logo : silhouette orange, barres et fleche bleu nuit.
      // Servent de base a la charte graphique.
      colors: {
        brand: {
          navy:   '#12395E',
          orange: '#EE7B23',
          // Etats de survol des boutons pleins : le navy s'eclaircit, l'orange
          // se fonce. Evite les hover:bg-blue-700 / orange-600 de Tailwind, qui
          // renvoyaient vers des teintes etrangeres au logo.
          'navy-hover':   '#1B4E7D',
          'orange-hover': '#D66A18',
          // Nuance foncee de l'orange de marque (meme teinte 26deg, meme saturation 86%,
          // luminosite 54% -> 35%). Indispensable pour du texte orange : #EE7B23 ne
          // tient que 2.5:1 sur fond clair, tres en dessous des 4.5:1 requis.
          'orange-dark': '#A64F0D',
          // Variante eclaircie de l'orange de marque, pour les fonds sombres :
          // #EE7B23 ne tient que 2.4:1 sur le bleu clair du degrade du hero,
          // sous le seuil de 3:1 exige pour les grands textes.
          'orange-light': '#FCA04D',
        },
      },
      fontFamily: {
        // Logotype uniquement. Space Grotesk a des formes legerement decalees
        // (le 'r', le 'a') qui rendent le nom memorable sans nuire a la lisibilite.
        display: ['"Space Grotesk"', '"IBM Plex Sans"', 'sans-serif'],
        sans: [
          '"IBM Plex Sans"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        // Chiffres, tickers et graphiques. Etait absent du theme : les 53 `font-mono`
        // du code retombaient sur la pile par defaut, donc un rendu different
        // sous Windows, macOS et Linux.
        mono: [
          '"IBM Plex Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          '"Courier New"',
          'monospace',
        ],
      },
      // IBM Plex Sans plafonne a 700 (Bold). Sans ce remappage, les 112 `font-extrabold`
      // et 4 `font-black` du code declencheraient un faux-gras synthetique baveux.
      fontWeight: {
        extrabold: '700',
        black: '700',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' }
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
