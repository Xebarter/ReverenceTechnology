import type { Metadata, Viewport } from 'next';
import { Newsreader, Source_Sans_3, Nunito_Sans } from 'next/font/google';
import '../index.css';
import { Providers } from './providers';

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  style: ['normal', 'italic'],
});

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-admin',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Reverence Technology',
  description: 'Reverence Technology website',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F4F1EA',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${newsreader.variable} ${sourceSans.variable} ${nunitoSans.variable}`}>
      <body className="font-sans bg-paper text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
