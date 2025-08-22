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
  webpack: (config) => {
    // Handle .mjs files
    config.module.rules.push({
      test: /\.mjs$/,
      type: 'javascript/auto',
    });
    
    return config;
  },
};

export default nextConfig;
