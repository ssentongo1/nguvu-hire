import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#6366F1",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "NguvuHire - Find Jobs & Talent Across Africa",
  description: "Connect job seekers and employers across Africa and beyond",
  manifest: "/manifest.json",
  keywords: "jobs, africa, employment, hiring, talent, recruitment",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NguvuHire",
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        
        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#6366F1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NguvuHire" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="msapplication-TileColor" content="#6366F1" />
        <meta name="msapplication-TileImage" content="/icon-144x144.png" />
        
        {/* Additional PWA tags for better mobile experience */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="NguvuHire" />
        
        {/* Favicon links */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.ico" />
      </head>
      <body className={`h-full antialiased ${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider>
          {/* Mobile-safe container */}
          <div className="min-h-screen w-full overflow-x-hidden">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}