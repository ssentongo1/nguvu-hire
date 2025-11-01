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
  keywords: "jobs, africa, employment, hiring, talent, recruitment",
  icons: {
    icon: '/favicon-neww.png',
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