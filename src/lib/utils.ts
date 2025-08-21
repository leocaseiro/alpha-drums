/**
 * Get the base path for assets when deployed to GitHub Pages
 */
export function getBasePath() {
  return process.env.NEXT_PUBLIC_BASE_PATH || '';
}

/**
 * Get the full path for a public asset
 */
export function getAssetPath(path: string) {
  const basePath = getBasePath();
  return `${basePath}${path}`;
}