import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/dm-sans';
import './globals.css';
import { themeScript } from '@/lib/theme';

export const metadata: Metadata = {
  title: 'Shiftwire',
  description: 'Fill open shifts in minutes. Text nearby workers and the first YES wins.',
  icons: { icon: '/favicon.svg' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0e1a2c' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>{children}</body>
    </html>
  );
}
