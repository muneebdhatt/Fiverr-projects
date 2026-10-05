import type { Config } from 'tailwindcss';

const scale = (name: string, steps: number[]) =>
  Object.fromEntries(steps.map((s) => [s, `rgb(var(--${name}-${s}) / <alpha-value>)`]));

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: scale('ink', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
        brand: scale('brand', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
        accent: { 400: '#e0b04a', 500: '#c99a2e', 600: '#a67c1d' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'Segoe UI', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'Times New Roman', 'serif'],
      },
      boxShadow: { card: '0 1px 0 rgba(60, 40, 20, .04)' },
    },
  },
  plugins: [],
};
export default config;
