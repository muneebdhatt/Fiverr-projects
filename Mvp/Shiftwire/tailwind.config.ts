import type { Config } from 'tailwindcss';
const v = (n: string) => Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((k) => [k, `rgb(var(--${n}-${k}) / <alpha-value>)`]));
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: v('ink'),
        brand: v('brand'),
        accent: { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706' },
      },
      fontFamily: {
        sans: ['DM Sans Variable', 'DM Sans', 'system-ui', 'Segoe UI', 'sans-serif'],
        display: ['Bricolage Grotesque Variable', 'Bricolage Grotesque', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'Cascadia Mono', 'monospace'],
      },
      borderRadius: { lg: '0.55rem', xl: '0.85rem', '2xl': '1.15rem' },
      boxShadow: { card: '0 1px 2px rgba(14,26,44,.05), 0 4px 14px rgba(14,26,44,.05)' },
    },
  },
  plugins: [],
};
export default config;
