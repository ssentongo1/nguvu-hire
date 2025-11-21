import type { NextConfig } from "next";

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable Turbopack for PWA compatibility
  experimental: {
    turbo: undefined,
  },
  // Ensure proper static generation
  output: 'standalone',
  // Handle image optimization
  images: {
    domains: [],
    unoptimized: process.env.NODE_ENV === 'development',
  },
};

module.exports = withPWA(nextConfig);