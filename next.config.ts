import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

// For GitHub Pages deployment
const isGithubPages = process.env.GITHUB_PAGES === 'true';
const basePath = isGithubPages ? '/alpha-drums' : '';

const nextConfig: NextConfig = {
  // Static HTML export only for GitHub Pages; on Vercel (and others) leave it
  // undefined so the app runs as a server-rendered (SSR) Next.js app.
  output: isGithubPages ? 'export' : undefined,
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
      // Dynamic require so a missing optional plugin degrades gracefully via the catch.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { AlphaTabWebPackPlugin } = require('@coderline/alphatab/webpack');
      config.plugins = config.plugins || [];
      config.plugins.push(
        new AlphaTabWebPackPlugin({
          // We already ship assets from public/, so don’t copy fonts
          assetOutputDir: false,
          // Workers are needed; worklets optional (we prefer ScriptProcessor in dev)
          audioWorklets: true,
          webWorkers: true,
        }),
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

// Serwist compiles the service worker (src/app/sw.ts) through Next's own
// webpack pass, so a single pipeline serves both the Vercel SSR build and the
// GitHub Pages static export (output: 'export'). It auto-registers the worker
// and honors basePath for the SW URL + scope.
const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  // Cache extra routes as users navigate via next/link.
  cacheOnNavigation: true,
  // Do NOT force a full page reload when connectivity returns. reloadOnOnline
  // calls location.reload() on every 'online' event, which would wipe live
  // playback/edit state on a flaky connection. The offline guarantee is the
  // cached shell, not live sync, so a reconnect reload buys nothing here.
  reloadOnOnline: false,
  // Only compile/register the SW in production builds. This keeps `next dev`
  // free of the webpack-based SW (and any Turbopack mismatch) and avoids
  // stale-cache confusion during development; PWA behavior is verified via
  // `next build && next start` and on Vercel/GitHub Pages.
  disable: process.env.NODE_ENV === 'development',
  // Precache only small, shell-relevant files from public/. Serwist globs
  // public/ for the precache manifest (default "**/*"), which would otherwise
  // pull in the large AlphaTab soundfonts (~1.3MB/954KB) and every Bravura font
  // format (~2.6MB) — ~4.9MB of install bloat for no shell benefit. This
  // allowlist keeps the AlphaTab worker/worklet scripts, the PWA icons, and the
  // modern Bravura.woff2 (~185KB, used for notation); soundfonts and legacy
  // font formats are fetched + runtime-cached on demand (defaultCache).
  //
  // NOTE: anything in public/ NOT matched here is excluded from the precache.
  // These are flat globs (no `**`), so they match the public/ root only — if you
  // add a new shell-critical asset (or a public/icons/ subdir), extend this list.
  globPublicPatterns: ['*.mjs', '*.png', 'font/Bravura.woff2'],
  maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
});

export default withSerwist(nextConfig);
