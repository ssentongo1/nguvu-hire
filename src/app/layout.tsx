import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import BodyWrapper from "./BodyWrapper.client";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Simple, compatible viewport for all devices */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="h-full">
        <ThemeProvider>
          <BodyWrapper className={`${geistSans.variable} ${geistMono.variable}`}>
            {/* Universal mobile-safe container */}
            <div className="min-h-screen w-full overflow-x-hidden">
              {children}
            </div>
          </BodyWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}