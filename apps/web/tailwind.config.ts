import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#FF6B35',
          secondary: '#FFD23F',
          deep: '#0B132B',
          mint: '#06D6A0',
          berry: '#EF476F',
          sky: '#118AB2',
        },
        paper: 'var(--paper)',
        cream: 'var(--cream)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        surface: 'var(--surface)',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        card: '0 6px 24px rgba(15,23,42,.06)',
        'card-dark': '0 6px 24px rgba(0,0,0,.35)',
        sheet: '0 -8px 40px rgba(15,23,42,.12)',
      },
    },
  },
  plugins: [forms],
} satisfies Config;
