import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/figtree';
import '@fontsource/instrument-serif';
import './globals.css';
import { themeScript } from '@/lib/theme';

export const metadata: Metadata = {
  title: 'Fernway',
  description: 'Patient check-in and a live queue for the front desk and care team.',
  icons: { icon: '/favicon.svg' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0d0c0a' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>{children}</body>
    </html>
  );
}
