import type { Config } from 'tailwindcss';

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;
const scale = (name: string, shades: (string | number)[]) => Object.fromEntries(shades.map((s) => [s, v(`${name}-${s}`)]));

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bone: { DEFAULT: v('bone-100'), ...scale('bone', [50, 100, 200, 300]) },
        pine: scale('pine', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
        bark: scale('bark', [300, 400, 500, 600, 700, 800, 900]),
        coral: scale('coral', [50, 100, 200, 500, 600, 700]),
        honey: scale('honey', [50, 100, 400, 500, 700]),
        tide: scale('tide', [50, 100, 500, 600, 700]),
        leaf: scale('leaf', [50, 100, 500, 600, 700]),
        snow: v('snow'),
        heading: v('heading'),
        accent: v('accent'),
      },
      fontFamily: {
        sans: ['"Figtree Variable"', 'system-ui', 'Segoe UI', 'sans-serif'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(20,18,12,.05), 0 6px 20px rgba(20,18,12,.06)',
        lift: '0 2px 4px rgba(20,18,12,.06), 0 14px 34px rgba(20,18,12,.12)',
      },
      keyframes: {
        rise: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        pop: { '0%': { transform: 'scale(.96)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        pulseRing: { '0%': { boxShadow: '0 0 0 0 rgba(214,40,40,.45)' }, '100%': { boxShadow: '0 0 0 14px rgba(214,40,40,0)' } },
      },
      animation: { rise: 'rise .35s ease backwards', pop: 'pop .18s ease backwards', ring: 'pulseRing 1.6s ease-out infinite' },
    },
  },
  plugins: [],
};
export default config;
