/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  assetPrefix: "/video-canvas/",
  webpack: (config) => {
    config.module.rules.push({
      test: /\.wgsl$/,
      use: 'raw-loader',
    });

    return config;
  },
};

export default nextConfig;
