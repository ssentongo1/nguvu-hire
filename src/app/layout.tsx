import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "NguvuHire - Find Jobs & Talent Across Africa",
  description: "Connect job seekers and employers across Africa and beyond",
  manifest: "/manifest.json",
  themeColor: "#000000",
  keywords: "jobs, africa, employment, hiring, talent, recruitment",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NguvuHire",
  },
  icons: {
    icon: '/favicon-neww2.png',
    apple: '/icon-192x192.png',
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        
        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NguvuHire" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-TileImage" content="/icon-192x192.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Additional PWA tags for better mobile experience */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="NguvuHire" />
        <link rel="shortcut icon" href="/favicon-neww2.png" />
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