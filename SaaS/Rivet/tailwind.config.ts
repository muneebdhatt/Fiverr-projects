import type { Config } from 'tailwindcss';
const v = (n: string) => Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((k) => [k, `rgb(var(--${n}-${k}) / <alpha-value>)`]));
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { ink: v('ink'), brand: v('brand'), ember: v('ember') },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
        display: ['Bricolage Grotesque Variable', 'Bricolage Grotesque', 'system-ui', 'sans-serif'],
      },
      borderRadius: { lg: '0.6rem', xl: '0.9rem', '2xl': '1.2rem' },
      boxShadow: { card: '0 1px 2px rgba(24,24,27,.05), 0 4px 14px rgba(24,24,27,.06)' },
    },
  },
  plugins: [],
};
export default config;
