/**
 * Shared brand/theme colour.
 *
 * Single source of truth for the dark base used by the web manifest
 * (theme_color / background_color), the viewport theme-color, and the PWA icon
 * background. The icon source (public/icon.svg) and scripts/generate-icons.mjs
 * hardcode this same value because they are static assets / a standalone build
 * script and cannot import this module — keep them in sync when changing it.
 */
export const THEME_COLOR = '#0B0B0F';
