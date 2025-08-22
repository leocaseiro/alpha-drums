import type { NextConfig } from "next";

// For GitHub Pages deployment
const isGithubPages = process.env.GITHUB_PAGES === 'true';
const basePath = isGithubPages ? '/alpha-drums' : '';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath,
  assetPrefix: basePath,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  webpack: (config, { isServer }) => {
    // Handle .mjs files
    config.module.rules.push({
      test: /\.mjs$/,
      type: 'javascript/auto',
    });
    
    // Configure AlphaTab worker resolution
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Redirect AlphaTab worker requests to our public directory
        '@coderline/alphatab/dist/alphaTab.worker.mjs': '/alphaTab.worker.mjs',
      };
      
      // Try to intercept and redirect worker loading
      config.module.rules.push({
        test: /alphaTab\.worker\.m?js$/,
        type: 'asset/resource',
        generator: {
          filename: 'static/[name][ext]',
          publicPath: '/_next/static/',
        },
      });
    }
    
    return config;
  },
};

export default nextConfig;
