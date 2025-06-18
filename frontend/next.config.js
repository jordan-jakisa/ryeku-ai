/** @type {import('next').NextConfig} */
const baseConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

// Integrate the official Next.js bundle analyzer.
// Enable by setting ANALYZE=true when running `npm run build`.
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(baseConfig);
