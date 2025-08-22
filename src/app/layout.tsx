import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getAssetPath } from "@/lib/utils";

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
  const { I18nProvider } = require("./i18n");
  const I18nSwitcher = require("./I18nSwitcher").default;
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
        <script src={getAssetPath("/sw.js")} defer></script>
      </body>
    </html>
  );
}
