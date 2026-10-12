import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/inter';
import '@fontsource-variable/newsreader';
import './globals.css';

export const metadata: Metadata = {
  title: 'Minutebook',
  description: 'Meeting notes that write themselves. Summaries, decisions and action items with owners and due dates.',
  icons: { icon: '/favicon.svg' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#e24614' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
