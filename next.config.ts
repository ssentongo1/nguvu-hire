import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development"
});

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Remove experimental.turbo entirely
  // experimental: {},
  
  output: "standalone",
  
  images: {
    domains: [],
    unoptimized: process.env.NODE_ENV === "development",
  },
};

module.exports = withPWA(nextConfig);
