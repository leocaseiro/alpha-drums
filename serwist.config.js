module.exports = {
  swSrc: 'src/sw.js',
  swDest: 'out/sw.js',
  globDirectory: 'out',
  globPatterns: ['**/*.{js,css,html,png,svg,ico,json,webmanifest,txt,wasm}'],
  maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
};
