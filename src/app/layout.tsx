import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getAssetPath } from "@/lib/utils";
import { I18nProvider } from "./i18n";
import I18nSwitcher from "./I18nSwitcher";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Alpha Drums",
  description: "A simple and powerful web-based drum machine.",
  manifest: getAssetPath("/manifest.webmanifest"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <meta name="theme-color" content="#000" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider>
          <div style={{position:'fixed',top:8,right:8,zIndex:20}}><I18nSwitcher /></div>
          {children}
        </I18nProvider>

      </body>
    </html>
  );
}
