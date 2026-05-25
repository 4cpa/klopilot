/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: ['maplibre-gl'],
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '9010' },
      { protocol: 'https', hostname: '*.klopilot.ch' },
    ],
  },
};

export default config;
