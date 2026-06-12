/** @type {import('next').NextConfig} */
const nextConfig = {
  // whatsapp-web.js + puppeteer are heavy native deps loaded lazily at runtime.
  // Keep them external so Next doesn't try to bundle them.
  serverExternalPackages: ["whatsapp-web.js", "puppeteer", "qrcode"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "places.googleapis.com" },
      { protocol: "https", hostname: "maps.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

module.exports = nextConfig;
