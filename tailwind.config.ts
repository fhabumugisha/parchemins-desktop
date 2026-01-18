import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        burgundy: '#722F37',
        gold: '#B8860B',
        cream: '#FAF7F2',
        'cream-light': '#FFFEF9',
        muted: '#6B5B4F',
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
      },
      screens: {
        '3xl': '1920px',
      },
    },
  },
  plugins: [typography],
};

export default config;
