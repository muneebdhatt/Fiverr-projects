import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 50: 'rgb(var(--ink-50) / <alpha-value>)', 100: 'rgb(var(--ink-100) / <alpha-value>)', 200: 'rgb(var(--ink-200) / <alpha-value>)', 300: 'rgb(var(--ink-300) / <alpha-value>)', 400: 'rgb(var(--ink-400) / <alpha-value>)', 500: 'rgb(var(--ink-500) / <alpha-value>)', 600: 'rgb(var(--ink-600) / <alpha-value>)', 700: 'rgb(var(--ink-700) / <alpha-value>)', 800: 'rgb(var(--ink-800) / <alpha-value>)', 900: 'rgb(var(--ink-900) / <alpha-value>)' },
        brand: { 50: '#eef0ff', 100: '#dfe3ff', 200: '#c3c9ff', 300: '#9ba3ff', 400: '#7377fb', 500: '#5753f0', 600: '#4638dc', 700: '#392cb5', 800: '#312a8f', 900: '#2b276f' },
        accent: { 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'] },
      boxShadow: { card: '0 1px 2px rgba(21,24,51,.05), 0 4px 16px rgba(21,24,51,.05)' },
    },
  },
  plugins: [],
};
export default config;
