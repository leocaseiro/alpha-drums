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
  webpack: (config, { isServer: _isServer }) => {
    // Integrate AlphaTab's WebPack plugin to fix worker/worklet resolution
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { AlphaTabWebPackPlugin } = require('@coderline/alphatab/webpack');
      config.plugins = config.plugins || [];
      config.plugins.push(
        new AlphaTabWebPackPlugin({
          // We already ship assets from public/, so don’t copy fonts
          assetOutputDir: false,
          // Workers are needed; worklets optional (we prefer ScriptProcessor in dev)
          audioWorklets: true,
          webWorkers: true,
        })
      );
    } catch (e) {
      // noop if plugin not available
    }
    // Handle .mjs files
    config.module.rules.push({
      test: /\.mjs$/,
      type: 'javascript/auto',
    });

    // Configure AlphaTab worker resolution
    // No special aliasing needed when shipping worker and fonts in public/

    return config;
  },
};

export default nextConfig;
