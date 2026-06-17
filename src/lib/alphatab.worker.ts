// AlphaTab Web Worker entry.
//
// This module is only ever loaded as a dedicated Web Worker, via
// `new Worker(new URL('./alphatab.worker.ts', import.meta.url), { type: 'module' })`
// in alphatab-utils.ts. Importing the package entry in a worker context makes
// AlphaTab detect it is running inside a worker and call
// `Environment.initializeWorker()` automatically (see alphaTab.main.ts).
//
// We let webpack bundle this (and AlphaTab's core) into a hashed worker chunk
// under /_next/, which avoids AlphaTab's own `import.meta.url`-based bootstrap
// that Next bakes to a build-time file:// path the browser refuses to load.
import '@coderline/alphatab';
