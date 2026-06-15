import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { getAssetPath } from '@/lib/utils';
import Providers from './providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// The web manifest link is injected automatically from src/app/manifest.ts.
// Icon URLs go through getAssetPath so they carry the /alpha-drums basePath on
// the GitHub Pages export and stay root-absolute on Vercel.
export const metadata: Metadata = {
  title: 'Alpha Drums',
  description: 'A simple and powerful web-based drum machine.',
  icons: {
    icon: getAssetPath('/icon-192.png'),
    apple: getAssetPath('/apple-touch-icon.png'),
  },
};

export const viewport: Viewport = {
  themeColor: '#0B0B0F',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
