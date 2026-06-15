/// <reference lib="webworker" />
import { defaultCache } from '@serwist/next/worker';
import { type PrecacheEntry, type SerwistGlobalConfig, Serwist } from 'serwist';

// Serwist injects the precache manifest into `self.__SW_MANIFEST` at build time.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  // Runtime caching (network/cache strategies for pages, static assets, fonts,
  // images, etc.). Large AlphaTab soundfonts/fonts are fetched on demand and
  // cached at runtime rather than force-precached — see the maximum-file-size
  // limit in next.config.ts.
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
