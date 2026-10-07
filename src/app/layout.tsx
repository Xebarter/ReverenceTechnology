import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/google-sans/wght.css';
import '@fontsource-variable/google-sans/wght-italic.css';
import '../index.css';
import { Providers } from './providers';
import { rootMetadata } from '../lib/seo';

export const metadata: Metadata = rootMetadata();

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F4F1EA',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-UG">
      <body className="font-sans bg-paper text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
