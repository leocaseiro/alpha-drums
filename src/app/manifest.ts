import type { MetadataRoute } from 'next';
import { getAssetPath } from '@/lib/utils';
import { THEME_COLOR } from '@/lib/theme';

// Render to a static manifest.webmanifest at build time. Required for the
// `output: 'export'` (GitHub Pages) build because this route reads the basePath
// from the environment; the prefix is baked in at build time.
export const dynamic = 'force-static';

/**
 * Web app manifest, generated so every URL respects the deploy's basePath:
 * root-absolute on Vercel (basePath ''), and `/alpha-drums`-prefixed on the
 * GitHub Pages export. `output: 'export'` renders this to a static
 * `manifest.webmanifest` at build time with the prefix baked in.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Alpha Drums',
    short_name: 'Alpha Drums',
    description: 'A simple and powerful web-based drum machine.',
    start_url: getAssetPath('/'),
    scope: getAssetPath('/'),
    display: 'standalone',
    background_color: THEME_COLOR,
    theme_color: THEME_COLOR,
    icons: [
      {
        src: getAssetPath('/icon-192.png'),
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: getAssetPath('/icon-512.png'),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: getAssetPath('/icon-192-maskable.png'),
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: getAssetPath('/icon-512-maskable.png'),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
