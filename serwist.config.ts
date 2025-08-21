import { defineConfig } from 'serwist';

export default defineConfig({
  globDirectory: 'out',
  globPatterns: ['**/*.{js,css,html,png,svg,ico,json,webmanifest,txt,wasm}'],
  swDest: 'out/sw.js',
  maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'http-cache',
        expiration: { maxEntries: 200, maxAgeSeconds: 86400 },
      },
    },
  ],
  navigateFallback: '/index.html',
});
