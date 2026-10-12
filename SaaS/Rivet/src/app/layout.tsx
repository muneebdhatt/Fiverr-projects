import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/inter';
import '@fontsource-variable/bricolage-grotesque';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rivet',
  description: 'Projects, time, invoices and a client portal for agencies, in one place.',
  icons: { icon: '/favicon.svg' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#7538e2' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
